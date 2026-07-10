-- ── migrations_v12.sql ────────────────────────────────────────────
-- Daily streak tracking table + atomic increment function

-- PART 1: streak_days table
CREATE TABLE IF NOT EXISTS streak_days (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID        REFERENCES profiles(id),
  day_date       DATE        NOT NULL,
  tasks_completed INTEGER    DEFAULT 0,
  target_met     BOOLEAN     DEFAULT FALSE,
  reward_claimed BOOLEAN     DEFAULT FALSE,
  reward_amount  INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contributor_id, day_date)
);

-- RLS: contributors can read their own rows; service role has full access
ALTER TABLE streak_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contributor_read_own_streak_days"
  ON streak_days FOR SELECT TO authenticated
  USING (contributor_id = auth.uid());

CREATE POLICY "service_role_all_streak_days"
  ON streak_days FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- PART 2: Atomic increment function (avoids read-then-write race condition)
-- Called by review-submission API on every task approval
CREATE OR REPLACE FUNCTION increment_streak_day(
  p_contributor_id UUID,
  p_day_date       DATE,
  p_target         INTEGER
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO streak_days (contributor_id, day_date, tasks_completed, target_met)
  VALUES (p_contributor_id, p_day_date, 1, (1 >= p_target))
  ON CONFLICT (contributor_id, day_date)
  DO UPDATE SET
    tasks_completed = streak_days.tasks_completed + 1,
    target_met = CASE
      WHEN streak_days.tasks_completed + 1 >= p_target THEN true
      ELSE streak_days.target_met
    END;
$$;
