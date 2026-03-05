import type { APIRoute } from 'astro';

const formatTequilaDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const tequilaApiKey = import.meta.env.TEQUILA_API_KEY || process.env.TEQUILA_API_KEY;

        if (!tequilaApiKey) {
            return new Response(JSON.stringify({ error: "⚠️ TEQUILA_API_KEY is not set. Go to https://tequila.kiwi.com/ to get a free API Key." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // Set up search params
        const origins = "MFE,HRL,LRD,BRO,CRP,SAT,AUS"; // Our target Texas regional airports
        const today = new Date();

        // Search from Tomorrow
        const tmrw = new Date(today);
        tmrw.setDate(tmrw.getDate() + 1);
        const dateFrom = formatTequilaDate(tmrw);

        // To 6 months from now
        const sixMonthsFromNow = new Date(today);
        sixMonthsFromNow.setMonth(today.getMonth() + 6);
        const dateTo = formatTequilaDate(sixMonthsFromNow);

        const params = new URLSearchParams({
            fly_from: origins,
            fly_to: 'anywhere',
            dateFrom: dateFrom,
            dateTo: dateTo,
            price_to: '350', // We only want true glitches or heavy discounts
            curr: 'USD',
            flight_type: 'round', // Round-trip flights only
            one_for_city: '1', // Only show the absolute cheapest flight per destination city
            max_stopovers: '2', // Don't show 5-stop nightmares
            limit: '5', // Show us the top 5 wildest deals across all regional airports
        });

        const url = `https://api.tequila.kiwi.com/v2/search?${params.toString()}`;
        console.log(`🦅 Regional Scout scanning Tequila API...`);

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': tequilaApiKey,
                'accept': 'application/json'
            }
        });

        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            console.log("   ❌ Scout found no anomalous deals under $350 today.");
            return new Response(JSON.stringify({ message: "No deals found.", data: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Format the deals and send them to Discord
        const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
        let dealsReport = "🦅 **REGIONAL SCOUT REPORT [LIVE DB SCAN]** 🦅\n\nThe Regional Scout just completed a sweep of MFE, LRD, HRL, CRP, SAT, and AUS. It found these round-trip anomalies under $350 right now:\n\n";

        for (const flight of data.data) {
            const departureDate = new Date(flight.route[0].local_departure).toLocaleDateString();
            const returnDate = flight.route.length > 1 ? new Date(flight.route[flight.route.length - 1].local_departure).toLocaleDateString() : 'N/A';
            const airlines = flight.airlines.join(', ');

            dealsReport += `**Route:** ${flight.flyFrom} ➔ ${flight.cityTo} (${flight.flyTo})\n`;
            dealsReport += `**Price:** $${flight.price} (Round-Trip)\n`;
            dealsReport += `**Dates:** ${departureDate} to ${returnDate}\n`;
            dealsReport += `**Airlines:** ${airlines}\n`;
            dealsReport += `**Verify:** [Check Google Flights](https://www.google.com/travel/flights?q=Flights%20to%20${flight.flyTo}%20from%20${flight.flyFrom}%20on%20${flight.route[0].local_departure.split('T')[0]})\n\n`;
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
            dealsFound: data.data.length,
            reportSent: !!discordWebhookUrl
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error("   ❌ Scout Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
