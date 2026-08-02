-- ============================================================
-- v24: Add ClickWall offerwall provider
-- ClickWall (clickwall.net) — iframe integration
-- S1 model: exchange rate 660, amount = user's NexCoins directly
-- Postback URL to set in ClickWall dashboard:
--   https://www.nexguild.in/api/offerwall/postback/clickwall?user_id={user_id}&txid={txid}&amount={amount}&status=1&secret=NxG_clickwall_2026
-- ============================================================

INSERT INTO offerwall_providers (
  name,
  slug,
  is_ad_network,
  integration_type,
  embed_url_template,
  postback_secret,
  postback_param_map,
  contributor_share_pct,
  custom_config,
  is_active,
  display_order,
  description,
  logo_url
) VALUES (
  'ClickWall',
  'clickwall',
  false,
  'iframe',
  'https://clickwall.net/app/iframe/10682/{user_id}',
  'NxG_clickwall_2026',
  '{"trans_id": "txid"}',
  100,
  '{
    "rate_is_user_share": true,
    "payout_multiplier": 1,
    "feature_tags": ["Surveys", "App Installs", "Offers", "Sign-ups"],
    "available_countries": []
  }',
  true,
  8,
  'Complete offers, surveys, and app installs to earn NexCoins instantly.',
  null
)
ON CONFLICT (slug) DO UPDATE SET
  name                  = EXCLUDED.name,
  embed_url_template    = EXCLUDED.embed_url_template,
  postback_secret       = EXCLUDED.postback_secret,
  postback_param_map    = EXCLUDED.postback_param_map,
  contributor_share_pct = EXCLUDED.contributor_share_pct,
  custom_config         = EXCLUDED.custom_config,
  is_active             = EXCLUDED.is_active,
  display_order         = EXCLUDED.display_order,
  description           = EXCLUDED.description;
