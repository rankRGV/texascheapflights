import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, url }) => {
    // 1. Verify Authentication from URL Parameters
    const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026';
    
    // Get parameters from the URL
    const dealId = url.searchParams.get('dealId');
    const token = url.searchParams.get('token');

    // Return a simple HTML error if unauthorized
    if (token !== ADMIN_PASSWORD) {
        return new Response(
            `<html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #ef4444;">❌ Unauthorized</h1>
                    <p>Invalid or missing token. You do not have permission to post this deal.</p>
                </body>
            </html>`, 
            { status: 401, headers: { 'Content-Type': 'text/html' } }
        );
    }

    if (!dealId) {
        return new Response(
            `<html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #f59e0b;">⚠️ Missing Deal ID</h1>
                    <p>No deal ID was provided in the URL.</p>
                </body>
            </html>`, 
            { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
    }

    try {
        // Use environment variable or the provided true Production Webhook URL
        const n8nWebhookUrl = import.meta.env.N8N_WEBHOOK_URL ?? 'https://jarvis-ens.app.n8n.cloud/webhook/433eb27d-eee4-4eaa-92fa-bba533544d43';

        // 2. Fetch deal data from Supabase to send to n8n
        const { data: deal, error: fetchError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (fetchError || !deal) {
            return new Response(
                `<html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #ef4444;">❌ Deal Not Found</h1>
                        <p>Could not find deal ID ${dealId} in the database.</p>
                    </body>
                </html>`, 
                { status: 404, headers: { 'Content-Type': 'text/html' } }
            );
        }

        // 3. Send payload to n8n Webhook
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

        // 4. Update Deal status in Supabase (posted_to_social = true)
        const { error: updateError } = await supabase
            .from('deals')
            .update({ posted_to_social: true })
            .eq('id', dealId);

        if (updateError) {
            console.warn('Failed to update posted_to_social status:', updateError);
        }

        // 5. Return Success HTML
        return new Response(
            `<html>
                <head>
                    <title>Post Successful</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: -apple-system, system-ui, sans-serif; background-color: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { background-color: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid #334155; text-align: center; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
                        .icon { font-size: 48px; margin-bottom: 20px; }
                        h1 { font-size: 24px; margin: 0 0 10px 0; color: #f8fafc; }
                        p { color: #94a3b8; font-size: 15px; margin: 0 0 24px 0; line-height: 1.5; }
                        .btn { background-color: #f59e0b; color: #0f172a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">🚀 ✅</div>
                        <h1>Posted to Socials!</h1>
                        <p>The deal from <strong>${deal.origin}</strong> to <strong>${deal.destination}</strong> ($${deal.price}) has been successfully sent to the n8n webhook.</p>
                        <a href="javascript:window.close();" class="btn">Close Window</a>
                    </div>
                </body>
            </html>`, 
            { status: 200, headers: { 'Content-Type': 'text/html' } }
        );

    } catch (error: any) {
        console.error('Error triggering social post:', error);
        return new Response(
            `<html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #ef4444;">❌ Server Error</h1>
                    <p>Failed to process the social post trigger.</p>
                    <pre style="text-align: left; background: #eee; padding: 10px; border-radius: 5px; margin-top: 20px;">${error.message}</pre>
                </body>
            </html>`, 
            { status: 500, headers: { 'Content-Type': 'text/html' } }
        );
    }
};
