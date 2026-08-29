import { ImageResponse } from '@vercel/og';
import fs from 'node:fs';
import path from 'node:path';

const paper = '#fffdf7';
const cream = '#f6efe1';
const ink = '#1b2a3d';
const inkMuted = '#52616f';
const goldDeep = '#92400e';
const skyDeep = '#0369a1';

const planeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="${goldDeep}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.4.6c-.4.5-.2 1.2.3 1.5L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.4 5.6c.3.5 1 .7 1.5.3l.6-.4c.4-.3.6-.8.5-1.3z"/></svg>`;

const element = {
  type: 'div',
  props: {
    style: {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: `radial-gradient(circle at 50% 0%, ${cream} 0%, ${paper} 60%)`,
      fontFamily: 'Inter, sans-serif',
    },
    children: [
      // Ambient gold glow
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', bottom: '-120px', left: '-120px',
            width: '480px', height: '480px', borderRadius: '9999px',
            background: 'rgba(212, 168, 67, 0.18)', filter: 'blur(80px)',
          },
        },
      },
      // Ambient sky glow
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute', top: '-100px', right: '-100px',
            width: '440px', height: '440px', borderRadius: '9999px',
            background: 'rgba(14, 165, 233, 0.16)', filter: 'blur(80px)',
          },
        },
      },
      // Icon
      { type: 'div', props: { style: { display: 'flex', marginBottom: '18px' }, children: [{ type: 'img', props: { src: `data:image/svg+xml;base64,${Buffer.from(planeIcon).toString('base64')}`, width: 76, height: 76 } }] } },
      // Wordmark
      {
        type: 'div',
        props: {
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 },
          children: [
            { type: 'div', props: { style: { fontSize: '96px', fontWeight: 900, color: ink, letterSpacing: '-0.02em' }, children: 'TEXAS' } },
            { type: 'div', props: { style: { fontSize: '40px', fontWeight: 800, color: goldDeep, letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '10px' }, children: 'Cheap Flights' } },
          ],
        },
      },
      // Tagline
      {
        type: 'div',
        props: {
          style: { fontSize: '28px', fontWeight: 500, color: inkMuted, marginTop: '34px' },
          children: 'Error fares & point deals from 19 Texas airports',
        },
      },
    ],
  },
};

const png = new ImageResponse(element, { width: 1200, height: 630 });
const buf = Buffer.from(await png.arrayBuffer());
const outPath = path.resolve('./public/og-image.png');
fs.writeFileSync(outPath, buf);
console.log('Wrote', outPath, buf.length, 'bytes');
