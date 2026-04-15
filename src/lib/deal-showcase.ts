import { getCarrierTier, normalizeAirlineName } from './airlines';

export interface ShowcaseDeal {
  id?: string;
  origin: string;
  destination: string;
  price?: number | null;
  airline?: string | null;
  score?: number | null;
  deal_type?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
  travel_dates?: string | null;
}

type ShowcaseOptions = {
  limit?: number;
  maxPerAirline?: number;
  maxPerOrigin?: number;
};

const LONG_HAUL_KEYWORDS = [
  'london', 'paris', 'rome', 'madrid', 'barcelona', 'tokyo', 'osaka', 'seoul', 'bangkok',
  'singapore', 'dubai', 'doha', 'istanbul', 'frankfurt', 'munich', 'amsterdam', 'zurich',
  'sydney', 'melbourne', 'auckland',
];

function isLongHaulDestination(destination?: string | null): boolean {
  const value = (destination ?? '').toLowerCase();
  return LONG_HAUL_KEYWORDS.some((keyword) => value.includes(keyword));
}

function getSelectionScore(deal: ShowcaseDeal): number {
  const sentAt = new Date(deal.sent_at || deal.created_at || 0).getTime();
  const ageHours = sentAt > 0 ? Math.max(0, (Date.now() - sentAt) / (1000 * 60 * 60)) : 999;
  const recencyBonus = Math.max(0, 24 - ageHours) * 0.15;
  const carrierTier = getCarrierTier(deal.airline);
  const tierBonus = {
    premium: 12,
    legacy: 10,
    hybrid: 7,
    regional: 5,
    unknown: 3,
    ulcc: 0,
  }[carrierTier];
  const typeBonus = deal.deal_type === 'error_fare' || (deal.score ?? 0) >= 9 ? 7 : 3;
  const distanceBonus = isLongHaulDestination(deal.destination) ? 5 : 0;
  const priceBonus = typeof deal.price === 'number'
    ? deal.price <= 250
      ? 4
      : deal.price <= 450
        ? 2
        : 0
    : 6;

  return ((deal.score ?? 0) * 10) + tierBonus + typeBonus + distanceBonus + priceBonus + recencyBonus;
}

function pickDeals<T extends ShowcaseDeal>(
  deals: T[],
  limit: number,
  maxPerAirline: number,
  maxPerOrigin: number
): T[] {
  const selected: T[] = [];
  const airlineCounts = new Map<string, number>();
  const originCounts = new Map<string, number>();
  const routeKeys = new Set<string>();

  for (const deal of deals) {
    if (selected.length >= limit) break;

    const airlineKey = normalizeAirlineName(deal.airline);
    const originKey = deal.origin.toUpperCase();
    const routeKey = `${originKey}-${deal.destination.toLowerCase()}-${airlineKey.toLowerCase()}`;

    if ((airlineCounts.get(airlineKey) ?? 0) >= maxPerAirline) continue;
    if ((originCounts.get(originKey) ?? 0) >= maxPerOrigin) continue;
    if (routeKeys.has(routeKey)) continue;

    selected.push(deal);
    routeKeys.add(routeKey);
    airlineCounts.set(airlineKey, (airlineCounts.get(airlineKey) ?? 0) + 1);
    originCounts.set(originKey, (originCounts.get(originKey) ?? 0) + 1);
  }

  return selected;
}

export function curateShowcaseDeals<T extends ShowcaseDeal>(
  deals: T[],
  options: ShowcaseOptions = {}
): T[] {
  const limit = options.limit ?? 4;
  const maxPerAirline = options.maxPerAirline ?? 1;
  const maxPerOrigin = options.maxPerOrigin ?? 1;

  const sorted = [...deals].sort((a, b) => {
    const scoreDelta = getSelectionScore(b) - getSelectionScore(a);
    if (scoreDelta !== 0) return scoreDelta;

    const sentDelta = new Date(b.sent_at || b.created_at || 0).getTime() - new Date(a.sent_at || a.created_at || 0).getTime();
    if (sentDelta !== 0) return sentDelta;

    return (b.price ?? Number.MAX_SAFE_INTEGER) - (a.price ?? Number.MAX_SAFE_INTEGER);
  });

  const strict = pickDeals(sorted, limit, maxPerAirline, maxPerOrigin);
  if (strict.length >= limit) return strict;

  const relaxed = pickDeals(
    sorted.filter((deal) => !strict.includes(deal)),
    limit - strict.length,
    Math.max(maxPerAirline, 2),
    Math.max(maxPerOrigin, 2)
  );

  return [...strict, ...relaxed].slice(0, limit);
}

export function estimateReferencePrice(deal: ShowcaseDeal): number {
  const price = deal.price ?? 0;
  if (!price) return 850;

  const tier = getCarrierTier(deal.airline);
  const baseMultiplier = {
    premium: 2.9,
    legacy: 2.5,
    hybrid: 2.2,
    regional: 2.1,
    unknown: 2.1,
    ulcc: 1.7,
  }[tier];

  const typeBoost = deal.deal_type === 'error_fare' || (deal.score ?? 0) >= 9 ? 0.35 : 0.1;
  return Math.max(price + 120, Math.round(price * (baseMultiplier + typeBoost)));
}

export function mapDealToShowcaseCard(deal: ShowcaseDeal) {
  return {
    type: 'cash_glitch',
    origin: deal.origin,
    dest: deal.destination,
    glitch_price: deal.price ? `$${deal.price}` : 'Unlisted',
    normal_price: `$${estimateReferencePrice(deal)}`,
    airline: normalizeAirlineName(deal.airline),
    lifespan: (deal.deal_type === 'error_fare' || (deal.score ?? 0) >= 9) ? '4h' : '24h',
    icon: (deal.deal_type === 'error_fare' || (deal.score ?? 0) >= 9) ? 'zap' : 'globe'
  };
}
