import type { APIRoute } from 'astro';
import { processDeal } from '../../lib/engine';
import { getCarrierTier, normalizeAirlineName } from '../../lib/airlines';
import { validateWithFli } from '../../lib/fli-validator';
import { persistDealObservations } from '../../lib/deal-observations';
import { selectDiverseCandidates } from '../../lib/deal-quality';

type OriginGroup = 'regional' | 'major';

type ScoutCandidate = {
    origin: string;
    destination: string;
    destinationCode?: string;
    price: number;
    airline: string;
    link: string;
    start_date?: string;
    end_date?: string;
    originGroup: OriginGroup;
    lane: 'regional-legacy' | 'regional-value' | 'major-legacy' | 'major-value' | 'premium';
    benchmarkLow: number;
    benchmarkHigh: number;
    estimatedDiscountPct: number;
    valueScore: number;
};

const PRIMARY_TX_AIRPORTS = [
    "MFE", "HRL", "LRD", "BRO", "CRP", "ELP", "LBB", "MAF", "AMA",
    "GRK", "TYR", "GGG", "ABI", "DFW", "IAH", "AUS", "SAT", "HOU", "DAL"
];

function rotateOrigins(origins: string[], count: number, slot: number): string[] {
    if (origins.length === 0 || count <= 0) return [];

    const start = slot % origins.length;
    const selected: string[] = [];
    for (let index = 0; index < Math.min(count, origins.length); index++) {
        selected.push(origins[(start + index) % origins.length]);
    }

    return selected;
}

function percentile(sortedValues: number[], point: number): number {
    if (sortedValues.length === 0) return 0;

    const index = (sortedValues.length - 1) * point;
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    if (lowerIndex === upperIndex) return sortedValues[lowerIndex];

    const weight = index - lowerIndex;
    return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * weight;
}

function estimateBenchmark(price: number, airline: string, originGroup: OriginGroup, priceStats: { median: number; p75: number }) {
    const tier = getCarrierTier(airline);
    const multiplier = {
        premium: 1.9,
        legacy: 1.55,
        hybrid: 1.45,
        regional: 1.4,
        unknown: 1.35,
        ulcc: 1.2,
    }[tier];
    const originFloor = originGroup === 'major' ? 220 : 140;
    const floor = Math.max(originFloor, Math.round(price * multiplier), Math.round(priceStats.median));
    const ceilingBase = Math.max(priceStats.p75, floor);
    const ceilingMultiplier = tier === 'premium' ? 1.45 : originGroup === 'major' ? 1.3 : 1.22;
    const benchmarkLow = Math.max(price + 35, floor);
    const benchmarkHigh = Math.max(benchmarkLow + 80, Math.round(ceilingBase * ceilingMultiplier));

    return { benchmarkLow, benchmarkHigh };
}

function getLane(originGroup: OriginGroup, airline: string, price: number): ScoutCandidate['lane'] {
    const tier = getCarrierTier(airline);

    if (price >= 1200 || tier === 'premium') return 'premium';
    if (originGroup === 'major' && tier !== 'ulcc') return 'major-legacy';
    if (originGroup === 'regional' && tier !== 'ulcc') return 'regional-legacy';
    return originGroup === 'major' ? 'major-value' : 'regional-value';
}

function extractDestinationCode(destination: any): string | undefined {
    const possibleCodes = [
        destination?.destination_id,
        destination?.id,
        destination?.iata_code,
        destination?.airport_code,
        destination?.airport?.id,
        destination?.airport?.iata_code,
        destination?.airports?.[0]?.id,
        destination?.airports?.[0]?.iata_code,
        destination?.name,
    ];

    const code = possibleCodes
        .map((value) => typeof value === 'string' ? value.toUpperCase().trim() : '')
        .find((value) => /^[A-Z]{3}$/.test(value));

    return code || undefined;
}

function extractDestinations(data: any): any[] {
    if (Array.isArray(data?.destinations)) return data.destinations;
    if (!Array.isArray(data?.deals)) return [];

    return data.deals
        .map((deal: any) => ({
            ...deal,
            name: deal.name || deal.destination_name || deal.destination || deal.arrival_airport?.name,
            flight_price: deal.flight_price ?? deal.price ?? deal.total_price,
            airline: deal.airline || deal.airlines?.join?.(', '),
            share_flights_url: deal.share_flights_url || deal.booking_link || deal.link,
            destination_id: deal.destination_id || deal.arrival_airport?.id,
        }))
        .filter((deal: any) => typeof deal.name === 'string' && deal.name.length > 0);
}

