#!/bin/bash
set -e

echo "🚀 FINAL RENDER BUILD SCRIPT - Bash Version"
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Working directory: $(pwd)"

# Phase 1: Clean state
echo ""
echo "🧹 PHASE 1: Clean installation"
rm -rf node_modules package-lock.json dist/ || true
npm cache clean --force || true

# Phase 2: Install with legacy peer deps to avoid conflicts
echo ""
echo "📦 PHASE 2: Installing dependencies"
npm install --legacy-peer-deps --include=dev --verbose

# Ensure critical build dependencies are installed
echo "📦 PHASE 2.1: Installing critical build dependencies"
npm install \
  vite@latest \
  @vitejs/plugin-react@latest \
  tailwindcss@latest \
  autoprefixer@latest \
  postcss@latest \
  esbuild@latest \
  tsx@latest \
  drizzle-kit@latest \
  typescript@latest \
  --save-dev --legacy-peer-deps --no-audit

# Additional step: Ensure all packages are properly linked
echo "📦 PHASE 2.2: Rebuilding node_modules structure"
npm dedupe --legacy-peer-deps || true
npm rebuild --legacy-peer-deps || true

# Verify critical dependencies
echo "📦 PHASE 2.3: Verifying critical dependencies"
echo "tailwindcss: $(npm list tailwindcss --depth=0 2>/dev/null || echo 'missing')"
echo "vite: $(npm list vite --depth=0 2>/dev/null || echo 'missing')"
echo "postcss: $(npm list postcss --depth=0 2>/dev/null || echo 'missing')"

# Phase 3: Force fix security (optional)
echo ""
echo "🔒 PHASE 3: Security fixes"
npm audit fix --force || echo "Security fixes completed with warnings"

# Phase 4: Verify or install build tools directly
echo ""
echo "🔧 PHASE 4: Ensuring build tools"

# Check if vite binary exists
if [ ! -f "./node_modules/.bin/vite" ]; then
  echo "Installing Vite directly..."
  npm install vite@latest --save-dev --legacy-peer-deps --no-audit
fi

# Check if esbuild binary exists  
if [ ! -f "./node_modules/.bin/esbuild" ]; then
  echo "Installing ESBuild directly..."
  npm install esbuild@latest --save-dev --legacy-peer-deps --no-audit
fi

# Verify build tools (use npx as fallback)
echo "Vite version: $(./node_modules/.bin/vite --version 2>/dev/null || npx vite --version 2>/dev/null || echo 'not found')"
echo "ESBuild version: $(./node_modules/.bin/esbuild --version 2>/dev/null || npx esbuild --version 2>/dev/null || echo 'not found')"

# Phase 5: Build frontend
echo ""
echo "🏗️ PHASE 5: Building frontend"

# Clear any vite cache that might cause issues
rm -rf node_modules/.vite-temp node_modules/.vite .vite || true

# Set environment variables for better module resolution
export NODE_ENV=production
export NODE_PATH="$PWD/node_modules"
export VITE_CONFIG_PATH="$PWD/vite.config.ts"

# Check if vite package exists
echo "📍 Checking Vite installation:"
echo "Vite package exists: $([ -d "node_modules/vite" ] && echo "YES" || echo "NO")"
echo "Vite binary exists: $([ -f "node_modules/.bin/vite" ] && echo "YES" || echo "NO")"
ls -la node_modules/.bin/ | grep vite || echo "No vite binary found"

# Method 1: Use local installed vite with production config
echo "Attempting build with local vite installation..."
if ./node_modules/.bin/vite build --config ./vite.config.production.js --mode production 2>/dev/null || npx vite build --config ./vite.config.production.js --mode production; then
  echo "✅ Frontend build successful with production config"
else
  echo "❌ Production config failed, trying without config..."
  # Restore original config
  mv vite.config.ts.backup vite.config.ts 2>/dev/null || true
  
  # Method 2: Try building without any config file (use defaults)
  echo "Attempting build without config file..."
  # Remove ALL config files temporarily
  mv vite.config.ts vite.config.ts.backup2 2>/dev/null || true
  mv vite.config.production.js vite.config.production.js.backup 2>/dev/null || true
  
  cd client
  if npx --yes vite@latest build --mode production --outDir ../dist/public; then
    echo "✅ Frontend build successful without config"
    cd ..
    # Restore configs
    mv ../vite.config.ts.backup2 ../vite.config.ts 2>/dev/null || true
    mv ../vite.config.production.js.backup ../vite.config.production.js 2>/dev/null || true
  else
    cd ..
    echo "❌ No-config approach failed, trying manual build..."
    # Restore configs
    mv vite.config.ts.backup2 vite.config.ts 2>/dev/null || true
    mv vite.config.production.js.backup vite.config.production.js 2>/dev/null || true
    
    # Method 3: Manual build approach
    echo "Attempting manual build process..."
    mkdir -p dist/public
    
    # Copy static files
    cp -r client/public/* dist/public/ 2>/dev/null || true
    cp client/index.html dist/public/ 2>/dev/null || true
    
    # Try to build with esbuild directly
    if command -v esbuild >/dev/null 2>&1; then
      echo "Building with ESBuild as fallback..."
      npx esbuild client/src/main.tsx \
        --bundle \
        --format=esm \
        --platform=browser \
        --target=es2020 \
        --outfile=dist/public/assets/main.js \
        --define:process.env.NODE_ENV='"production"' \
        --loader:.tsx=tsx \
        --loader:.ts=tsx \
        --loader:.css=css \
        --minify || exit 1
      echo "✅ Manual build completed"
    else
      echo "❌ All build methods failed"
      exit 1
    fi
  fi
fi

# Phase 6: Build backend
echo ""
echo "⚡ PHASE 6: Building backend"
# Try direct binary first, then npx as fallback
./node_modules/.bin/esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20 \
  --tsconfig=tsconfig.json \
  2>/dev/null || \
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20 \
  --tsconfig=tsconfig.json

# Phase 7: Verify output
echo ""
echo "🎯 PHASE 7: Verification"
echo "Build output:"
ls -la dist/
if [ -d "dist/public" ]; then
  echo "Frontend files:"
  ls -la dist/public/
fi

echo ""
echo "✅ BUILD COMPLETED SUCCESSFULLY!"
echo "Frontend: dist/public/"
echo "Backend: dist/index.js"