const { pool } = require('../config/db');
const { nextDate } = require('../utils/recurrence');

const columns = `id, user_id, transaction_type, title, description, amount::text AS amount,
  category, payment_method,   frequency, start_date, anchor_day, end_date, next_due_date,
  active, auto_generate, timezone, created_at, updated_at`;

const map = (row) => ({
  _id: row.id, user: row.user_id, type: row.transaction_type, title: row.title,
  ...(row.description !== null ? { description: row.description } : {}),
  amount: Number(row.amount), category: row.category, paymentMethod: row.payment_method,
  frequency: row.frequency, startDate: row.start_date, anchorDay: row.anchor_day, endDate: row.end_date,
  nextDueDate: row.next_due_date, active: row.active, autoGenerate: row.auto_generate,
  timezone: row.timezone, createdAt: row.created_at, updatedAt: row.updated_at,
});

const findMany = async (userId) => {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM recurring_transactions
     WHERE user_id = $1::uuid ORDER BY active DESC, next_due_date ASC, created_at DESC`, [userId]
  );
  return rows.map(map);
};

const create = async (userId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO recurring_transactions
      (user_id, transaction_type, title, description, amount, category, payment_method,
       frequency, start_date, anchor_day, end_date, next_due_date, active, auto_generate, timezone)
     VALUES ($1::uuid, $2, $3, $4, $5::numeric, $6, $7, $8, $9::date, $10,
       $11, $12::date, $13::date, $14, $15)
     RETURNING ${columns}`,
    [userId, data.type, data.title, data.description || null, data.amount, data.category || null,
      data.paymentMethod || null, data.frequency, data.startDate, data.endDate || null,
      data.anchorDay, data.nextDueDate, data.active, data.autoGenerate, data.timezone]
  );
  return map(rows[0]);
};

const update = async (userId, id, data) => {
  const { rows } = await pool.query(
    `UPDATE recurring_transactions SET title = $3, description = $4, amount = $5::numeric,
      category = $6, payment_method = $7, frequency = $8, start_date = $9::date,
      anchor_day = $10, end_date = $11::date, next_due_date = $12::date,
      auto_generate = $13, timezone = $14, updated_at = NOW()
     WHERE id = $1::uuid AND user_id = $2::uuid
     RETURNING ${columns}`,
    [id, userId, data.title, data.description || null, data.amount, data.category || null,
      data.paymentMethod || null, data.frequency, data.startDate, data.anchorDay,
      data.endDate || null, data.nextDueDate, data.autoGenerate, data.timezone]
  );
  return rows[0] ? map(rows[0]) : null;
};

const setActive = async (userId, id, active) => {
  const { rows } = await pool.query(
    `UPDATE recurring_transactions SET active = $3, updated_at = NOW()
     WHERE id = $1::uuid AND user_id = $2::uuid RETURNING ${columns}`,
    [id, userId, active]
  );
  return rows[0] ? map(rows[0]) : null;
};

const remove = async (userId, id) => {
  const result = await pool.query(
    'DELETE FROM recurring_transactions WHERE id = $1::uuid AND user_id = $2::uuid', [id, userId]
  );
  return result.rowCount > 0;
};

const processDue = async (userId, today) => {
  const client = await pool.connect();
  const generated = [];
  try {
    await client.query('BEGIN');
    const schedules = await client.query(
      `SELECT ${columns} FROM recurring_transactions
       WHERE user_id = $1::uuid AND active = TRUE AND auto_generate = TRUE
         AND next_due_date <= $2::date
       ORDER BY next_due_date FOR UPDATE`, [userId, today]
    );
    for (const schedule of schedules.rows) {
      let dueDate = schedule.next_due_date;
      while (dueDate <= today && (!schedule.end_date || dueDate <= schedule.end_date)) {
        const occurrence = await client.query(
          `INSERT INTO recurring_occurrences (recurring_transaction_id, due_date, transaction_id)
           VALUES ($1::uuid, $2::date, gen_random_uuid())
           ON CONFLICT (recurring_transaction_id, due_date) DO NOTHING
           RETURNING transaction_id`,
          [schedule.id, dueDate]
        );
        if (occurrence.rowCount > 0) {
          const transactionId = occurrence.rows[0].transaction_id;
          if (schedule.transaction_type === 'income') {
            await client.query(
              `INSERT INTO income (id, user_id, title, description, amount, category, payment_method, income_date)
               VALUES ($1::uuid, $2::uuid, $3, $4, $5::numeric, $6, $7, $8::date)`,
              [transactionId, userId, schedule.title, schedule.description, schedule.amount,
                schedule.category, schedule.payment_method, dueDate]
            );
          } else {
            await client.query(
              `INSERT INTO expenses (id, user_id, title, description, amount, category, payment_method, expense_date)
               VALUES ($1::uuid, $2::uuid, $3, $4, $5::numeric, $6, $7, $8::date)`,
              [transactionId, userId, schedule.title, schedule.description, schedule.amount,
                schedule.category, schedule.payment_method, dueDate]
            );
          }
          generated.push({ scheduleId: schedule.id, dueDate, transactionId });
        }
        dueDate = nextDate(dueDate, schedule.frequency, schedule.anchor_day);
      }
      const completed = schedule.end_date && dueDate > schedule.end_date;
      await client.query(
        `UPDATE recurring_transactions SET next_due_date = $3::date,
          active = CASE WHEN $4::boolean THEN FALSE ELSE active END, updated_at = NOW()
         WHERE id = $1::uuid AND user_id = $2::uuid`,
        [schedule.id, userId, dueDate, completed]
      );
    }
    await client.query('COMMIT');
    return generated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { findMany, create, update, setActive, remove, processDue };
