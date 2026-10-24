const { pool } = require('../config/db');

const findTransactions = async ({ userId, startDate, endDate, type }) => {
  const tables = type === 'income' ? ['income'] : type === 'expense' ? ['expenses'] : ['income', 'expenses'];
  const queries = tables.map((table) => {
    const dateColumn = table === 'income' ? 'income_date' : 'expense_date';
    return pool.query(
      `SELECT title, description, amount::text AS amount, category, payment_method, ${dateColumn} AS date, $3::text AS type
       FROM ${table} WHERE user_id = $1::uuid AND ${dateColumn} >= $2::date AND ${dateColumn} <= $4::date
       ORDER BY ${dateColumn} DESC`,
      [userId, startDate, table === 'income' ? 'income' : 'expense', endDate]
    );
  });
  const results = await Promise.all(queries);
  return results.flatMap((result) => result.rows).sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

const report = async (userId, startDate, endDate) => {
  const [income, expenses, categories] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(amount), 0)::text AS total FROM income WHERE user_id = $1::uuid AND income_date BETWEEN $2::date AND $3::date', [userId, startDate, endDate]),
    pool.query('SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date', [userId, startDate, endDate]),
    pool.query('SELECT category, SUM(amount)::text AS total FROM expenses WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date GROUP BY category ORDER BY SUM(amount) DESC', [userId, startDate, endDate]),
  ]);
  const totalIncome = Number(income.rows[0].total);
  const totalExpenses = Number(expenses.rows[0].total);
  return {
    startDate, endDate, totalIncome, totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    expenseCategoryBreakdown: categories.rows.map((row) => ({ category: row.category, total: Number(row.total) })),
  };
};

module.exports = { findTransactions, report };
