CREATE TABLE IF NOT EXISTS public.contributor_activity (
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contributor_id, activity_date)
);

CREATE INDEX IF NOT EXISTS contributor_activity_date_last_active_idx
  ON public.contributor_activity (activity_date, last_active_at DESC);

ALTER TABLE public.contributor_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contributor_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contributor_activity TO service_role;
