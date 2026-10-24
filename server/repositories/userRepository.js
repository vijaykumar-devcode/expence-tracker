const { pool } = require('../config/db');

const toUser = (row) => (row ? {
  id: row.id,
  name: row.name,
  email: row.email,
} : null);

const findByEmail = async (email, includePassword = false) => {
  const columns = includePassword ? 'id, name, email, password_hash' : 'id, name, email';
  const { rows } = await pool.query(
    `SELECT ${columns} FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, name, email FROM users WHERE id = $1::uuid LIMIT 1',
    [id]
  );
  return toUser(rows[0]);
};

const createUser = async ({ name, email, passwordHash }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email`,
    [name, email, passwordHash]
  );
  return toUser(rows[0]);
};

const updatePassword = async (id, passwordHash) => {
  const result = await pool.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1::uuid', [id, passwordHash]);
  return result.rowCount > 0;
};

const updateProfile = async (id, name, email) => {
  const { rows } = await pool.query(
    `UPDATE users SET name = $2, email = $3, updated_at = NOW()
     WHERE id = $1::uuid RETURNING id, name, email`,
    [id, name, email]
  );
  return toUser(rows[0]);
};

module.exports = { findByEmail, findById, createUser, updatePassword, updateProfile };
