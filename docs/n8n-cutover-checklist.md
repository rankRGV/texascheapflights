# n8n cutover checklist

The direct social publisher is now in the Astro app. The existing admin Post button and Discord confirmation page call the Meta API from server-side code, so the external n8n workflow is no longer required for manual social publishing.

## Required before the first test post

Add these server-side environment variables in Vercel:

- `META_ACCESS_TOKEN`: a newly rotated Meta token with the required Facebook Page and Instagram publishing permissions.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `DEAL_CARD_SECRET` (or keep the existing `ADMIN_PASSWORD` fallback)
- `ADMIN_PASSWORD`
- `CRON_SECRET`
- Existing scout/ingest keys such as `SERP_API_KEY`, `GEMINI_API_KEY`, and `RESEND_API_KEY`.

The Meta token that was embedded in the n8n backup should be treated as exposed. Do not copy it into Vercel. Create a replacement token and revoke the old one.

The `deal-cards` Supabase Storage bucket must allow public reads because Meta fetches the generated PNG URLs. The app uploads three cached variants for each post:

- Feed card: 1200 × 630
- Instagram card: 1080 × 1080
- Story card: 1080 × 1920

## Safe rollout

1. Deploy the code.
2. Add and verify `META_ACCESS_TOKEN` in Vercel.
3. Post one real deal from the admin page with stories and comments disabled.
4. Confirm the Facebook post, Instagram post, image rendering, and `posted_to_social` flag.
5. Set `META_PUBLISH_STORIES=true` only after the feed post works.
6. Set `META_COMMENT_SNAPSHOT=true` only after the Facebook post ID and snapshot card are confirmed.
7. Disable the n8n workflow after the direct path has passed the test.

Stories and snapshot comments default to off. The admin action remains the approval gate; the scout and RSS jobs do not automatically publish social posts.

## Scheduled replacement

`vercel.json` schedules RSS polling every 12 hours and the scout 30 minutes later. Both endpoints already require `Authorization: Bearer $CRON_SECRET` whenever `CRON_SECRET` is configured.

The first scheduled deployment should be checked in the Vercel function logs. If the schedule is not visible, confirm that the deployment is a production deployment and that `CRON_SECRET`, `SERP_API_KEY`, Supabase, Gemini, and Resend variables are present in the Production environment.

## Visual variety

The post card variant is deterministic per deal ID and rotates among four creative labels: `radar`, `regional`, `weekend`, and `last-call`. This keeps a deal consistent across retries while making the feed less repetitive. The next visual pass can add separate layouts for those labels without changing the publisher contract.
