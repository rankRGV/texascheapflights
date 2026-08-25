import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
        const audienceId = import.meta.env.RESEND_AUDIENCE_ID || process.env.RESEND_AUDIENCE_ID || '';
        const body = await request.json();
        const { token, alert_scope, home_airport, max_price, active } = body;

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
        }

        const { data: subscriber, error: lookupError } = await supabase
            .from('subscribers')
            .select('email, magical_token')
            .eq('magical_token', token)
            .single();

        if (lookupError || !subscriber) throw lookupError || new Error('Subscriber not found');

        // Prepare update object
        const updateData: any = {};
        if (alert_scope) updateData.alert_scope = alert_scope;
        if (home_airport) updateData.home_airport = home_airport.toUpperCase();
        if (max_price !== undefined && max_price !== null && max_price !== '') {
            updateData.max_price = parseInt(max_price);
        }
        if (active !== undefined) updateData.active = active;

        const { data: updatedSubscriber, error } = await supabase
            .from('subscribers')
            .update(updateData)
            .eq('magical_token', token)
            .select('email, magical_token, home_airport, alert_scope, max_price')
            .single();

        if (error) throw error;

        // Supabase remains authoritative, but keep Resend's contact properties
        // aligned for segmentation and future broadcast personalization.
        if (apiKey && audienceId && updatedSubscriber) {
            const resend = new Resend(apiKey);
            const { error: resendError } = await resend.contacts.update({
                email: subscriber.email,
                audienceId,
                properties: {
                    magical_token: updatedSubscriber.magical_token,
                    home_airport: updatedSubscriber.home_airport,
                    alert_scope: updatedSubscriber.alert_scope,
                    max_price: updatedSubscriber.max_price ?? null,
                },
            });

            if (resendError) {
                console.warn('Resend preference sync failed:', resendError.message);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('Update Preferences Error:', err);
        return new Response(JSON.stringify({ error: 'Failed to update preferences' }), { status: 500 });
    }
};
