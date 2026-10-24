require('dotenv').config();

const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

if (!process.env.TEST_DATABASE_URL) {
  describe('PostgreSQL API integration', { skip: 'TEST_DATABASE_URL is not configured; refusing to use DATABASE_URL' }, () => {
    it('requires an isolated PostgreSQL test database', () => {});
  });

} else {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DATABASE_SSL = process.env.TEST_DATABASE_SSL || 'false';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'postgres-test-secret';

  const fs = require('fs/promises');
  const path = require('path');
  const request = require('supertest');
  const app = require('../app');
  const { pool } = require('../config/db');

  let agentA;
  let agentB;
  let expenseA;
  let expenseB;

  const applyMigration = async () => {
    const migration = await fs.readFile(
      path.join(__dirname, '..', 'db', 'migrations', '001_create_users_and_expenses.sql'),
      'utf8'
    );
    const budgetMigration = await fs.readFile(
      path.join(__dirname, '..', 'db', 'migrations', '002_create_budgets.sql'),
      'utf8'
    );
    const incomeMigration = await fs.readFile(
      path.join(__dirname, '..', 'db', 'migrations', '003_create_income.sql'),
      'utf8'
    );
    const recurringMigration = await fs.readFile(
      path.join(__dirname, '..', 'db', 'migrations', '004_create_recurring_transactions.sql'),
      'utf8'
    );
    const goalsMigration = await fs.readFile(
      path.join(__dirname, '..', 'db', 'migrations', '005_create_savings_goals.sql'),
      'utf8'
    );
    await pool.query(migration);
    await pool.query(budgetMigration);
    await pool.query(incomeMigration);
    await pool.query(recurringMigration);
    await pool.query(goalsMigration);
    await pool.query('DELETE FROM savings_goal_entries');
    await pool.query('DELETE FROM savings_goals');
    await pool.query('DELETE FROM recurring_occurrences');
    await pool.query('DELETE FROM recurring_transactions');
    await pool.query('DELETE FROM income');
    await pool.query('DELETE FROM budgets');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM users');
  };

  const register = async (agent, email, name) => {
    const response = await agent
      .post('/api/auth/register')
      .send({ name, email, password: 'strong-password-123' });
    assert.equal(response.status, 201);
    return response;
  };

  describe('PostgreSQL API integration', () => {
    before(async () => {
      await applyMigration();
      agentA = request.agent(app);
      agentB = request.agent(app);
      await register(agentA, 'a@example.com', 'User A');
      await register(agentB, 'b@example.com', 'User B');

      const createdA = await agentA.post('/api/expenses').send({
        title: 'A expense',
        description: 'A searchable note',
        amount: 100,
        category: 'Food',
        paymentMethod: 'Cash',
        date: '2026-10-24',
        user_id: '00000000-0000-0000-0000-000000000000',
      });
      const createdB = await agentB.post('/api/expenses').send({
        title: 'B expense',
        amount: 200,
        category: 'Travel',
        paymentMethod: 'Card',
        date: '2026-10-24',
      });
      assert.equal(createdA.status, 201);
      assert.equal(createdB.status, 201);
      expenseA = createdA.body;
      expenseB = createdB.body;
    });

    after(async () => {
      await pool.query('DELETE FROM savings_goal_entries');
      await pool.query('DELETE FROM savings_goals');
      await pool.query('DELETE FROM recurring_occurrences');
      await pool.query('DELETE FROM recurring_transactions');
      await pool.query('DELETE FROM income');
      await pool.query('DELETE FROM budgets');
      await pool.query('DELETE FROM expenses');
      await pool.query('DELETE FROM users');
      await pool.end();
    });

    it('assigns new expenses to the authenticated user, not request input', () => {
      assert.notEqual(expenseA.user, '00000000-0000-0000-0000-000000000000');
    });

    it('isolates listing and preserves pagination', async () => {
      const response = await agentA.get('/api/expenses?page=1&limit=1&search=A');
      assert.equal(response.status, 200);
      assert.equal(response.body.total, 1);
      assert.equal(response.body.expenses[0]._id, expenseA._id);
    });

    it('supports description search, payment filtering, and amount sorting', async () => {
      const response = await agentA.get('/api/expenses?search=searchable&paymentMethod=Cash&sort=amountDesc');
      assert.equal(response.status, 200);
      assert.equal(response.body.total, 1);
      assert.equal(response.body.expenses[0].description, 'A searchable note');
    });

    it('supports description updates and clearing, date filters, and pagination validation', async () => {
      const updated = await agentA.put(`/api/expenses/${expenseA._id}`).send({
        description: 'Updated note',
      });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.description, 'Updated note');

      const cleared = await agentA.put(`/api/expenses/${expenseA._id}`).send({
        description: '',
      });
      assert.equal(cleared.status, 200);
      assert.equal(cleared.body.description, undefined);

      const filtered = await agentA.get('/api/expenses?startDate=2026-10-24&endDate=2026-10-24&category=Food');
      assert.equal(filtered.status, 200);
      assert.equal(filtered.body.total, 1);
      assert.equal((await agentA.get('/api/expenses?page=0')).status, 400);
    });

    it('supports all allowlisted sort directions', async () => {
      const extra = await agentA.post('/api/expenses').send({
        title: 'Sort check',
        amount: 50,
        category: 'Food',
        paymentMethod: 'Cash',
        date: '2026-10-23',
      });
      assert.equal(extra.status, 201);
      const newest = await agentA.get('/api/expenses?sort=newest&limit=10');
      const oldest = await agentA.get('/api/expenses?sort=oldest&limit=10');
      const high = await agentA.get('/api/expenses?sort=amountDesc&limit=10');
      const low = await agentA.get('/api/expenses?sort=amountAsc&limit=10');
      assert.equal(newest.status, 200);
      assert.equal(oldest.status, 200);
      assert.equal(high.body.expenses[0].amount, 100);
      assert.equal(low.body.expenses[0].amount, 50);
      await agentA.delete(`/api/expenses/${extra.body._id}`);
    });

    it('creates and isolates monthly budgets with threshold calculations', async () => {
      const created = await agentA.post('/api/budgets').send({
        month: '2026-10-01',
        amount: 125,
        category: 'Food',
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.spent, 100);
      assert.equal(created.body.alert, 'warning');
      assert.equal((await agentB.get('/api/budgets?month=2026-10-01')).body.budgets.length, 0);
      assert.equal((await agentA.put(`/api/budgets/${created.body._id}`).send({ amount: 100 })).body.alert, 'exceeded');
      assert.equal((await agentB.get(`/api/budgets?month=2026-10-01`)).body.budgets.length, 0);
      assert.equal((await agentB.put(`/api/budgets/${created.body._id}`).send({ amount: 50 })).status, 404);
      assert.equal((await agentB.delete(`/api/budgets/${created.body._id}`)).status, 404);
      assert.equal((await agentA.delete(`/api/budgets/${created.body._id}`)).status, 200);
    });

    it('rejects invalid budget months and duplicate scopes', async () => {
      const invalid = await agentA.post('/api/budgets').send({
        month: '2026-02-31',
        amount: 100,
        category: 'Food',
      });
      assert.equal(invalid.status, 400);
      const first = await agentA.post('/api/budgets').send({
        month: '2026-11-01',
        amount: 100,
        category: null,
      });
      assert.equal(first.status, 201);
      const duplicate = await agentA.post('/api/budgets').send({
        month: '2026-11-01',
        amount: 200,
        category: null,
      });
      assert.equal(duplicate.status, 409);
      await agentA.delete(`/api/budgets/${first.body._id}`);
    });

    it('supports empty months and rejects invalid budget fields', async () => {
      const empty = await agentA.get('/api/budgets?month=2027-01-01');
      assert.equal(empty.status, 200);
      assert.deepEqual(empty.body.budgets, []);
      assert.equal((await agentA.post('/api/budgets').send({
        month: '2027-01-01',
        amount: 0,
        category: 'Food',
      })).status, 400);
      assert.equal((await agentA.post('/api/budgets').send({
        month: '2027-01-01',
        amount: 100,
        category: 'Invalid',
      })).status, 400);
    });

    it('supports income CRUD, filters, sorting, and ownership isolation', async () => {
      const created = await agentA.post('/api/income').send({
        title: 'Salary', amount: 500, category: 'Salary', paymentMethod: 'Bank',
        date: '2026-10-01', description: 'Monthly pay',
      });
      assert.equal(created.status, 400);
      const valid = await agentA.post('/api/income').send({
        title: 'Salary', amount: 500, category: 'Salary', paymentMethod: 'Cash',
        date: '2026-10-01', description: 'Monthly pay',
      });
      assert.equal(valid.status, 201);
      const item = valid.body;
      assert.equal((await agentA.get(`/api/income/${item._id}`)).status, 200);
      assert.equal((await agentB.get(`/api/income/${item._id}`)).status, 404);
      assert.equal((await agentB.put(`/api/income/${item._id}`).send({ amount: 1 })).status, 404);
      assert.equal((await agentB.delete(`/api/income/${item._id}`)).status, 404);
      assert.equal((await agentA.get('/api/income?search=Monthly&category=Salary&paymentMethod=Cash&sort=amountDesc')).body.total, 1);
      const updated = await agentA.put(`/api/income/${item._id}`).send({ description: '' });
      assert.equal(updated.body.description, undefined);
      assert.equal((await agentA.delete(`/api/income/${item._id}`)).status, 200);
    });

    it('calculates combined finance summaries and zero-income savings safely', async () => {
      const response = await agentA.get('/api/finance/summary?month=2026-10');
      assert.equal(response.status, 200);
      assert.equal(response.body.totalIncome, 0);
      assert.equal(response.body.savingsRate, 0);
      assert.equal(response.body.monthlyTrend.length, 6);
      assert.equal((await agentA.get('/api/finance/summary?month=invalid')).status, 400);
    });

    it('isolates recurring schedules and processes automatic occurrences idempotently', async () => {
      const manual = await agentA.post('/api/recurring').send({
        type: 'expense', title: 'Manual reminder', amount: 25, frequency: 'monthly',
        startDate: '2026-10-01',
      });
      assert.equal(manual.status, 201);
      assert.equal((await agentB.get(`/api/recurring`)).body.recurringTransactions.some((item) => item._id === manual.body._id), false);

      const automatic = await agentA.post('/api/recurring').send({
        type: 'income', title: 'Recurring salary', amount: 500, category: 'Salary',
        paymentMethod: 'Cash', frequency: 'monthly', startDate: '2026-10-01', autoGenerate: true,
      });
      assert.equal(automatic.status, 201);
      const first = await agentA.post('/api/recurring/process-due');
      assert.equal(first.status, 200);
      assert.equal(first.body.generated.length, 1);
      const retry = await agentA.post('/api/recurring/process-due');
      assert.equal(retry.status, 200);
      assert.equal(retry.body.generated.length, 0);
      assert.equal((await agentB.delete(`/api/recurring/${automatic.body._id}`)).status, 404);

      await agentA.delete(`/api/income/${first.body.generated[0].transactionId}`);
      await agentA.delete(`/api/recurring/${manual.body._id}`);
      await agentA.delete(`/api/recurring/${automatic.body._id}`);
    });

    it('blocks cross-user detail, update, and delete', async () => {
      assert.equal((await agentA.get(`/api/expenses/${expenseB._id}`)).status, 404);
      assert.equal((await agentA.put(`/api/expenses/${expenseB._id}`).send({ amount: 999 })).status, 404);
      assert.equal((await agentA.delete(`/api/expenses/${expenseB._id}`)).status, 404);
    });

    it('scopes reports and savings goals and rejects excessive withdrawals', async () => {
      const goal = await agentA.post('/api/goals').send({ name: 'Emergency fund', targetAmount: 1000, description: 'Reserve' });
      assert.equal(goal.status, 201);
      assert.equal((await agentB.get('/api/goals')).body.goals.length, 0);
      assert.equal((await agentA.post(`/api/goals/${goal.body._id}/entries`).send({ type: 'contribution', amount: 250, date: '2026-10-24' })).status, 201);
      assert.equal((await agentA.post(`/api/goals/${goal.body._id}/entries`).send({ type: 'withdrawal', amount: 251, date: '2026-10-24' })).status, 409);
      const report = await agentA.get('/api/reports?startDate=2026-10-01&endDate=2026-10-31');
      assert.equal(report.status, 200);
      assert.equal(report.body.totalIncome, 0);
      const csv = await agentA.get('/api/reports/csv?startDate=2026-10-01&endDate=2026-10-31&type=all');
      assert.equal(csv.status, 200);
      assert.match(csv.headers['content-type'], /text\/csv/);
      assert.equal((await agentB.delete(`/api/goals/${goal.body._id}`)).status, 404);
      assert.equal((await agentA.delete(`/api/goals/${goal.body._id}`)).status, 200);
    });

    it('scopes summaries and category breakdowns', async () => {
      const summaryA = await agentA.get('/api/expenses/summary');
      const summaryB = await agentB.get('/api/expenses/summary');
      assert.equal(summaryA.body.totalExpenses, 100);
      assert.equal(summaryA.body.transactionCount, 1);
      assert.deepEqual(summaryA.body.categoryBreakdown, [{ category: 'Food', total: 100 }]);
      assert.equal(summaryB.body.totalExpenses, 200);
    });

    it('rejects invalid UUIDs and unauthenticated requests', async () => {
      assert.equal((await agentA.get('/api/expenses/not-a-uuid')).status, 404);
      assert.equal((await request(app).get('/api/expenses')).status, 401);
      assert.equal((await agentA.get('/api/expenses?startDate=not-a-date')).status, 400);
      assert.equal((await agentA.get('/api/expenses?page=1abc')).status, 400);
    });
  });
}
