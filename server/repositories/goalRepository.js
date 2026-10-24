const { pool } = require('../config/db');

const goalColumns = `g.id, g.user_id, g.name, g.target_amount::text AS target_amount,
  g.deadline, g.description, COALESCE(SUM(CASE WHEN e.entry_type = 'contribution' THEN e.amount ELSE -e.amount END), 0)::text AS balance`;
const map = (row) => ({ _id: row.id, user: row.user_id, name: row.name, targetAmount: Number(row.target_amount), deadline: row.deadline, description: row.description, balance: Number(row.balance), remaining: Math.max(0, Number(row.target_amount) - Number(row.balance)), progress: Math.min(100, (Number(row.balance) / Number(row.target_amount)) * 100) });

const list = async (userId) => {
  const { rows } = await pool.query(`SELECT ${goalColumns} FROM savings_goals g LEFT JOIN savings_goal_entries e ON e.goal_id = g.id AND e.user_id = $1::uuid WHERE g.user_id = $1::uuid GROUP BY g.id ORDER BY g.deadline NULLS LAST, g.created_at DESC`, [userId]);
  return rows.map(map);
};
const create = async (userId, data) => {
  const { rows } = await pool.query('INSERT INTO savings_goals (user_id, name, target_amount, deadline, description) VALUES ($1::uuid, $2, $3::numeric, $4::date, $5) RETURNING id, user_id, name, target_amount::text, deadline, description, 0::text AS balance', [userId, data.name, data.targetAmount, data.deadline || null, data.description || null]);
  return map(rows[0]);
};
const update = async (userId, id, data) => {
  const { rows } = await pool.query(`UPDATE savings_goals SET name = COALESCE($3, name), target_amount = COALESCE($4::numeric, target_amount), deadline = $5::date, description = $6, updated_at = NOW() WHERE id = $1::uuid AND user_id = $2::uuid RETURNING id`, [id, userId, data.name, data.targetAmount, data.deadline || null, data.description || null]);
  if (!rows[0]) return null;
  const result = await pool.query(`SELECT ${goalColumns} FROM savings_goals g LEFT JOIN savings_goal_entries e ON e.goal_id = g.id AND e.user_id = $1::uuid WHERE g.id = $2::uuid AND g.user_id = $1::uuid GROUP BY g.id`, [userId, id]);
  return result.rows[0] ? map(result.rows[0]) : null;
};
const remove = async (userId, id) => (await pool.query('DELETE FROM savings_goals WHERE id = $1::uuid AND user_id = $2::uuid', [id, userId])).rowCount > 0;
const entries = async (userId, id) => {
  const { rows } = await pool.query('SELECT e.id, e.entry_type, e.amount::text AS amount, e.entry_date, e.note FROM savings_goal_entries e JOIN savings_goals g ON g.id = e.goal_id WHERE e.goal_id = $1::uuid AND e.user_id = $2::uuid AND g.user_id = $2::uuid ORDER BY e.entry_date DESC, e.created_at DESC', [id, userId]);
  return rows.map((row) => ({ _id: row.id, type: row.entry_type, amount: Number(row.amount), date: row.entry_date, note: row.note }));
};
const addEntry = async (userId, id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const goal = await client.query('SELECT id FROM savings_goals WHERE id = $1::uuid AND user_id = $2::uuid FOR UPDATE', [id, userId]);
    if (!goal.rowCount) { await client.query('ROLLBACK'); return null; }
    if (data.type === 'withdrawal') {
      const balance = await client.query("SELECT COALESCE(SUM(CASE WHEN entry_type = 'contribution' THEN amount ELSE -amount END), 0)::numeric AS balance FROM savings_goal_entries WHERE goal_id = $1::uuid", [id]);
      if (Number(balance.rows[0].balance) < data.amount) { await client.query('ROLLBACK'); return { insufficient: true }; }
    }
    const { rows } = await client.query('INSERT INTO savings_goal_entries (goal_id, user_id, entry_type, amount, entry_date, note) VALUES ($1::uuid, $2::uuid, $3, $4::numeric, $5::date, $6) RETURNING id, entry_type, amount::text, entry_date, note', [id, userId, data.type, data.amount, data.date, data.note || null]);
    await client.query('COMMIT');
    return { _id: rows[0].id, type: rows[0].entry_type, amount: Number(rows[0].amount), date: rows[0].entry_date, note: rows[0].note };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
};
module.exports = { list, create, update, remove, entries, addEntry };
