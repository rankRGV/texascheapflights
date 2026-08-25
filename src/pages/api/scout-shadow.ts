import type { APIRoute } from 'astro';
import { GET as runScout, PRIMARY_TX_AIRPORTS } from './scout';

const SHADOW_PROFILES = ['2,4', '5,9', '10,16'];

/**
 * Daily, read-only shadow runner for the Google Flights Deals source.
 * It rotates one Texas airport and one trip-length profile per day, while
 * reusing the scout's authentication and zero-alert shadow behavior.
 */
export const GET: APIRoute = async (context) => {
    const url = new URL(context.request.url);
    const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

    url.searchParams.set('shadow', 'true');
    if (!url.searchParams.has('origin')) {
        url.searchParams.set('origin', PRIMARY_TX_AIRPORTS[day % PRIMARY_TX_AIRPORTS.length]);
    }
    if (!url.searchParams.has('trip_length')) {
        url.searchParams.set('trip_length', SHADOW_PROFILES[day % SHADOW_PROFILES.length]);
    }

    return runScout({
        ...context,
        request: new Request(url, {
            method: 'GET',
            headers: context.request.headers,
        }),
    });
};
