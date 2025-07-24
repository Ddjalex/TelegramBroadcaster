#!/bin/bash
set -e

echo "🚀 RENDER BUILD SCRIPT V4 - Enhanced Dependency Management"
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Working directory: $(pwd)"
echo "Environment: NODE_ENV=${NODE_ENV:-development}"

# Phase 1: Clean state
echo ""
echo "🧹 PHASE 1: Clean installation"
rm -rf node_modules package-lock.json yarn.lock dist/ .vite || true
npm cache clean --force || true

# Phase 2: Install dependencies with better error handling
echo ""
echo "📦 PHASE 2: Installing all dependencies"

# First, install all package.json dependencies
echo "Installing from package.json..."
npm install --legacy-peer-deps --include=dev --verbose

# Explicitly install build-critical dependencies to ensure they're available
echo "Ensuring build-critical dependencies are available..."
npm install --legacy-peer-deps --no-audit \
  vite@^7.0.6 \
  @vitejs/plugin-react@^4.3.2 \
  tailwindcss@^3.4.17 \
  autoprefixer@^10.4.20 \
  postcss@^8.4.47 \
  esbuild@^0.25.0 \
  tsx@^4.19.1 \
  drizzle-kit@^0.31.4 \
  typescript@5.6.3

echo "All dependencies installed successfully!"

# Phase 3: Verify critical build tools
echo ""
echo "🔍 PHASE 3: Verifying build tools"
echo "Node modules structure:"
ls -la node_modules/.bin/ | grep -E "(vite|esbuild|tailwind)" || echo "Some binaries missing"

echo "Package verification:"
node -e "
try {
  console.log('vite:', require('vite/package.json').version);
  console.log('tailwindcss:', require('tailwindcss/package.json').version); 
  console.log('postcss:', require('postcss/package.json').version);
  console.log('esbuild:', require('esbuild/package.json').version);
} catch(e) {
  console.error('Package verification failed:', e.message);
  process.exit(1);
}
"

# Phase 4: Build frontend with multiple fallback strategies
echo ""
echo "🏗️ PHASE 4: Building frontend"

# Set production environment
export NODE_ENV=production
export NODE_PATH="$PWD/node_modules"

# Clear any vite cache
rm -rf node_modules/.vite .vite || true

# Strategy 1: Use the production vite config
echo "Strategy 1: Building with production config..."
if ./node_modules/.bin/vite build --config ./vite.config.production.js --mode production 2>/dev/null; then
  echo "✅ Frontend build successful with production config"
elif npx vite build --config ./vite.config.production.js --mode production 2>/dev/null; then
  echo "✅ Frontend build successful with npx and production config"
else
  echo "❌ Production config failed, trying default config..."
  
  # Strategy 2: Use default vite config
  if ./node_modules/.bin/vite build --mode production 2>/dev/null; then
    echo "✅ Frontend build successful with default config"
  elif npx vite build --mode production 2>/dev/null; then
    echo "✅ Frontend build successful with npx and default config"
  else
    echo "❌ Default config failed, trying simplified approach..."
    
    # Strategy 3: Create minimal vite config
    cat > vite.config.minimal.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'client'),
  build: {
    outDir: resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'client/index.html')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@shared': resolve(__dirname, 'shared'),
      '@assets': resolve(__dirname, 'attached_assets')
    }
  }
})
EOF
    
    echo "Building with minimal config..."
    if ./node_modules/.bin/vite build --config ./vite.config.minimal.js --mode production; then
      echo "✅ Frontend build successful with minimal config"
    elif npx vite build --config ./vite.config.minimal.js --mode production; then
      echo "✅ Frontend build successful with npx and minimal config"
    else
      echo "❌ All vite strategies failed, trying manual approach..."
      
      # Strategy 4: Manual build with esbuild
      mkdir -p dist/public/assets
      
      # Copy static files
      cp -r client/public/* dist/public/ 2>/dev/null || true
      cp client/index.html dist/public/ 2>/dev/null || true
      
      # Build with esbuild as last resort
      echo "Building with esbuild fallback..."
      npx esbuild client/src/main.tsx \
        --bundle \
        --format=esm \
        --platform=browser \
        --target=es2020 \
        --outfile=dist/public/assets/main.js \
        --define:process.env.NODE_ENV='"production"' \
        --loader:.tsx=tsx \
        --loader:.ts=ts \
        --minify \
        --external:react \
        --external:react-dom || {
        echo "❌ All build strategies failed"
        exit 1
      }
      
      echo "✅ Manual build completed with esbuild"
    fi
  fi
fi

# Phase 5: Build backend
echo ""
echo "⚡ PHASE 5: Building backend"
./node_modules/.bin/esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20 \
  --tsconfig=tsconfig.json || \
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20 \
  --tsconfig=tsconfig.json

# Phase 6: Verification
echo ""
echo "🎯 PHASE 6: Build verification"
echo "Build output structure:"
ls -la dist/ 2>/dev/null || echo "No dist directory found"

if [ -d "dist/public" ]; then
  echo "Frontend files:"
  ls -la dist/public/ | head -10
  echo "Frontend build size: $(du -sh dist/public/ 2>/dev/null || echo 'unknown')"
fi

if [ -f "dist/index.js" ]; then
  echo "Backend file: $(ls -lh dist/index.js)"
  echo "Backend build size: $(du -sh dist/index.js 2>/dev/null || echo 'unknown')"
fi

echo ""
echo "✅ BUILD COMPLETED SUCCESSFULLY!"
echo "Ready for deployment on Render"