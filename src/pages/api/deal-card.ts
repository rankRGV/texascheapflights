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
    const origin = p.get('origin') ?? 'MFE';
    const destination = p.get('destination') ?? 'CUN';
    const price = p.get('price');
    const points = p.get('points');
    const airline = p.get('airline') ?? 'Frontier';
    const dealType = p.get('type') ?? 'sale';
    const dates = p.get('dates') ?? '';
    const theme = p.get('theme') ?? 'dark';

    // Load logo as base64 for reliable rendering in Vercel OG
    let logoData = '';
    try {
        const logoPath = path.resolve('./public/logo.png');
        const logoBuffer = fs.readFileSync(logoPath);
        logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
        console.error('Failed to load logo for deal card:', e);
    }

    const gold = '#f5c842';
    const navyDeep = '#050a14';
    const slate400 = '#94a3b8';

    const dealLabel =
        dealType === 'error_fare' ? '⚡ ERROR FARE'
            : dealType === 'sweetspot' ? '🎯 SWEET SPOT'
                : '✈ DEAL ALERT';

    const displayValue = price ? `$${price}` : points ? `${points}k pts` : '$89';
    const displayLabel = price ? 'roundtrip' : 'one-way';

    return new ImageResponse(
        {
            type: 'div',
            props: {
                style: {
                    width: '1200px',
                    height: '630px',
                    background: theme === 'light'
                        ? 'radial-gradient(circle at 75% 25%, #f1f5f9 0%, #e2e8f0 100%)'
                        : 'radial-gradient(circle at 75% 25%, #0a1628 0%, #050a14 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Inter, sans-serif',
                    position: 'relative',
                    color: theme === 'light' ? '#0f172a' : 'white',
                    padding: '60px',
                },
                children: [
                    // 1. Top Left Badge
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '60px', left: '60px',
                                border: `1.5px solid ${gold}66`,
                                background: 'rgba(245, 200, 66, 0.05)',
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

                    // 2. Top Right Logo
                    logoData ? {
                        type: 'img',
                        props: {
                            src: logoData,
                            style: {
                                position: 'absolute', top: '50px', right: '60px',
                                height: '70px',
                                objectFit: 'contain',
                                filter: theme === 'light' ? 'invert(1) brightness(0.2)' : 'none',
                            },
                        },
                    } : null,

                    // 3. Center Route
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginTop: '120px',
                                gap: '60px',
                            },
                            children: [
                                // Origin
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
                                        children: [
                                            { type: 'div', props: { style: { fontSize: '130px', fontWeight: 900, lineHeight: 1 }, children: origin } },
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
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
                                        children: [
                                            { type: 'div', props: { style: { fontSize: '130px', fontWeight: 900, lineHeight: 1 }, children: destination } },
                                            { type: 'div', props: { style: { fontSize: '22px', color: slate400, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '10px' }, children: 'TO' } },
                                        ],
                                    },
                                },
                            ],
                        },
                    },

                    // 4. Bottom Left Price & Airline
                    {
                        type: 'div',
                        props: {
                            style: { position: 'absolute', bottom: '60px', left: '60px', display: 'flex', flexDirection: 'column' },
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

                    // 5. Bottom Right CTA
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', bottom: '60px', right: '60px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            background: '#facc15', color: navyDeep,
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
        {
            width: 1200,
            height: 630,
        }
    );
};