function buildCandidates(origin: string, originGroup: OriginGroup, destinations: any[]): ScoutCandidate[] {
    const prices = destinations
        .map((destination) => Number(destination.flight_price))
        .filter((price) => Number.isFinite(price) && price > 0)
        .sort((a, b) => a - b);

    if (prices.length === 0) return [];

    const priceStats = {
        median: percentile(prices, 0.5),
        p75: percentile(prices, 0.75),
    };

    return destinations
        .map((destination) => {
            const price = Number(destination.flight_price);
            if (!Number.isFinite(price) || price <= 0) return null;

            const airline = normalizeAirlineName(destination.airline || 'Multiple Airlines');
            const lane = getLane(originGroup, airline, price);
            const { benchmarkLow, benchmarkHigh } = estimateBenchmark(price, airline, originGroup, priceStats);
            const benchmarkMid = Math.round((benchmarkLow + benchmarkHigh) / 2);
            const estimatedDiscountPct = Math.max(0, Math.round(((benchmarkMid - price) / benchmarkMid) * 100));
            const carrierBonus = {
                premium: 18,
                legacy: 14,
                hybrid: 10,
                regional: 8,
                unknown: 4,
                ulcc: 0,
            }[getCarrierTier(airline)];
            const laneBonus = {
                premium: 16,
                'major-legacy': 14,
                'regional-legacy': 12,
                'major-value': 8,
                'regional-value': 6,
            }[lane];
            const valueScore = estimatedDiscountPct + carrierBonus + laneBonus;

            return {
                origin,
                destination: destination.name,
                destinationCode: extractDestinationCode(destination),
                price,
                airline,
                link: destination.share_flights_url || destination.link || `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination.name}`,
                start_date: destination.start_date,
                end_date: destination.end_date,
                originGroup,
                lane,
                benchmarkLow,
                benchmarkHigh,
                estimatedDiscountPct,
                valueScore,
            } satisfies ScoutCandidate;
        })
        .filter((candidate): candidate is ScoutCandidate => candidate !== null)
        .filter((candidate) => {
            if (candidate.lane === 'premium') return candidate.estimatedDiscountPct >= 15 || candidate.price <= 2400;
            if (candidate.lane === 'major-legacy' || candidate.lane === 'regional-legacy') return candidate.estimatedDiscountPct >= 22;
            return candidate.estimatedDiscountPct >= 18;
        });
}

function selectTopDeals(candidates: ScoutCandidate[]): ScoutCandidate[] {
    const laneLimits: Array<{ lane: ScoutCandidate['lane']; limit: number }> = [
        { lane: 'regional-legacy', limit: 1 },
        { lane: 'major-legacy', limit: 2 },
        { lane: 'regional-value', limit: 1 },
        { lane: 'major-value', limit: 1 },
        { lane: 'premium', limit: 1 },
    ];
    const selected: ScoutCandidate[] = [];
    const seenAirlines = new Set<string>();
    const seenRoutes = new Set<string>();
    const sorted = [...candidates].sort((a, b) => b.valueScore - a.valueScore || a.price - b.price);

    const tryAddCandidate = (candidate: ScoutCandidate) => {
        const airlineKey = normalizeAirlineName(candidate.airline).toLowerCase();
        const routeKey = `${candidate.origin}-${candidate.destination.toLowerCase()}-${airlineKey}`;
        if (seenAirlines.has(airlineKey) || seenRoutes.has(routeKey)) return false;

        selected.push(candidate);
        seenAirlines.add(airlineKey);
        seenRoutes.add(routeKey);
        return true;
    };

    for (const { lane, limit } of laneLimits) {
        const laneCandidates = sorted.filter((candidate) => candidate.lane === lane).slice(0, 8);
        let laneCount = 0;

        for (const candidate of laneCandidates) {
            if (laneCount >= limit) break;
            if (tryAddCandidate(candidate)) laneCount++;
        }
    }

    for (const candidate of sorted) {
        if (selected.length >= 8) break;
        tryAddCandidate(candidate);
    }

    return selectDiverseCandidates(selected, 5);
}

