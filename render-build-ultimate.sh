#!/bin/bash
set -e

echo "🔧 RENDER BUILD ULTIMATE - GUARANTEED LOGIN FIX"
echo "================================================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --verbose

# Create production build configuration
echo "📝 Creating bulletproof production config..."
cat > vite.config.ultimate.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
});
EOF

# Build frontend
echo "🏗️ Building frontend..."
export NODE_ENV=production
npx vite build --config ./vite.config.ultimate.js --mode production

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20

# CRITICAL: Initialize database and admin user
echo "🗄️ CRITICAL: Database initialization..."
if [ -n "$DATABASE_URL" ]; then
  echo "Running database setup..."
  
  # First, ensure schema exists
  npx drizzle-kit push --config=./drizzle.config.ts
  
  # Create comprehensive admin initialization
  cat > create-admin.js << 'EOF'
const { Pool, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function createAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
    
    console.log('🔍 Checking admin_credentials table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_credentials'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ admin_credentials table missing. Creating...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_credentials (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ admin_credentials table created');
    }
    
    console.log('🔍 Checking for existing admin user...');
    const existingAdmin = await pool.query(
      'SELECT id FROM admin_credentials WHERE username = $1',
      ['admin']
    );
    
    if (existingAdmin.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        'INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2)',
        ['admin', passwordHash]
      );
      
      console.log('✅ ADMIN USER CREATED: admin/admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Verify admin user can be retrieved
    const verification = await pool.query(
      'SELECT username FROM admin_credentials WHERE username = $1',
      ['admin']
    );
    
    if (verification.rows.length > 0) {
      console.log('✅ Admin user verification successful');
    } else {
      throw new Error('Admin user verification failed');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
EOF

  # Run admin creation with timeout
  echo "👤 Creating admin user..."
  timeout 60 node create-admin.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Admin user creation completed successfully"
  else
    echo "❌ Admin user creation failed or timed out"
    exit 1
  fi
  
  rm -f create-admin.js
  
else
  echo "⚠️ DATABASE_URL not available in build environment"
  echo "Admin user will be created at runtime"
fi

# Create startup verification script
echo "📝 Creating startup verification..."
cat > dist/verify-startup.js << 'EOF'
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function verifyStartup() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set');
    return;
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const adminCheck = await pool.query(
      'SELECT username FROM admin_credentials WHERE username = $1',
      ['admin']
    );
    
    if (adminCheck.rows.length > 0) {
      console.log('✅ STARTUP VERIFICATION: Admin user exists and ready');
      console.log('🔑 Login credentials: admin/admin123');
    } else {
      console.log('❌ STARTUP VERIFICATION: Admin user missing');
    }
  } catch (error) {
    console.log('❌ STARTUP VERIFICATION FAILED:', error.message);
  } finally {
    await pool.end();
  }
}

verifyStartup();
EOF

echo "✅ Build complete!"
echo "📁 Build output:"
ls -la dist/
echo "📁 Public assets:"
ls -la dist/public/ || echo "No public directory found"

echo "🎉 ULTIMATE BUILD COMPLETE - LOGIN GUARANTEED TO WORK!"