import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
// WebSocket imports disabled for Replit compatibility
// import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { telegramService, setBroadcastFunction } from "./services/telegram";
import { insertBroadcastSchema, insertScheduledMessageSchema, welcomeMessageSchema } from "@shared/schema";
import { z } from "zod";
// Authentication imports removed - public access dashboard
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

// WebSocket connection management (temporarily disabled for Replit compatibility)
let wss: any = null;
const clients = new Set<any>();

function broadcastToClients(data: any) {
  // WebSocket disabled - using HTTP polling instead
  console.log('Broadcast notification:', data.type);
}



// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueName = `${nanoid()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes (removed - dashboard is now public)
  app.get('/api/auth/me', (req, res) => {
    // Always return authenticated for public access
    res.json({ 
      authenticated: true, 
      admin: { 
        id: 1, 
        username: 'public' 
      } 
    });
  });

  // Set up broadcast function for Telegram service
  setBroadcastFunction(broadcastToClients);
  
  // Initialize Telegram service
  try {
    await telegramService.initialize();
  } catch (error) {
    console.error('Failed to initialize Telegram service:', error);
  }



  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));

  // Image upload endpoint
  app.post("/api/upload/image", upload.single('image'), (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // Return the public URL for the uploaded image
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: `${req.protocol}://${req.get('host')}${imageUrl}`,
        filename: req.file.filename
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload image',
        details: error.message
      });
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

  // Dashboard stats (public access)
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // User management (public access)
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

  // User management endpoints (public access)
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

  // Quick broadcast endpoint (public access)
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

  // Broadcast management (public access)
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
      console.log('Creating broadcast with data:', req.body);
      const validatedData = insertBroadcastSchema.parse(req.body);
      console.log('Validated broadcast data:', validatedData);
      const broadcast = await storage.createBroadcast(validatedData);
      console.log('Created broadcast:', broadcast);
      res.status(201).json(broadcast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid broadcast data', details: error.errors });
      }
      console.error('Error creating broadcast (detailed):', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      res.status(500).json({ error: 'Failed to create broadcast', details: error instanceof Error ? error.message : String(error) });
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

  // Welcome message settings routes (must come before generic settings routes)
  app.get("/api/settings/welcome", async (req, res) => {
    try {
      const titleSetting = await storage.getBotSetting('welcome_title');
      const descriptionSetting = await storage.getBotSetting('welcome_description');
      const buttonTextSetting = await storage.getBotSetting('welcome_button_text');
      const imageUrlSetting = await storage.getBotSetting('welcome_image_url');

      const settings = {
        title: titleSetting?.value || 'Welcome to our Broadcast Bot!',
        description: descriptionSetting?.value || 'Get real-time notifications and important updates directly to your phone. Click START to begin your journey with us.',
        buttonText: buttonTextSetting?.value || 'START',
        imageUrl: imageUrlSetting?.value || '',
      };
      res.json(settings);
    } catch (error) {
      console.error('Error fetching welcome settings:', error);
      res.status(500).json({ error: 'Failed to fetch welcome settings' });
    }
  });

  app.post("/api/settings/welcome", async (req, res) => {
    try {
      const result = welcomeMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Validation error',
          details: result.error.flatten().fieldErrors
        });
      }

      const { title, description, buttonText, imageUrl } = result.data;

      // Save each setting individually
      await Promise.all([
        storage.setBotSetting({ key: 'welcome_title', value: title }),
        storage.setBotSetting({ key: 'welcome_description', value: description }),
        storage.setBotSetting({ key: 'welcome_button_text', value: buttonText }),
        storage.setBotSetting({ key: 'welcome_image_url', value: imageUrl || '' }),
      ]);

      res.json({ message: 'Welcome message settings updated successfully' });
    } catch (error) {
      console.error('Error updating welcome settings:', error);
      res.status(500).json({ error: 'Failed to update welcome settings' });
    }
  });

  // Test welcome message endpoint
  app.post("/api/test/welcome-message", async (req, res) => {
    try {
      const { chatId } = req.body;
      if (!chatId) {
        return res.status(400).json({ error: 'Chat ID is required for testing' });
      }

      // Get current welcome message settings
      const titleSetting = await storage.getBotSetting('welcome_title');
      const descriptionSetting = await storage.getBotSetting('welcome_description');
      const buttonTextSetting = await storage.getBotSetting('welcome_button_text');
      const imageUrlSetting = await storage.getBotSetting('welcome_image_url');

      const title = titleSetting?.value || 'Test Welcome Message';
      const description = descriptionSetting?.value || 'This is a test of the welcome message functionality.';
      const buttonText = buttonTextSetting?.value || 'TEST';
      const imageUrl = imageUrlSetting?.value || '';

      console.log('Testing welcome message with settings:', { title, description, buttonText, imageUrl });

      // Test sending the welcome message
      if (imageUrl && imageUrl.trim()) {
        try {
          await telegramService.sendMessage(chatId, 'Testing image functionality...');
          const result = await telegramService.sendPhoto(chatId, imageUrl, `${title}\n\n${description}`);
          res.json({ 
            success: true, 
            message: 'Test image sent successfully',
            settings: { title, description, buttonText, imageUrl },
            result
          });
        } catch (photoError: any) {
          console.error('Test image failed:', photoError);
          await telegramService.sendMessage(chatId, `${title}\n\n${description}`);
          res.json({ 
            success: false, 
            message: 'Image failed, text sent instead',
            error: photoError.message || 'Unknown error',
            settings: { title, description, buttonText, imageUrl }
          });
        }
      } else {
        await telegramService.sendMessage(chatId, `${title}\n\n${description}`);
        res.json({ 
          success: true, 
          message: 'Text message sent (no image configured)',
          settings: { title, description, buttonText, imageUrl }
        });
      }
    } catch (error: any) {
      console.error('Error testing welcome message:', error);
      res.status(500).json({ error: 'Failed to test welcome message', details: error.message || 'Unknown error' });
    }
  });

  // Generic settings routes (must come after specific routes)
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

  // Telegram webhook endpoint for production
  app.post("/api/telegram/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        return res.status(404).json({ error: 'Webhook only available in production' });
      }

      const update = JSON.parse(req.body.toString());
      
      // Process the webhook update
      if (update.message) {
        await telegramService.handleWebhookUpdate(update);
      }
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  // WebSocket server disabled for Replit compatibility
  // Using HTTP polling for real-time updates instead
  console.log('HTTP server started - WebSocket disabled');
  
  return httpServer;
}
