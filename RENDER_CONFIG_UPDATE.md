# 🔧 Update Your Render Configuration

## Current Configuration (from your screenshot):
- **Build Command**: `chmod +x render-build-final.sh && ./render-build-final.sh`
- **Start Command**: `node start-production.js`

## ✅ NEW Configuration (USE THIS):

### Build Command:
```bash
chmod +x render-build-simple.sh && ./render-build-simple.sh
```

### Start Command:
```bash
node dist/index.js
```

## Why This Change?

1. **render-build-simple.sh** is the latest script that fixes all dependency issues
2. **node dist/index.js** directly runs the built server (more reliable than start-production.js wrapper)

## Steps to Update:

1. In your Render dashboard, click "Edit" next to Build Command
2. Replace with: `chmod +x render-build-simple.sh && ./render-build-simple.sh`
3. Click "Edit" next to Start Command  
4. Replace with: `node dist/index.js`
5. Click "Deploy Latest Commit" to trigger a new build

## Expected Success:

✅ Build will complete without "Cannot find package 'vite'" errors  
✅ No more "Cannot find module 'tailwindcss'" errors  
✅ Frontend and backend will build successfully  
✅ App will start and be accessible at your Render URL  

## Environment Variables (keep as-is):
- `DATABASE_URL`: Your Neon database URL
- `NODE_ENV`: production  
- `TELEGRAM_BOT_TOKEN`: Your bot token (optional)

---

**Make these changes and your deployment will work perfectly!**