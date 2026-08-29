import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import fs from 'node:fs';
import path from 'node:path';

// Instagram / Facebook Story card — 1080×1920px (9:16 portrait)
// Design philosophy: "Full-screen impact" — price dominates the center,
// route above it, branding at top. Bottom 250px left clear for the IG link sticker.
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
    const dates = (rawDates === 'null' || !rawDates) ? 'Flexible Dates' : rawDates;
    const theme = p.get('theme') ?? 'light';
    const variant = p.get('variant') ?? 'radar';
    const variantAccent = variant === 'regional' ? '#38bdf8'
        : variant === 'weekend' ? '#f97316'
            : variant === 'last-call' ? '#fb7185'
                : '#d4a843';

    // Load logo as base64
    let logoData = '';
    try {
        const logoPath = path.resolve('./public/logo.png');
        const logoBuffer = fs.readFileSync(logoPath);
        logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
        console.error('Failed to load logo for story card:', e);
    }

    // Load Satoshi font if available
    let satoshiFontData: ArrayBuffer | null = null;
    try {
        const fontPath = path.resolve('./public/fonts/Satoshi-Black.ttf');
        const buf = fs.readFileSync(fontPath);
        satoshiFontData = new Uint8Array(buf).buffer;
    } catch {
        // Inter fallback
    }
    const fontFamily = satoshiFontData ? 'Satoshi' : 'Inter, sans-serif';

    // Brand colors
    const gold = variantAccent;
    const navyDeep = '#050a14';
    const slate400 = theme === 'light' ? '#52616f' : '#94a3b8';
    const goldText = theme === 'light' ? '#92400e' : gold;

    // Each family gets a different visual cue so the feed feels edited, not stamped out.
    const variantDecoration = variant === 'regional'
        ? {
            type: 'div',
            props: { style: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '22px', background: `linear-gradient(180deg, ${gold}, #38bdf855 70%, transparent)` } },
        }
        : variant === 'weekend'
            ? {
                type: 'div',
                props: { style: { position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)', border: `2px solid ${gold}88`, borderRadius: '999px', padding: '10px 24px', color: goldText, fontSize: '18px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }, children: 'WEEKEND IDEA' },
            }
            : variant === 'last-call'
                ? {
                    type: 'div',
                    props: { style: { position: 'absolute', top: '28px', right: '-64px', transform: 'rotate(8deg)', background: gold, color: navyDeep, padding: '12px 72px', fontSize: '17px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }, children: 'CHECK BEFORE IT MOVES' },
                }
                : null;

    // Font scaling — same thresholds as IG card (same 1080px width)
    const scaledFontSize = (text: string) => {
        const len = text.length;
        if (len <= 3) return '90px';
        if (len <= 6) return '72px';
        if (len <= 10) return '58px';
        if (len <= 16) return '46px';
        return '38px';
    };
    const originSize = scaledFontSize(origin);
    const destSize = scaledFontSize(destination);
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
        ? 'radial-gradient(circle at 50% 40%, #f6efe1 0%, #fffdf7 100%)'
        : 'radial-gradient(circle at 50% 40%, #0a1628 0%, #050a14 100%)';

    const dotColor = theme === 'light'
        ? 'rgba(0,0,0,0.04)'
        : 'rgba(255,255,255,0.035)';

    return new ImageResponse(
        {
            type: 'div',
            props: {
                style: {
                    width: '1080px',
                    height: '1920px',
                    background: bgGradient,
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily,
                    position: 'relative',
                    color: theme === 'light' ? '#1b2a3d' : 'white',
                },
                children: [
                    variantDecoration,

                    // Dot grid atmosphere
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
                                backgroundSize: '32px 32px',
                            },
                        },
                    },

                    // Badge — top-left, below story chrome (y: 140px)
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '140px', left: '60px',
                                border: `1.5px solid ${gold}66`,
                                background: 'rgba(212, 168, 67, 0.05)',
                                borderRadius: '14px',
                                padding: '12px 26px',
                                display: 'flex', alignItems: 'center',
                            },
                            children: [{
                                type: 'div',
                                props: {
                                    style: { fontSize: '22px', fontWeight: 800, color: goldText, letterSpacing: '0.1em', textTransform: 'uppercase' },
                                    children: dealLabel,
                                },
                            }],
                        },
                    },

                    // Logo — top-right, aligned with badge
                    theme === 'light'
                        ? {
                            type: 'div',
                            props: {
                                style: { position: 'absolute', top: '140px', right: '60px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 },
                                children: [
                                    { type: 'div', props: { style: { fontSize: '26px', fontWeight: 900, color: '#1b2a3d' }, children: 'TEXAS' } },
                                    { type: 'div', props: { style: { fontSize: '11px', fontWeight: 800, color: '#92400e', letterSpacing: '0.15em', marginTop: '2px' }, children: 'CHEAP FLIGHTS' } },
                                ],
                            },
                        }
                        : logoData ? {
                            type: 'img',
                            props: {
                                src: logoData,
                                style: {
                                    position: 'absolute', top: '140px', right: '60px',
                                    height: '64px',
                                    objectFit: 'contain',
                                },
                            },
                        } : null,

                    // ── Main content block — centered in the safe zone ──────────────
                    // Safe zone: top 140px (story chrome) + bottom 260px (link sticker)
                    // Usable: 1920 - 140 - 260 = 1520px, center = 140 + 760 = 900px
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                top: '140px',
                                bottom: '260px',
                                left: '60px',
                                right: '60px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0px',
                            },
                            children: [
                                // Route row
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: variant === 'regional' ? '28px' : variant === 'weekend' ? '56px' : '40px',
                                            width: '100%',
                                        },
                                        children: [
                                            // Origin
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '360px' },
                                                    children: [
                                                        { type: 'div', props: { style: { fontSize: routeSize, fontWeight: 900, lineHeight: 1, textAlign: 'center' }, children: origin } },
                                                        { type: 'div', props: { style: { fontSize: '20px', color: slate400, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '12px' }, children: 'FROM' } },
                                                    ],
                                                },
                                            },
                                            // Plane separator
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { display: 'flex', alignItems: 'center', position: 'relative', width: '120px', height: '80px' },
                                                    children: [
                                                        { type: 'div', props: { style: { width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, ${gold}66, transparent)` } } },
                                                        { type: 'div', props: { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '26px', color: '#38bdf8' }, children: '✈' } },
                                                    ],
                                                },
                                            },
                                            // Destination
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '360px' },
                                                    children: [
                                                        { type: 'div', props: { style: { fontSize: routeSize, fontWeight: 900, lineHeight: 1, textAlign: 'center' }, children: destination } },
                                                        { type: 'div', props: { style: { fontSize: '20px', color: slate400, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '12px' }, children: 'TO' } },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },

                                // Gold divider line
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            width: '200px',
                                            height: '2px',
                                            background: `linear-gradient(90deg, transparent, ${gold}88, transparent)`,
                                            marginTop: '60px',
                                            marginBottom: '60px',
                                        },
                                    },
                                },

                                // Price — the visual hero
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', alignItems: 'baseline', gap: '16px', justifyContent: 'center' },
                                        children: [
                                            { type: 'div', props: { style: { fontSize: '180px', fontWeight: 900, color: goldText, lineHeight: 0.9 }, children: displayValue } },
                                            { type: 'div', props: { style: { fontSize: '34px', fontWeight: 700, color: slate400 }, children: displayLabel } },
                                        ],
                                    },
                                },

                                // Airline + dates
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: '30px', fontWeight: 600, color: slate400,
                                            marginTop: '28px',
                                            display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center',
                                        },
                                        children: [
                                            { type: 'span', props: { children: airline } },
                                            dates ? { type: 'span', props: { style: { opacity: 0.5 }, children: '•' } } : null,
                                            dates ? { type: 'span', props: { children: dates } } : null,
                                        ],
                                    },
                                },

                                // Domain — branding, above the link sticker safe zone
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '24px', fontWeight: 600, color: goldText, opacity: 0.7, marginTop: '20px' },
                                        children: 'texascheapflights.com',
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            width: 1080,
            height: 1920,
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
