# NexGuild.in

## MyLead campaigns

Featured MyLead campaigns are loaded from the Publisher API in `/api/surveys` when the `mylead` offerwall provider is active and these server-only variables are set:

```text
MYLEAD_API_USERNAME=
MYLEAD_API_PASSWORD=
```

Campaign rewards use `MYLEAD_USD_TO_NEXCOINS_RATE` and `MYLEAD_EUR_TO_NEXCOINS_RATE` (both default to `660` NexCoins per currency unit). Set these to match the reward conversion used by the platform. Campaign links carry the NexGuild contributor ID as `ml_sub1`; the MyLead conversion callback must return that value along with a unique transaction ID, payout amount, currency, and status. Configure MyLead's security-hash header with the same secret saved on the active MyLead provider in NexGuild. Only `approved` conversions are credited; rejected conversions reverse a prior credit.

The MyLead publisher Surveys page does not have a documented per-user survey-list API, so it is not embedded as a NexGuild survey feed.