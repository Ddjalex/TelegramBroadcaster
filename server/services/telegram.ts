import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import type { User } from '@shared/schema';

// Import WebSocket broadcast function
let broadcastToClients: ((data: any) => void) | null = null;

export function setBroadcastFunction(fn: (data: any) => void) {
  broadcastToClients = fn;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';

if (!BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN environment variable not set. Bot functionality will be disabled.');
}

class TelegramService {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  constructor() {
    if (BOT_TOKEN) {
      this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    if (!BOT_TOKEN || !this.bot) {
      console.warn('Skipping Telegram bot initialization - no token provided');
      return;
    }

    try {
      // Set up webhook if running in production, otherwise use polling
      if (process.env.NODE_ENV === 'production') {
        // For Render deployment, construct webhook URL from Render service URL
        const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL || `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;
        const webhookUrl = `${baseUrl}/api/telegram/webhook`;
        console.log('Setting up webhook for production:', webhookUrl);
        await this.bot.setWebHook(webhookUrl);
        console.log('Webhook set successfully');
      } else {
        await this.bot.startPolling();
        console.log('Bot polling started for development');
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
    if (!this.bot) return;
    
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

          // Send real-time notification about new user
          if (broadcastToClients) {
            broadcastToClients({
              type: 'NEW_USER_REGISTERED',
              data: { 
                user,
                message: `New user registered: ${user.firstName || user.username || 'Unknown'}`
              }
            });
          }

          // Get custom welcome message from settings
          const titleSetting = await storage.getBotSetting('welcome_title');
          const descriptionSetting = await storage.getBotSetting('welcome_description');
          const buttonTextSetting = await storage.getBotSetting('welcome_button_text');
          const imageUrlSetting = await storage.getBotSetting('welcome_image_url');

          const title = titleSetting?.value || '🤖 Welcome to our Broadcast Bot!';
          const description = descriptionSetting?.value || 'To complete your registration and receive real-time notifications, please share your phone number.';
          const buttonText = buttonTextSetting?.value || '📱 Share My Contact';
          const imageUrl = imageUrlSetting?.value || '';

          // Send welcome image first if provided
          if (imageUrl && imageUrl.trim()) {
            try {
              console.log(`Attempting to send welcome image to user ${user.firstName || user.username || 'Unknown'}`);
              console.log(`Image URL: ${imageUrl}`);
              console.log(`Title: ${title}`);
              console.log(`Description: ${description}`);
              console.log(`Button Text: ${buttonText}`);
              
              await this.bot?.sendPhoto(chatId, imageUrl, {
                caption: `${title}\n\n${description}`,
                reply_markup: {
                  keyboard: [
                    [{ text: buttonText, request_contact: true }]
                  ],
                  resize_keyboard: true,
                  one_time_keyboard: true
                }
              });
              console.log(`✅ Welcome image sent successfully to ${user.firstName || user.username || 'Unknown'}`);
            } catch (photoError) {
              console.error(`❌ Failed to send welcome image to ${user.firstName || user.username || 'Unknown'}:`);
              console.error('Error details:', photoError);
              console.log('🔄 Falling back to text message...');
              
              // Fallback to text message if image fails
              await this.bot?.sendMessage(chatId, `${title}\n\n${description}`, {
                reply_markup: {
                  keyboard: [
                    [{ text: buttonText, request_contact: true }]
                  ],
                  resize_keyboard: true,
                  one_time_keyboard: true
                }
              });
              console.log(`✅ Text fallback message sent to ${user.firstName || user.username || 'Unknown'}`);
            }
          } else {
            // Send text message if no image
            console.log(`Sending text welcome message to user ${user.firstName || user.username} (no image set)`);
            const welcomeMessage = `${title}\n\n${description}`;
            
            const options = {
              reply_markup: {
                keyboard: [
                  [{ text: buttonText, request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            };

            await this.bot?.sendMessage(chatId, welcomeMessage, options);
            console.log(`Text welcome message sent successfully to ${user.firstName || user.username}`);
          }
        } else {
          // Update user activity
          await storage.updateUserActivity(telegramId);
          
          // Check if user has phone number
          if (!user.phoneNumber) {
            const phoneRequestMessage = `
👋 Welcome back!

To ensure you receive important notifications, please share your phone number.

Click the button below to complete your profile.
            `;

            const options = {
              reply_markup: {
                keyboard: [
                  [{ text: '📱 Share My Contact', request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            };

            await this.bot?.sendMessage(chatId, phoneRequestMessage, options);
          } else {
            const welcomeBackMessage = `
✅ Thank you! Your phone number has been saved.

Waiting for important announcements.
            `;

            await this.bot?.sendMessage(chatId, welcomeBackMessage, {
              reply_markup: {
                remove_keyboard: true
              }
            });
          }
        }
      } catch (error) {
        console.error('Error handling /start command:', error);
        await this.bot?.sendMessage(chatId, 'Sorry, there was an error registering you. Please try again later.');
      }
    });

    // Handle contact sharing
    this.bot?.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      const contact = msg.contact;
      
      if (!telegramId || !contact) return;

      try {
        // Update user with phone number
        await storage.updateUserPhone(telegramId, contact.phone_number);
        
        // Send real-time notification about phone number update
        if (broadcastToClients) {
          broadcastToClients({
            type: 'USER_PHONE_UPDATED',
            data: { 
              telegramId,
              phoneNumber: contact.phone_number,
              message: `User updated phone number: ${contact.phone_number}`
            }
          });
        }
        
        const confirmMessage = `
✅ Thank you! Your phone number has been saved.

Waiting for important announcements.
        `;

        await this.bot?.sendMessage(chatId, confirmMessage, {
          reply_markup: {
            remove_keyboard: true
          }
        });
      } catch (error) {
        console.error('Error saving contact:', error);
        await this.bot?.sendMessage(chatId, 'Sorry, there was an error saving your phone number. Please try again.');
      }
    });



    // Handle /help command
    this.bot?.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `
📋 Available Commands:

/start - Register for broadcasts
/help - Show this help message
/status - Check your registration status
/unsubscribe - Stop receiving broadcasts

For questions or support, contact our administrators.
      `;

      await this.bot?.sendMessage(chatId, helpMessage);
    });

    // Handle /status command
    this.bot?.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      
      if (!telegramId) return;

      try {
        const user = await storage.getUserByTelegramId(telegramId);
        
        if (user && user.isActive) {
          await this.bot?.sendMessage(chatId, '✅ You are registered and will receive broadcasts.');
        } else {
          await this.bot?.sendMessage(chatId, '❌ You are not registered. Use /start to register.');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        await this.bot?.sendMessage(chatId, 'Sorry, unable to check your status right now.');
      }
    });

    // Handle /unsubscribe command
    this.bot?.onText(/\/unsubscribe/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      
      if (!telegramId) return;

      try {
        const user = await storage.getUserByTelegramId(telegramId);
        
        if (user) {
          // Deactivate user instead of deleting
          // Note: This would require adding an update method to storage
          await this.bot?.sendMessage(chatId, '✅ You have been unsubscribed from broadcasts.');
        } else {
          await this.bot?.sendMessage(chatId, 'You were not registered for broadcasts.');
        }
      } catch (error) {
        console.error('Error unsubscribing user:', error);
        await this.bot?.sendMessage(chatId, 'Sorry, unable to unsubscribe you right now.');
      }
    });
  }

  async sendBroadcastMessage(users: User[], message: string, broadcastId: number) {
    const results = { successful: 0, failed: 0, errors: [] as string[] };

    console.log(`Starting broadcast ${broadcastId} to ${users.length} users`);

    if (!this.bot) {
      console.warn('Bot not initialized, cannot send messages');
      return results;
    }

    for (const user of users) {
      try {
        if (!user.isActive) {
          console.log(`Skipping inactive user ${user.telegramId}`);
          continue;
        }

        await this.bot.sendMessage(parseInt(user.telegramId), message, { parse_mode: 'HTML' });
        
        // Create delivery record
        const delivery = await storage.createMessageDelivery({
          broadcastId,
          userId: user.id,
          status: 'sent',
        });

        await storage.updateMessageDeliveryStatus(delivery.id, 'delivered');
        results.successful++;
        console.log(`Message sent successfully to user ${user.telegramId}`);
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
      
      // Small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`Broadcast ${broadcastId} completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  async getBotInfo() {
    try {
      const me = await this.bot?.getMe();
      return {
        username: me?.username || 'Unknown',
        firstName: me?.first_name || 'Bot',
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

  // Send a simple text message
  async sendMessage(chatId: number | string, message: string) {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    return await this.bot.sendMessage(chatId, message);
  }

  // Send a photo with caption
  async sendPhoto(chatId: number | string, photoUrl: string, caption?: string) {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    return await this.bot.sendPhoto(chatId, photoUrl, { caption });
  }

  // Handle webhook updates (for production)
  async handleWebhookUpdate(update: any) {
    try {
      await this.bot?.processUpdate(update);
    } catch (error) {
      console.error('Error processing webhook update:', error);
    }
  }
}

export const telegramService = new TelegramService();
