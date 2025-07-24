#!/usr/bin/env node
import { build } from 'vite';
import { build as esbuild } from 'esbuild';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🏗️  Building for Render deployment...');

// Custom plugin to resolve @shared imports
const sharedPlugin = {
  name: 'shared-resolver',
  setup(build) {
    build.onResolve({ filter: /^@shared/ }, (args) => {
      const importPath = args.path.replace('@shared', resolve(__dirname, 'shared'));
      return { path: importPath };
    });
  },
};

async function buildFrontend() {
  console.log('📦 Building frontend with Vite...');
  try {
    await build({
      configFile: resolve(__dirname, 'vite.config.ts'),
    });
    console.log('✅ Frontend build completed');
  } catch (error) {
    console.error('❌ Frontend build failed:', error);
    process.exit(1);
  }
}

async function buildBackend() {
  console.log('🔧 Building backend with esbuild...');
  try {
    await esbuild({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outdir: 'dist',
      packages: 'external',
      plugins: [sharedPlugin],
      tsconfig: 'tsconfig.json',
      logLevel: 'info',
    });
    console.log('✅ Backend build completed');
  } catch (error) {
    console.error('❌ Backend build failed:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    // Build frontend first
    await buildFrontend();
    
    // Then build backend
    await buildBackend();
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('💥 Build process failed:', error);
    process.exit(1);
  }
}

main();