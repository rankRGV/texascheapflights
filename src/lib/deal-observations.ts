import { supabase, isSupabaseConfigured } from './supabase';
import { getTripLengthBucket, type TripLengthBucket } from './deal-quality';

export interface DealObservationInput {
    sourceEngine: string;
    origin: string;
    destination: string;
    destinationCode?: string;
    airline?: string;
    price: number;
    startDate?: string;
    endDate?: string;
    bookingLink?: string;
    rawPayload?: unknown;
}

/**
 * Persistence is opt-in so a shadow request remains safe until its table exists
 * in the deployed Supabase project.
 */
export async function persistDealObservations(observations: DealObservationInput[]) {
    const enabled = (import.meta.env.PERSIST_SCOUT_OBSERVATIONS || process.env.PERSIST_SCOUT_OBSERVATIONS) === 'true';
    if (!enabled || !isSupabaseConfigured || observations.length === 0) {
        return { persisted: false, count: 0, reason: 'opted-out-or-unconfigured' };
    }

    const rows = observations.map((observation) => ({
        source_engine: observation.sourceEngine,
        origin: observation.origin,
        destination: observation.destination,
        destination_code: observation.destinationCode ?? null,
        airline: observation.airline ?? null,
        price: observation.price,
        start_date: observation.startDate ?? null,
        end_date: observation.endDate ?? null,
        trip_length_bucket: getTripLengthBucket(observation.startDate, observation.endDate) as TripLengthBucket,
        booking_link: observation.bookingLink ?? null,
        raw_payload: observation.rawPayload ?? null,
    }));

    const { error } = await supabase.from('deal_observations').insert(rows);
    if (error) {
        console.error('Unable to persist deal observations:', error.message);
        return { persisted: false, count: 0, reason: error.message };
    }

    return { persisted: true, count: rows.length };
}
