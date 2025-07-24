#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🏗️  Building for Production...');

// Helper function to run commands with proper error handling
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Ensure we have all dependencies
    runCommand('npm ci --include=dev', 'Installing all dependencies');
    
    // Build frontend with Vite
    runCommand('npx vite build', 'Building frontend with Vite');
    
    // Build backend with esbuild
    const buildCommand = [
      'npx esbuild server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist',
      '--alias:@shared=./shared'
    ].join(' ');
    
    runCommand(buildCommand, 'Building backend with esbuild');
    
    console.log('🎉 Production build completed successfully!');
    console.log('📁 Frontend built to: dist/client');
    console.log('📁 Backend built to: dist/index.js');
  } catch (error) {
    console.error('💥 Build process failed:', error);
    process.exit(1);
  }
}

main();