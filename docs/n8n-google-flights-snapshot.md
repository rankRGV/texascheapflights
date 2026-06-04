# n8n Google Flights Snapshot Add-On

## Goal

After an approved Texas Cheap Flights deal is posted to social, the n8n workflow should open the deal's Google Flights URL, capture a screenshot showing the fare or savings context, and publish that screenshot as a comment/reply on the post that was just created.

## Payload fields now sent by Astro

The `/api/admin/social-post` and `/api/admin/discord-social` endpoints now send:

- `deal`: the Supabase deal row.
- `image_secret_key`: key for the existing deal-card image endpoint.
- `social_context.google_flights_url`: URL to open for verification.
- `social_context.savings_snapshot_card_url`: reliable fallback image for Meta comments.
- `social_context.savings`: current price, estimated reference price, savings amount, and savings percent.
- `social_context.google_flights_snapshot.comment_text`: suggested comment copy.
- `workflow_intent.comment_snapshot_on_primary_post`: explicit flag for the add-on branch.

## Recommended n8n branch

Add this branch after the node that creates the primary social post:

1. Capture the primary post ID/permalink from the social publishing node.
2. Open `{{$json.social_context.google_flights_url}}` with a browser/screenshot provider when one is available.
3. Wait for network idle or a fixed 5-8 second delay.
4. Capture the visible fare card or price comparison area.
5. Upload/store the screenshot if the social comment API needs a media URL, or use `social_context.savings_snapshot_card_url` as a reliable fallback image.
6. Comment/reply on the primary post with:
   - text: `{{$json.social_context.google_flights_snapshot.comment_text}}`
   - media: the screenshot file or uploaded media URL
7. Log success/failure with the deal ID and post ID.

## Practical note

Google Flights can be hard to screenshot reliably in headless automation because it may show consent, bot checks, or dynamic layout changes. If direct capture is flaky, use a screenshot service with browser session support or fall back to `social_context.savings_snapshot_card_url`. Keep the workflow non-blocking: the primary post should remain published even if the comment screenshot fails.
