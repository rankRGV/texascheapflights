import { ImageResponse } from '@vercel/og';
import logo from '../../public/logo.png?inline';
import { formatSocialTravelDates } from './social-travel-dates';

type Layout = 'feed' | 'story';
type Style = Record<string, string | number>;

function block(style: Style, children: unknown) {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children } };
}

const ink = '#1b2a3d';
const navy = '#050a14';
const paper = '#fffdf7';
const cream = '#f6efe1';
const sky = '#0369a1';
const gold = '#d4a843';
const muted = '#52616f';

export function renderSocialCard(url: URL, layout: Layout): Response {
  const params = url.searchParams;
  const requiredKey = import.meta.env.DEAL_CARD_SECRET || import.meta.env.ADMIN_PASSWORD;
  if (!requiredKey || params.get('key') !== requiredKey) {
    return new Response('Unauthorized', { status: 401 });
  }

  const origin = (params.get('origin')?.trim() || 'MFE').toUpperCase();
  const destination = params.get('destination')?.trim() || 'CUN';
  const airline = params.get('airline')?.trim() || 'Airline varies';
  const dates = formatSocialTravelDates(params.get('dates')) || 'Flexible dates';
  const price = params.get('price')?.trim();
  const points = params.get('points')?.trim();
  const value = price ? `$${price}` : points ? `${points}k pts` : 'Check fare';
  const valueLabel = price ? 'ROUNDTRIP' : points ? 'ONE WAY' : '';
  const type = params.get('type');
  // Scout's error_fare value is score-based and does not establish a pricing mistake.
  const label = type === 'sweetspot' ? 'SWEET SPOT' : 'FLIGHT DEAL';
  const isStory = layout === 'story';
  const height = isStory ? 1920 : 1080;
  const panelHeight = isStory ? 1180 : 968;
  const destinationSize = Math.max(42, Math.min(88, Math.floor(900 / (destination.length * 0.56))));
  const valueSize = value.length > 6 ? 112 : 168;

  const labelStyle = { fontSize: 24, fontWeight: 700, letterSpacing: 3, color: sky };
  const detailStyle = { fontSize: 30, fontWeight: 700, color: ink, lineHeight: 1.12 };
  const route = block({ flexDirection: 'column', gap: 4, maxWidth: '100%' }, [
    block({ color: muted, fontSize: 29, fontWeight: 700 }, `${origin} →`),
    block({ color: ink, fontSize: destinationSize, fontWeight: 900, lineHeight: 1.04 }, destination),
  ]);

  const header = block({
    background: navy, borderBottom: `5px solid ${gold}`, width: '100%', height: 130,
    padding: '0 56px', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  }, [
    { type: 'img', props: { src: logo, width: 320, height: 72, alt: 'Texas Cheap Flights' } },
    block({ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: '#d9ecff' }, label),
  ]);

  const body = block({
    flex: 1, flexDirection: 'column', justifyContent: 'space-between', width: '100%',
    padding: isStory ? '78px 56px 56px' : '45px 56px 39px',
  }, [
    route,
    block({ alignItems: 'center', flexWrap: 'wrap', gap: 24, color: sky }, [
      block({ fontSize: valueSize, fontWeight: 900, letterSpacing: -6, lineHeight: 1.04 }, value),
      block({ ...labelStyle, fontSize: 21 }, valueLabel),
    ]),
    block({
      borderTop: '2px dashed #d4c9b5', paddingTop: 30, gap: 32, alignItems: 'flex-start',
    }, [
      block({ width: '34%', flexDirection: 'column', gap: 8 }, [
        block(labelStyle, 'AIRLINE'), block(detailStyle, airline),
      ]),
      block({ flex: 1, flexDirection: 'column', gap: 8 }, [
        block(labelStyle, 'TRAVEL DATES'), block(detailStyle, dates),
      ]),
    ]),
  ]);

  return new ImageResponse(block({
    width: '100%', height: '100%', background: navy, justifyContent: 'center',
    alignItems: 'flex-start', paddingTop: isStory ? 295 : 56,
  }, [
    block({
      width: 968, height: panelHeight, background: paper, borderRadius: 36, overflow: 'hidden',
      flexDirection: 'column', alignItems: 'stretch',
    }, [
      header,
      body,
      block({
        width: '100%', height: 92, alignItems: 'center', background: cream, padding: '0 56px',
        flexShrink: 0, fontSize: 28, fontWeight: 700, color: ink,
      }, 'texascheapflights.com'),
    ]),
  ]), { width: 1080, height });
}
