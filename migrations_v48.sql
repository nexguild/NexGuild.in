-- Retire Premium Tasks after deploying the application rollback.
-- Preserve task records in a non-API archive schema for financial/audit history.

CREATE SCHEMA IF NOT EXISTS premium_task_archive;
REVOKE ALL ON SCHEMA premium_task_archive FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA premium_task_archive TO service_role;

DROP FUNCTION IF EXISTS public.credit_premium_task_conversion(TEXT, TEXT, UUID, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.reverse_premium_task_conversion(TEXT, TEXT, UUID);

ALTER TABLE IF EXISTS public.premium_task_conversions SET SCHEMA premium_task_archive;
ALTER TABLE IF EXISTS public.premium_task_clicks SET SCHEMA premium_task_archive;
ALTER TABLE IF EXISTS public.premium_task_offers SET SCHEMA premium_task_archive;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.platform_commissions
    WHERE source_type = 'premium_task'
  ) THEN
    ALTER TABLE public.platform_commissions
      DROP CONSTRAINT IF EXISTS platform_commissions_source_type_check;

    ALTER TABLE public.platform_commissions
      ADD CONSTRAINT platform_commissions_source_type_check
      CHECK (source_type IN ('task', 'offerwall'));
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
