# CORRECT Render Environment Variables

## What You Need to Fix

Based on your screenshot, you have some incorrect variables. Here's what to do:

### DELETE These Variables (they're not needed):
- ❌ BACKEND_URL 
- ❌ JWT_SECRET
- ❌ WEBHOOK_URL

### KEEP These Variables (they're correct):
- ✅ DATABASE_URL (your PostgreSQL connection)
- ✅ TELEGRAM_BOT_TOKEN (your bot token)

### ADD These Missing Variables:
- ➕ NODE_ENV
- ➕ PORT  
- ➕ RENDER_EXTERNAL_URL

## Final Correct Setup

Your Render environment should have exactly these 5 variables:

```
DATABASE_URL = postgresql://telegram_broadcaster_db_user:WLj0l*AGkPGdaMSsP4kSRhYxJuoIm6dq@dpg-ct6h2v68ii6s73fv0n1g-a.oregon-postgres.render.com/telegram_broadcaster_db

TELEGRAM_BOT_TOKEN = 7781035003:AAHyM8Xi_kOq0MFMdXwfLozA-LIKCA-VqhY

NODE_ENV = production

PORT = 10000

RENDER_EXTERNAL_URL = https://telegrambroadcaster-ke1b.onrender.com
```

## Steps to Fix:

1. **Delete** BACKEND_URL, JWT_SECRET, and WEBHOOK_URL
2. **Add** NODE_ENV = production
3. **Add** PORT = 10000  
4. **Add** RENDER_EXTERNAL_URL = https://telegrambroadcaster-ke1b.onrender.com
5. **Redeploy** your service

## Why These Changes Matter:

- **NODE_ENV=production** - Enables production mode and webhook handling
- **PORT=10000** - Required port for Render deployment
- **RENDER_EXTERNAL_URL** - Needed for proper webhook configuration
- **Removing JWT_SECRET** - Not used in this application (no authentication)
- **Removing WEBHOOK_URL** - Application handles this automatically