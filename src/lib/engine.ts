import { Resend } from 'resend';
import { parseEmailToDeal, type ParsedDeal } from './gemini';

export async function processDeal(title: string, content: string, source: string) {
    console.log(`🤖 Processing deal from ${source}: ${title}`);

    // 1. Handle "System" emails (Gmail Confirmation, Webhook Tests, etc.)
    const isSystemEmail = /confirm|verify|verification|code|password|welcome|resend/i.test(title + content);
    const isNoise = /unsubscribe|privacy policy|terms of service/i.test(title) && content.length < 500;

    if (isSystemEmail) {
        console.log("   🛠️ System Email detected. Bypassing score and alerting Discord...");
        await triggerAlerts({
            originAirport: "SYSTEM",
            destination: "ADMIN",
            price: 0,
            airline: "Internal",
            priceStrengthScore: 5,
            hedgeValueScore: 5,
            totalScore: 10,
            explanation: `Admin Message: ${title}`,
            isTexasOrigin: true
        }, content);
        return { success: true, reason: 'System Alert' };
    }

    if (isNoise) {
        console.log("   🔇 Noise/Spam detected. Dropping.");
        return { success: false, reason: 'Noise filter' };
    }

    const dealData = await parseEmailToDeal(title, content);

    if (dealData) {
        if (!dealData.isTexasOrigin) {
            console.log(`   🚀 Auto-Drop: Deal origin is not Texas. Found: ${dealData.originAirport}`);
            return { success: false, reason: 'Not Texas origin' };
        } else {
            console.log(`   ✅ TEXAS DEAL SPOTTED!`);
            console.log(`   ✈️ Route: ${dealData.originAirport} ➔ ${dealData.destination} ($${dealData.price} via ${dealData.airline})`);
            console.log(`   📈 Total Score: ${dealData.totalScore}/10 (${dealData.explanation})`);

            if (dealData.totalScore >= 7) {
                console.log(`   🎉 HIGH SCORE - SENDING ALERTS...`);
                await triggerAlerts(dealData);
                return { success: true, score: dealData.totalScore };
            } else {
                console.log(`   📉 SCORE TOO LOW - Skipping alerts.`);
                return { success: false, reason: 'Score too low' };
            }
        }
    } else {
        // 3. Fallback: If it's not a deal and not a system email, it's likely a human message!
        console.log("   👤 Human message detected. Sending to Discord Support...");
        await triggerAlerts({
            originAirport: "SUPPORT",
            destination: "FOUNDER",
            price: 0,
            airline: "Customer",
            priceStrengthScore: 5,
            hedgeValueScore: 5,
            totalScore: 10,
            explanation: `Support Message: ${title}`,
            isTexasOrigin: true
        }, content);
        return { success: true, reason: 'Human Support' };
    }
}

async function triggerAlerts(dealData: ParsedDeal, rawContent?: string) {
    try {
        const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
        const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

        let draftLink = "https://resend.com/broadcasts";

        // Only create drafts for REAL deals (not system or support alerts)
        if (resendApiKey && dealData.originAirport !== "SYSTEM" && dealData.originAirport !== "SUPPORT") {
            const resend = new Resend(resendApiKey);
            const audiences = await resend.audiences.list();
            const audienceId = audiences.data?.data?.[0]?.id;

            if (audienceId) {
                const draft = await resend.broadcasts.create({
                    audienceId,
                    from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
                    subject: `✈️ ALERT: ${dealData.originAirport} ➔ ${dealData.destination} for $${dealData.price}!`,
                    name: `Deal: ${dealData.originAirport} to ${dealData.destination}`,
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background-color: #050a14; padding: 32px 20px; text-align: center; border-bottom: 3px solid #f59e0b;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Texas <span style="color: #f59e0b;">Cheap Flights</span></h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px;">🚨 Anomaly Alert Detected</p>
                <h2 style="margin: 0 0 24px 0; font-size: 32px; font-weight: 900; color: #0f172a; line-height: 1.1;">${dealData.originAirport} ➔ ${dealData.destination}</h2>
                
                <!-- Deal Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                    <tr>
                      <td style="padding-bottom: 0;">
                        <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 1px;">Price</p>
                        <p style="margin: 4px 0 0 0; font-size: 36px; font-weight: 900; color: #1e3a8a; letter-spacing: -1px;">$${dealData.price}</p>
                      </td>
                      <td style="padding-bottom: 0; text-align: right;">
                        <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 1px;">Airline</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${dealData.airline}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 1px;">The Strategy</p>
                    <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.6; font-weight: 500;">${dealData.explanation}</p>
                  </div>
                </div>
                
                <p style="margin: 0 0 32px 0; font-size: 15px; color: #475569; line-height: 1.6;">Most anomaly fares like this disappear within 12-24 hours. Because of the 24-hour cancellation rule, the smartest move is to book it now and check your PTO later.</p>
                
                <div style="text-align: center;">
                  <a href="https://www.google.com/travel/flights?q=Flights%20to%20${dealData.destination}%20from%20${dealData.originAirport}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 18px 36px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1.5px;">Search This Route</a>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">You received this because you are an early member of Texas Cheap Flights.</p>
              </div>
            </div>
          `
                });
                if (draft.data?.id) {
                    draftLink = `https://resend.com/broadcasts/${draft.data.id}`;
                }
                console.log(`   📝 Draft created in Resend`);
            }
        }

        if (discordWebhookUrl) {
            let message = "";

            if (dealData.originAirport === "SYSTEM") {
                message = `🛠️ **SYSTEM ALERT / ADMIN MESSAGE** 🛠️\n\n**Subject:** ${dealData.explanation}\n\n**Content Snippet:**\n\`\`\`${rawContent?.substring(0, 1500)}\`\`\``;
            } else if (dealData.originAirport === "SUPPORT") {
                message = `👤 **CUSTOMER SUPPORT INQUIRY** 👤\n\n**From:** (Check Resend/Email)\n**Subject:** ${dealData.explanation}\n\n**Message:**\n\`\`\`${rawContent?.substring(0, 1500)}\`\`\``;
            } else {
                message = `🚨 **NEW DEAL FOUND (Score: ${dealData.totalScore}/10)** 🚨\n\n**Route:** ${dealData.originAirport} ➔ ${dealData.destination}\n**Price:** $${dealData.price} on ${dealData.airline}\n**Analysis:** ${dealData.explanation}\n\n📝 **Draft Created:** [Review & Send in Resend](${draftLink})`;
            }

            await fetch(discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
            console.log("   ✅ Sent to Discord!");
        }
    } catch (err) {
        console.error("   ❌ Failed to trigger alerts:", err);
    }
}
