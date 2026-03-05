import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    try {
        const serpApiKey = import.meta.env.SERP_API_KEY || process.env.SERP_API_KEY;

        if (!serpApiKey) {
            return new Response(JSON.stringify({ error: "⚠️ SERP_API_KEY is not set. Go to https://serpapi.com/ to get a free API Key." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // Our target Texas regional airports
        const origins = ["MFE", "HRL", "LRD", "BRO", "CRP", "SAT", "AUS"];
        // /m/02j71 is Google's Knowledge Graph ID for "Earth" (Anywhere)
        const arrivalId = "/m/02j71";

        console.log(`🦅 Regional Scout scanning Google Flights (via SerpApi)...`);
        let allDealsFound: any[] = [];

        // Let's scout the first 3 airports to keep the API limits safe for the free tier
        const scoutList = origins.slice(0, 3);

        for (const origin of scoutList) {
            const params = new URLSearchParams({
                engine: 'google_flights_explore',
                departure_id: origin,
                arrival_id: arrivalId,
                currency: 'USD',
                hl: 'en',
                api_key: serpApiKey
            });

            const url = `https://serpapi.com/search.json?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.destinations && data.destinations.length > 0) {
                // Filter for glitches under $350
                const deals = data.destinations.filter((d: any) => d.flight?.price <= 350);

                deals.forEach((deal: any) => {
                    allDealsFound.push({
                        origin: origin,
                        destination: deal.name,
                        price: deal.flight?.price,
                        airline: deal.flight?.airline || "Multiple",
                        link: deal.flight?.link || `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${deal.name}`
                    });
                });
            }
        }

        if (allDealsFound.length === 0) {
            console.log("   ❌ Scout found no anomalous deals under $350 today.");
            return new Response(JSON.stringify({ message: "No deals found." }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Format the deals and send them to Discord
        const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
        let dealsReport = "🦅 **REGIONAL SCOUT REPORT [GOOGLE FLIGHTS SCAN]** 🦅\n\nThe Regional Scout just completed a sweep. It found these anomalies under $350:\n\n";

        // Only send top 5 to avoid Discord text limits
        const topDeals = allDealsFound.sort((a, b) => a.price - b.price).slice(0, 5);

        for (const flight of topDeals) {
            dealsReport += `**Route:** ${flight.origin} ➔ ${flight.destination}\n`;
            dealsReport += `**Price:** $${flight.price} (Round-Trip)\n`;
            dealsReport += `**Airlines:** ${flight.airline}\n`;
            dealsReport += `**Verify:** [Check Google Flights](${flight.link})\n\n`;
        }

        if (discordWebhookUrl) {
            await fetch(discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: dealsReport })
            });
            console.log("   ✅ Scout report sent to Discord!");
        }

        return new Response(JSON.stringify({
            success: true,
            dealsFound: allDealsFound.length,
            reportSent: !!discordWebhookUrl
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error("   ❌ Scout Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
