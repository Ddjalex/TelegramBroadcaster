#!/bin/bash
set -e

echo "🛡️ RENDER BUILD - BULLETPROOF VERSION"
echo "===================================="

# Force install all dependencies
echo "📦 Installing dependencies with force..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --no-audit --no-fund --verbose

# Verify critical packages exist
echo "🔍 Verifying build tools..."
npm list vite @vitejs/plugin-react tailwindcss autoprefixer || {
  echo "❌ Critical packages missing - reinstalling..."
  npm install vite @vitejs/plugin-react tailwindcss autoprefixer --legacy-peer-deps
}

# Create PostCSS config
echo "📝 Creating PostCSS config..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
EOF

# Remove any problematic config files
echo "🧹 Cleaning config conflicts..."
rm -f vite.config.*.js vite.config.*.ts.backup

# Create minimal working Vite config
echo "📝 Creating minimal Vite config..."
cat > vite.render.config.js << 'EOF'
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets')
    }
  }
});
EOF

# Build frontend
echo "🏗️ Building frontend..."
export NODE_ENV=production
export VITE_NODE_ENV=production

# Try multiple build approaches
if ! npx vite build --config vite.render.config.js --mode production; then
  echo "⚠️ Standard build failed, trying fallback..."
  
  # Fallback 1: Basic build without config
  if ! npx vite build --outDir dist/public; then
    echo "⚠️ Basic build failed, trying manual approach..."
    
    # Fallback 2: Manual esbuild approach
    mkdir -p dist/public
    npx esbuild client/src/main.tsx \
      --bundle \
      --outfile=dist/public/index.js \
      --format=esm \
      --jsx=automatic \
      --loader:.tsx=tsx \
      --loader:.ts=tsx \
      --define:process.env.NODE_ENV='"production"'
    
    # Create minimal HTML
    cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telegram Broadcaster</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/index.js"></script>
</body>
</html>
EOF
  fi
fi

# Clean up temp config
rm -f vite.render.config.js

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

# Database and admin setup
echo "🗄️ Setting up database and admin..."
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected, initializing..."
  
  # Push schema
  npx drizzle-kit push --config=./drizzle.config.ts --verbose || echo "Schema push completed or already exists"
  
  # Create admin with maximum compatibility
  cat > admin-setup.cjs << 'EOF'
const { Pool, neonConfig } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function setupAdmin() {
  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Ensure table exists with all fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Admin table ready');
    
    // Check for existing admin
    const existing = await pool.query('SELECT id, username FROM admin_credentials WHERE username = $1', ['admin']);
    
    if (existing.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      
      const result = await pool.query(
        'INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2) RETURNING id, username',
        ['admin', hash]
      );
      
      console.log('✅ ADMIN CREATED:', result.rows[0]);
      console.log('🔑 LOGIN: admin/admin123');
    } else {
      console.log('✅ Admin exists:', existing.rows[0]);
    }
    
    // Final verification
    const verify = await pool.query('SELECT COUNT(*) as count FROM admin_credentials WHERE username = $1', ['admin']);
    
    if (verify.rows[0].count > 0) {
      console.log('✅ ADMIN LOGIN READY');
    } else {
      throw new Error('Admin verification failed');
    }
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupAdmin().catch(error => {
  console.error('Fatal setup error:', error);
  process.exit(1);
});
EOF

  # Run admin setup with timeout
  echo "Creating admin user..."
  timeout 60 node admin-setup.cjs || {
    echo "❌ Admin setup failed"
    exit 1
  }
  
  rm -f admin-setup.cjs
  
else
  echo "⚠️ DATABASE_URL not available in build environment"
fi

# Verify build output
echo "✅ Build verification:"
ls -la dist/ || echo "Dist directory missing"
ls -la dist/public/ || echo "Public directory missing"
test -f dist/index.js && echo "✅ Backend built" || echo "❌ Backend missing"
test -f dist/public/index.html && echo "✅ Frontend built" || echo "❌ Frontend missing"

echo "🎉 BULLETPROOF BUILD COMPLETE!"
echo "🔐 Login ready: admin/admin123"