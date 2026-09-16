-- Add Notik offerwall configuration.
-- Enter the Notik App API Key in the admin offerwall settings after applying.
-- Store the App API Secret in the provider postback secret field.

INSERT INTO offerwall_providers (
  name,
  slug,
  is_ad_network,
  integration_type,
  postback_param_map,
  contributor_share_pct,
  custom_config,
  is_active,
  display_order,
  description,
  logo_url
) VALUES (
  'Notik',
  'notik',
  false,
  'iframe',
  '{"trans_id": "txn_id"}',
  100,
  '{
    "app_id": "Nt1A6qKCgr",
    "publisher_id": "UEoeUU",
    "hash_algorithm": "hmac-sha1-url",
    "rate_is_user_share": true,
    "payout_multiplier": 1,
    "credit_status_value": "1",
    "feature_tags": ["Surveys", "App Installs", "Offers", "Sign-ups"],
    "available_countries": []
  }',
  false,
  9,
  'Complete surveys, app installs, and offers to earn NexCoins.',
  null
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  integration_type = EXCLUDED.integration_type,
  postback_param_map = EXCLUDED.postback_param_map,
  contributor_share_pct = EXCLUDED.contributor_share_pct,
  custom_config = EXCLUDED.custom_config,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description;
