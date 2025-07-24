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
# Try direct binary first, then npx as fallback
./node_modules/.bin/vite build --mode production 2>/dev/null || npx vite build --mode production

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