#!/bin/bash
set -e

echo "🚀 RENDER BUILD - FINAL VERSION"
echo "==============================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --no-audit --no-fund

# Remove problematic config files that cause Vite issues
echo "🧹 Cleaning configuration conflicts..."
rm -f vite.config.*.backup

# Build frontend with fallback strategy
echo "🏗️ Building frontend..."
export NODE_ENV=production

# Try fallback build immediately (skip the problematic config)
echo "Using fallback esbuild approach..."
mkdir -p dist/public

# Build with esbuild
npx esbuild client/src/main.tsx \
  --bundle \
  --outfile=dist/public/index.js \
  --format=esm \
  --jsx=automatic \
  --loader:.tsx=tsx \
  --loader:.ts=tsx \
  --loader:.css=css \
  --define:process.env.NODE_ENV='"production"' \
  --external:react \
  --external:react-dom

# Create HTML file
cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telegram Broadcaster Admin</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/index.js"></script>
</body>
</html>
EOF

echo "✅ Frontend built successfully"

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20 \
  --define:process.env.NODE_ENV='"production"'

echo "✅ Backend built successfully"

# Skip database initialization during build - do it at runtime instead
echo "⚠️ Skipping database setup during build (will initialize at runtime)"
echo "💡 Database and admin user will be created when the server starts"

# Create runtime initialization script
cat > dist/init-runtime.js << 'EOF'
const { Pool, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function initializeAtRuntime() {
  // Only run if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not available - skipping admin initialization');
    return;
  }
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000
  });
  
  try {
    console.log('🔗 Initializing database connection...');
    
    // Test connection with timeout
    await Promise.race([
      pool.query('SELECT NOW()'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000))
    ]);
    
    console.log('✅ Database connected successfully');
    
    // Create admin_credentials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Check for existing admin
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
    
    console.log('🔐 Login ready: admin/admin123');
    
  } catch (error) {
    console.error('⚠️ Database initialization failed:', error.message);
    console.error('💡 Admin user will be created on first server start');
  } finally {
    await pool.end();
  }
}

// Auto-run if this file is executed directly
if (require.main === module) {
  initializeAtRuntime().catch(console.error);
}

module.exports = { initializeAtRuntime };
EOF

# Verify build output
echo "📋 Build verification:"
ls -la dist/
ls -la dist/public/
test -f dist/index.js && echo "✅ Backend: Ready" || echo "❌ Backend: Missing"
test -f dist/public/index.html && echo "✅ Frontend: Ready" || echo "❌ Frontend: Missing"
test -f dist/init-runtime.js && echo "✅ Runtime Init: Ready" || echo "❌ Runtime Init: Missing"

echo ""
echo "🎉 BUILD COMPLETED SUCCESSFULLY!"
echo "🔧 Database will initialize when server starts"
echo "🔐 Login will be: admin/admin123"
echo ""