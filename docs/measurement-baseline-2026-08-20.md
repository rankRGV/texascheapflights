# Texas Cheap Flights measurement baseline

Captured: 2026-08-21

## Subscriber systems

- Resend audience: Early Access
- Resend contacts: **42**
- Supabase active subscribers: **40**
- Supabase sent deals with score >= 7: **580**
- Supabase total deals: **936**
- Difference to reconcile: **2 contacts**

The Resend count is the delivery-system baseline. The Supabase active-subscriber count remains the product-facing baseline until the two systems are reconciled. Do not display a combined total or claim that the systems are synchronized until duplicate and inactive records are reviewed.

## Existing GSC export

- Property: https://texascheapflights.com
- Search type: Web
- Export filter: Last 3 months
- Exported period: 2026-03-13 through 2026-06-12
- Chart totals: 28 clicks and 40,460 impressions

The export is stale relative to this baseline date. A fresh Search Console export is still required before setting numeric SEO targets.

## Immediate reconciliation task

1. Export the 42 Resend contacts without putting email addresses into the repository.
2. Compare normalized hashes or account IDs against Supabase subscriber records.
3. Identify the two records as duplicate, inactive, unsubscribed, or missing.
4. Make one system authoritative for delivery status and document the sync rule.
