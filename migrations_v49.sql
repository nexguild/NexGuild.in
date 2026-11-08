-- Add Perkox's dynamic offers API and embedded offerwall integration.
-- Apply this migration, then configure the Perkox API key and a long random
-- postback secret in Admin -> Offerwalls.
--
-- Perkox app #10573 currently rejects edits with HTTP 403. Keep this provider
-- disabled until its portal shows NexCoin / NEXC / 660 and set
-- custom_config.currency_rate_confirmed=true in Admin -> Offerwalls.
-- Then configure the Perkox postback URL as:
-- https://www.nexguild.in/api/offerwall/postback/perkox?secret=YOUR_SECRET&player_id={player_id}&click_id={click_id}&offer_id={offer_id}&reward_amount={reward_amount}&payout={payout}&status={status}
-- Replace YOUR_SECRET with the same postback secret stored in NexGuild.
-- Verify a test callback in Admin -> Postback Logs before enabling the provider.

INSERT INTO public.offerwall_providers (
  name,
  slug,
  is_ad_network,
  integration_type,
  embed_url_template,
  postback_param_map,
  contributor_share_pct,
  custom_config,
  is_active,
  display_order,
  description
) VALUES (
  'Perkox',
  'perkox',
  false,
  'api',
  'https://perkwall.com?app_id=10573&player_id={user_id}',
  '{
    "user_id": "player_id",
    "trans_id": "click_id",
    "amount": "reward_amount",
    "status": "status",
    "offer_id": "offer_id",
    "secret": "secret"
  }'::jsonb,
  100,
  '{
    "app_id": "10573",
    "conversion_rate": 660,
    "rate_is_user_share": true,
    "currency_rate_confirmed": false,
    "feature_tags": ["Offers", "App Installs", "Games"],
    "available_countries": []
  }'::jsonb,
  false,
  12,
  'Browse Perkox offers and earn NexCoins after confirmed conversions.'
)
ON CONFLICT (slug) DO UPDATE SET
  name                  = EXCLUDED.name,
  is_ad_network         = false,
  integration_type      = EXCLUDED.integration_type,
  embed_url_template    = EXCLUDED.embed_url_template,
  postback_param_map    = EXCLUDED.postback_param_map,
  contributor_share_pct = EXCLUDED.contributor_share_pct,
  custom_config         = COALESCE(offerwall_providers.custom_config, '{}'::jsonb) || EXCLUDED.custom_config,
  is_active             = false,
  display_order         = EXCLUDED.display_order,
  description           = EXCLUDED.description;
