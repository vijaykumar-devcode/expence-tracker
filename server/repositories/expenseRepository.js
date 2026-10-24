const { pool } = require('../config/db');

const expenseColumns = `
  id, user_id, title, description, amount::text AS amount,
  category, payment_method, expense_date, created_at, updated_at
`;

const toExpense = (row) => ({
  _id: row.id,
  user: row.user_id,
  title: row.title,
  ...(row.description !== null ? { description: row.description } : {}),
  amount: Number(row.amount),
  category: row.category,
  paymentMethod: row.payment_method,
  date: row.expense_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findMany = async ({ userId, search, category, paymentMethod, startDate, endDate, page, limit, sort }) => {
  const values = [userId];
  const conditions = ['user_id = $1::uuid'];
  const add = (value, clause) => {
    values.push(value);
    conditions.push(clause(`$${values.length}`));
  };

  if (search) {
    values.push(`%${search}%`);
    const placeholder = `$${values.length}`;
    conditions.push(`(title ILIKE ${placeholder} OR COALESCE(description, '') ILIKE ${placeholder})`);
  }
  if (category && category !== 'All' && category !== 'All Categories') add(category, (placeholder) => `category = ${placeholder}`);
  if (paymentMethod && paymentMethod !== 'All' && paymentMethod !== 'All Payment Methods') add(paymentMethod, (placeholder) => `payment_method = ${placeholder}`);
  if (startDate) add(startDate, (placeholder) => `expense_date >= ${placeholder}::date`);
  if (endDate) add(endDate, (placeholder) => `expense_date <= ${placeholder}::date`);

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM expenses WHERE ${conditions.join(' AND ')}`,
    values
  );
  const total = countResult.rows[0].total;
  values.push(limit, (page - 1) * limit);
  const sortMap = {
    newest: 'expense_date DESC, created_at DESC',
    oldest: 'expense_date ASC, created_at ASC',
    amountDesc: 'expenses.amount DESC, expense_date DESC, created_at DESC',
    amountAsc: 'expenses.amount ASC, expense_date DESC, created_at DESC',
  };
  const orderBy = sortMap[sort] || sortMap.newest;
  const { rows } = await pool.query(
    `SELECT ${expenseColumns} FROM expenses
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { expenses: rows.map(toExpense), total };
};

const findById = async (id, userId) => {
  const { rows } = await pool.query(
    `SELECT ${expenseColumns} FROM expenses
     WHERE id = $1::uuid AND user_id = $2::uuid`,
    [id, userId]
  );
  return rows[0] ? toExpense(rows[0]) : null;
};

const create = async ({ userId, title, description, amount, category, date, paymentMethod }) => {
  const { rows } = await pool.query(
    `INSERT INTO expenses (user_id, title, description, amount, category, payment_method, expense_date)
     VALUES ($1::uuid, $2, $3, $4::numeric, $5, $6, $7::date)
     RETURNING ${expenseColumns}`,
    [userId, title, description || null, amount, category, paymentMethod, date]
  );
  return toExpense(rows[0]);
};

const update = async ({ id, userId, title, description, amount, category, date, paymentMethod, hasDescription }) => {
  const { rows } = await pool.query(
    `UPDATE expenses
     SET title = COALESCE($3, title),
         description = CASE WHEN $9::boolean THEN $4 ELSE description END,
         amount = COALESCE($5::numeric, amount),
         category = COALESCE($6, category),
         expense_date = COALESCE($7::date, expense_date),
         payment_method = COALESCE($8, payment_method),
         updated_at = NOW()
     WHERE id = $1::uuid AND user_id = $2::uuid
     RETURNING ${expenseColumns}`,
    [id, userId, title, description, amount, category, date, paymentMethod, hasDescription]
  );
  return rows[0] ? toExpense(rows[0]) : null;
};

const remove = async (id, userId) => {
  const result = await pool.query(
    'DELETE FROM expenses WHERE id = $1::uuid AND user_id = $2::uuid',
    [id, userId]
  );
  return result.rowCount > 0;
};

const getSummary = async (userId, startDate, endDate) => {
  const [total, monthly, count, recent, categories] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses WHERE user_id = $1::uuid', [userId]),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0)::text AS total
       FROM expenses WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date`,
      [userId, startDate, endDate]
    ),
    pool.query('SELECT COUNT(*)::int AS count FROM expenses WHERE user_id = $1::uuid', [userId]),
    pool.query(
      `SELECT ${expenseColumns} FROM expenses
       WHERE user_id = $1::uuid ORDER BY expense_date DESC, created_at DESC LIMIT 5`,
      [userId]
    ),
    pool.query(
      `SELECT category, SUM(amount)::text AS total
       FROM expenses
       WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date
       GROUP BY category ORDER BY SUM(amount) DESC`,
      [userId, startDate, endDate]
    ),
  ]);

  return {
    totalExpenses: Number(total.rows[0].total),
    monthlyExpenses: Number(monthly.rows[0].total),
    transactionCount: count.rows[0].count,
    recentTransactions: recent.rows.map(toExpense),
    categoryBreakdown: categories.rows.map((row) => ({
      category: row.category,
      total: Number(row.total),
    })),
  };
};

module.exports = { findMany, findById, create, update, remove, getSummary };
