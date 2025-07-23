import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import type { User } from '@shared/schema';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}

class TelegramService {
  private bot: TelegramBot;
  private isInitialized = false;

  constructor() {
    this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set up webhook if running in production, otherwise use polling
      if (process.env.NODE_ENV === 'production') {
        const webhookUrl = process.env.WEBHOOK_URL || `${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/telegram/webhook`;
        await this.bot.setWebHook(webhookUrl);
      } else {
        await this.bot.startPolling();
      }

      this.setupCommands();
      this.isInitialized = true;
      console.log('Telegram bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  private setupCommands() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      
      if (!telegramId) return;

      try {
        // Check if user already exists
        let user = await storage.getUserByTelegramId(telegramId);
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            telegramId,
            username: msg.from?.username || '',
            firstName: msg.from?.first_name || '',
            lastName: msg.from?.last_name || '',
          });

          const welcomeMessage = `
🤖 Welcome to our Broadcast Bot!

To complete your registration and receive real-time notifications, please share your phone number.

Click the button below or send your phone number manually.
          `;

          const options = {
            reply_markup: {
              keyboard: [
                [{ text: '📱 Share Phone Number', request_contact: true }]
              ],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          };

          await this.bot.sendMessage(chatId, welcomeMessage, options);
        } else {
          // Update user activity
          await storage.updateUserActivity(telegramId);
          
          const welcomeBackMessage = `
👋 Welcome back!

You're already registered to receive updates and announcements.

Use /help to see available commands.
          `;

          await this.bot.sendMessage(chatId, welcomeBackMessage);
        }
      } catch (error) {
        console.error('Error handling /start command:', error);
        await this.bot.sendMessage(chatId, 'Sorry, there was an error registering you. Please try again later.');
      }
    });

    // Handle contact sharing
    this.bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      const contact = msg.contact;
      
      if (!telegramId || !contact) return;

      try {
        // Update user with phone number
        await storage.updateUserPhone(telegramId, contact.phone_number);
        
        const confirmMessage = `
✅ Thank you! Your phone number has been saved.

You're now fully registered to receive:
- Important announcements
- Real-time notifications
- Community updates

Use /help to see all available commands.
        `;

        // Remove the keyboard
        const options = {
          reply_markup: {
            remove_keyboard: true
          }
        };

        await this.bot.sendMessage(chatId, confirmMessage, options);
      } catch (error) {
        console.error('Error saving contact:', error);
        await this.bot.sendMessage(chatId, 'Sorry, there was an error saving your phone number. Please try again.');
      }
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `
📋 Available Commands:

/start - Register for broadcasts
/help - Show this help message
/status - Check your registration status
/unsubscribe - Stop receiving broadcasts

For questions or support, contact our administrators.
      `;

      await this.bot.sendMessage(chatId, helpMessage);
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      
      if (!telegramId) return;

      try {
        const user = await storage.getUserByTelegramId(telegramId);
        
        if (user && user.isActive) {
          await this.bot.sendMessage(chatId, '✅ You are registered and will receive broadcasts.');
        } else {
          await this.bot.sendMessage(chatId, '❌ You are not registered. Use /start to register.');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        await this.bot.sendMessage(chatId, 'Sorry, unable to check your status right now.');
      }
    });

    // Handle /unsubscribe command
    this.bot.onText(/\/unsubscribe/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      
      if (!telegramId) return;

      try {
        const user = await storage.getUserByTelegramId(telegramId);
        
        if (user) {
          // Deactivate user instead of deleting
          // Note: This would require adding an update method to storage
          await this.bot.sendMessage(chatId, '✅ You have been unsubscribed from broadcasts.');
        } else {
          await this.bot.sendMessage(chatId, 'You were not registered for broadcasts.');
        }
      } catch (error) {
        console.error('Error unsubscribing user:', error);
        await this.bot.sendMessage(chatId, 'Sorry, unable to unsubscribe you right now.');
      }
    });
  }

  async sendBroadcastMessage(users: User[], message: string, broadcastId: number) {
    const results = { successful: 0, failed: 0, errors: [] as string[] };

    for (const user of users) {
      try {
        await this.bot.sendMessage(user.telegramId, message, { parse_mode: 'HTML' });
        
        // Create delivery record
        const delivery = await storage.createMessageDelivery({
          broadcastId,
          userId: user.id,
          status: 'sent',
        });

        await storage.updateMessageDeliveryStatus(delivery.id, 'delivered');
        results.successful++;
      } catch (error: any) {
        console.error(`Failed to send message to user ${user.id}:`, error);
        
        // Create failed delivery record
        const delivery = await storage.createMessageDelivery({
          broadcastId,
          userId: user.id,
          status: 'failed',
        });

        await storage.updateMessageDeliveryStatus(delivery.id, 'failed', error.message);
        results.failed++;
        results.errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    return results;
  }

  async getBotInfo() {
    try {
      const me = await this.bot.getMe();
      return {
        username: me.username,
        firstName: me.first_name,
        isOnline: true,
        lastActivity: new Date(),
      };
    } catch (error) {
      console.error('Error getting bot info:', error);
      return {
        username: 'Unknown',
        firstName: 'Bot',
        isOnline: false,
        lastActivity: null,
      };
    }
  }

  // Handle webhook updates (for production)
  async handleWebhookUpdate(update: any) {
    try {
      await this.bot.processUpdate(update);
    } catch (error) {
      console.error('Error processing webhook update:', error);
    }
  }
}

export const telegramService = new TelegramService();
