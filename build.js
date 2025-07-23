#!/usr/bin/env node
import { build } from 'esbuild';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function buildServer() {
  try {
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outdir: 'dist',
      packages: 'external',
      plugins: [sharedPlugin],
      tsconfig: 'tsconfig.json',
    });
    console.log('Server build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildServer();