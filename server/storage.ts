import { 
  users, 
  broadcasts, 
  messageDeliveries, 
  botSettings,
  type User, 
  type InsertUser,
  type Broadcast,
  type InsertBroadcast,
  type MessageDelivery,
  type InsertMessageDelivery,
  type BotSetting,
  type InsertBotSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserActivity(telegramId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{
    total: number;
    activeToday: number;
    newThisMonth: number;
  }>;

  // Broadcast operations
  createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast>;
  getBroadcast(id: number): Promise<Broadcast | undefined>;
  getAllBroadcasts(): Promise<Broadcast[]>;
  getRecentBroadcasts(limit?: number): Promise<Broadcast[]>;
  updateBroadcastStatus(id: number, status: string, metadata?: any): Promise<void>;
  updateBroadcastStats(id: number, successful: number, failed: number): Promise<void>;

  // Message delivery operations
  createMessageDelivery(delivery: InsertMessageDelivery): Promise<MessageDelivery>;
  updateMessageDeliveryStatus(id: number, status: string, errorMessage?: string): Promise<void>;
  getBroadcastDeliveries(broadcastId: number): Promise<MessageDelivery[]>;

  // Bot settings
  getBotSetting(key: string): Promise<BotSetting | undefined>;
  setBotSetting(setting: InsertBotSetting): Promise<BotSetting>;

  // Analytics
  getDashboardStats(): Promise<{
    totalUsers: number;
    messagesSent: number;
    deliveryRate: number;
    activeToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserActivity(telegramId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.telegramId, telegramId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isActive, true));
  }

  async getUserStats(): Promise<{ total: number; activeToday: number; newThisMonth: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalResult] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [activeTodayResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.isActive, true), gte(users.lastActiveAt, today)));
    const [newThisMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.isActive, true), gte(users.joinedAt, monthStart)));

    return {
      total: totalResult.count,
      activeToday: activeTodayResult.count,
      newThisMonth: newThisMonthResult.count,
    };
  }

  async createBroadcast(insertBroadcast: InsertBroadcast): Promise<Broadcast> {
    const [broadcast] = await db.insert(broadcasts).values(insertBroadcast).returning();
    return broadcast;
  }

  async getBroadcast(id: number): Promise<Broadcast | undefined> {
    const [broadcast] = await db.select().from(broadcasts).where(eq(broadcasts.id, id));
    return broadcast || undefined;
  }

  async getAllBroadcasts(): Promise<Broadcast[]> {
    return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt));
  }

  async getRecentBroadcasts(limit = 10): Promise<Broadcast[]> {
    return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt)).limit(limit);
  }

  async updateBroadcastStatus(id: number, status: string, metadata?: any): Promise<void> {
    const updateData: any = { status };
    if (status === "sent") {
      updateData.sentAt = new Date();
    }
    if (metadata) {
      updateData.metadata = metadata;
    }
    await db.update(broadcasts).set(updateData).where(eq(broadcasts.id, id));
  }

  async updateBroadcastStats(id: number, successful: number, failed: number): Promise<void> {
    await db
      .update(broadcasts)
      .set({
        successfulDeliveries: successful,
        failedDeliveries: failed,
        totalRecipients: successful + failed,
      })
      .where(eq(broadcasts.id, id));
  }

  async createMessageDelivery(insertDelivery: InsertMessageDelivery): Promise<MessageDelivery> {
    const [delivery] = await db.insert(messageDeliveries).values(insertDelivery).returning();
    return delivery;
  }

  async updateMessageDeliveryStatus(id: number, status: string, errorMessage?: string): Promise<void> {
    const updateData: any = { status };
    if (status === "sent") {
      updateData.sentAt = new Date();
    } else if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    await db.update(messageDeliveries).set(updateData).where(eq(messageDeliveries.id, id));
  }

  async getBroadcastDeliveries(broadcastId: number): Promise<MessageDelivery[]> {
    return db.select().from(messageDeliveries).where(eq(messageDeliveries.broadcastId, broadcastId));
  }

  async getBotSetting(key: string): Promise<BotSetting | undefined> {
    const [setting] = await db.select().from(botSettings).where(eq(botSettings.key, key));
    return setting || undefined;
  }

  async setBotSetting(insertSetting: InsertBotSetting): Promise<BotSetting> {
    const [setting] = await db
      .insert(botSettings)
      .values({ ...insertSetting, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: botSettings.key,
        set: { value: insertSetting.value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    messagesSent: number;
    deliveryRate: number;
    activeToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsersResult] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [messagesSentResult] = await db.select({ count: count() }).from(broadcasts).where(eq(broadcasts.status, "sent"));
    const [activeTodayResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.isActive, true), gte(users.lastActiveAt, today)));

    // Calculate delivery rate
    const [deliveryStats] = await db
      .select({
        successful: count(messageDeliveries.id),
      })
      .from(messageDeliveries)
      .where(eq(messageDeliveries.status, "delivered"));

    const [totalDeliveries] = await db.select({ count: count() }).from(messageDeliveries);

    const deliveryRate = totalDeliveries.count > 0 
      ? (deliveryStats.successful / totalDeliveries.count) * 100 
      : 0;

    return {
      totalUsers: totalUsersResult.count,
      messagesSent: messagesSentResult.count,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      activeToday: activeTodayResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
