const { pool } = require('../config/db');

const summary = async (userId, month) => {
  const start = `${month}-01`;
  const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
  const [income, expenses, incomeCategories, expenseCategories, recent, trends] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(amount), 0)::text AS total FROM income WHERE user_id = $1::uuid AND income_date BETWEEN $2::date AND $3::date', [userId, start, end]),
    pool.query('SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date', [userId, start, end]),
    pool.query('SELECT category, SUM(amount)::text AS total FROM income WHERE user_id = $1::uuid AND income_date BETWEEN $2::date AND $3::date GROUP BY category ORDER BY SUM(amount) DESC', [userId, start, end]),
    pool.query('SELECT category, SUM(amount)::text AS total FROM expenses WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date GROUP BY category ORDER BY SUM(amount) DESC', [userId, start, end]),
    pool.query(`SELECT id, title, amount::text AS amount, category, income_date AS date, 'income' AS type FROM income WHERE user_id = $1::uuid AND income_date BETWEEN $2::date AND $3::date
      UNION ALL SELECT id, title, amount::text AS amount, category, expense_date AS date, 'expense' AS type FROM expenses WHERE user_id = $1::uuid AND expense_date BETWEEN $2::date AND $3::date
      ORDER BY date DESC LIMIT 10`, [userId, start, end]),
    pool.query(`WITH months AS (
      SELECT generate_series(date_trunc('month', $2::date) - interval '5 months', date_trunc('month', $2::date), interval '1 month')::date AS month
    ) SELECT to_char(months.month, 'YYYY-MM') AS month,
      COALESCE((SELECT SUM(amount) FROM income WHERE user_id = $1::uuid AND income_date >= months.month AND income_date < months.month + interval '1 month'), 0)::text AS income,
      COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = $1::uuid AND expense_date >= months.month AND expense_date < months.month + interval '1 month'), 0)::text AS expenses
      FROM months ORDER BY months.month`, [userId, start]),
  ]);
  const totalIncome = Number(income.rows[0].total);
  const totalExpenses = Number(expenses.rows[0].total);
  return {
    month, totalIncome, totalExpenses, netCashFlow: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    incomeCategoryBreakdown: incomeCategories.rows.map((r) => ({ category: r.category, total: Number(r.total) })),
    expenseCategoryBreakdown: expenseCategories.rows.map((r) => ({ category: r.category, total: Number(r.total) })),
    recentTransactions: recent.rows.map((r) => ({ _id: r.id, title: r.title, amount: Number(r.amount), category: r.category, date: r.date, type: r.type })),
    monthlyTrend: trends.rows.map((r) => ({ month: r.month, income: Number(r.income), expenses: Number(r.expenses), netCashFlow: Number(r.income) - Number(r.expenses) })),
  };
};

module.exports = { summary };
