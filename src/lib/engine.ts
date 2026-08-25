import { Resend } from 'resend';
import { parseEmailToDeal, type ParsedDeal } from './gemini';
import { supabase } from './supabase';
import { normalizeAirlineName } from './airlines';
import { publishDealToSocial } from './social-publisher';
import { getTripLengthBucket, isMateriallyBetter, normalizeDealDestination, parseTravelDateRange } from './deal-quality';

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
    const isHighPriority = dealData.totalScore >= 9;
    const fatigueWindow = isHighPriority
      ? 48 * 60 * 60 * 1000        // 48h cooldown for auto-post unicorns
      : 7 * 24 * 60 * 60 * 1000;  // 7-day window for standard deals

    const travelDates = extractTravelDates(content);
    const fatigueReason = await checkFatigue(dealData, fatigueWindow, travelDates);

    if (fatigueReason) {
      const windowLabel = isHighPriority ? '48h' : '7d';
      console.log(`   💤 FATIGUE (${windowLabel}, ${fatigueReason}): Already sent a similar ${dealData.originAirport} ➔ ${dealData.destination} deal recently. Skipping.`);
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

      // We no longer auto-post high scores to social. All deals go to Discord for manual approval.
      const isAutoPost = false;

      // 1. Log to DB first to get the unique ID for internal linking
      const dealId = await logDealToDb(dealData, title, content, source, true, 'Prepared');

      // 2. Trigger alerts with the internal ID and auto-post flag
      // Note: we are NOT auto-sending emails anymore per user request.
      const sent = await triggerAlerts(dealData, content, dealId, isAutoPost);

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

function extractTravelDates(content?: string | null): string | null {
  if (!content) return null;

  const datesMatch = content.match(/Dates:\s*([^\n<]+)/i);
  const value = datesMatch?.[1]?.trim() || '';
  return value && !/^flexible(?:\s+to\s+flexible)?$/i.test(value) ? value : null;
}

async function checkFatigue(
  deal: ParsedDeal,
  windowMs: number = 7 * 24 * 60 * 60 * 1000,
  travelDates?: string | null,
): Promise<'route' | 'destination' | 'trip-profile' | false> {
  try {
    const windowStart = new Date(Date.now() - windowMs).toISOString();
    const incomingDates = parseTravelDateRange(travelDates);
    const incomingProfile = getTripLengthBucket(incomingDates.startDate, incomingDates.endDate);
    const incoming = {
      origin: deal.originAirport,
      destination: deal.destination,
      airline: normalizeAirlineName(deal.airline),
      price: deal.price,
      score: deal.totalScore,
      deal_type: deal.totalScore >= 9 ? 'error_fare' : 'sale',
      ...incomingDates,
    };

    const { data } = await supabase
      .from('deals')
      .select('id, origin, destination, airline, price, score, deal_type, travel_dates')
      .not('sent_at', 'is', null)
      .gt('sent_at', windowStart)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return false;

    const destinationKey = normalizeDealDestination(deal.destination);
    const sameDestinationDeals = data.filter((existingDeal) =>
      normalizeDealDestination(existingDeal.destination) === destinationKey,
    );
    const sameOriginProfileCount = data.filter((existingDeal) => {
      if (existingDeal.origin?.toUpperCase() !== deal.originAirport.toUpperCase() || incomingProfile === 'unknown') return false;
      const existingDates = parseTravelDateRange(existingDeal.travel_dates);
      return getTripLengthBucket(existingDates.startDate, existingDates.endDate) === incomingProfile;
    }).length;

    for (const existingDeal of data) {
      const existingDates = parseTravelDateRange(existingDeal.travel_dates);
      const existing = {
        origin: existingDeal.origin,
        destination: existingDeal.destination,
        airline: normalizeAirlineName(existingDeal.airline),
        price: Number(existingDeal.price) || Number.MAX_SAFE_INTEGER,
        score: typeof existingDeal.score === 'number' ? existingDeal.score : undefined,
        deal_type: existingDeal.deal_type,
        ...existingDates,
      };

      if (isMateriallyBetter(incoming, existing)) continue;

      const sameRoute = existing.origin?.toUpperCase() === deal.originAirport.toUpperCase()
        && normalizeDealDestination(existing.destination) === destinationKey;
      const sameProfile = existing.origin?.toUpperCase() === deal.originAirport.toUpperCase()
        && incomingProfile !== 'unknown'
        && getTripLengthBucket(existing.start_date, existing.end_date) === incomingProfile;

      // Level 1: do not repeat the same Texas origin and destination during
      // the cooldown window unless the new fare is clearly better.
      if (sameRoute) return 'route';

      // Level 2: cap ordinary repeats to the same destination across Texas
      // airports, while preserving materially better exceptions above.
      if (sameDestinationDeals.length >= 2) return 'destination';

      // Level 3: prevent one airport from receiving a stream of identical
      // trip-length profiles. Unknown dates are deliberately excluded.
      if (sameProfile && sameOriginProfileCount >= 3) return 'trip-profile';
    }

    return false;
  } catch (err) {
    console.warn("   ⚠️ Fatigue check failed:", err);
    return false;
  }
}

async function logDealToDb(deal: ParsedDeal, title: string, content: string, source: string, wasSent: boolean, status: string): Promise<string> {
  try {
    // Extract dates if present in content
    const travelDates = extractTravelDates(content);

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

async function triggerAlerts(dealData: ParsedDeal, rawContent?: string, dealId?: string, autoPost: boolean = false): Promise<boolean> {
  try {
    const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

    let draftLink = "https://resend.com/broadcasts";

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

    // 1. Social Automation (direct publisher when autoPost is enabled)
    // Rate-limit: only one auto-post per 30 minutes to avoid API throttling
    let isRateLimited = false;
    if (autoPost && dealId) {
      const THIRTY_MIN_AGO = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentPost } = await supabase
        .from('deals')
        .select('id')
        .eq('deal_type', 'error_fare')
        .not('sent_at', 'is', null)
        .gt('sent_at', THIRTY_MIN_AGO)
        .neq('id', dealId)
        .limit(1);
      if (recentPost && recentPost.length > 0) {
        console.log(`   ⏳ RATE LIMIT: Auto-post skipped — another deal posted within 30 min. Discord draft created.`);
        autoPost = false;
        isRateLimited = true;
      }
    }

    if (autoPost && dealId) {
      try {
        const { data: deal } = await supabase.from('deals').select('*').eq('id', dealId).single();
        if (deal) {
          await publishDealToSocial(deal);
          console.log(`   🚀 Direct social publisher completed for deal ${dealId}`);
        }
      } catch (err) {
        console.warn("   ⚠️ Direct social publisher failed:", err);
      }
    }

    // 2. Email Draft (Resend) - ALWAYS creates a draft now, no auto-send.
    if (resendApiKey && dealData.originAirport !== "SYSTEM" && dealData.originAirport !== "SUPPORT") {
      const resend = new Resend(resendApiKey);
      const audiences = await resend.audiences.list();
      const audienceId = audiences.data?.data?.[0]?.id;

      const manageLink = `https://texascheapflights.com/manage-subscription?token={{contact.magical_token}}`;

      if (audienceId) {
        const broadcastPayload = {
          audienceId,
          from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
          subject: `✈️ ALERT: ${dealData.originAirport} ➔ ${dealData.destination} for $${dealData.price}!`,
          name: `Deal: ${dealData.originAirport} to ${dealData.destination}`,
          send: false, // Ensure we only create drafts per user request
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
                const discountMatch = rawContent.match(/Estimated Discount:\s*(\d+)%/i);

                if (typicalMatch) {
                  const lowTyp = typicalMatch[1];
                  const highTyp = typicalMatch[2];
                  const cheaperText = discountMatch
                    ? `about ${discountMatch[1]}% below our scout benchmark`
                    : cheaperMatch
                      ? `$${cheaperMatch[1]} below our scout benchmark`
                      : `well below our scout benchmark`;

                  return `
                                <!-- Price Insight Widget -->
                                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; border-radius: 6px; padding: 18px 24px; margin-bottom: 28px;">
                                    <p style="margin: 0 0 6px 0; font-size: 16px; color: #166534; font-weight: 600;">
                                        Prices are currently <span style="color: #15803d; font-weight: 800;">low</span> — ${cheaperText}
                                    </p>
                                    <p style="margin: 0; font-size: 13px; color: #166534; opacity: 0.9; line-height: 1.5;">
                                        Our scout benchmark for comparable trips sits around <strong>$${lowTyp}–$${highTyp}</strong>.
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
                <p style="margin: 0 0 32px 0; font-size: 16px; color: #334155; line-height: 1.75;">This is your window. Error fares like this can disappear fast once airlines correct the price. Verify the fare, check cancellation terms, and book only if the trip makes sense for you.</p>

                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 14px;">
                  <a href="${bookLink}" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-size: 15px; font-weight: 900; text-decoration: none; padding: 18px 44px; border-radius: 6px; text-transform: uppercase; letter-spacing: 2px;">Lock In This Price &rarr;</a>
                </div>

                <!-- Trust Line Under CTA -->
                <p style="margin: 0; text-align: center; font-size: 13px; color: #64748b; line-height: 1.5;">&#10003; Many U.S. itineraries include a <strong>24-hour cancellation window</strong>, but always confirm the airline's rules before booking.</p>

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
        };

        const draft = await resend.broadcasts.create(broadcastPayload as any);
        if (draft.data?.id) {
          draftLink = `https://resend.com/broadcasts/${draft.data.id}`;
        }
        console.log(`   📝 Draft created in Resend`);
      }
    }

    // 3. Discord Sync
    if (discordWebhookUrl) {
      let message = "";
      let clusterCountInfo = "";

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
        const socialLink = dealId ? `\n📲 **Socials:** [Post to Socials](https://texascheapflights.com/api/admin/discord-social?dealId=${dealId}&token=${import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026'})` : "";
        
        const alertStatus = autoPost
          ? "🚀 **AUTO-POSTED TO SOCIALS**"
          : isRateLimited
            ? "⏳ **RATE LIMITED — Post manually in ~30 min** (another 9/10 was just auto-posted)"
            : "📝 **DRAFT CREATED (Review Required)**";
            
        message = `🚨 **NEW DEAL FOUND (Score: ${dealData.totalScore}/10)** 🚨\n\n**Status:** ${alertStatus}\n**Route:** ${dealData.originAirport} ➔ ${dealData.destination}\n**Price:** $${dealData.price} on ${dealData.airline}\n${datesText ? `**Dates:** ${datesText}\n` : ''}**Analysis:** ${dealData.explanation}${clusterCountInfo}\n\n🔗 **Verify:** [Check Google Flights](${bookLink})${internalLink}\n📝 **Review:** [Review in Resend](${draftLink})${socialLink}`;
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
