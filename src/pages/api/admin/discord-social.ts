import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { buildSocialWebhookPayload } from '../../../lib/social-payload';

// GET renders a confirmation page to prevent Discord unfurler from auto-triggering
export const GET: APIRoute = async ({ url }) => {
    const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026';
    const dealId = url.searchParams.get('dealId');
    const token = url.searchParams.get('token');

    if (token !== ADMIN_PASSWORD) {
        return new Response(
            `<html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #ef4444;">❌ Unauthorized</h1>
                    <p>Invalid or missing token.</p>
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
                </body>
            </html>`, 
            { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
    }

    // Render a confirmation page
    return new Response(
        `<html>
            <head>
                <title>Confirm Social Post</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: -apple-system, system-ui, sans-serif; background-color: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background-color: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid #334155; text-align: center; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
                    .icon { font-size: 48px; margin-bottom: 20px; }
                    h1 { font-size: 24px; margin: 0 0 10px 0; color: #f8fafc; }
                    p { color: #94a3b8; font-size: 15px; margin: 0 0 24px 0; line-height: 1.5; }
                    .btn { background-color: #f59e0b; border: none; cursor: pointer; color: #0f172a; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: bold; width: 100%; transition: background-color 0.2s; }
                    .btn:hover { background-color: #fbbf24; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">📢</div>
                    <h1>Confirm Post</h1>
                    <p>Are you sure you want to post Deal #<b>${dealId}</b> to socials?</p>
                    <form method="POST" action="">
                        <input type="hidden" name="dealId" value="${dealId}" />
                        <input type="hidden" name="token" value="${token}" />
                        <button type="submit" class="btn">🚀 Yes, Post to Socials</button>
                    </form>
                </div>
            </body>
        </html>`, 
        { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
};

// POST handles the actual submission
export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const dealId = formData.get('dealId')?.toString();
        const token = formData.get('token')?.toString();
        const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026';

        if (token !== ADMIN_PASSWORD) {
            return new Response('Unauthorized', { status: 401 });
        }

        if (!dealId) {
            return new Response('Missing Deal ID', { status: 400 });
        }

        const n8nWebhookUrl = import.meta.env.N8N_WEBHOOK_URL ?? 'https://jarvis-ens.app.n8n.cloud/webhook/433eb27d-eee4-4eaa-92fa-bba533544d43';

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
                        <p>Could not find deal ID ${dealId}.</p>
                    </body>
                </html>`, 
                { status: 404, headers: { 'Content-Type': 'text/html' } }
            );
        }

        const DEAL_CARD_SECRET = import.meta.env.DEAL_CARD_SECRET ?? ADMIN_PASSWORD;
        const n8nPayload = buildSocialWebhookPayload(deal, DEAL_CARD_SECRET);

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload)
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n Webhook failed with status: ${n8nResponse.status}`);
        }

        await supabase
            .from('deals')
            .update({ posted_to_social: true })
            .eq('id', dealId);

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
