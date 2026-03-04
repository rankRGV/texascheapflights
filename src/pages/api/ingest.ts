import type { APIRoute } from 'astro';
import { Webhook } from 'svix';
import { processDeal } from '../../lib/engine';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Verify this request actually came from Resend using Svix
    const secret = import.meta.env.RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;

    if (!secret) {
      console.warn("RESEND_WEBHOOK_SECRET is not set");
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    const payloadString = await request.text();
    const svix_id = request.headers.get('svix-id');
    const svix_timestamp = request.headers.get('svix-timestamp');
    const svix_signature = request.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing svix headers', { status: 400 });
    }

    const wh = new Webhook(secret);
    let payload;

    try {
      payload = wh.verify(payloadString, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any;
    } catch (err: any) {
      console.warn("Invalid webhook signature:", err.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Parse the verified payload from Resend
    console.log("📥 Received Verified Webhook:", payload.type);

    if (payload.type === 'email.received') {
      const emailId = payload.data?.email_id;
      const emailSubject = payload.data?.subject || "No Subject";

      console.log(`📡 Inbound Payload Meta: From ${payload.data?.from}, Subject: ${emailSubject}`);

      let finalContent = payload.data?.text || payload.data?.html || "";

      // 3. Fallback: Fetch via API with a tiny delay to allow indexing
      const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      if (!finalContent && emailId && resendApiKey) {
        console.log(`   🔍 Content missing. Waiting 1.5s for Resend indexing...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Small delay for race condition

        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        const response = await resend.emails.get(emailId);

        if (response.data) {
          finalContent = response.data.text || response.data.html || "";
        }
      }

      if (!finalContent) {
        // Ultimate fallback: stringify the whole payload so we at least see metadata in Discord
        finalContent = `Metadata Only Found: ${JSON.stringify(payload.data)}`;
      }

      // 4. Process the deal using our shared engine
      await processDeal(emailSubject, finalContent, 'Email/Resend');

    } else {
      console.log(`   ⚠️ Ignored payload type: ${payload.type}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Payload received" }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Error in /api/ingest:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
