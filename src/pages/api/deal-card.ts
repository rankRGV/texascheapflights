import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';

export const GET: APIRoute = async ({ url }) => {
    const p = url.searchParams;

    // Deal data from query params (so the engine can call this URL)
    const origin = p.get('origin') ?? 'MFE';
    const destination = p.get('destination') ?? 'CUN';
    const price = p.get('price') ?? null;       // e.g. "299"
    const points = p.get('points') ?? null;       // e.g. "35000"
    const airline = p.get('airline') ?? '';
    const dealType = p.get('type') ?? 'sale';     // 'error_fare' | 'sweetspot' | 'sale'
    const savings = p.get('savings') ?? null;       // e.g. "61" (percent off)
    const dates = p.get('dates') ?? '';

    // ── Computed display values ──────────────────────────────────────────────
    const priceDisplay = price
        ? `$${price}`
        : points
            ? `${Number(points).toLocaleString()} pts`
            : 'Deal Alert';

    const dealLabel =
        dealType === 'error_fare' ? '⚡ ERROR FARE'
            : dealType === 'sweetspot' ? '🎯 SWEET SPOT'
                : '✈ DEAL ALERT';

    const dealColor =
        dealType === 'error_fare' ? '#ef4444'
            : dealType === 'sweetspot' ? '#38bdf8'
                : '#f5c842';

    // ── Card layout (1200×630) ───────────────────────────────────────────────
    return new ImageResponse(
        {
            type: 'div',
            props: {
                style: {
                    width: '1200px',
                    height: '630px',
                    background: 'linear-gradient(135deg, #050a14 0%, #0a1628 50%, #050a14 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Inter, sans-serif',
                    overflow: 'hidden',
                    position: 'relative',
                },
                children: [

                    // ── Background grid lines ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', inset: 0,
                                backgroundImage: 'linear-gradient(rgba(245,200,66,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.04) 1px, transparent 1px)',
                                backgroundSize: '60px 60px',
                            },
                        },
                    },

                    // ── Ambient glow ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '-100px', right: '-100px',
                                width: '500px', height: '500px',
                                background: `radial-gradient(circle, ${dealColor}22 0%, transparent 70%)`,
                                borderRadius: '50%',
                            },
                        },
                    },

                    // ── Deal type badge ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '48px', left: '60px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            background: `${dealColor}22`,
                                            border: `1.5px solid ${dealColor}66`,
                                            borderRadius: '12px',
                                            padding: '8px 18px',
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: dealColor,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            display: 'flex',
                                        },
                                        children: dealLabel,
                                    },
                                },
                                ...(savings ? [{
                                    type: 'div',
                                    props: {
                                        style: {
                                            background: '#10b98122',
                                            border: '1.5px solid #10b98166',
                                            borderRadius: '12px',
                                            padding: '8px 18px',
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: '#10b981',
                                            letterSpacing: '0.1em',
                                            display: 'flex',
                                        },
                                        children: `${savings}% OFF`,
                                    },
                                }] : []),
                            ],
                        },
                    },

                    // ── Logo ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '44px', right: '60px',
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '13px', fontWeight: 800, color: '#f5c842', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'flex' },
                                        children: 'Texas',
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex' },
                                        children: 'Cheap Flights',
                                    },
                                },
                            ],
                        },
                    },

                    // ── Main route display ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '130px', left: '60px', right: '60px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '40px',
                            },
                            children: [
                                // Origin
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '100px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1, display: 'flex' },
                                                    children: origin,
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '18px', color: '#64748b', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', marginTop: '4px' },
                                                    children: 'From',
                                                },
                                            },
                                        ],
                                    },
                                },

                                // Arrow
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: '28px',
                                        },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { width: '120px', height: '2px', background: `linear-gradient(90deg, transparent, ${dealColor}, transparent)`, display: 'flex' },
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '32px', display: 'flex' },
                                                    children: '✈',
                                                },
                                            },
                                        ],
                                    },
                                },

                                // Destination
                                {
                                    type: 'div',
                                    props: {
                                        style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '100px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1, display: 'flex' },
                                                    children: destination,
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '18px', color: '#64748b', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', marginTop: '4px' },
                                                    children: 'To',
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },

                    // ── Price display ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', bottom: '100px', left: '60px',
                                display: 'flex', alignItems: 'baseline', gap: '8px',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '88px', fontWeight: 900, color: dealColor, letterSpacing: '-0.03em', lineHeight: 1, display: 'flex' },
                                        children: priceDisplay,
                                    },
                                },
                                ...(price ? [{
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '24px', color: '#64748b', fontWeight: 600, display: 'flex', paddingBottom: '12px' },
                                        children: 'roundtrip',
                                    },
                                }] : []),
                            ],
                        },
                    },

                    // ── Airline + Dates ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', bottom: '54px', left: '60px',
                                display: 'flex', alignItems: 'center', gap: '24px',
                            },
                            children: [
                                ...(airline ? [{
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', color: '#94a3b8', fontWeight: 600, display: 'flex' },
                                        children: airline,
                                    },
                                }] : []),
                                ...(airline && dates ? [{
                                    type: 'div',
                                    props: {
                                        style: { width: '4px', height: '4px', borderRadius: '50%', background: '#475569', display: 'flex' },
                                    },
                                }] : []),
                                ...(dates ? [{
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', color: '#94a3b8', fontWeight: 600, display: 'flex' },
                                        children: dates,
                                    },
                                }] : []),
                            ],
                        },
                    },

                    // ── CTA ──
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', bottom: '48px', right: '60px',
                                background: dealColor,
                                borderRadius: '16px',
                                padding: '16px 36px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '18px', fontWeight: 900, color: '#050a14', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex' },
                                        children: 'Get the Next Deal',
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '14px', fontWeight: 600, color: '#050a1499', display: 'flex' },
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
