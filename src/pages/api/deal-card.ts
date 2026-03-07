import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';

export const GET: APIRoute = async ({ url }) => {
    const p = url.searchParams;

    // Deal data from query params
    const origin = p.get('origin') ?? 'MFE';
    const destination = p.get('destination') ?? 'CUN';
    const price = p.get('price') ?? null;
    const points = p.get('points') ?? null;
    const airline = p.get('airline') ?? '';
    const dealType = p.get('type') ?? 'sale';
    const savings = p.get('savings') ?? null;
    const dates = p.get('dates') ?? '';
    const theme = p.get('theme') ?? 'dark'; // 'dark' | 'light' | 'brand'

    // ── Theme configuration ───────────────────────────────────────────────
    const isLight = theme === 'light';
    const isBrand = theme === 'brand';

    const bgGradient =
        isBrand ? 'linear-gradient(135deg, #d97706 0%, #f5c842 100%)' // Gold gradient
            : isLight ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' // Light slate
                : 'linear-gradient(135deg, #050a14 0%, #0a1628 50%, #050a14 100%)'; // Dark navy

    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : isBrand ? 'rgba(255,255,255,0.1)' : 'rgba(245,200,66,0.04)';
    const textColorPrimary = isLight ? '#0f172a' : isBrand ? '#050a14' : 'white';
    const textColorSecondary = isLight ? '#64748b' : isBrand ? '#050a1499' : '#64748b';
    const textColorTertiary = isLight ? '#94a3b8' : isBrand ? '#050a1477' : '#94a3b8';

    const dealLabel =
        dealType === 'error_fare' ? '⚡ ERROR FARE'
            : dealType === 'sweetspot' ? '🎯 SWEET SPOT'
                : '✈ DEAL ALERT';

    // Accent color base (modified slightly by theme for contrast)
    let dealColor =
        dealType === 'error_fare' ? '#ef4444' // Red
            : dealType === 'sweetspot' ? (isLight ? '#0284c7' : '#38bdf8') // Blue
                : (isLight ? '#d97706' : '#f5c842'); // Gold

    // On the brand theme (gold bg), red stays red, blue stays blue, but gold deal becomes white/black
    if (isBrand && dealType === 'sale') dealColor = '#050a14';

    const priceDisplay = price ? `$${price}` : points ? `${Number(points).toLocaleString()} pts` : 'Alert';

    // ── Card layout (1200×630) ───────────────────────────────────────────────
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
                                backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
                                backgroundSize: '60px 60px',
                            },
                        },
                    },

                    // ── Ambient glow (disabled on light/brand for cleaner look) ──
                    ...(!isLight && !isBrand ? [{
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '-100px', right: '-100px',
                                width: '500px', height: '500px',
                                background: `radial-gradient(circle, ${dealColor}22 0%, transparent 70%)`,
                                borderRadius: '50%',
                            },
                        },
                    }] : []),

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
                                            background: isBrand ? 'rgba(255,255,255,0.2)' : isLight ? `${dealColor}11` : `${dealColor}22`,
                                            border: `1.5px solid ${isBrand ? 'rgba(255,255,255,0.4)' : dealColor}66`,
                                            borderRadius: '12px',
                                            padding: '8px 18px',
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: isBrand ? '#050a14' : dealColor,
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
                                            background: isBrand ? 'rgba(255,255,255,0.2)' : isLight ? '#10b98111' : '#10b98122',
                                            border: `1.5px solid ${isBrand ? 'rgba(255,255,255,0.4)' : '#10b98166'}`,
                                            borderRadius: '12px',
                                            padding: '8px 18px',
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: isBrand ? '#050a14' : '#10b981',
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
                                        style: { fontSize: '13px', fontWeight: 800, color: isBrand ? '#050a14' : (isLight ? '#d97706' : '#f5c842'), letterSpacing: '0.3em', textTransform: 'uppercase', display: 'flex' },
                                        children: 'Texas',
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', fontWeight: 900, color: textColorPrimary, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex' },
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
                                                    style: { fontSize: '100px', fontWeight: 900, color: textColorPrimary, letterSpacing: '-0.02em', lineHeight: 1, display: 'flex' },
                                                    children: origin,
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '18px', color: textColorSecondary, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', marginTop: '4px' },
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
                                                    style: { width: '120px', height: '2px', background: `linear-gradient(90deg, transparent, ${isBrand ? '#050a14' : dealColor}, transparent)`, display: 'flex' },
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '32px', color: textColorPrimary, display: 'flex' },
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
                                                    style: { fontSize: '100px', fontWeight: 900, color: textColorPrimary, letterSpacing: '-0.02em', lineHeight: 1, display: 'flex' },
                                                    children: destination,
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: { fontSize: '18px', color: textColorSecondary, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', marginTop: '4px' },
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
                                        style: { fontSize: '24px', color: textColorSecondary, fontWeight: 600, display: 'flex', paddingBottom: '12px' },
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
                                        style: { fontSize: '20px', color: textColorTertiary, fontWeight: 600, display: 'flex' },
                                        children: airline,
                                    },
                                }] : []),
                                ...(airline && dates ? [{
                                    type: 'div',
                                    props: {
                                        style: { width: '4px', height: '4px', borderRadius: '50%', background: textColorTertiary, display: 'flex' },
                                    },
                                }] : []),
                                ...(dates ? [{
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', color: textColorTertiary, fontWeight: 600, display: 'flex' },
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
                                background: isBrand ? '#050a14' : dealColor,
                                borderRadius: '16px',
                                padding: '16px 36px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '18px', fontWeight: 900, color: isBrand ? '#f5c842' : (isLight ? 'white' : '#050a14'), letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex' },
                                        children: 'Get the Next Deal',
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '14px', fontWeight: 600, color: isBrand ? '#ffffff99' : (isLight ? 'rgba(255,255,255,0.8)' : '#050a1499'), display: 'flex' },
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
