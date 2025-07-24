#!/usr/bin/env node

// Simple, reliable build script for Render deployment
import { execSync } from 'child_process';

console.log('🏗️  Building for Render deployment...');
console.log('📦 Node.js version:', process.version);
console.log('📁 Working directory:', process.cwd());

function runCommand(command, description, options = {}) {
  console.log(`\n📦 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' },
      ...options 
    });
    console.log(`✅ ${description} completed`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

try {
  // Step 1: Clean install with dev dependencies for build tools
  runCommand(
    'npm ci --include=dev --verbose', 
    'Installing dependencies (including dev dependencies for build tools)'
  );

  // Step 2: Check that Vite is available
  console.log('\n🔍 Checking build tools availability...');
  runCommand('npx vite --version', 'Verifying Vite');
  runCommand('npx esbuild --version', 'Verifying ESBuild');

  // Step 3: Build frontend with Vite
  runCommand('npx vite build --mode production', 'Building frontend');

  // Step 4: Build backend with esbuild
  runCommand(`
    npx esbuild server/index.ts 
    --bundle 
    --platform=node 
    --format=esm 
    --outdir=dist 
    --packages=external 
    --tsconfig=tsconfig.json 
    --target=node20 
    --legal-comments=none
  `.replace(/\s+/g, ' ').trim(), 'Building backend');

  console.log('\n🎉 Build completed successfully!');
  console.log('📂 Output files:');
  
  // List generated files
  try {
    execSync('ls -la dist/', { stdio: 'inherit' });
    execSync('ls -la dist/public/', { stdio: 'inherit' });
  } catch (e) {
    console.log('Could not list output files, but build completed');
  }

} catch (error) {
  console.error('\n💥 Build failed:', error.message);
  process.exit(1);
}