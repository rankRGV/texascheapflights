import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
    try {
        // Fetch the last 20 sent deals for the ticker and history page
        const { data: recentDeals, error } = await supabase
            .from('deals')
            .select('id, created_at, origin, destination, price, airline, score, deal_type, travel_dates, booking_link, sent_at')
            .not('sent_at', 'is', null)
            .order('sent_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Aggregate stats
        const { data: stats } = await supabase
            .from('deals')
            .select('price, score')
            .not('sent_at', 'is', null);

        const totalSent = stats?.length ?? 0;
        const avgSavings = stats && stats.length > 0
            ? Math.round(stats.reduce((sum, d) => sum + (d.price || 0), 0) / stats.length)
            : 0;
        const bestDeal = stats && stats.length > 0
            ? Math.min(...stats.map(d => d.price || 9999))
            : null;

        return new Response(JSON.stringify({
            deals: recentDeals ?? [],
            stats: { totalSent, avgSavings, bestDeal }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('Failed to fetch recent deals:', err);
        return new Response(JSON.stringify({ deals: [], stats: { totalSent: 0, avgSavings: 0, bestDeal: null } }), {
            status: 200, // Graceful degradation
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
