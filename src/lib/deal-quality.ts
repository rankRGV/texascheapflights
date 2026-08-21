export type TripLengthBucket = 'weekend' | 'standard' | 'extended' | 'unknown';

export interface DiversityCandidate {
    origin: string;
    destination: string;
    airline?: string;
    start_date?: string;
    end_date?: string;
    price: number;
}

export function normalizeDealDestination(destination: string): string {
    return destination
        .toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function getTripLengthBucket(startDate?: string, endDate?: string): TripLengthBucket {
    if (!startDate || !endDate) return 'unknown';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    if (!Number.isFinite(days) || days <= 0) return 'unknown';
    if (days <= 4) return 'weekend';
    if (days <= 9) return 'standard';
    if (days <= 16) return 'extended';
    return 'unknown';
}

function isMateriallyBetter(candidate: DiversityCandidate, existing: DiversityCandidate): boolean {
    return candidate.price <= existing.price * 0.85;
}

/**
 * Keeps a small alert batch varied by route, destination, and trip profile.
 * A materially better fare remains eligible, even when it repeats one of those dimensions.
 */
export function selectDiverseCandidates<T extends DiversityCandidate>(
    candidates: T[],
    maxCandidates = 5,
): T[] {
    const selected: T[] = [];
    const destinationCounts = new Map<string, number>();
    const profileCounts = new Map<TripLengthBucket, number>();

    for (const candidate of candidates) {
        if (selected.length >= maxCandidates) break;

        const destinationKey = normalizeDealDestination(candidate.destination);
        const profile = getTripLengthBucket(candidate.start_date, candidate.end_date);
        const sameRoute = selected.filter((existing) =>
            existing.origin.toUpperCase() === candidate.origin.toUpperCase()
            && normalizeDealDestination(existing.destination) === destinationKey
        );
        const sameDestination = selected.filter((existing) =>
            normalizeDealDestination(existing.destination) === destinationKey
        );

        if (sameRoute.length > 0 && !sameRoute.some((existing) => isMateriallyBetter(candidate, existing))) {
            continue;
        }
        if ((destinationCounts.get(destinationKey) ?? 0) >= 1
            && !sameDestination.some((existing) => isMateriallyBetter(candidate, existing))) {
            continue;
        }
        if ((profileCounts.get(profile) ?? 0) >= 3
            && !selected.some((existing) => getTripLengthBucket(existing.start_date, existing.end_date) === profile
                && isMateriallyBetter(candidate, existing))) {
            continue;
        }

        selected.push(candidate);
        destinationCounts.set(destinationKey, (destinationCounts.get(destinationKey) ?? 0) + 1);
        profileCounts.set(profile, (profileCounts.get(profile) ?? 0) + 1);
    }

    return selected;
}
