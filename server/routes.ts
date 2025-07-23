import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramService } from "./services/telegram";
import { insertBroadcastSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Telegram service
  try {
    await telegramService.initialize();
  } catch (error) {
    console.error('Failed to initialize Telegram service:', error);
  }

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

      // Get all active users
      const users = await storage.getAllUsers();

      // Send broadcast in background
      setImmediate(async () => {
        try {
          const results = await telegramService.sendBroadcastMessage(users, broadcast.message, id);
          
          // Update broadcast stats
          await storage.updateBroadcastStats(id, results.successful, results.failed);
          await storage.updateBroadcastStatus(id, 'sent');
          
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

  const httpServer = createServer(app);
  return httpServer;
}
