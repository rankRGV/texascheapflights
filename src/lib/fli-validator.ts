import { execFile } from 'node:child_process';

export type FliValidationStatus =
  | 'disabled'
  | 'invalid_route'
  | 'confirmed'
  | 'better_date_found'
  | 'not_found'
  | 'price_mismatch'
  | 'fli_error';

export type FliValidationInput = {
  origin: string;
  destination: string;
  scoutPrice: number;
  startDate?: string;
  endDate?: string;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
};

export type FliValidationResult = {
  status: FliValidationStatus;
  enabled: boolean;
  checkedAt: string;
  tripDurations: number[];
  validatedPrice?: number;
  validatedDates?: string;
  deltaFromScoutPrice?: number;
  bestAlternative?: unknown;
  exactSearch?: unknown;
  dateSearches?: Array<{
    tripDuration: number;
    status: 'ok' | 'error';
    lowestPrice?: number;
    bestResult?: unknown;
    error?: string;
  }>;
  message?: string;
};

const TRIP_DURATIONS = [3, 4, 5, 7, 10, 14];
const IATA_RE = /^[A-Z]{3}$/;

function isEnabled() {
  const value = import.meta.env.ENABLE_FLI_VALIDATION || process.env.ENABLE_FLI_VALIDATION;
  return String(value).toLowerCase() === 'true';
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeDate(date?: string) {
  if (!date) return undefined;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return toDateString(parsed);
}

function routeIsValid(origin: string, destination: string) {
  return IATA_RE.test(origin) && IATA_RE.test(destination) && origin !== destination;
}

function getFliCommand() {
  return import.meta.env.FLI_CLI_COMMAND || process.env.FLI_CLI_COMMAND || 'fli';
}

function runFli(args: string[], timeoutMs = 20000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    execFile(
      getFliCommand(),
      args,
      {
        timeout: timeoutMs,
        windowsHide: true,
        shell: process.platform === 'win32',
        maxBuffer: 1024 * 1024 * 4,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error('fli returned non-JSON output'));
        }
      }
    );
  });
}

function extractPrice(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  const candidates = [
    record.price,
    record.total_price,
    record.totalPrice,
    record.amount,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const parsed = Number(candidate.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  return undefined;
}

function bestPricedResult(results: unknown): { price?: number; result?: unknown } {
  const list = Array.isArray(results)
    ? results
    : results && typeof results === 'object' && Array.isArray((results as Record<string, unknown>).results)
      ? ((results as Record<string, unknown>).results as unknown[])
      : [];

  let best: { price?: number; result?: unknown } = {};
  for (const result of list) {
    const price = extractPrice(result);
    if (!price) continue;
    if (!best.price || price < best.price) {
      best = { price, result };
    }
  }

  return best;
}

export async function validateWithFli(input: FliValidationInput): Promise<FliValidationResult> {
  const checkedAt = new Date().toISOString();
  const origin = input.origin.toUpperCase();
  const destination = input.destination.toUpperCase();
  const cabin = input.cabin ?? 'ECONOMY';

  if (!isEnabled()) {
    return {
      status: 'disabled',
      enabled: false,
      checkedAt,
      tripDurations: TRIP_DURATIONS,
      message: 'Set ENABLE_FLI_VALIDATION=true and install the fli CLI to run validation.',
    };
  }

  if (!routeIsValid(origin, destination)) {
    return {
      status: 'invalid_route',
      enabled: true,
      checkedAt,
      tripDurations: TRIP_DURATIONS,
      message: 'fli validation requires IATA airport codes for both origin and destination.',
    };
  }

  const today = new Date();
  const rangeStart = normalizeDate(input.startDate) ?? toDateString(addDays(today, 14));
  const rangeEnd = normalizeDate(input.endDate) ?? toDateString(addDays(today, 120));
  const dateSearches: FliValidationResult['dateSearches'] = [];

  let exactSearch: unknown;
  let exactBest: { price?: number; result?: unknown } = {};
  if (input.startDate && input.endDate) {
    try {
      exactSearch = await runFli([
        'flights',
        origin,
        destination,
        rangeStart,
        '--return',
        rangeEnd,
        '--class',
        cabin,
        '--stops',
        'ONE_STOP',
        '--sort',
        'CHEAPEST',
        '--format',
        'json',
      ]);
      exactBest = bestPricedResult(exactSearch);
    } catch (error) {
      exactSearch = { error: error instanceof Error ? error.message : String(error) };
    }
  }

  for (const tripDuration of TRIP_DURATIONS) {
    try {
      const results = await runFli([
        'dates',
        origin,
        destination,
        '--from',
        rangeStart,
        '--to',
        rangeEnd,
        '--duration',
        String(tripDuration),
        '--round',
        '--class',
        cabin,
        '--stops',
        'ONE_STOP',
        '--sort',
        '--format',
        'json',
      ]);
      const best = bestPricedResult(results);
      dateSearches.push({
        tripDuration,
        status: 'ok',
        lowestPrice: best.price,
        bestResult: best.result,
      });
    } catch (error) {
      dateSearches.push({
        tripDuration,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const dateBest = dateSearches
    .filter((result) => result.status === 'ok' && result.lowestPrice)
    .sort((a, b) => (a.lowestPrice ?? Number.MAX_SAFE_INTEGER) - (b.lowestPrice ?? Number.MAX_SAFE_INTEGER))[0];

  const validatedPrice = exactBest.price ?? dateBest?.lowestPrice;
  if (!validatedPrice) {
    return {
      status: dateSearches.every((result) => result.status === 'error') ? 'fli_error' : 'not_found',
      enabled: true,
      checkedAt,
      tripDurations: TRIP_DURATIONS,
      exactSearch,
      dateSearches,
      message: 'No matching fli price was found for this route/date range.',
    };
  }

  const deltaFromScoutPrice = validatedPrice - input.scoutPrice;
  const status: FliValidationStatus =
    Math.abs(deltaFromScoutPrice) <= 25
      ? 'confirmed'
      : deltaFromScoutPrice < -25
        ? 'better_date_found'
        : 'price_mismatch';

  return {
    status,
    enabled: true,
    checkedAt,
    tripDurations: TRIP_DURATIONS,
    validatedPrice,
    validatedDates: exactBest.price ? `${rangeStart} to ${rangeEnd}` : undefined,
    deltaFromScoutPrice,
    bestAlternative: dateBest?.bestResult,
    exactSearch,
    dateSearches,
  };
}
