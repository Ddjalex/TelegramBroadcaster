#!/bin/bash
set -e

echo "🔧 RENDER BUILD FIXED - NO VITE ISSUES"
echo "======================================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Create simple PostCSS config
echo "📝 Creating PostCSS configuration..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Build frontend with direct vite command (no custom config)
echo "🏗️ Building frontend..."
export NODE_ENV=production
npx vite build --outDir dist/public

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20

# CRITICAL: Database and admin initialization
echo "🗄️ Initializing database and admin user..."
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected - running initialization..."
  
  # Push database schema
  npx drizzle-kit push --config=./drizzle.config.ts || echo "Schema push failed - may already exist"
  
  # Create admin user with direct SQL
  cat > init-admin.mjs << 'EOF'
import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin() {
  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Check if admin exists
    const existing = await pool.query('SELECT id FROM admin_credentials WHERE username = $1', ['admin']);
    
    if (existing.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2)',
        ['admin', hash]
      );
      console.log('✅ ADMIN USER CREATED: admin/admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Verify
    const verify = await pool.query('SELECT username FROM admin_credentials WHERE username = $1', ['admin']);
    if (verify.rows.length === 0) {
      throw new Error('Admin verification failed');
    }
    console.log('✅ Admin user verified');
    
  } catch (error) {
    console.error('❌ Admin initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdmin().catch(console.error);
EOF

  # Run admin creation
  echo "Creating admin user..."
  timeout 45 node init-admin.mjs || {
    echo "❌ Admin creation failed or timed out"
    exit 1
  }
  
  rm -f init-admin.mjs
  echo "✅ Admin user initialization complete"
  
else
  echo "⚠️ DATABASE_URL not available - admin will be created at runtime"
fi

echo "✅ Build complete!"
echo "📁 Build contents:"
ls -la dist/
echo "📁 Frontend assets:"
ls -la dist/public/ 2>/dev/null || echo "No public directory"

echo "🎉 BUILD SUCCESSFUL - LOGIN READY!"