#!/usr/bin/env node

// Ultimate production startup with guaranteed admin user
const { spawn } = require('child_process');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const ws = require('ws');
const path = require('path');

neonConfig.webSocketConstructor = ws;

console.log('🚀 ULTIMATE STARTUP - Telegram Broadcast Bot');
console.log('============================================');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || '10000');
console.log('Database:', process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING');
console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'CONFIGURED' : 'MISSING');

async function ensureAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL missing - skipping admin check');
    return;
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔍 Verifying admin user...');
    
    // Check if admin exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admin_credentials WHERE username = $1',
      ['admin']
    );
    
    if (existingAdmin.rows.length === 0) {
      console.log('❌ Admin user missing - creating now...');
      
      // Create admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2)',
        ['admin', passwordHash]
      );
      
      console.log('✅ EMERGENCY ADMIN USER CREATED: admin/admin123');
    } else {
      console.log('✅ Admin user verified and ready');
    }
    
  } catch (error) {
    console.error('❌ Admin user verification failed:', error);
    // Don't exit - let the app start anyway
  } finally {
    await pool.end();
  }
}

async function startServer() {
  try {
    // Ensure admin user exists
    await ensureAdminUser();
    
    // Run startup verification
    try {
      console.log('🔍 Running startup verification...');
      require('./verify-startup.js');
    } catch (err) {
      console.log('⚠️ Startup verification skipped:', err.message);
    }
    
    // Start main server
    const serverPath = path.join(__dirname, 'index.js');
    console.log('🚀 Starting server:', serverPath);
    
    const server = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    server.on('error', (err) => {
      console.error('❌ Server startup failed:', err);
      process.exit(1);
    });
    
    server.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });
    
    // Graceful shutdown
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => {
        console.log(`📤 ${signal} received - shutting down...`);
        server.kill(signal);
      });
    });
    
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

startServer();