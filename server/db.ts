import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Enhanced database connection validation
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  console.error('Please configure your database connection in your deployment environment');
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format for common issues
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('DATABASE_URL format appears invalid:', dbUrl.substring(0, 20) + '...');
  console.error('Expected format: postgresql://user:password@host:port/database');
}

// Configure pool with production-optimized settings
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Test database connection on startup
pool.on('connect', () => {
  console.log('Database connection established successfully');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database connections...');
  await pool.end();
  process.exit(0);
});