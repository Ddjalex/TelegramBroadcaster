# How Temporary Vite Config Works

## What Happens During Build

### Step 1: Backup Original Config
```bash
if [ -f "vite.config.ts" ]; then
  mv vite.config.ts vite.config.ts.backup
fi
```
This saves your existing `vite.config.ts` as `vite.config.ts.backup`

### Step 2: Create Temporary Config
The script creates `vite.config.temp.js` with this content:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
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
})
```

### Step 3: Build Using Temp Config
```bash
npx vite build --config vite.config.temp.js
```

### Step 4: Clean Up
```bash
rm -f vite.config.temp.js
if [ -f "vite.config.ts.backup" ]; then
  mv vite.config.ts.backup vite.config.ts
fi
```

## Why This Works

1. **No Module Conflicts**: Temp config uses `.js` extension, avoiding TypeScript issues
2. **Clean Environment**: No interference from existing config
3. **Proper Aliases**: All your path aliases work correctly
4. **PostCSS Integration**: TailwindCSS and Autoprefixer work properly

## Your Render Setup

Just use this exact build command in Render:
```bash
chmod +x render-build-simple-final.sh && ./render-build-simple-final.sh
```

The script handles all the temporary config creation and cleanup automatically. You don't need to do anything manually.