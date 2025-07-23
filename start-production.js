#!/usr/bin/env node

// Production startup script with better error handling and logging
console.log('Starting Telegram Broadcast Bot in production mode...');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please set these environment variables before starting the application.');
  process.exit(1);
}

// Optional environment variables with warnings
const optionalEnvVars = ['TELEGRAM_BOT_TOKEN'];
optionalEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.warn(`Warning: ${env} is not set. Some features may not work properly.`);
  }
});

console.log('Environment check passed. Starting application...');

// Set default values for production
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '10000'; // Default Render port

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Import and start the application
try {
  await import('./dist/index.js');
} catch (error) {
  console.error('Failed to start application:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}