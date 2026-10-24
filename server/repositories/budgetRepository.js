const { pool } = require('../config/db');

const columns = `
  b.id, b.user_id, b.budget_month, b.category, b.amount::text AS amount,
  b.created_at, b.updated_at,
  COALESCE(SUM(e.amount), 0)::text AS spent
`;

const mapBudget = (row) => {
  const amount = Number(row.amount);
  const spent = Number(row.spent);
  const percentageUsed = amount === 0 ? 0 : (spent / amount) * 100;
  return {
    _id: row.id,
    user: row.user_id,
    month: row.budget_month,
    category: row.category,
    amount,
    spent,
    remaining: amount - spent,
    percentageUsed,
    alert: percentageUsed >= 100 ? 'exceeded' : percentageUsed >= 80 ? 'warning' : 'normal',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const findMany = async (userId, month) => {
  const { rows } = await pool.query(
    `SELECT ${columns}
     FROM budgets b
     LEFT JOIN expenses e
       ON e.user_id = b.user_id
      AND e.expense_date >= b.budget_month
      AND e.expense_date < (b.budget_month + INTERVAL '1 month')::date
      AND (b.category IS NULL OR e.category = b.category)
     WHERE b.user_id = $1::uuid AND b.budget_month = $2::date
     GROUP BY b.id
     ORDER BY b.category NULLS FIRST`,
    [userId, month]
  );
  return rows.map(mapBudget);
};

const create = async ({ userId, month, category, amount }) => {
  const { rows } = await pool.query(
    `INSERT INTO budgets (user_id, budget_month, category, amount)
     VALUES ($1::uuid, $2::date, $3, $4::numeric)
     RETURNING id`,
    [userId, month, category || null, amount]
  );
  const budgets = await findMany(userId, month);
  return budgets.find((budget) => budget._id === rows[0].id);
};

const update = async ({ id, userId, amount }) => {
  const { rows } = await pool.query(
    `UPDATE budgets SET amount = $3::numeric, updated_at = NOW()
     WHERE id = $1::uuid AND user_id = $2::uuid
     RETURNING id, budget_month`,
    [id, userId, amount]
  );
  if (!rows[0]) return null;
  const budgets = await findMany(userId, rows[0].budget_month);
  return budgets.find((budget) => budget._id === rows[0].id);
};

const remove = async (id, userId) => {
  const result = await pool.query(
    'DELETE FROM budgets WHERE id = $1::uuid AND user_id = $2::uuid',
    [id, userId]
  );
  return result.rowCount > 0;
};

module.exports = { findMany, create, update, remove };
