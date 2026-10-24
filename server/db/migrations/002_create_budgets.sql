CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_month DATE NOT NULL CHECK (budget_month = date_trunc('month', budget_month)::date),
  category VARCHAR(32),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (category IS NULL OR category IN (
    'Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Other'
  ))
);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_scope_idx
  ON budgets (user_id, budget_month, COALESCE(category, ''));

CREATE INDEX IF NOT EXISTS budgets_user_month_idx
  ON budgets (user_id, budget_month);
