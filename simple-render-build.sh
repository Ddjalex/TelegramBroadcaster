#!/bin/bash

# Ultra-simple build script for Render - no dependencies on complex JS
set -e

echo "🏗️ Simple Build Script for Render"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Clean start
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json dist/

# Install everything
echo "📦 Installing all dependencies..."
npm install --include=dev --verbose

# Fix security issues
echo "🔒 Fixing security vulnerabilities..."
npm audit fix --force || echo "Audit fix completed with warnings"

# Verify tools exist
echo "🔍 Verifying build tools..."
echo "Vite location: $(which vite || echo 'not found in PATH')"
echo "Vite in node_modules: $(ls node_modules/.bin/vite 2>/dev/null || echo 'not found')"

# Force install build tools if missing
if [ ! -f "node_modules/.bin/vite" ]; then
  echo "⚠️ Vite missing, installing directly..."
  npm install vite@latest esbuild@latest @vitejs/plugin-react@latest --save-dev
fi

# Build frontend
echo "🔨 Building frontend..."
./node_modules/.bin/vite build --mode production

# Build backend  
echo "🔧 Building backend..."
./node_modules/.bin/esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20

echo "✅ Build completed!"
echo "📂 Output files:"
ls -la dist/
ls -la dist/public/ || echo "No public directory"