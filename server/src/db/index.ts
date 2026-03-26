import '../config.js';
import pkg from 'pg';
const { Pool } = pkg;

console.log('DB Pool initialization. DATABASE_URL present:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
