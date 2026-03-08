import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { token, alert_scope, home_airport, max_price, active } = body;

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
        }

        // Prepare update object
        const updateData: any = {};
        if (alert_scope) updateData.alert_scope = alert_scope;
        if (home_airport) updateData.home_airport = home_airport.toUpperCase();
        if (max_price) updateData.max_price = parseInt(max_price);
        if (active !== undefined) updateData.active = active;

        const { error } = await supabase
            .from('subscribers')
            .update(updateData)
            .eq('magical_token', token);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('Update Preferences Error:', err);
        return new Response(JSON.stringify({ error: 'Failed to update preferences' }), { status: 500 });
    }
};
