// Production startup script for Render
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Telegram Broadcast Bot in production...');
console.log('Environment checks:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('- TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('- PORT:', process.env.PORT || '10000');

// Start the main application
const serverPath = path.join(__dirname, 'dist', 'index.js');
console.log('Starting server from:', serverPath);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (code) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
  if (signal) {
    console.error(`❌ Server killed with signal ${signal}`);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM received, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT received, shutting down gracefully...');
  server.kill('SIGINT');
});