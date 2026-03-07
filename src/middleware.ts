import { defineMiddleware } from 'astro:middleware';

// In-memory rate limit store (resets on cold start — good enough for Hobby)
// Key: IP address, Value: { count, windowStart }
const ipStore = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT = 5;          // max requests
const WINDOW_MS = 60_000;      // per 60 seconds
const PROTECTED_PATH = '/api/subscribe';

export const onRequest = defineMiddleware(async (ctx, next) => {
    if (ctx.url.pathname !== PROTECTED_PATH || ctx.request.method !== 'POST') {
        return next();
    }

    // Get IP from Vercel's forwarded header, fallback to connection
    const ip =
        ctx.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        ctx.request.headers.get('x-real-ip') ??
        'unknown';

    const now = Date.now();
    const record = ipStore.get(ip);

    if (!record || now - record.windowStart > WINDOW_MS) {
        // New window
        ipStore.set(ip, { count: 1, windowStart: now });
    } else if (record.count >= RATE_LIMIT) {
        // Over limit — return 429
        return new Response(
            JSON.stringify({ error: 'Too many requests. Please wait a minute before trying again.' }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                    'X-RateLimit-Limit': String(RATE_LIMIT),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    } else {
        record.count++;
    }

    return next();
});
