import type { APIRoute } from 'astro';
import Parser from 'rss-parser';
import { processDeal } from '../../lib/engine';

const parser = new Parser();

// The feeds we want to monitor
const FEEDS = [
    'https://www.theflightdeal.com/category/flight-deals/hou/feed/',
    'https://www.theflightdeal.com/category/flight-deals/dfw/feed/',
    'https://www.theflightdeal.com/feed/',
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
    const ONE_HOUR_AGO = now.getTime() - (60 * 60 * 1000);

    console.log("🕒 Starting RSS Poll...");

    for (const feedUrl of FEEDS) {
        try {
            console.log(`📡 Fetching: ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);

            for (const item of feed.items) {
                const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;

                // Only process items from the last 60 minutes
                if (pubDate > ONE_HOUR_AGO) {
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