export const GET: APIRoute = async ({ request }) => {
    try {
        const serpApiKey = import.meta.env.SERP_API_KEY || process.env.SERP_API_KEY;

        if (!serpApiKey) {
            return new Response(JSON.stringify({ error: "⚠️ SERP_API_KEY is not set. Go to https://serpapi.com/ to get a free API Key." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const urlParams = new URL(request.url).searchParams;
        const isTest = urlParams.get('test') === 'true';
        const isDryRun = urlParams.get('dryRun') === 'true';
        const isShadow = urlParams.get('shadow') === 'true';
        const shouldValidateWithFli = urlParams.get('validate') === 'fli';
        const originOverride = urlParams.get('origin')?.toUpperCase();
        const requestedTripLength = urlParams.get('trip_length') || '';
        const shadowProfiles = ['2,4', '5,9', '10,16'];
        const shadowTripLength = shadowProfiles.includes(requestedTripLength)
            ? requestedTripLength
            : shadowProfiles[Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % shadowProfiles.length];
        const sourceEngine = isShadow ? 'google_flights_deals' : 'google_travel_explore';
        const readOnly = isDryRun || isShadow;

        // Check for a secret to prevent random people from triggering this
        const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
        const authHeader = request.headers.get('Authorization');

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const originPools = {
            regional: [
                "MFE", "HRL", "LRD", "BRO", "CRP", "ELP", "LBB", "MAF", "AMA",
                "GRK", "TYR", "GGG", "ABI"
            ],
            major: ["DFW", "IAH", "AUS", "SAT", "HOU", "DAL"]
        };
        const scanSlot = Math.floor(Date.now() / (12 * 60 * 60 * 1000));
        if (isShadow && !originOverride) {
            return new Response(JSON.stringify({
                error: 'Shadow mode requires one origin per request.',
                example: '/api/scout?shadow=true&origin=DFW&trip_length=2,4',
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const scoutList = originOverride && PRIMARY_TX_AIRPORTS.includes(originOverride)
            ? [originOverride]
            : [
                ...rotateOrigins(originPools.regional, 2, scanSlot * 2),
                ...rotateOrigins(originPools.major, 2, scanSlot)
            ];

        console.log(`🦅 Regional Scout scanning Google Flights (via SerpApi) across balanced Texas lanes...`);
        let allDealsFound: ScoutCandidate[] = [];

        console.log(`   📍 Selected batch for this sweep: ${scoutList.join(', ')}`);

        for (const origin of scoutList) {
            const params = new URLSearchParams({
                engine: sourceEngine,
                departure_id: origin,
                currency: 'USD',
                hl: 'en',
                api_key: serpApiKey
            });
            if (isShadow) {
                params.set('trip_length', shadowTripLength);
            }

            const url = `https://serpapi.com/search.json?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();

            const destinations = extractDestinations(data);
            if (destinations.length > 0) {
                const originGroup: OriginGroup = originPools.major.includes(origin) ? 'major' : 'regional';
                allDealsFound.push(...buildCandidates(origin, originGroup, destinations));
            }
        }

        if (allDealsFound.length === 0) {
            console.log(`   ❌ Scout found no candidates that cleared the value thresholds today.`);
            if (readOnly) {
                return new Response(JSON.stringify({
                    success: true,
                    dryRun: isDryRun,
                    shadow: isShadow,
                    sourceEngine,
                    tripLength: isShadow ? shadowTripLength : null,
                    selectedOrigins: scoutList,
                    dealsFound: 0,
                    topDeals: [],
                    sideEffects: {
                        processDealCalled: false,
                        supabaseWrites: false,
                        discordAlerts: false,
                        resendDrafts: false,
                        socialPosts: false,
                    }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ message: "No deals found." }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const topDeals = selectTopDeals(allDealsFound);

        if (readOnly) {
            const validatedDeals = shouldValidateWithFli
                ? await Promise.all(topDeals.map(async (flight) => ({
                    ...flight,
                    validation: await validateWithFli({
                        origin: flight.origin,
                        destination: flight.destinationCode || flight.destination,
                        scoutPrice: flight.price,
                        startDate: flight.start_date,
                        endDate: flight.end_date,
                        cabin: flight.lane === 'premium' ? 'BUSINESS' : 'ECONOMY',
                    }),
                })))
                : topDeals;

            const observationResult = isShadow
                ? await persistDealObservations(topDeals.map((flight) => ({
                    sourceEngine,
                    origin: flight.origin,
                    destination: flight.destination,
                    destinationCode: flight.destinationCode,
                    airline: flight.airline,
                    price: flight.price,
                    startDate: flight.start_date,
                    endDate: flight.end_date,
                    bookingLink: flight.link,
                })))
                : { persisted: false, count: 0, reason: 'dry-run' };

            return new Response(JSON.stringify({
                success: true,
                dryRun: isDryRun,
                shadow: isShadow,
                sourceEngine,
                tripLength: isShadow ? shadowTripLength : null,
                validation: shouldValidateWithFli ? 'fli' : 'none',
                selectedOrigins: scoutList,
                dealsFound: allDealsFound.length,
                topDeals: validatedDeals,
                observations: observationResult,
                sideEffects: {
                    processDealCalled: false,
                    supabaseWrites: observationResult.persisted,
                    discordAlerts: false,
                    resendDrafts: false,
                    socialPosts: false,
                }
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        let processedCount = 0;

        for (const flight of topDeals) {
            console.log(`🧠 Sending Scout Deal to Engine: ${flight.origin} -> ${flight.destination}`);

            const title = `✈️ ${isTest ? '[TEST] ' : ''}SCOUT FIND: ${flight.origin} to ${flight.destination} for $${flight.price}`;

            const content = `
                The Regional Scout found a Flight Anomaly!
                Route: ${flight.origin} to ${flight.destination}
                Dates: ${flight.start_date || 'Flexible'} to ${flight.end_date || 'Flexible'}
                Price: $${flight.price}
                Airline: ${flight.airline}
                
                Typical: $${flight.benchmarkLow} - $${flight.benchmarkHigh}
                Cheaper: $${Math.max(0, flight.benchmarkLow - flight.price)}
                Estimated Discount: ${flight.estimatedDiscountPct}%
                Scout Lane: ${flight.lane}
                
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
