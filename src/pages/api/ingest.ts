import type { APIRoute } from 'astro';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import { parseEmailToDeal } from '../../lib/gemini';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Verify this request actually came from Resend using Svix
    const secret = import.meta.env.RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;

    if (!secret) {
      console.warn("RESEND_WEBHOOK_SECRET is not set");
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    // Get the raw body as a string for Svix verification
    const payloadString = await request.text();

    // Get the Svix headers from the request
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse the verified payload from Resend
    console.log("📥 Received Verified Webhook:", payload.type);

    if (payload.type === 'email.received') {
      const emailSubject = payload.data?.subject || "No Subject";
      const fromAddress = payload.data?.from || "Unknown Sender";
      const emailHtml = payload.data?.html || "";
      const emailText = payload.data?.text || emailHtml || "No Content";

      console.log(`   📧 From: ${fromAddress}`);
      console.log(`   📌 Subject: ${emailSubject}`);

      // 3. Pass this to the AI Brain
      console.log("🤖 Passing to Gemini for Texas Relevance and Scoring...");
      const dealData = await parseEmailToDeal(emailSubject, emailText);

      if (dealData) {
        if (!dealData.isTexasOrigin) {
          console.log(`   🚀 Auto-Drop: Deal origin is not Texas. Found: ${dealData.originAirport}`);
        } else {
          console.log(`   ✅ TEXAS DEAL SPOTTED!`);
          console.log(`   ✈️ Route: ${dealData.originAirport} ➔ ${dealData.destination} ($${dealData.price} via ${dealData.airline})`);
          console.log(`   📈 Total Score: ${dealData.totalScore}/10 (${dealData.explanation})`);

          if (dealData.totalScore >= 7) {
            console.log(`   🎉 HIGH SCORE - SEND TO DISCORD QUEUE NOW!`);

            try {
              const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
              const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

              let draftLink = "https://resend.com/broadcasts";

              if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                // Fetch the audience to send this to
                const audiences = await resend.audiences.list();
                const audienceId = audiences.data?.data?.[0]?.id;

                if (audienceId) {
                  const draft = await resend.broadcasts.create({
                    audienceId,
                    from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
                    subject: `✈️ ALERT: ${dealData.originAirport} ➔ ${dealData.destination} for $${dealData.price}!`,
                    name: `Deal: ${dealData.originAirport} to ${dealData.destination}`,
                    html: `
                      <h2>Texas Cheap Flights Alert!</h2>
                      <p>We found a massive deal from <strong>${dealData.originAirport}</strong> to <strong>${dealData.destination}</strong>.</p>
                      <p><strong>Price:</strong> $${dealData.price}</p>
                      <p><strong>Airline:</strong> ${dealData.airline}</p>
                      <p><strong>Why this is a great deal:</strong> ${dealData.explanation}</p>
                      <p>Book quickly before it disappears!</p>
                    `
                  });
                  if (draft.data?.id) {
                    draftLink = `https://resend.com/broadcasts/${draft.data.id}`;
                  }
                  console.log(`   📝 Draft created in Resend`);
                }
              }

              if (discordWebhookUrl) {
                await fetch(discordWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    content: `🚨 **NEW DEAL FOUND (Score: ${dealData.totalScore}/10)** 🚨\n\n**Route:** ${dealData.originAirport} ➔ ${dealData.destination}\n**Price:** $${dealData.price} on ${dealData.airline}\n**Analysis:** ${dealData.explanation}\n\n📝 **Draft Created:** [Review & Send in Resend](${draftLink})`
                  })
                });
                console.log("   ✅ Sent to Discord!");
              } else {
                console.warn("   ⚠️ DISCORD_WEBHOOK_URL not set.");
              }
            } catch (err) {
              console.error("   ❌ Failed to push to Drafts or Discord:", err);
            }
          } else {
            console.log(`   📉 SCORE TOO LOW - Skipping alerts.`);
          }
        }
      } else {
        console.log("   ❌ AI Failed to parse deal.");
      }

    } else {
      console.log(`   ⚠️ Ignored payload type: ${payload.type}`);
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
