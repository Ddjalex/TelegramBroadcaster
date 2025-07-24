#!/usr/bin/env node

// Ultra-robust build script for Render deployment
import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 RENDER BUILD SCRIPT V2 - Ultra Robust');
console.log('📍 Node.js:', process.version);
console.log('📍 Platform:', process.platform);
console.log('📍 Working Dir:', process.cwd());

function executeCommand(command, description, options = {}) {
  console.log(`\n🔧 ${description}...`);
  console.log(`📝 Command: ${command}`);
  
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        FORCE_COLOR: '0'
      },
      ...options 
    });
    console.log(`✅ ${description} - SUCCESS`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - FAILED:`, error.message);
    if (options.optional) {
      console.log(`⚠️ ${description} was optional, continuing...`);
      return null;
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('\n🧹 PHASE 1: CLEANUP & PREPARATION');
    
    // Force clean installation
    executeCommand('rm -rf node_modules package-lock.json', 'Removing old dependencies', { optional: true });
    executeCommand('npm cache clean --force', 'Cleaning npm cache', { optional: true });
    
    console.log('\n📦 PHASE 2: DEPENDENCY INSTALLATION');
    
    // Install all dependencies including dev
    executeCommand('npm install --include=dev --force --verbose', 'Installing ALL dependencies');
    
    console.log('\n🔒 PHASE 3: SECURITY FIXES');
    
    // Force fix vulnerabilities 
    executeCommand('npm audit fix --force', 'Fixing security vulnerabilities', { optional: true });
    
    console.log('\n🔧 PHASE 4: BUILD TOOLS VERIFICATION');
    
    // Verify or install build tools
    if (!existsSync('./node_modules/.bin/vite')) {
      console.log('⚠️ Vite not found, installing explicitly...');
      executeCommand('npm install vite@latest --save-dev --no-audit', 'Installing Vite');
    }
    
    if (!existsSync('./node_modules/.bin/esbuild')) {
      console.log('⚠️ ESBuild not found, installing explicitly...');
      executeCommand('npm install esbuild@latest --save-dev --no-audit', 'Installing ESBuild');
    }
    
    // Test build tools
    executeCommand('./node_modules/.bin/vite --version', 'Testing Vite');
    executeCommand('./node_modules/.bin/esbuild --version', 'Testing ESBuild');
    
    console.log('\n🏗️ PHASE 5: FRONTEND BUILD');
    
    // Build frontend using direct binary path
    executeCommand('./node_modules/.bin/vite build --mode production', 'Building frontend with Vite');
    
    console.log('\n⚡ PHASE 6: BACKEND BUILD');
    
    // Build backend using direct binary path
    const backendCmd = [
      './node_modules/.bin/esbuild server/index.ts',
      '--bundle',
      '--platform=node', 
      '--format=esm',
      '--outdir=dist',
      '--packages=external',
      '--target=node20',
      '--tsconfig=tsconfig.json'
    ].join(' ');
    
    executeCommand(backendCmd, 'Building backend with ESBuild');
    
    console.log('\n🎯 PHASE 7: BUILD VERIFICATION');
    
    // Verify output
    executeCommand('ls -la dist/', 'Listing dist directory');
    executeCommand('ls -la dist/public/', 'Listing public assets', { optional: true });
    executeCommand('du -sh dist/', 'Checking build size', { optional: true });
    
    console.log('\n🎉 BUILD COMPLETED SUCCESSFULLY!');
    console.log('✅ Frontend: Built to dist/public/');
    console.log('✅ Backend: Built to dist/index.js');
    console.log('✅ Ready for deployment!');
    
  } catch (error) {
    console.error('\n💥 BUILD FAILED:', error.message);
    console.error('\n🔍 Debugging info:');
    executeCommand('node --version', 'Node version', { optional: true });
    executeCommand('npm --version', 'NPM version', { optional: true });
    executeCommand('ls -la node_modules/.bin/ | head -10', 'Available binaries', { optional: true });
    process.exit(1);
  }
}

main();