import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Verify this request actually came from Resend
        // Resend sends webhooks as POST requests with a JSON payload

        // We will need a secret token to prevent random people from hitting this endpoint
        const authHeader = request.headers.get('Authorization');
        const secret = import.meta.env.INGEST_SECRET || process.env.INGEST_SECRET;

        if (!secret || authHeader !== \`Bearer \${secret}\`) {
      console.warn("Unauthorized attempt to access /api/ingest");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse the payload from Resend
    const payload = await request.json();
    
    // Resend Webhooks usually wrap the data: { type: 'email.received', data: { ... } }
    console.log("📥 Received Ingestion Webhook:", payload.type);

    if (payload.type === 'email.received') {
      const emailSubject = payload.data?.subject || "No Subject";
      const emailBody = payload.data?.text || payload.data?.html || "No Body";
      const fromAddress = payload.data?.from || "Unknown Sender";

      console.log(\`   📧 From: \${fromAddress}\`);
      console.log(\`   📌 Subject: \${emailSubject}\`);

      // TODO: Pass this to the AI Brain (Step 3)
    } else {
        console.log(\`   ⚠️ Ignored payload type: \${payload.type}\`);
    }

    // 3. Acknowledge receipt quickly so Resend doesn't retry
    return new Response(JSON.stringify({ success: true, message: "Payload received" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("❌ Error in /api/ingest:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
