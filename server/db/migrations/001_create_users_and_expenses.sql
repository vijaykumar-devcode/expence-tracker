CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  email VARCHAR(320) NOT NULL CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users (lower(email));

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(32) NOT NULL CHECK (category IN (
    'Food',
    'Travel',
    'Shopping',
    'Bills',
    'Health',
    'Education',
    'Other'
  )),
  payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN (
    'Cash',
    'UPI',
    'Card',
    'Other'
  )),
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_user_date_idx
  ON expenses (user_id, expense_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS expenses_user_category_idx
  ON expenses (user_id, category);

CREATE INDEX IF NOT EXISTS expenses_user_payment_method_idx
  ON expenses (user_id, payment_method);
