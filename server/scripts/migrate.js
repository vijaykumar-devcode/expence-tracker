require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { connectDB, closeDB, pool } = require('../config/db');

const run = async () => {
  await connectDB();
  const migrationDir = path.join(__dirname, '..', 'db', 'migrations');
  const migrationFiles = (await fs.readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  for (const file of migrationFiles) {
    const applied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );
    if (applied.rowCount > 0) continue;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await fs.readFile(path.join(migrationDir, file), 'utf8'));
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  console.log('PostgreSQL migration applied');
};

run()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB();
  });
