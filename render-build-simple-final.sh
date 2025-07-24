#!/bin/bash
set -e

echo "🔧 RENDER BUILD - SIMPLE & RELIABLE"
echo "=================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Backup existing vite config
echo "📝 Managing Vite configuration..."
if [ -f "vite.config.ts" ]; then
  mv vite.config.ts vite.config.ts.backup
fi

# Create simple temporary config
cat > vite.config.temp.js << 'EOF'
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

# Build frontend
echo "🏗️ Building frontend..."
export NODE_ENV=production
npx vite build --config vite.config.temp.js

# Clean up temp config and restore original
rm -f vite.config.temp.js
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

# Database setup
echo "🗄️ Database initialization..."
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migration..."
  npx drizzle-kit push --config=./drizzle.config.ts || echo "Schema already exists"
  
  # Create admin user
  node -e "
const { Pool, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Setting up admin user...');
    
    // Create table if needed
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    \`);
    
    // Check existing admin
    const existing = await pool.query('SELECT id FROM admin_credentials WHERE username = \$1', ['admin']);
    
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO admin_credentials (username, password_hash) VALUES (\$1, \$2)', ['admin', hash]);
      console.log('✅ ADMIN USER CREATED: admin/admin123');
    } else {
      console.log('✅ Admin user exists');
    }
    
    // Verify
    const verify = await pool.query('SELECT username FROM admin_credentials WHERE username = \$1', ['admin']);
    if (verify.rows.length > 0) {
      console.log('✅ Admin login ready');
    } else {
      throw new Error('Admin verification failed');
    }
    
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
"
  
else
  echo "⚠️ DATABASE_URL not available"
fi

echo "✅ Build completed!"
echo "📁 Build output:"
ls -la dist/
echo "📁 Frontend:"
ls -la dist/public/ 2>/dev/null || echo "Frontend build check failed"

echo "🎉 READY FOR DEPLOYMENT!"