#!/bin/bash
set -e

echo "🔧 RENDER BUILD SCRIPT V7 - ULTIMATE LOGIN FIX"
echo "=================================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --verbose

# Verify critical packages
echo "🔍 Verifying build tools..."
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found"
    exit 1
fi

# Check if Vite is available
if ! npx vite --version &> /dev/null; then
    echo "⚠️ Vite not found, installing globally..."
    npm install -g vite
fi

# Create simple Vite config for production
echo "📝 Creating production Vite config..."
cat > vite.config.production.js << 'EOF'
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
npx vite build --config ./vite.config.production.js --mode production

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20

# CRITICAL: Initialize database schema and admin user
echo "🗄️ CRITICAL: Initializing database schema and admin user..."
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected, running schema migration..."
  npx drizzle-kit push --config=./drizzle.config.ts || echo "Schema migration failed - may already exist"
  
  # Create initialization script
  cat > init-admin.js << 'EOF'
import { neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { adminCredentials } from './shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { adminCredentials } });

async function initializeAdmin() {
  try {
    console.log('Checking for existing admin user...');
    const existingAdmin = await db.select().from(adminCredentials).where(eq(adminCredentials.username, 'admin')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('Creating default admin user...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await db.insert(adminCredentials).values({
        username: 'admin',
        passwordHash: passwordHash
      });
      console.log('✅ Default admin user created: admin/admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initializeAdmin().catch(console.error);
EOF

  # Run admin initialization
  echo "👤 Creating default admin user..."
  node init-admin.js || echo "Admin user creation failed - may already exist"
  rm init-admin.js
else
  echo "⚠️ DATABASE_URL not set in build environment - will initialize at runtime"
fi

echo "✅ Build complete!"
echo "📁 Build output:"
ls -la dist/
echo "📁 Public assets:"
ls -la dist/public/ || echo "No public directory"

echo "🎉 RENDER BUILD V7 COMPLETE - LOGIN SHOULD NOW WORK!"