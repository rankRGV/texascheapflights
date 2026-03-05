import type { APIRoute } from 'astro';
import { GET as pollRss } from './poll-rss';
import { GET as scout } from './scout';

export const GET: APIRoute = async (context) => {
    // Ensure security if a secret is provided
    const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
    const authHeader = context.request.headers.get('Authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    console.log("🚀 Running Master Vercel Cron Job...");

    let results = {
        rss: "Failed",
        scout: "Failed"
    };

    try {
        console.log("--- Executing RSS Poll ---");
        await pollRss(context);
        results.rss = "Success";
    } catch (e: any) {
        console.error("Master Cron - RSS Poll Error:", e);
    }

    try {
        console.log("--- Executing Regional Scout ---");
        await scout(context);
        results.scout = "Success";
    } catch (e: any) {
        console.error("Master Cron - Scout Error:", e);
    }

    return new Response(JSON.stringify({ message: "Master cron complete", results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
