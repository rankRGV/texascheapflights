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
        console.log("   ❌ AI Failed to parse deal.");
        return { success: false, reason: 'AI Parse Failure' };
    }
}

async function triggerAlerts(dealData: ParsedDeal, rawContent?: string) {
    try {
        const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
        const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

        let draftLink = "https://resend.com/broadcasts";

        // Only create drafts for REAL deals (not system alerts)
        if (resendApiKey && dealData.originAirport !== "SYSTEM") {
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
            const message = dealData.originAirport === "SYSTEM"
                ? `🛠️ **SYSTEM ALERT / ADMIN MESSAGE** 🛠️\n\n**Subject:** ${dealData.explanation}\n\n**Content Snippet:**\n\`\`\`${rawContent?.substring(0, 1500)}\`\`\``
                : `🚨 **NEW DEAL FOUND (Score: ${dealData.totalScore}/10)** 🚨\n\n**Route:** ${dealData.originAirport} ➔ ${dealData.destination}\n**Price:** $${dealData.price} on ${dealData.airline}\n**Analysis:** ${dealData.explanation}\n\n📝 **Draft Created:** [Review & Send in Resend](${draftLink})`;

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
