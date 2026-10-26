-- Let CPX Research show its full available survey inventory and use the
-- orange survey header seen in its standard offerwall presentation.
WITH current_config AS (
  SELECT id, COALESCE(custom_config, '{}'::jsonb) AS config
  FROM public.offerwall_providers
  WHERE slug = 'cpx_research'
),
updated_widgets AS (
  SELECT
    id,
    jsonb_set(
      config,
      '{widget_configs}',
      COALESCE(
        (
          SELECT jsonb_agg(widget - 'limit_surveys' ORDER BY widget_order)
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(config->'widget_configs') = 'array'
                THEN config->'widget_configs'
              ELSE '[]'::jsonb
            END
          ) WITH ORDINALITY AS widgets(widget, widget_order)
        ),
        '[]'::jsonb
      ),
      true
    ) AS config
  FROM current_config
)
UPDATE public.offerwall_providers AS provider
SET custom_config = jsonb_set(
  updated_widgets.config,
  '{style_config}',
  COALESCE(updated_widgets.config->'style_config', '{}'::jsonb) ||
    jsonb_build_object(
      'survey_box',
      COALESCE(updated_widgets.config->'style_config'->'survey_box', '{}'::jsonb) ||
        jsonb_build_object('topbar_background_color', '#FFAD1F')
    ),
  true
)
FROM updated_widgets
WHERE provider.id = updated_widgets.id;
