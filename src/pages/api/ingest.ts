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
      const emailSubject = payload.data?.subject || "No Subject";
      const emailHtml = payload.data?.html || "";
      const emailText = payload.data?.text || emailHtml || "No Content";

      // 3. Process the deal using our shared engine
      await processDeal(emailSubject, emailText, 'Email/Resend');

    } else {
      console.log(`   ⚠️ Ignored payload type: ${payload.type}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Payload received" }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Error in /api/ingest:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
