# Render Environment Variables - Copy These Exactly

## Required Environment Variables for Render Deployment

Set these in your Render Web Service → Environment tab:

### 1. DATABASE_URL
```
Variable Name: DATABASE_URL
Value: [Copy from your Render PostgreSQL database "Internal Database URL"]
```
**How to get it:**
- Go to your Render PostgreSQL database dashboard
- Copy the "Internal Database URL" (NOT External)
- Paste it exactly as the DATABASE_URL value

### 2. TELEGRAM_BOT_TOKEN  
```
Variable Name: TELEGRAM_BOT_TOKEN
Value: [Your bot token from @BotFather]
```
**How to get it:**
- Message @BotFather on Telegram
- Use /mybots to see your existing bots, or /newbot to create one
- Copy the token (format: 123456789:ABCdefGhIjKlMnOpQrStUvWxYz)

### 3. NODE_ENV
```
Variable Name: NODE_ENV
Value: production
```

### 4. PORT
```
Variable Name: PORT  
Value: 10000
```

### 5. RENDER_EXTERNAL_URL
```
Variable Name: RENDER_EXTERNAL_URL
Value: https://telegrambroadcaster-ke1b.onrender.com
```

## How to Find Your Render Service Name

1. Go to your Render Web Service dashboard
2. Look at the URL - it will be something like: `https://my-telegram-bot-xyz123.onrender.com`
3. Use that exact URL for RENDER_EXTERNAL_URL

## Your Complete Setup

For your service at `https://telegrambroadcaster-ke1b.onrender.com`, your variables should be:

```
DATABASE_URL = [your_postgresql_internal_database_url_from_render]
TELEGRAM_BOT_TOKEN = [your_telegram_bot_token_from_botfather]
NODE_ENV = production
PORT = 10000
RENDER_EXTERNAL_URL = https://telegrambroadcaster-ke1b.onrender.com
```

## Webhook Information

The webhook endpoint is automatically configured as:
- **Webhook URL:** `https://telegrambroadcaster-ke1b.onrender.com/api/telegram/webhook`
- **Method:** POST
- **Content-Type:** application/json

This is handled automatically by the application - you don't need to set it manually in Telegram.

## Troubleshooting

### If Users/Dashboard don't load:
- Check DATABASE_URL is the "Internal" URL from Render PostgreSQL
- Ensure the database was created before the web service

### If bot doesn't respond to messages:
- Verify TELEGRAM_BOT_TOKEN is correct
- Check RENDER_EXTERNAL_URL matches your actual service URL
- Look at Render service logs for webhook errors

### If admin settings don't save:
- Confirm DATABASE_URL format is correct
- Check service logs for database connection errors