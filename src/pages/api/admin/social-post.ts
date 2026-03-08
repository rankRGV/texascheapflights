import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
    // 1. Verify Authentication
    const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026';

    // Verify via cookie (for dashboard clicks) or auth header (for API testing)
    const cookiePw = cookies.get('tcf_admin')?.value;
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (cookiePw !== ADMIN_PASSWORD && authHeader !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        // 2. Parse request body
        const body = await request.json();
        const { dealId } = body;

        if (!dealId) {
            return new Response(JSON.stringify({ error: 'Missing dealId' }), { status: 400 });
        }

        // Use environment variable or the provided true Production Webhook URL
        const n8nWebhookUrl = import.meta.env.N8N_WEBHOOK_URL ?? 'https://jarvis-ens.app.n8n.cloud/webhook/433eb27d-eee4-4eaa-92fa-bba533544d43';

        // 3. Fetch deal data from Supabase to send to n8n
        const { data: deal, error: fetchError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (fetchError || !deal) {
            return new Response(JSON.stringify({ error: 'Deal not found in database' }), { status: 404 });
        }

        // 4. Send payload to n8n Webhook
        // Including the Deal Card Secret so n8n can fetch the image securely
        const DEAL_CARD_SECRET = import.meta.env.DEAL_CARD_SECRET ?? ADMIN_PASSWORD;
        const n8nPayload = {
            deal: deal,
            image_secret_key: DEAL_CARD_SECRET
        };

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(n8nPayload)
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n Webhook failed with status: ${n8nResponse.status}`);
        }

        // 5. Update Deal status in Supabase (posted_to_social = true)
        // NOTE: This assumes there is a 'posted_to_social' boolean column 
        // If there isn't, we can skip this or you can add it to your Supabase schema later.
        const { error: updateError } = await supabase
            .from('deals')
            .update({ posted_to_social: true })
            .eq('id', dealId);

        if (updateError) {
            console.warn('Failed to update posted_to_social status:', updateError);
            // We don't fail the whole request just because tracking failed
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Sent to n8n successfully!'
        }), { status: 200 });

    } catch (error: any) {
        console.error('Error triggering social post:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process social post trigger',
            details: error.message
        }), { status: 500 });
    }
};
