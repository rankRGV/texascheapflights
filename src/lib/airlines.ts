export type CarrierTier = 'legacy' | 'ulcc' | 'hybrid' | 'premium' | 'regional' | 'unknown';

type AirlineRule = {
  canonical: string;
  patterns: string[];
  tier: CarrierTier;
};

const AIRLINE_RULES: AirlineRule[] = [
  { canonical: 'American', patterns: ['american', 'aa', 'americanairlines', 'american eagle'], tier: 'legacy' },
  { canonical: 'Delta', patterns: ['delta', 'deltairlines'], tier: 'legacy' },
  { canonical: 'United', patterns: ['united', 'unitedairlines'], tier: 'legacy' },
  { canonical: 'Southwest', patterns: ['southwest', 'southwestairlines'], tier: 'legacy' },
  { canonical: 'Alaska', patterns: ['alaska', 'alaskaairlines'], tier: 'legacy' },
  { canonical: 'JetBlue', patterns: ['jetblue', 'jet blue'], tier: 'hybrid' },
  { canonical: 'Spirit', patterns: ['spirit', 'spiritairlines'], tier: 'ulcc' },
  { canonical: 'Frontier', patterns: ['frontier', 'frontierairlines'], tier: 'ulcc' },
  { canonical: 'Allegiant', patterns: ['allegiant', 'allegiantair'], tier: 'ulcc' },
  { canonical: 'Breeze', patterns: ['breeze', 'breezeairways'], tier: 'ulcc' },
  { canonical: 'Sun Country', patterns: ['suncountry', 'sun country'], tier: 'ulcc' },
  { canonical: 'Avelo', patterns: ['avelo', 'aveloairlines'], tier: 'ulcc' },
  { canonical: 'British Airways', patterns: ['britishairways', 'ba'], tier: 'premium' },
  { canonical: 'Lufthansa', patterns: ['lufthansa'], tier: 'premium' },
  { canonical: 'Air France', patterns: ['airfrance'], tier: 'premium' },
  { canonical: 'KLM', patterns: ['klm'], tier: 'premium' },
  { canonical: 'Virgin Atlantic', patterns: ['virginatlantic'], tier: 'premium' },
  { canonical: 'ANA', patterns: ['ana', 'allnippon'], tier: 'premium' },
  { canonical: 'JAL', patterns: ['jal', 'japanairlines'], tier: 'premium' },
  { canonical: 'Qatar Airways', patterns: ['qatar', 'qatarairways'], tier: 'premium' },
  { canonical: 'Emirates', patterns: ['emirates'], tier: 'premium' },
  { canonical: 'Turkish Airlines', patterns: ['turkish', 'turkishairlines'], tier: 'premium' },
  { canonical: 'Singapore Airlines', patterns: ['singapore', 'singaporeairlines'], tier: 'premium' },
  { canonical: 'Multiple Airlines', patterns: ['multiple', 'various', 'mixed'], tier: 'unknown' },
];

function canonicalize(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/air\s+lines?/g, 'airlines')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function normalizeAirlineName(airline?: string | null): string {
  const cleaned = canonicalize(airline);

  if (!cleaned) return 'Unknown Airline';

  const matched = AIRLINE_RULES.find((rule) => rule.patterns.some((pattern) => cleaned.includes(canonicalize(pattern))));
  if (matched) return matched.canonical;

  return (airline ?? 'Unknown Airline').trim() || 'Unknown Airline';
}

export function getCarrierTier(airline?: string | null): CarrierTier {
  const cleaned = canonicalize(airline);
  if (!cleaned) return 'unknown';

  const matched = AIRLINE_RULES.find((rule) => rule.patterns.some((pattern) => cleaned.includes(canonicalize(pattern))));
  return matched?.tier ?? 'unknown';
}

export function isBudgetCarrier(airline?: string | null): boolean {
  return getCarrierTier(airline) === 'ulcc';
}

export function isLegacyCarrier(airline?: string | null): boolean {
  const tier = getCarrierTier(airline);
  return tier === 'legacy' || tier === 'premium';
}
