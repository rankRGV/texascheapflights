import { normalizeAirlineName } from './airlines';
import { estimateReferencePrice, type ShowcaseDeal } from './deal-showcase';

export type SocialVisualVariant = 'radar' | 'regional' | 'weekend' | 'last-call';

export function selectSocialVisualVariant(dealId?: string): SocialVisualVariant {
  const variants: SocialVisualVariant[] = ['radar', 'regional', 'weekend', 'last-call'];
  const seed = (dealId || 'texas-cheap-flights').split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return variants[seed % variants.length];
}

type DealForSocial = ShowcaseDeal & {
  booking_link?: string | null;
  travel_dates?: string | null;
};

function buildGoogleFlightsSearchUrl(deal: DealForSocial): string {
  const origin = encodeURIComponent(deal.origin || '');
  const destination = encodeURIComponent(deal.destination || '');
  return `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${destination}`;
}

function buildDealCardUrl(deal: DealForSocial, imageSecretKey: string, variant: SocialVisualVariant, endpoint: string): string {
  const params = new URLSearchParams({
    origin: deal.origin,
    destination: deal.destination,
    airline: normalizeAirlineName(deal.airline),
    type: deal.deal_type || 'sale',
    dates: deal.travel_dates || 'Flexible Dates',
    key: imageSecretKey,
    variant,
    theme: variant === 'regional' || variant === 'weekend' ? 'light' : 'dark',
  });

  if (deal.price) params.set('price', String(deal.price));
  return `https://texascheapflights.com${endpoint}?${params.toString()}`;
}

function buildSavingsSnapshotUrl(
  deal: DealForSocial,
  savings: {
    referencePrice: number;
    savingsAmount: number | null;
    savingsPercent: number | null;
  }
): string {
  const params = new URLSearchParams({
    origin: deal.origin,
    destination: deal.destination,
    airline: normalizeAirlineName(deal.airline),
    dates: deal.travel_dates || 'Flexible Dates',
    reference: String(savings.referencePrice),
  });

  if (deal.price) params.set('price', String(deal.price));
  if (savings.savingsAmount) params.set('savings', String(savings.savingsAmount));
  if (savings.savingsPercent) params.set('percent', String(savings.savingsPercent));

  return `https://texascheapflights.com/api/savings-snapshot?${params.toString()}`;
}

export function buildSocialWebhookPayload(deal: DealForSocial, imageSecretKey: string) {
  const variant = selectSocialVisualVariant(deal.id);
  const referencePrice = estimateReferencePrice(deal);
  const dealPrice = typeof deal.price === 'number' ? deal.price : null;
  const savingsAmount = dealPrice ? Math.max(0, referencePrice - dealPrice) : null;
  const savingsPercent = dealPrice && referencePrice > dealPrice
    ? Math.round(((referencePrice - dealPrice) / referencePrice) * 100)
    : null;
  const googleFlightsUrl = deal.booking_link || buildGoogleFlightsSearchUrl(deal);
  const savingsSnapshotCardUrl = buildSavingsSnapshotUrl(deal, {
    referencePrice,
    savingsAmount,
    savingsPercent,
  });
  const route = `${deal.origin} to ${deal.destination}`;
  const savingsText = savingsAmount && savingsPercent
    ? `Google Flights check: ${route} is showing around $${dealPrice} roundtrip, roughly $${savingsAmount} (${savingsPercent}%) below our Texas scout benchmark.`
    : `Google Flights check: ${route} is worth verifying against live pricing before the fare moves.`;

  return {
    deal,
    image_secret_key: imageSecretKey,
    social_context: {
      deal_page_url: `https://texascheapflights.com/deal/${deal.id}`,
      variant,
      deal_card_url: buildDealCardUrl(deal, imageSecretKey, variant, '/api/deal-card'),
      ig_deal_card_url: buildDealCardUrl(deal, imageSecretKey, variant, '/api/deal-card-ig'),
      story_deal_card_url: buildDealCardUrl(deal, imageSecretKey, variant, '/api/deal-card-story'),
      savings_snapshot_card_url: savingsSnapshotCardUrl,
      google_flights_url: googleFlightsUrl,
      route,
      airline: normalizeAirlineName(deal.airline),
      savings: {
        current_price: dealPrice,
        reference_price: referencePrice,
        savings_amount: savingsAmount,
        savings_percent: savingsPercent,
        benchmark_source: 'Texas Cheap Flights scout estimate',
      },
      google_flights_snapshot: {
        enabled: true,
        target_url: googleFlightsUrl,
        fallback_card_url: savingsSnapshotCardUrl,
        capture_goal: 'Open the Google Flights URL after the social post is published and capture the visible fare comparison or price panel that supports the savings claim. If direct capture is blocked, comment with the generated savings snapshot card and Google Flights verification link.',
        comment_text: savingsText,
      },
    },
    workflow_intent: {
      publish_primary_post: true,
      capture_google_flights_snapshot: true,
      comment_snapshot_on_primary_post: true,
    },
  };
}
