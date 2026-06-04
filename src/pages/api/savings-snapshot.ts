import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import fs from 'node:fs';
import path from 'node:path';

function money(value: string | null) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return `$${Math.round(number).toLocaleString('en-US')}`;
}

export const GET: APIRoute = async ({ url }) => {
  const p = url.searchParams;
  const origin = (p.get('origin') || 'TEX').toUpperCase();
  const destination = p.get('destination') || 'Your next trip';
  const price = money(p.get('price')) || '$---';
  const reference = money(p.get('reference')) || '$---';
  const savings = money(p.get('savings')) || '$---';
  const percent = p.get('percent') ? `${p.get('percent')}%` : '--%';
  const airline = p.get('airline') || 'Multiple airlines';
  const dates = p.get('dates') || 'Flexible dates';

  let logoData = '';
  try {
    const logoPath = path.resolve('./public/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch {}

  const gold = '#d4a843';
  const navy = '#050a14';
  const mid = '#0d1832';
  const slate = '#94a3b8';
  const green = '#10b981';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: `radial-gradient(circle at 80% 20%, #12315c 0%, ${navy} 42%, #02050b 100%)`,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          padding: '56px',
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              },
            },
          },
          logoData
            ? {
                type: 'img',
                props: {
                  src: logoData,
                  style: {
                    position: 'absolute',
                    top: '48px',
                    right: '56px',
                    height: '62px',
                    objectFit: 'contain',
                  },
                },
              }
            : null,
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 1,
                height: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginBottom: '32px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            border: `1px solid ${gold}80`,
                            color: gold,
                            background: 'rgba(212, 168, 67, 0.08)',
                            borderRadius: '12px',
                            padding: '10px 18px',
                            fontSize: '22px',
                            fontWeight: 900,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          },
                          children: 'Google Flights check',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { color: slate, fontSize: '22px', fontWeight: 700 },
                          children: `${airline} - ${dates}`,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '34px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'column' },
                          children: [
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '84px',
                                  lineHeight: 1,
                                  fontWeight: 950,
                                  letterSpacing: '-0.04em',
                                },
                                children: origin,
                              },
                            },
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '26px',
                                  color: slate,
                                  fontWeight: 800,
                                  letterSpacing: '0.18em',
                                  textTransform: 'uppercase',
                                  marginTop: '10px',
                                },
                                children: 'from Texas',
                              },
                            },
                          ],
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '170px',
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
                          children: [
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: destination.length > 14 ? '58px' : '84px',
                                  lineHeight: 1,
                                  fontWeight: 950,
                                  letterSpacing: '-0.04em',
                                  maxWidth: '520px',
                                  textAlign: 'right',
                                },
                                children: destination,
                              },
                            },
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '26px',
                                  color: slate,
                                  fontWeight: 800,
                                  letterSpacing: '0.18em',
                                  textTransform: 'uppercase',
                                  marginTop: '10px',
                                },
                                children: 'roundtrip',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      gap: '20px',
                      marginTop: 'auto',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            flex: 1,
                            background: mid,
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '26px',
                            padding: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                          },
                          children: [
                            { type: 'div', props: { style: { color: slate, fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }, children: 'Current fare' } },
                            { type: 'div', props: { style: { color: gold, fontSize: '76px', lineHeight: 1, fontWeight: 950, marginTop: '12px' }, children: price } },
                          ],
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            flex: 1,
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.35)',
                            borderRadius: '26px',
                            padding: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                          },
                          children: [
                            { type: 'div', props: { style: { color: green, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }, children: 'Estimated savings' } },
                            { type: 'div', props: { style: { color: 'white', fontSize: '76px', lineHeight: 1, fontWeight: 950, marginTop: '12px' }, children: savings } },
                            { type: 'div', props: { style: { color: slate, fontSize: '24px', fontWeight: 800, marginTop: '10px' }, children: `${percent} below a ${reference} benchmark` } },
                          ],
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
    },
  );
};
