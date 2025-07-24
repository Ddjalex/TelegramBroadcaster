#!/bin/bash
set -e

echo "🚀 SIMPLE RENDER BUILD - Direct Fix"
echo "Node: $(node --version)"

# Clean install
rm -rf node_modules package-lock.json dist/ .vite || true
npm cache clean --force || true

# Single install command
echo "Installing dependencies..."
npm install --legacy-peer-deps --include=dev

# Create inline PostCSS config to avoid require issues
echo "Creating inline PostCSS config..."
cat > postcss.config.simple.js << 'EOF'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [tailwindcss, autoprefixer]
}
EOF

# Create vite config that uses the inline PostCSS
echo "Creating vite config..."
cat > vite.config.simple.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(process.cwd(), 'client/index.html')
    }
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'client/src'),
      '@shared': resolve(process.cwd(), 'shared'),
      '@assets': resolve(process.cwd(), 'attached_assets')
    }
  }
})
EOF

# Build
echo "Building..."
export NODE_ENV=production
npx vite build --config ./vite.config.simple.js --mode production

# Build backend
echo "Building backend..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outdir=dist \
  --packages=external \
  --target=node20

echo "✅ Build complete!"
ls -la dist/