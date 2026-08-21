# Scout shadow test

The shadow path is read-only by design. It uses SerpAPI's google_flights_deals
engine, never calls processDeal, and only writes observations when the
PERSIST_SCOUT_OBSERVATIONS=true environment variable is enabled after the
Supabase migration has been applied.

## Request shape

Run one request per Texas airport per day, rotating the trip profile across:

- trip_length=2,4
- trip_length=5,9
- trip_length=10,16

Example request: /api/scout?shadow=true&origin=DFW&trip_length=2,4

The request requires the normal Authorization: Bearer <CRON_SECRET> header
when CRON_SECRET is configured. Start with the existing 19-airport list and
keep the result JSON for each day.

## 14-day decision gate

Compare the shadow source with the existing source on:

- unique routes and unique destinations per week
- unique airlines and duration buckets
- regional-airport share
- candidate verification success
- repeat-alert rate
- discovery-to-alert time
- SerpAPI cost per verified candidate

Do not promote the new source until exact route, price, dates, airline, stops,
baggage, and booking-link checks are complete. A source should only be promoted
if it improves destination and duration diversity without increasing
unsubscribe or complaint rates.
