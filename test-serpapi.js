async function test() {
    const apiKey = '80acbba559e7dbdfa8db66dd12f760bd1980a957a303fabfdf066bffd54fc17d';

    const params = new URLSearchParams({
        engine: 'google_travel_explore',
        departure_id: 'MFE',
        currency: 'USD',
        hl: 'en',
        api_key: apiKey
    });

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    console.log("Fetching:", url.replace(apiKey, "HIDDEN"));

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Status:", res.status);
        if (data.error) console.log("ERROR:", data.error);
        console.log("Keys:", Object.keys(data));
        if (data.destinations) {
            console.log("DESTINATIONS:", data.destinations.length);
            console.log(JSON.stringify(data.destinations[0], null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

test();
