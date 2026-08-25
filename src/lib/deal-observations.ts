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
 * Shadow observations are persisted by default. Set
 * PERSIST_SCOUT_OBSERVATIONS=false to pause collection without disabling the
 * read-only shadow request itself.
 */
export async function persistDealObservations(observations: DealObservationInput[]) {
    const configured = import.meta.env.PERSIST_SCOUT_OBSERVATIONS || process.env.PERSIST_SCOUT_OBSERVATIONS;
    const enabled = configured !== 'false';
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
