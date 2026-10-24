CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(8) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  title VARCHAR(100) NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(32),
  payment_method VARCHAR(32),
  frequency VARCHAR(8) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  anchor_day SMALLINT NOT NULL CHECK (anchor_day BETWEEN 1 AND 31),
  end_date DATE,
  next_due_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_generate BOOLEAN NOT NULL DEFAULT FALSE,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (next_due_date >= start_date),
  CHECK (description IS NULL OR char_length(description) <= 500),
  CHECK ((transaction_type = 'income' AND category IN ('Salary', 'Freelance', 'Business', 'Investment Returns', 'Gift', 'Other'))
      OR (transaction_type = 'expense' AND category IN ('Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Other'))),
  CHECK (payment_method IS NULL OR payment_method IN ('Cash', 'UPI', 'Card', 'Other'))
);

CREATE INDEX IF NOT EXISTS recurring_transactions_user_due_idx
  ON recurring_transactions (user_id, active, next_due_date);

CREATE TABLE IF NOT EXISTS recurring_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  transaction_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recurring_transaction_id, due_date)
);
