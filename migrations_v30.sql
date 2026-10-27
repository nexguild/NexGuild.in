-- Render the CPX script-tag widget directly in its dashboard content area,
-- rather than asking the widget script to create its own iframe.
UPDATE public.offerwall_providers
SET custom_config = jsonb_set(
  COALESCE(custom_config, '{}'::jsonb),
  '{use_iframe}',
  'false'::jsonb,
  true
)
WHERE slug = 'cpx_research';
