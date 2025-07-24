# Complete Deployment Guide for Render

## Fixed Issues in This Version
- ✅ Users, Message History, and Dashboard now load correctly
- ✅ Bot messages now work properly after deployment  
- ✅ Admin updates save successfully on production
- ✅ Enhanced welcome messages work with images
- ✅ Database connection issues resolved
- ✅ Webhook configuration fixed for production

## Required Environment Variables

Set these EXACT environment variables in your Render dashboard:

### Essential Variables
```
DATABASE_URL=your_postgresql_internal_database_url
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
NODE_ENV=production
PORT=10000
RENDER_EXTERNAL_URL=https://your-service-name.onrender.com
```

**CRITICAL**: Replace `your-service-name` with your actual Render service name from the URL.

## Step-by-Step Deployment

### 1. Create PostgreSQL Database FIRST
- In Render dashboard: "New +" → "PostgreSQL"
- Name: `telegram-bot-db` 
- Select free tier → "Create Database"
- **WAIT** for database creation to complete
- Copy the **"Internal Database URL"** (not External!)

### 2. Create Web Service
- "New +" → "Web Service"
- Connect your GitHub repository
- Branch: `main` or your active branch

### 3. Configure Build Settings
```
Build Command: npm install && node render-build.js
Start Command: node start-production.js
Node Version: 20.x
```

### 4. Set Environment Variables
Go to your web service → Environment → Add each variable:

```
DATABASE_URL = paste_your_internal_database_url_here
TELEGRAM_BOT_TOKEN = your_telegram_bot_token
NODE_ENV = production  
PORT = 10000
RENDER_EXTERNAL_URL = https://your-actual-service-name.onrender.com
```

### 5. Deploy and Monitor
- Click "Deploy"
- Watch the build logs for any errors
- Once deployed, check the service logs

## Testing After Deployment

### 1. Test Admin Dashboard
- Visit your Render app URL
- Dashboard should load without authentication
- Check that Users, Broadcasts, and Dashboard stats display data
- Try saving settings to confirm database writes work

### 2. Test Telegram Bot
- Find your bot in Telegram
- Send `/start` command
- Should receive enhanced welcome message with image
- Share contact to complete registration
- User should appear in admin dashboard

### 3. Test Broadcasting
- Go to Compose page in admin dashboard
- Send a test broadcast message
- Message should deliver to registered users
- Check Message History for delivery status

## Troubleshooting

### Build Fails
- Check that Node.js version is 20.x or higher
- Ensure all dependencies are in package.json
- Use build command: `npm install && node render-build.js`
- The new build script automatically installs dev dependencies needed for Vite/ESBuild
- Fixed "Vite not found" error by ensuring proper dependency installation

### Application Crashes on Start
- Check environment variables are set correctly
- Verify DATABASE_URL is accessible from your deployment
- Review logs for specific error messages

### Bot Not Working
- Ensure TELEGRAM_BOT_TOKEN is set
- Verify the token is valid by testing with @BotFather
- Check that the webhook URL is accessible (if using webhooks)

## Local Production Testing

To test the production build locally:

```bash
npm run build
NODE_ENV=production DATABASE_URL=your_local_db_url node start-production.js
```

## Database Migration

The application automatically creates required tables on startup using Drizzle ORM. No manual SQL migrations are needed.