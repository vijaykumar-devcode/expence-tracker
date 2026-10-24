const { pool } = require('../config/db');

const columns = `id, user_id, title, description, amount::text AS amount,
  category, payment_method, income_date, created_at, updated_at`;

const mapIncome = (row) => ({
  _id: row.id, user: row.user_id, title: row.title,
  ...(row.description !== null ? { description: row.description } : {}),
  amount: Number(row.amount), category: row.category,
  paymentMethod: row.payment_method, date: row.income_date,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

const findMany = async ({ userId, search, category, paymentMethod, startDate, endDate, page, limit, sort }) => {
  const values = [userId];
  const conditions = ['user_id = $1::uuid'];
  const add = (value, sql) => { values.push(value); conditions.push(sql(`$${values.length}`)); };
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(title ILIKE $${values.length} OR COALESCE(description, '') ILIKE $${values.length})`);
  }
  if (category) add(category, (p) => `category = ${p}`);
  if (paymentMethod) add(paymentMethod, (p) => `payment_method = ${p}`);
  if (startDate) add(startDate, (p) => `income_date >= ${p}::date`);
  if (endDate) add(endDate, (p) => `income_date <= ${p}::date`);
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM income WHERE ${conditions.join(' AND ')}`, values);
  const sortMap = {
    newest: 'income_date DESC, created_at DESC',
    oldest: 'income_date ASC, created_at ASC',
    amountDesc: 'income.amount DESC, income_date DESC, created_at DESC',
    amountAsc: 'income.amount ASC, income_date DESC, created_at DESC',
  };
  values.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(
    `SELECT ${columns} FROM income WHERE ${conditions.join(' AND ')}
     ORDER BY ${sortMap[sort]} LIMIT $${values.length - 1} OFFSET $${values.length}`, values
  );
  return { incomes: rows.map(mapIncome), total: count.rows[0].total };
};

const findById = async (id, userId) => {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM income WHERE id = $1::uuid AND user_id = $2::uuid`, [id, userId]
  );
  return rows[0] ? mapIncome(rows[0]) : null;
};

const create = async ({ userId, title, description, amount, category, date, paymentMethod }) => {
  const { rows } = await pool.query(
    `INSERT INTO income (user_id, title, description, amount, category, payment_method, income_date)
     VALUES ($1::uuid, $2, $3, $4::numeric, $5, $6, $7::date) RETURNING ${columns}`,
    [userId, title, description || null, amount, category, paymentMethod, date]
  );
  return mapIncome(rows[0]);
};

const update = async ({ id, userId, title, description, amount, category, date, paymentMethod, hasDescription }) => {
  const { rows } = await pool.query(
    `UPDATE income SET title = COALESCE($3, title),
      description = CASE WHEN $9::boolean THEN $4 ELSE description END,
      amount = COALESCE($5::numeric, amount), category = COALESCE($6, category),
      income_date = COALESCE($7::date, income_date), payment_method = COALESCE($8, payment_method),
      updated_at = NOW()
     WHERE id = $1::uuid AND user_id = $2::uuid RETURNING ${columns}`,
    [id, userId, title, description, amount, category, date, paymentMethod, hasDescription]
  );
  return rows[0] ? mapIncome(rows[0]) : null;
};

const remove = async (id, userId) => {
  const result = await pool.query('DELETE FROM income WHERE id = $1::uuid AND user_id = $2::uuid', [id, userId]);
  return result.rowCount > 0;
};

module.exports = { findMany, findById, create, update, remove };
