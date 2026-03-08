import { Resend } from 'resend';
import { parseEmailToDeal, type ParsedDeal } from './gemini';
import { supabase } from './supabase';

interface RegionalCluster {
  [key: string]: string[];
}

const REGIONAL_CLUSTERS: RegionalCluster = {
  'RGV': ['MFE', 'HRL', 'BRO', 'CRP'],
  'CENTRAL': ['SAT', 'AUS', 'LRD', 'GRK', 'ABI'],
  'HOUSTON': ['IAH', 'HOU', 'CRP'],
  'DALLAS': ['DFW', 'DAL', 'TYR', 'GGG'],
  'WEST': ['ELP', 'MAF', 'LBB', 'AMA']
};

/**
 * Returns a list of airports that should be considered "nearby" for a given origin.
 * This powers the 'Regional' alert scope.
 */
function getClusterAirports(origin: string): string[] {
  const originUpper = origin.toUpperCase();
  const clusters = Object.values(REGIONAL_CLUSTERS).filter(c => c.includes(originUpper));
  // Flatten and unique
  const nearby = Array.from(new Set(clusters.flat()));
  return nearby.length > 0 ? nearby : [originUpper];
}

export async function processDeal(title: string, content: string, source: string) {
  console.log(`🤖 Processing deal from ${source}: ${title}`);

  // Only match against title — narrow word-boundary check to avoid false positives on real deals
  const isSystemEmail = /\b(confirm your|verify your|verification code|reset password|welcome to|sent by resend|webhook test)\b/i.test(title);
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
    }

    // --- SUPABASE GUARD: Blocklist ---
    const isBlocked = await checkBlocklist(dealData);
    if (isBlocked) {
      console.log(`   🚫 BLOCKLIST: Suppressing deal for ${dealData.airline} or ${dealData.destination}`);
      await logDealToDb(dealData, title, content, source, false, 'Blocked');
      return { success: false, reason: 'Blocklisted' };
    }

    // --- SUPABASE GUARD: Fatigue/Duplicate Check ---
    const isDupe = await checkFatigue(dealData);
    const isHighPriority = dealData.totalScore >= 9; // Always send unicorns even if dupes

    if (isDupe && !isHighPriority) {
      console.log(`   💤 FATIGUE: Already sent ${dealData.originAirport} ➔ ${dealData.destination} recently. Skipping.`);
      await logDealToDb(dealData, title, content, source, false, 'Fatigue/Duplicate');
      return { success: false, reason: 'Fatigue/Duplicate' };
    }

    console.log(`   ✅ TEXAS DEAL SPOTTED!`);
    console.log(`   ✈️ Route: ${dealData.originAirport} ➔ ${dealData.destination} ($${dealData.price} via ${dealData.airline})`);
    console.log(`   📈 Total Score: ${dealData.totalScore}/10 (${dealData.explanation})`);

    // Force the scout finds to succeed during test sweeps, or use normal scoring
    const isScoutTest = title.includes("[TEST]") && source === "Regional Scout";

    if (dealData.totalScore >= 7 || isScoutTest) {
      if (isScoutTest) console.log(`   🚀 Bypassing Score Threshold for Test Scout Deal`);
      else console.log(`   🎉 HIGH SCORE - SENDING ALERTS...`);

      // 1. Log to DB first to get the unique ID for internal linking
      const dealId = await logDealToDb(dealData, title, content, source, true, 'Prepared');

      // 2. Trigger alerts with the internal ID
      const sent = await triggerAlerts(dealData, content, dealId);

      // 3. Update sent status if needed (optional since we set wasSent=true in logDealToDb above, 
      // but if triggerAlerts fails entirely we might want to log that. 
      // For now, tracking "Prepared" is enough as we assume Resend handles delivery).

      return { success: sent, score: dealData.totalScore };
    } else {
      console.log(`   📉 SCORE TOO LOW - Skipping alerts.`);
      await logDealToDb(dealData, title, content, source, false, 'Low Score');
      return { success: false, reason: 'Score too low' };
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

async function checkBlocklist(deal: ParsedDeal): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('blocklist')
      .select('type, value')
      .eq('active', true);

    if (!data) return false;

    return data.some(b => {
      if (b.type === 'airline' && deal.airline.toLowerCase().includes(b.value.toLowerCase())) return true;
      if (b.type === 'destination' && deal.destination.toLowerCase().includes(b.value.toLowerCase())) return true;
      if (b.type === 'route' && `${deal.originAirport}-${deal.destination}`.toUpperCase() === b.value.toUpperCase()) return true;
      return false;
    });
  } catch (err) {
    console.warn("   ⚠️ Blocklist check failed:", err);
    return false;
  }
}

