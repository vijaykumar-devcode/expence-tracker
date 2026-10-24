CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  deadline DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (deadline IS NULL OR deadline >= created_at::date),
  CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE INDEX IF NOT EXISTS savings_goals_user_idx ON savings_goals (user_id, deadline);

CREATE TABLE IF NOT EXISTS savings_goal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type VARCHAR(12) NOT NULL CHECK (entry_type IN ('contribution', 'withdrawal')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL,
  note VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS savings_goal_entries_owner_idx ON savings_goal_entries (user_id, goal_id, entry_date DESC);
