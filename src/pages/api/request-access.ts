import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server misconfiguration.' }), { status: 500 });
        }

        const { email } = await request.json();
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required.' }), { status: 400 });
        }

        // 1. Find user in Supabase
        const { data, error: dbError } = await supabase
            .from('subscribers')
            .select('magical_token, email')
            .eq('email', email.toLowerCase())
            .single();

        if (dbError || !data) {
            // Security: Don't reveal if email exists. Still say "Success" but don't send.
            return new Response(JSON.stringify({ success: true, message: 'If you are a subscriber, a link is on its way.' }), { status: 200 });
        }

        // 2. Send email via Resend
        const resend = new Resend(apiKey);
        const magicLink = `https://texascheapflights.com/manage-subscription?token=${data.magical_token}`;

        await resend.emails.send({
            from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
            to: data.email,
            subject: "✈️ Your Access Link: Texas Cheap Flights",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2>Access Your Settings</h2>
          <p>Click the button below to manage your flight alert preferences and home airport.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}" style="background-color: #d4a843; color: #050a14; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; text-transform: uppercase;">Manage My Subscription</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; word-break: break-all; color: #0ea5e9;">${magicLink}</p>
        </div>
      `
        });

        return new Response(JSON.stringify({ success: true, message: 'If you are a subscriber, a link is on its way.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('Request Access Error:', err);
        return new Response(JSON.stringify({ error: 'Failed to process request.' }), { status: 500 });
    }
};