async function checkFatigue(deal: ParsedDeal): Promise<boolean> {
  try {
    const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('deals')
      .select('id')
      .eq('origin', deal.originAirport)
      .eq('destination', deal.destination)
      .not('sent_at', 'is', null)
      .gt('sent_at', SEVEN_DAYS_AGO)
      .limit(1);

    return !!(data && data.length > 0);
  } catch (err) {
    console.warn("   ⚠️ Fatigue check failed:", err);
    return false;
  }
}

async function logDealToDb(deal: ParsedDeal, title: string, content: string, source: string, wasSent: boolean, status: string): Promise<string> {
  try {
    // Extract dates if present in content
    const datesMatch = content.match(/Dates:\s*([^\n<]+)/i);
    const travelDates = datesMatch ? datesMatch[1].trim() : null;

    // Extract booking link if present
    const linkMatch = content.match(/Book Link:\s*(https?:\/\/[^\s<]+)/i);
    const bookingLink = linkMatch ? linkMatch[1] : `https://www.google.com/travel/flights?q=Flights+to+${encodeURIComponent(deal.destination)}+from+${encodeURIComponent(deal.originAirport)}`;

    const { data, error } = await supabase.from('deals').insert({
      origin: deal.originAirport,
      destination: deal.destination,
      price: deal.price || null,
      airline: deal.airline || null,
      score: deal.totalScore,
      source: source,
      raw_title: title,
      travel_dates: travelDates,
      booking_link: bookingLink,
      sent_at: wasSent ? new Date().toISOString() : null,
      deal_type: deal.totalScore >= 9 ? 'error_fare' : 'sale'
    }).select('id').single();

    if (error) throw error;
    console.log(`   💾 Deal persisted to Supabase (${status})`);
    return data?.id || '';
  } catch (err) {
    console.error("   ❌ Failed to log deal to Supabase:", err);
    return '';
  }
}

async function triggerAlerts(dealData: ParsedDeal, rawContent?: string, dealId?: string): Promise<boolean> {
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

      // 1-Click preference management link (Magical Token)
      // Since this is a BROADCAST, we use Resend's personalization tags.
      // We'll use the 'magical_token' we synced to contact metadata.
      const manageLink = `https://texascheapflights.com/manage-subscription?token={{contact.magical_token}}`;

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
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">You're receiving this as a founding member of Texas Cheap Flights.</p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: inline-block;">
                    <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                        <a href="${manageLink}" style="color: #0ea5e9; text-decoration: none;">Manage Preferences &nbsp;•&nbsp; One-Click Access</a>
                    </p>
                </div>
                <p style="margin: 16px 0 0 0; font-size: 10px; color: #cbd5e1;">We only alert you when we find something genuinely worth your attention in Texas.</p>
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
      let clusterCountInfo = "";

      // Calculate targeting count
      if (dealData.originAirport !== "SYSTEM" && dealData.originAirport !== "SUPPORT") {
        const cluster = getClusterAirports(dealData.originAirport);
        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)
          .or(`alert_scope.eq.statewide,and(alert_scope.eq.regional,home_airport.in.(${cluster.join(',')})),and(alert_scope.eq.local,home_airport.eq.${dealData.originAirport.toUpperCase()})`)
          .lte('max_price', dealData.price || 9999);

        clusterCountInfo = `\n👥 **Targeting:** ${count ?? 0} eligible subscribers in the ${dealData.originAirport} region.`;
      }

      if (dealData.originAirport === "SYSTEM") {
        message = `🛠️ **SYSTEM ALERT / ADMIN MESSAGE** 🛠️\n\n**Subject:** ${dealData.explanation}\n\n**Content Snippet:**\n\`\`\`${rawContent?.substring(0, 1500)}\`\`\``;
      } else if (dealData.originAirport === "SUPPORT") {
        message = `👤 **CUSTOMER SUPPORT INQUIRY** 👤\n\n**From:** (Check Resend/Email)\n**Subject:** ${dealData.explanation}\n\n**Message:**\n\`\`\`${rawContent?.substring(0, 1500)}\`\`\``;
      } else {
        const internalLink = dealId ? `\n🔗 **Site Details:** https://texascheapflights.com/deal/${dealId}` : "";
        message = `🚨 **NEW DEAL FOUND (Score: ${dealData.totalScore}/10)** 🚨\n\n**Route:** ${dealData.originAirport} ➔ ${dealData.destination}\n**Price:** $${dealData.price} on ${dealData.airline}\n${datesText ? `**Dates:** ${datesText}\n` : ''}**Analysis:** ${dealData.explanation}${clusterCountInfo}\n\n🔗 **Verify:** [Check Google Flights](${bookLink})${internalLink}\n📝 **Draft Created:** [Review & Send in Resend](${draftLink})`;
      }

      await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      });
      console.log("   ✅ Sent to Discord!");
    }
    return true;
  } catch (err) {
    console.error("   ❌ Failed to trigger alerts:", err);
    return false;
  }
}
