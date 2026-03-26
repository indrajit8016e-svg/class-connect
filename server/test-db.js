import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config(); // Should pick up .env in the same directory

console.log('Testing connection with URL:', process.env.DATABASE_URL ? 'URL exists' : 'URL MISSING');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Connection error details:', err);
    process.exit(1);
  }
}

test();
