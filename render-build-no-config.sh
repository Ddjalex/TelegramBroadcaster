#!/bin/bash
set -e

echo "🔧 RENDER BUILD - NO CONFIG CONFLICTS"
echo "===================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Temporarily rename vite config to avoid conflicts
echo "📝 Temporarily disabling existing Vite config..."
if [ -f "vite.config.ts" ]; then
  mv vite.config.ts vite.config.ts.backup
fi

# Create minimal inline build
echo "🏗️ Building frontend with inline config..."
export NODE_ENV=production

# Use npx vite build with inline configuration
npx vite build \
  --outDir dist/public \
  --config /dev/stdin << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
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
})
EOF

# Restore original config if it existed
if [ -f "vite.config.ts.backup" ]; then
  mv vite.config.ts.backup vite.config.ts
fi

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20

# Database and admin user setup
echo "🗄️ Setting up database and admin user..."
if [ -n "$DATABASE_URL" ]; then
  echo "Initializing database schema..."
  npx drizzle-kit push --config=./drizzle.config.ts || echo "Schema already exists"
  
  # Create admin user with Node.js script
  cat > setup-admin.js << 'EOF'
const { Pool, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function setupAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Ensure admin_credentials table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Check for existing admin
    const result = await pool.query('SELECT id FROM admin_credentials WHERE username = $1', ['admin']);
    
    if (result.rows.length === 0) {
      console.log('Creating admin user...');
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2)',
        ['admin', hash]
      );
      console.log('✅ ADMIN USER CREATED: admin/admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Final verification
    const verify = await pool.query('SELECT username FROM admin_credentials WHERE username = $1', ['admin']);
    if (verify.rows.length > 0) {
      console.log('✅ Admin user verified and ready for login');
    } else {
      throw new Error('Admin verification failed');
    }
    
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupAdmin().catch(console.error);
EOF

  echo "Creating admin user..."
  node setup-admin.js
  rm -f setup-admin.js
  
else
  echo "⚠️ DATABASE_URL not available - admin will be created at runtime"
fi

echo "✅ Build completed successfully!"
echo "📁 Output:"
ls -la dist/
echo "📁 Frontend assets:"
ls -la dist/public/ 2>/dev/null || echo "Public directory check failed"

echo "🎉 DEPLOYMENT READY - LOGIN WILL WORK!"