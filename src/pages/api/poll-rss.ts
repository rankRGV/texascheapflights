import type { APIRoute } from 'astro';
import Parser from 'rss-parser';
import { processDeal } from '../../lib/engine';

const parser = new Parser();

// Texas-specific feeds only - no global feeds to avoid non-Texas deals
const FEEDS = [
    'https://www.theflightdeal.com/category/flight-deals/hou/feed/',
    'https://www.theflightdeal.com/category/flight-deals/dfw/feed/',
    'https://www.faredealalert.com/feed/'
];

export const GET: APIRoute = async ({ request }) => {
    // 1. Check for a simple secret to prevent random people from triggering this
    const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
    const authHeader = request.headers.get('Authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const results = [];
    const now = new Date();
    // Since this runs every ~10 and ~14 hours, we look back 15 hours to safely catch all deals.
    const FIFTEEN_HOURS_AGO = now.getTime() - (15 * 60 * 60 * 1000);

    console.log("🕒 Starting RSS Poll...");

    for (const feedUrl of FEEDS) {
        try {
            console.log(`📡 Fetching: ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);

            for (const item of feed.items) {
                const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;

                // Only process items from the last 15 hours
                if (pubDate > FIFTEEN_HOURS_AGO) {
                    console.log(`   ✨ New RSS Item: ${item.title}`);
                    const res = await processDeal(item.title || "No Title", item.content || item.contentSnippet || "", `RSS: ${feed.title}`);
                    results.push({ title: item.title, status: res });
                }
            }
        } catch (err) {
            console.error(`❌ Failed to poll ${feedUrl}:`, err);
        }
    }

    return new Response(JSON.stringify({
        timestamp: now.toISOString(),
        itemsProcessed: results.length,
        results
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
