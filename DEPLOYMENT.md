# Deployment Guide

## Environment Variables

For the application to work properly in production, you need to set these environment variables:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port number (defaults to 10000 for Render)

### Optional
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `NODE_ENV` - Set to "production" for production deployment

## Deploy to Render

1. **Fork/Clone the repository** to your GitHub account

2. **Create a PostgreSQL Database FIRST**:
   - In Render dashboard, click "New +" → "PostgreSQL" 
   - Name: `telegram-bot-db` (or any name you prefer)
   - Select the free tier
   - Click "Create Database"
   - Wait for database to be created
   - Copy the "Internal Database URL" from the database dashboard

3. **Create a new Web Service** on Render:
   - Connect your GitHub repository
   - Choose the branch (usually `main`)

4. **Configure Build Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node start-production.js`
   - **Node Version**: 20.x or higher

5. **Set Environment Variables** in Render dashboard:
   ```
   DATABASE_URL=paste_your_internal_database_url_here
   BOT_TOKEN=your_bot_token_from_botfather
   NODE_ENV=production
   PORT=10000
   ```

6. **Deploy**: Click "Deploy" and wait for the build to complete

7. **Access your dashboard**: Once deployed, visit your app URL and login with:
   - Username: `admin`
   - Password: `admin123`
   - **IMPORTANT**: Change this password immediately in Settings!

## Troubleshooting

### Build Fails
- Check that Node.js version is 20.x or higher
- Ensure all dependencies are in package.json
- Verify the build command includes both frontend and backend builds

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