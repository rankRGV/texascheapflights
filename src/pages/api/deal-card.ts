import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import fs from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async ({ url }) => {
    const p = url.searchParams;

    // Security check
    const providedKey = p.get('key');
    const requiredKey = import.meta.env.DEAL_CARD_SECRET || import.meta.env.ADMIN_PASSWORD;
    if (!providedKey || providedKey !== requiredKey) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Deal data
    const origin = (p.get('origin') ?? 'MFE').toUpperCase();
    const destination = p.get('destination') ?? 'CUN';
    const price = p.get('price');
    const points = p.get('points');
    const airline = p.get('airline') ?? 'Frontier';
    const dealType = p.get('type') ?? 'sale';
    const rawDates = p.get('dates') ?? '';

    // Null-safe date handling
    const dates = (rawDates === 'null' || !rawDates) ? 'Flexible Dates' : rawDates;

    const theme = p.get('theme') ?? 'dark';
    const variant = p.get('variant') ?? 'radar';
    const variantAccent = variant === 'regional' ? '#38bdf8'
        : variant === 'weekend' ? '#f97316'
            : variant === 'last-call' ? '#fb7185'
                : '#d4a843';

    // Load logo as base64 for reliable rendering in Vercel OG
    let logoData = '';
    try {
        const logoPath = path.resolve('./public/logo.png');
        const logoBuffer = fs.readFileSync(logoPath);
        logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
        console.error('Failed to load logo for deal card:', e);
    }

    // Load Satoshi font if available — drop Satoshi-Black.ttf into /public/fonts/ to activate
    let satoshiFontData: ArrayBuffer | null = null;
    try {
        const fontPath = path.resolve('./public/fonts/Satoshi-Black.ttf');
        const buf = fs.readFileSync(fontPath);
        satoshiFontData = new Uint8Array(buf).buffer;
    } catch {
        // Font not present — Inter fallback is fine
    }
    const fontFamily = satoshiFontData ? 'Satoshi' : 'Inter, sans-serif';

    // Brand colors
    const gold = variantAccent;
    const navyDeep = '#050a14';
    const slate400 = '#94a3b8';

    // Each family gets a different visual cue so the feed feels edited, not stamped out.
    const variantDecoration = variant === 'regional'
        ? {
            type: 'div',
            props: { style: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '22px', background: `linear-gradient(180deg, ${gold}, #38bdf855 70%, transparent)` } },
        }
        : variant === 'weekend'
            ? {
                type: 'div',
                props: { style: { position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)', border: `2px solid ${gold}88`, borderRadius: '999px', padding: '10px 24px', color: gold, fontSize: '18px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }, children: 'WEEKEND IDEA' },
            }
            : variant === 'last-call'
                ? {
                    type: 'div',
                    props: { style: { position: 'absolute', top: '28px', right: '-64px', transform: 'rotate(8deg)', background: gold, color: navyDeep, padding: '12px 72px', fontSize: '17px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }, children: 'CHECK BEFORE IT MOVES' },
                }
                : null;

    // Font scaling — synced so origin and destination always render at the same size
    const scaledFontSize = (text: string) => {
        const len = text.length;
        if (len <= 3) return '115px';
        if (len <= 6) return '90px';
        if (len <= 10) return '72px';
        if (len <= 16) return '58px';
        return '48px';
    };
    const originSize = scaledFontSize(origin);
    const destSize = scaledFontSize(destination);
    // Use the smaller of the two — prevents lopsided pairs like MFE (115px) vs Fort Lauderdale (58px)
    const routeSize = parseInt(originSize) < parseInt(destSize) ? originSize : destSize;

    const dealTypeLabel =
        dealType === 'error_fare' ? '⚡ ERROR FARE'
            : dealType === 'sweetspot' ? '🎯 SWEET SPOT'
                : '✈ DEAL ALERT';
    const dealLabel =
        variant === 'regional' ? '🛫 REGIONAL ROUTE'
            : variant === 'weekend' ? '☀ WEEKEND ESCAPE'
                : variant === 'last-call' ? '⏱ LAST CALL'
                    : dealTypeLabel;

    const displayValue = price ? `$${price}` : points ? `${points}k pts` : '$89';
    const displayLabel = price ? 'roundtrip' : 'one-way';

    const bgGradient = theme === 'light'
        ? 'radial-gradient(circle at 75% 25%, #f1f5f9 0%, #e2e8f0 100%)'
        : 'radial-gradient(circle at 75% 25%, #0a1628 0%, #050a14 100%)';

    const dotColor = theme === 'light'
        ? 'rgba(0,0,0,0.04)'
        : 'rgba(255,255,255,0.035)';

    return new ImageResponse(
        {
            type: 'div',
            props: {
                style: {
                    width: '1200px',
                    height: '630px',
                    background: bgGradient,
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily,
                    position: 'relative',
                    color: theme === 'light' ? '#0f172a' : 'white',
                    padding: variant === 'regional' ? '60px 60px 60px 86px' : '60px',
                },
                children: [
                    variantDecoration,

                    // Atmosphere: subtle dot grid over the background
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
                                backgroundSize: '28px 28px',
                            },
                        },
                    },

                    // 1. Top Left Badge
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '60px', left: '60px',
                                border: `1.5px solid ${gold}66`,
                                background: 'rgba(212, 168, 67, 0.05)',
                                borderRadius: '12px',
                                padding: '10px 22px',
                                display: 'flex', alignItems: 'center',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', fontWeight: 800, color: gold, letterSpacing: '0.1em', textTransform: 'uppercase' },
                                        children: dealLabel,
                                    },
                                },
                            ],
                        },
                    },

                    // 2. Top Right Logo — top: 60px aligns with badge
                    logoData ? {
                        type: 'img',
                        props: {
                            src: logoData,
                            style: {
                                position: 'absolute', top: '60px', right: '60px',
                                height: '70px',
                                objectFit: 'contain',
                                filter: theme === 'light' ? 'invert(1) brightness(0.2)' : 'none',
                            },
                        },
                    } : null,

                    // 3. Center Route — marginTop: 90px (was 120) recenters in the card
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: variant === 'weekend' ? '116px' : variant === 'last-call' ? '104px' : '90px',
                                gap: variant === 'regional' ? '36px' : variant === 'weekend' ? '72px' : '60px',
                            },
                            children: [
                                // Origin
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' },
                                        children: [
                                            { type: 'div', props: { style: { fontSize: routeSize, fontWeight: 900, lineHeight: 1, textAlign: 'center' }, children: origin } },
                                            { type: 'div', props: { style: { fontSize: '22px', color: slate400, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '10px' }, children: 'FROM' } },
                                        ],
                                    },
                                },
                                // Plane Separator
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', alignItems: 'center', position: 'relative', width: '200px', height: '130px' },
                                        children: [
                                            { type: 'div', props: { style: { width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, ${gold}66, transparent)` } } },
                                            { type: 'div', props: { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '36px', color: '#38bdf8' }, children: '✈' } },
                                        ],
                                    },
                                },
                                // Destination
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' },
                                        children: [
                                            { type: 'div', props: { style: { fontSize: routeSize, fontWeight: 900, lineHeight: 1, textAlign: 'center' }, children: destination } },
                                            { type: 'div', props: { style: { fontSize: '22px', color: slate400, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '10px' }, children: 'TO' } },
                                        ],
                                    },
                                },
                            ],
                        },
                    },

                    // 4. Bottom Row — unified flex container keeps price and CTA on the same baseline
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', bottom: '60px', left: '60px', right: '60px',
                                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                            },
                            children: [
                                // Left: Price & Airline
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column' },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { display: 'flex', alignItems: 'baseline', gap: '12px' },
                                                    children: [
                                                        { type: 'div', props: { style: { fontSize: '110px', fontWeight: 900, color: gold, lineHeight: 0.9 }, children: displayValue } },
                                                        { type: 'div', props: { style: { fontSize: '28px', fontWeight: 700, color: slate400 }, children: displayLabel } },
                                                    ],
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '24px', fontWeight: 600, color: slate400, marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' },
                                                    children: [
                                                        { type: 'span', props: { children: airline } },
                                                        dates ? { type: 'span', props: { style: { color: slate400, opacity: 0.5 }, children: '•' } } : null,
                                                        dates ? { type: 'span', props: { children: dates } } : null,
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                                // Right: CTA
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        background: gold, color: navyDeep,
                                                        borderRadius: '20px', padding: '24px 48px',
                                                        fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    },
                                                    children: 'Get the Next Deal',
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '18px', fontWeight: 600, color: slate400 },
                                                    children: 'texascheapflights.com',
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            width: 1200,
            height: 630,
            ...(satoshiFontData ? {
                fonts: [{
                    name: 'Satoshi',
                    data: satoshiFontData,
                    weight: 900,
                    style: 'normal' as const,
                }]
            } : {}),
        }
    );
};
