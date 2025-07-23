import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { telegramService, setBroadcastFunction } from "./services/telegram";
import { insertBroadcastSchema, insertScheduledMessageSchema, changePasswordSchema } from "@shared/schema";
import { z } from "zod";

// WebSocket connection management
let wss: WebSocketServer;
const clients = new Set<WebSocket>();

function broadcastToClients(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Initialize default admin if none exists
async function initializeDefaultAdmin() {
  try {
    const existingAdmin = await storage.getAdminByUsername('admin');
    if (!existingAdmin) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      await storage.createAdmin({
        username: 'admin',
        passwordHash: hashedPassword
      });
      console.log('Default admin created with username: admin, password: admin123');
      console.log('SECURITY WARNING: Please change the default password immediately!');
    }
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up broadcast function for Telegram service
  setBroadcastFunction(broadcastToClients);
  
  // Initialize Telegram service
  try {
    await telegramService.initialize();
  } catch (error) {
    console.error('Failed to initialize Telegram service:', error);
  }

  // Initialize default admin
  await initializeDefaultAdmin();

  // Secure admin authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Update last login time
      await storage.updateAdminLastLogin(username);
      
      res.json({ success: true, message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Change admin password
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const result = changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error',
          errors: result.error.flatten().fieldErrors
        });
      }

      const { currentPassword, newPassword } = result.data;
      const username = 'admin'; // For now, assuming single admin user

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await storage.updateAdminPassword(username, hashedNewPassword);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Telegram webhook endpoint
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      await telegramService.handleWebhookUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // User management
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get("/api/users/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  // User management endpoints
  app.patch("/api/users/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      
      await storage.updateUserStatus(id, isActive);
      
      // Send real-time notification
      broadcastToClients({
        type: 'USER_STATUS_UPDATED',
        data: { userId: id, isActive, message: isActive ? 'User activated' : 'User deactivated' }
      });
      
      res.json({ message: isActive ? 'User activated' : 'User deactivated' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeUser(id);
      
      // Send real-time notification
      broadcastToClients({
        type: 'USER_REMOVED',
        data: { userId: id, message: 'User removed successfully' }
      });
      
      res.json({ message: 'User removed successfully' });
    } catch (error) {
      console.error('Error removing user:', error);
      res.status(500).json({ error: 'Failed to remove user' });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: 'User deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Quick broadcast endpoint
  app.post("/api/broadcasts/quick", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Create quick broadcast
      const broadcast = await storage.createBroadcast({
        title: `Quick Broadcast - ${new Date().toLocaleString()}`,
        message: message.trim(),
        status: 'draft',
      });

      // Get all active users
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(user => user.isActive);

      if (activeUsers.length === 0) {
        return res.status(400).json({ error: 'No active users to send message to' });
      }

      // Update broadcast status to sending
      await storage.updateBroadcastStatus(broadcast.id, 'sending');

      // Send broadcast in background
      setImmediate(async () => {
        try {
          const results = await telegramService.sendBroadcastMessage(activeUsers, message, broadcast.id);
          
          // Update broadcast stats
          await storage.updateBroadcastStats(broadcast.id, results.successful, results.failed);
          await storage.updateBroadcastStatus(broadcast.id, 'sent');
          
          console.log(`Quick broadcast ${broadcast.id} completed: ${results.successful} successful, ${results.failed} failed`);
        } catch (error) {
          console.error(`Error sending quick broadcast ${broadcast.id}:`, error);
          await storage.updateBroadcastStatus(broadcast.id, 'failed');
        }
      });

      res.json({ 
        message: 'Quick broadcast started',
        broadcastId: broadcast.id,
        recipientCount: activeUsers.length
      });
    } catch (error) {
      console.error('Error starting quick broadcast:', error);
      res.status(500).json({ error: 'Failed to start quick broadcast' });
    }
  });

  // Broadcast management
  app.get("/api/broadcasts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const broadcasts = limit ? await storage.getRecentBroadcasts(limit) : await storage.getAllBroadcasts();
      res.json(broadcasts);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      res.status(500).json({ error: 'Failed to fetch broadcasts' });
    }
  });

  app.get("/api/broadcasts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const broadcast = await storage.getBroadcast(id);
      
      if (!broadcast) {
        return res.status(404).json({ error: 'Broadcast not found' });
      }

      res.json(broadcast);
    } catch (error) {
      console.error('Error fetching broadcast:', error);
      res.status(500).json({ error: 'Failed to fetch broadcast' });
    }
  });

  app.post("/api/broadcasts", async (req, res) => {
    try {
      const validatedData = insertBroadcastSchema.parse(req.body);
      const broadcast = await storage.createBroadcast(validatedData);
      res.status(201).json(broadcast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid broadcast data', details: error.errors });
      }
      console.error('Error creating broadcast:', error);
      res.status(500).json({ error: 'Failed to create broadcast' });
    }
  });

  app.post("/api/broadcasts/:id/send", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const broadcast = await storage.getBroadcast(id);
      
      if (!broadcast) {
        return res.status(404).json({ error: 'Broadcast not found' });
      }

      if (broadcast.status !== 'draft') {
        return res.status(400).json({ error: 'Broadcast has already been sent' });
      }

      // Update broadcast status to sending
      await storage.updateBroadcastStatus(id, 'sending');

      // Get only active users for broadcasting
      const users = await storage.getActiveUsers();

      // Send broadcast in background
      setImmediate(async () => {
        try {
          const results = await telegramService.sendBroadcastMessage(users, broadcast.message, id);
          
          // Update broadcast stats
          await storage.updateBroadcastStats(id, results.successful, results.failed);
          await storage.updateBroadcastStatus(id, 'sent');
          
          // Send real-time notification about broadcast completion
          broadcastToClients({
            type: 'BROADCAST_COMPLETED',
            data: { 
              broadcastId: id, 
              successful: results.successful, 
              failed: results.failed,
              message: `Broadcast completed: ${results.successful} sent, ${results.failed} failed`
            }
          });
          
          console.log(`Broadcast ${id} completed: ${results.successful} successful, ${results.failed} failed`);
        } catch (error) {
          console.error(`Error sending broadcast ${id}:`, error);
          await storage.updateBroadcastStatus(id, 'failed');
        }
      });

      res.json({ message: 'Broadcast started', broadcastId: id });
    } catch (error) {
      console.error('Error starting broadcast:', error);
      res.status(500).json({ error: 'Failed to start broadcast' });
    }
  });

  // Delete broadcast
  app.delete("/api/broadcasts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const broadcast = await storage.getBroadcast(id);
      
      if (!broadcast) {
        return res.status(404).json({ error: 'Broadcast not found' });
      }

      await storage.deleteBroadcast(id);
      res.json({ message: 'Broadcast deleted successfully' });
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      res.status(500).json({ error: 'Failed to delete broadcast' });
    }
  });

  // Get broadcast deliveries
  app.get("/api/broadcasts/:id/deliveries", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveries = await storage.getBroadcastDeliveries(id);
      res.json(deliveries);
    } catch (error) {
      console.error('Error fetching broadcast deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch broadcast deliveries' });
    }
  });

  // Bot status
  app.get("/api/bot/status", async (req, res) => {
    try {
      const botInfo = await telegramService.getBotInfo();
      res.json(botInfo);
    } catch (error) {
      console.error('Error fetching bot status:', error);
      res.status(500).json({ error: 'Failed to fetch bot status' });
    }
  });

  // Settings
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getBotSetting(req.params.key);
      res.json(setting || { key: req.params.key, value: null });
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
      }

      const setting = await storage.setBotSetting({ key, value });
      res.json(setting);
    } catch (error) {
      console.error('Error saving setting:', error);
      res.status(500).json({ error: 'Failed to save setting' });
    }
  });

  // Scheduled messages routes
  app.get("/api/scheduled-messages", async (req, res) => {
    try {
      const messages = await storage.getAllScheduledMessages();
      res.json(messages);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled messages' });
    }
  });

  app.post("/api/scheduled-messages", async (req, res) => {
    try {
      // Convert scheduledFor string to Date object
      const { scheduledFor, ...rest } = req.body;
      const dataWithDate = {
        ...rest,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
      };
      
      const data = insertScheduledMessageSchema.parse(dataWithDate);
      const message = await storage.createScheduledMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid message data', details: error.errors });
      }
      console.error('Error creating scheduled message:', error);
      res.status(500).json({ error: 'Failed to create scheduled message' });
    }
  });

  app.get("/api/scheduled-messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.getScheduledMessage(id);
      
      if (!message) {
        return res.status(404).json({ error: 'Scheduled message not found' });
      }
      
      res.json(message);
    } catch (error) {
      console.error('Error fetching scheduled message:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled message' });
    }
  });

  app.patch("/api/scheduled-messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert scheduledFor string to Date object if present
      const { scheduledFor, ...rest } = req.body;
      const updatesWithDate = {
        ...rest,
        ...(scheduledFor && { scheduledFor: new Date(scheduledFor) })
      };
      
      const updates = insertScheduledMessageSchema.partial().parse(updatesWithDate);
      
      await storage.updateScheduledMessage(id, updates);
      res.json({ message: 'Scheduled message updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid update data', details: error.errors });
      }
      console.error('Error updating scheduled message:', error);
      res.status(500).json({ error: 'Failed to update scheduled message' });
    }
  });

  app.patch("/api/scheduled-messages/:id/cancel", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await storage.updateScheduledMessageStatus(id, 'cancelled');
      res.json({ message: 'Scheduled message cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      res.status(500).json({ error: 'Failed to cancel scheduled message' });
    }
  });

  app.delete("/api/scheduled-messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await storage.deleteScheduledMessage(id);
      res.json({ message: 'Scheduled message deleted successfully' });
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      res.status(500).json({ error: 'Failed to delete scheduled message' });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New WebSocket client connected');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  return httpServer;
}
