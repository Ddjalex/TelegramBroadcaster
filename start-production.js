#!/usr/bin/env node

// Production startup script for Render deployment
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Telegram Broadcast Bot in production mode...');
console.log('📁 Current directory:', __dirname);
console.log('🌍 Environment variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  - TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing');
console.log('  - RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL ? '✅ Set' : '❌ Missing');

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

try {
  // Import and start the server
  const serverPath = join(__dirname, 'dist', 'index.js');
  console.log('📂 Loading server from:', serverPath);
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Import the built server
  await import(serverPath);
  
  console.log('✅ Server started successfully');
} catch (error) {
  console.error('💥 Failed to start server:', error);
  console.error(error.stack);
  process.exit(1);
}