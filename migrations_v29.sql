-- Add ClixWall (clixwall.com) without changing the separate ClickWall provider.
-- Configure the website API key and postback secret in Admin -> Offerwalls,
-- then enable it after the ClixWall wall and postback settings are tested.
-- Postback URL:
-- https://nexguild.in/api/offerwall/postback/clixwall?user_id={user_id}&secret={secret}&user_payout_usd={user_payout_usd}&transaction_id={transaction_id}&offer_id={offer_id}&status={status}
-- user_payout_usd is used so NexGuild can convert USD to NexCoins at the
-- configured currency_conversion_rate instead of treating USD as NexCoins.
INSERT INTO public.offerwall_providers (
  name,
  slug,
  is_ad_network,
  integration_type,
  contributor_share_pct,
  custom_config,
  is_active,
  display_order,
  description
) VALUES (
  'ClixWall',
  'clixwall',
  false,
  'iframe',
  66,
  '{
    "currency_conversion_rate": 1000,
    "feature_tags": ["Surveys", "Offers", "Tasks"],
    "available_countries": []
  }'::jsonb,
  false,
  10,
  'Complete surveys, offers, and tasks from ClixWall.'
)
ON CONFLICT (slug) DO UPDATE SET
  name                  = EXCLUDED.name,
  is_ad_network         = false,
  integration_type      = EXCLUDED.integration_type,
  contributor_share_pct = EXCLUDED.contributor_share_pct,
  custom_config         = EXCLUDED.custom_config || COALESCE(offerwall_providers.custom_config, '{}'::jsonb),
  display_order         = EXCLUDED.display_order,
  description           = EXCLUDED.description;
