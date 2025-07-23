import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  totalRecipients: integer("total_recipients").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  failedDeliveries: integer("failed_deliveries").default(0),
  metadata: jsonb("metadata"), // For storing additional data like formatting, attachments
});

export const messageDeliveries = pgTable("message_deliveries", {
  id: serial("id").primaryKey(),
  broadcastId: integer("broadcast_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(), // pending, sent, delivered, failed
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  deliveries: many(messageDeliveries),
}));

export const broadcastsRelations = relations(broadcasts, ({ many }) => ({
  deliveries: many(messageDeliveries),
}));

export const messageDeliveriesRelations = relations(messageDeliveries, ({ one }) => ({
  broadcast: one(broadcasts, {
    fields: [messageDeliveries.broadcastId],
    references: [broadcasts.id],
  }),
  user: one(users, {
    fields: [messageDeliveries.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
  lastActiveAt: true,
});

export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  totalRecipients: true,
  successfulDeliveries: true,
  failedDeliveries: true,
});

export const insertMessageDeliverySchema = createInsertSchema(messageDeliveries).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
});

export const insertBotSettingSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type MessageDelivery = typeof messageDeliveries.$inferSelect;
export type InsertMessageDelivery = z.infer<typeof insertMessageDeliverySchema>;
export type BotSetting = typeof botSettings.$inferSelect;
export type InsertBotSetting = z.infer<typeof insertBotSettingSchema>;
