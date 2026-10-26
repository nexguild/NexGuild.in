-- Match the CPX Research survey header to NexGuild's teal brand color.
UPDATE public.offerwall_providers
SET custom_config = jsonb_set(
  COALESCE(custom_config, '{}'::jsonb),
  '{style_config,survey_box,topbar_background_color}',
  '"#14b8a6"'::jsonb,
  true
)
WHERE slug = 'cpx_research';
