import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection events
pool.on('connect', () => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [DB] New client connected to database`);
});

pool.on('error', (err: Error) => {
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[${timestamp}] [DB] Unexpected error on idle client`, err);
});

/**
 * Execute a query with automatic connection handling
 */
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[${timestamp}] [DB] Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error(`[${timestamp}] [DB] Query error:`, error);
    throw error;
  }
};

/**
 * Get a client from the pool for transaction handling
 */
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  const timestamp = new Date().toLocaleTimeString();

  try {
    const result = await query('SELECT NOW()');
    console.log(`[${timestamp}] [DB] Connection test successful:`, result.rows[0]);
    return true;
  } catch (error) {
    console.error(`[${timestamp}] [DB] Connection test failed:`, error);
    return false;
  }
};

/**
 * Close all database connections
 */
export const closePool = async (): Promise<void> => {
  const timestamp = new Date().toLocaleTimeString();
  await pool.end();
  console.log(`[${timestamp}] [DB] Database pool closed`);
};

export default pool;
