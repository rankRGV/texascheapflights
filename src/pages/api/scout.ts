import type { APIRoute } from 'astro';
import { processDeal } from '../../lib/engine';

export const GET: APIRoute = async ({ request }) => {
    try {
        const serpApiKey = import.meta.env.SERP_API_KEY || process.env.SERP_API_KEY;

        if (!serpApiKey) {
            return new Response(JSON.stringify({ error: "⚠️ SERP_API_KEY is not set. Go to https://serpapi.com/ to get a free API Key." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const urlParams = new URL(request.url).searchParams;
        const isTest = urlParams.get('test') === 'true';
        const priceLimit = isTest ? 1000 : 350;

        // Check for a secret to prevent random people from triggering this
        const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
        const authHeader = request.headers.get('Authorization');

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Our comprehensive list of Texas regional airports (excluding DFW, IAH, HOU, DAL)
        const origins = [
            "MFE", "HRL", "LRD", "BRO", "CRP", "SAT", "AUS", // South/Central/Valley
            "ELP", "LBB", "MAF", "AMA", "SJT",             // West/Panhandle
            "BPT", "GRK", "TYR", "GGG", "ABI", "TXK",      // East/Central Minor
            "VCT", "ACT"                                   // Coast/Central Minor
        ];

        console.log(`🦅 Regional Scout scanning Google Flights (via SerpApi)... Limit: $${priceLimit}`);
        let allDealsFound: any[] = [];

        // To stay under the free 250 searches/month limit, we randomly select a batch of 3 airports per run.
        // If we run this twice a day, it's 6 searches/day. 6 * 30 days = 180 searches/month.
        const shuffledOrigins = origins.sort(() => 0.5 - Math.random());
        const scoutList = shuffledOrigins.slice(0, 3);

        console.log(`   📍 Randomly selected batch for this sweep: ${scoutList.join(', ')}`);

        for (const origin of scoutList) {
            const params = new URLSearchParams({
                engine: 'google_travel_explore',
                departure_id: origin,
                currency: 'USD',
                hl: 'en',
                api_key: serpApiKey
            });

            const url = `https://serpapi.com/search.json?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.destinations && data.destinations.length > 0) {
                // Filter for glitches under our dynamic limit
                const deals = data.destinations.filter((d: any) => d.flight_price <= priceLimit);

                deals.forEach((deal: any) => {
                    allDealsFound.push({
                        origin: origin,
                        destination: deal.name,
                        price: deal.flight_price,
                        airline: deal.airline || "Multiple",
                        link: deal.share_flights_url || deal.link || `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${deal.name}`,
                        start_date: deal.start_date,
                        end_date: deal.end_date
                    });
                });
            }
        }

        if (allDealsFound.length === 0) {
            console.log(`   ❌ Scout found no anomalous deals under $${priceLimit} today.`);
            return new Response(JSON.stringify({ message: "No deals found." }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Only run top 3 through the Engine to avoid Discord/Resend spam and Gemini API limits
        const topDeals = allDealsFound.sort((a, b) => a.price - b.price).slice(0, 3);

        let processedCount = 0;

        for (const flight of topDeals) {
            console.log(`🧠 Sending Scout Deal to Engine: ${flight.origin} -> ${flight.destination}`);

            const title = `✈️ SCOUT FIND: ${flight.origin} to ${flight.destination} for $${flight.price}`;

            // Generate a synthetic "Typical" price based on the current price to activate the Price Insight widget
            const typicalLow = flight.price + 120;
            const typicalHigh = flight.price + 280;

            const content = `
                The Regional Scout found a Flight Anomaly!
                Route: ${flight.origin} to ${flight.destination}
                Dates: ${flight.start_date || 'Flexible'} to ${flight.end_date || 'Flexible'}
                Price: $${flight.price}
                Airline: ${flight.airline}
                
                Typical: $${typicalLow} - $${typicalHigh}
                Cheaper: $${typicalLow - flight.price}
                
                Book Link: ${flight.link}
            `;

            const result = await processDeal(title, content, "Regional Scout");
            if (result && result.success) {
                processedCount++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            dealsFound: allDealsFound.length,
            dealsProcessedByEngine: processedCount
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error("   ❌ Scout Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
