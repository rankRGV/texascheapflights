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

      // Force the scout finds to succeed during test sweeps, or use normal scoring
      const isScoutTest = title.includes("[TEST]") && source === "Regional Scout";

      if (dealData.totalScore >= 7 || isScoutTest) {
        if (isScoutTest) console.log(`   🚀 Bypassing Score Threshold for Test Scout Deal`);
        else console.log(`   🎉 HIGH SCORE - SENDING ALERTS...`);

        await triggerAlerts(dealData, content);
        return { success: true, score: dealData.totalScore };
      } else {
        console.log(`   📉 SCORE TOO LOW - Skipping alerts.`);
        return { success: false, reason: 'Score too low' };
      }
    }
  } else {
    // 3. Fallback: Gemini couldn't parse a deal. Could be a human email OR unparseable RSS HTML.
    // Only route to Discord support if it came from a real inbound email, not a feed or scout.
    const isRSSSource = source?.startsWith('RSS:') || source === 'Regional Scout';
    if (isRSSSource) {
      console.log(`   🔇 Unparseable RSS/Scout item silently dropped. Source: ${source}`);
      return { success: false, reason: 'Unparseable feed item - dropped' };
    }
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

    let bookLink = `https://www.google.com/travel/flights?q=Flights+to+${encodeURIComponent(dealData.destination)}+from+${encodeURIComponent(dealData.originAirport)}`;
    let datesText = "";
    if (rawContent) {
      const linkMatch = rawContent.match(/Book Link:\s*(https?:\/\/[^\s<]+)/i);
      if (linkMatch && linkMatch[1]) {
        bookLink = linkMatch[1];
      }
      const datesMatch = rawContent.match(/Dates:\s*([^\n<]+)/i);
      if (datesMatch && datesMatch[1]) {
        datesText = datesMatch[1].trim();
      }
    }

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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b; overflow: hidden; border: 1px solid #e2e8f0;">

              <!-- Header -->
              <div style="background-color: #050a14; padding: 28px 24px; text-align: center; border-bottom: 3px solid #f59e0b;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px;">Texas <span style="color: #f59e0b;">Cheap Flights</span></h1>
              </div>

              <!-- Urgency Strip -->
              <div style="background-color: #fff7ed; border-bottom: 2px solid #fed7aa; padding: 11px 24px; text-align: center;">
                <p style="margin: 0; font-size: 13px; font-weight: 700; color: #c2410c;">⚡ Error fares vanish within 12–24 hours — usually before airlines catch them.</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 32px 32px 32px;">

                <!-- Tag -->
                <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2.5px;">🔥 Error Fare Detected</p>

                <!-- Route Headline -->
                <h2 style="margin: 0 0 6px 0; font-size: 38px; font-weight: 900; color: #0f172a; line-height: 1.05; letter-spacing: -0.5px;">${dealData.originAirport} → ${dealData.destination}</h2>
                <p style="margin: 0 0 32px 0; font-size: 14px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Departing from Texas ${datesText ? ` &nbsp;•&nbsp; <span style="color:#0ea5e9;">Travel Dates: ${datesText}</span>` : ''}</p>

                ${(() => {
              if (rawContent) {
                const typicalMatch = rawContent.match(/Typical:\s*\$?(\d+)\s*[-to]+\s*\$?(\d+)/i);
                const cheaperMatch = rawContent.match(/Cheaper:\s*\$?(\d+)/i);

                if (typicalMatch) {
                  const lowTyp = typicalMatch[1];
                  const highTyp = typicalMatch[2];
                  const cheaperText = cheaperMatch ? `$${cheaperMatch[1]} cheaper than usual` : `well below the typical range`;

                  return `
                                <!-- Price Insight Widget -->
                                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; border-radius: 6px; padding: 18px 24px; margin-bottom: 28px;">
                                    <p style="margin: 0 0 6px 0; font-size: 16px; color: #166534; font-weight: 600;">
                                        Prices are currently <span style="color: #15803d; font-weight: 800;">low</span> — ${cheaperText}
                                    </p>
                                    <p style="margin: 0; font-size: 13px; color: #166534; opacity: 0.9; line-height: 1.5;">
                                        The least expensive flights for similar trips usually cost between <strong>$${lowTyp}–$${highTyp}</strong>.
                                    </p>
                                </div>
                            `;
                }
              }
              return '';
            })()}

                <!-- Deal Card -->
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 24px; margin-bottom: 28px;">
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                      <td style="vertical-align: top;">
                        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1.5px;">Round-trip from</p>
                        <p style="margin: 0; font-size: 54px; font-weight: 900; color: #0f172a; letter-spacing: -2px; line-height: 1;">$${dealData.price}</p>
                      </td>
                      ${dealData.airline ? `<td style="vertical-align: top; text-align: right; padding-left: 16px;">
                        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1.5px;">Airline</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">${dealData.airline}</p>
                      </td>` : ''}
                    </tr>
                  </table>
                  <div style="border-top: 1px solid #fde68a; padding-top: 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1.5px;">Why this deal matters</p>
                    <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.65; font-weight: 500;">${dealData.explanation}</p>
                  </div>
                </div>

                <!-- Body Copy -->
                <p style="margin: 0 0 32px 0; font-size: 16px; color: #334155; line-height: 1.75;">This is your window. Error fares like this disappear fast — airlines fix them the moment someone notices. The <strong>24-hour cancellation rule</strong> is your safety net: book it right now and sort out the details later. PTO not approved yet? Book it anyway.</p>

                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 14px;">
                  <a href="${bookLink}" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-size: 15px; font-weight: 900; text-decoration: none; padding: 18px 44px; border-radius: 6px; text-transform: uppercase; letter-spacing: 2px;">Lock In This Price &rarr;</a>
                </div>

                <!-- Trust Line Under CTA -->
                <p style="margin: 0; text-align: center; font-size: 13px; color: #64748b; line-height: 1.5;">&#10003; Most airlines offer <strong>free cancellation within 24 hours</strong> of booking.</p>

              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8;">You're receiving this as an early member of Texas Cheap Flights.</p>
                <p style="margin: 0; font-size: 11px; color: #cbd5e1;">We only alert you when we find something genuinely worth your attention.</p>
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
        message = `🚨 **NEW DEAL FOUND (Score: ${dealData.totalScore}/10)** 🚨\n\n**Route:** ${dealData.originAirport} ➔ ${dealData.destination}\n**Price:** $${dealData.price} on ${dealData.airline}\n${datesText ? `**Dates:** ${datesText}\n` : ''}**Analysis:** ${dealData.explanation}\n\n🔗 **Verify:** [Check Google Flights](${bookLink})\n📝 **Draft Created:** [Review & Send in Resend](${draftLink})`;
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
