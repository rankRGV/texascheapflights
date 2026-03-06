async function test() {
    const apiKey = '80acbba559e7dbdfa8db66dd12f760bd1980a957a303fabfdf066bffd54fc17d';

    const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: 'MFE',
        arrival_id: 'LAS',
        outbound_date: '2026-06-13',
        return_date: '2026-06-19',
        currency: 'USD',
        hl: 'en',
        api_key: apiKey
    });

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    console.log("Fetching:", url.replace(apiKey, "HIDDEN"));

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.price_insights) {
            console.log("Lowest price:", data.price_insights.lowest_price);
            console.log("Price level:", data.price_insights.price_level);
            console.log("Typical range:", data.price_insights.typical_price_range);
        } else {
            console.log("No price insights found.");
        }
    } catch (e) {
        console.error(e);
    }
}

test();
