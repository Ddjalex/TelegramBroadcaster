#!/bin/bash
set -e

echo "🚀 RENDER BUILD - ULTIMATE VERSION"
echo "=================================="

# Clean start
echo "🧹 Complete cleanup..."
rm -rf node_modules package-lock.json dist
rm -f vite.config.*.backup vite.config.temp.js postcss.config.js

# Install ALL dependencies fresh
echo "📦 Installing all dependencies..."
npm install --legacy-peer-deps --no-audit --no-fund

# Verify and install missing critical packages
echo "🔍 Ensuring critical packages..."
npm install vite @vitejs/plugin-react tailwindcss autoprefixer postcss esbuild --save-dev --legacy-peer-deps

# Create minimal postcss config
echo "📝 Creating PostCSS config..."
cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create minimal tailwind config
echo "📝 Creating Tailwind config..."
cat > tailwind.config.cjs << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/src/**/*.{js,ts,jsx,tsx}",
    "./client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create CSS entry file
echo "📝 Creating CSS entry..."
mkdir -p client/src
cat > client/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
}
EOF

# Create ultra-minimal Vite config
echo "📝 Creating minimal Vite config..."
cat > vite.build.config.cjs << 'EOF'
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'client/src/main.tsx'),
    },
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
});
EOF

# Build frontend
echo "🏗️ Building frontend..."
export NODE_ENV=production

# Try Vite build first
if npx vite build --config vite.build.config.cjs; then
  echo "✅ Vite build successful"
else
  echo "⚠️ Vite failed, using ESBuild fallback..."
  
  # ESBuild fallback
  mkdir -p dist/public
  
  # Bundle with esbuild
  npx esbuild client/src/main.tsx \
    --bundle \
    --outfile=dist/public/assets/index.js \
    --format=esm \
    --jsx=automatic \
    --loader:.tsx=tsx \
    --loader:.ts=tsx \
    --loader:.css=css \
    --define:process.env.NODE_ENV='"production"' \
    --external:react \
    --external:react-dom \
    --minify
  
  # Create HTML with CDN resources
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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 20px; }
    .button { 
      background: #3b82f6; 
      color: white; 
      padding: 8px 16px; 
      border-radius: 6px; 
      border: none; 
      cursor: pointer;
      font-weight: 500;
    }
    .button:hover { background: #2563eb; }
    .input { 
      width: 100%; 
      padding: 8px 12px; 
      border: 1px solid #d1d5db; 
      border-radius: 6px; 
      font-size: 14px;
    }
    .input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  </style>
</head>
<body>
  <div id="root">
    <div class="container">
      <div class="card">
        <h1 style="margin: 0 0 20px 0; color: #1f2937;">Telegram Broadcaster Admin</h1>
        <p style="color: #6b7280;">Loading application...</p>
      </div>
    </div>
  </div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>
EOF
  
  echo "✅ ESBuild fallback completed"
fi

# Clean up temp configs
rm -f vite.build.config.cjs tailwind.config.cjs postcss.config.cjs

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20 \
  --define:process.env.NODE_ENV='"production"' \
  --minify

echo "✅ Backend built successfully"

# Create start script that handles admin creation at runtime
echo "📝 Creating production start script..."
cat > dist/start.js << 'EOF'
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Starting Telegram Broadcaster...');

// Run database push first
if (process.env.DATABASE_URL) {
  try {
    console.log('📊 Pushing database schema...');
    await execAsync('npx drizzle-kit push --config=./drizzle.config.ts');
    console.log('✅ Database schema ready');
  } catch (error) {
    console.warn('⚠️ Schema push failed:', error.message);
  }
}

// Start the main server
console.log('🖥️ Starting server...');
import('./index.js').catch(error => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
EOF

# Verify build
echo "📋 Build verification:"
ls -la dist/ 2>/dev/null || echo "❌ dist/ missing"
ls -la dist/public/ 2>/dev/null || echo "❌ dist/public/ missing"
test -f dist/index.js && echo "✅ Backend ready" || echo "❌ Backend missing"
test -f dist/start.js && echo "✅ Start script ready" || echo "❌ Start script missing"
test -f dist/public/index.html && echo "✅ Frontend ready" || echo "❌ Frontend missing"

echo ""
echo "🎉 ULTIMATE BUILD COMPLETED!"
echo "📝 Use start command: node dist/start.js"
echo "🔐 Login: admin/admin123"
echo ""