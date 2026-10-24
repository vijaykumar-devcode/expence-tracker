const { Pool } = require('pg');

const parseBoolean = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number.parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: parseBoolean(process.env.DATABASE_SSL, process.env.NODE_ENV === 'production')
    ? { rejectUnauthorized: false }
    : false,
});

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to start the PostgreSQL backend');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required to start the backend');
  }
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connection established');
  } finally {
    client.release();
  }
};

const closeDB = async () => pool.end();

module.exports = { pool, connectDB, closeDB };
