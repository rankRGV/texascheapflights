import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const audienceId = import.meta.env.RESEND_AUDIENCE_ID || process.env.RESEND_AUDIENCE_ID || '';

    if (!apiKey) {
      console.error('RESEND_API_KEY is not set in environment variables');
      return new Response(JSON.stringify({ error: 'Server misconfiguration: Missing API Key.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const { email, airport } = body as { email: string; airport: string };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Allowlist validation - only accept known Texas airport codes
    const VALID_AIRPORTS = ['MFE', 'HRL', 'BRO', 'LRD', 'CRP', 'SAT', 'AUS', 'IAH', 'HOU', 'DFW', 'DAL', 'ELP', 'LBB', 'AMA', 'MAF', 'GRK', 'TYR', 'GGG', 'ABI'];
    if (!airport || !VALID_AIRPORTS.includes(airport.toUpperCase())) {
      return new Response(JSON.stringify({ error: 'Invalid airport code. Please select a Texas airport.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Attempting signup for: ${email} from ${airport}`);

    // 1. Sync to Supabase Subscribers Table FIRST to get/generate the magical_token
    let magicalToken = '';
    try {
      const { data: syncData, error: dbError } = await supabase.from('subscribers').upsert({
        email: email.toLowerCase(),
        home_airport: airport.toUpperCase(),
        active: true,
        source: 'waitlist'
      }, { onConflict: 'email' }).select('magical_token').single();

      if (dbError) throw dbError;
      magicalToken = syncData?.magical_token || '';
      console.log(`Contact synced to Supabase database. Token: ${magicalToken ? 'YES' : 'NO'}`);
    } catch (dbErr: any) {
      console.error('Supabase subscriber sync failed:', dbErr.message || dbErr);
    }

    // 2. Add/Update contact in Resend Audience with the token
    if (audienceId) {
      try {
        await resend.contacts.create({
          email: email,
          audienceId: audienceId,
          unsubscribed: false,
          properties: {
            magical_token: magicalToken,
            home_airport: airport.toUpperCase(),
            alert_scope: 'regional'
          }
        } as any);
        console.log(`Contact added to audience with token metadata`);
      } catch (contactErr: any) {
        // If they exist, update them instead
        try {
          await resend.contacts.update({
            email: email,
            audienceId: audienceId,
            properties: {
              magical_token: magicalToken,
              home_airport: airport.toUpperCase(),
              alert_scope: 'regional'
            }
          } as any);
          console.log(`Contact updated in audience with token metadata`);
        } catch (updateErr: any) {
          console.warn('Failed to sync contact metadata to Resend:', updateErr.message);
        }
      }
    }

    // 3. Send welcome email
    try {
      const { data, error } = await resend.emails.send({
        from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
        to: email,
        subject: "✈️ You're on the list, Texas traveler.",
        html: buildWelcomeEmail({ airport, token: magicalToken }),
      });

      if (error) {
        console.error('Resend email error:', error);
        throw new Error(error.message);
      }

      console.log('Welcome email sent successfully:', data?.id);
    } catch (emailErr: any) {
      console.error('Email sending failed:', emailErr);
      return new Response(JSON.stringify({
        error: 'Email delivery failed.',
        details: emailErr.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('CATCH: Subscribe error:', err);
    return new Response(JSON.stringify({
      error: 'Subscription failed.',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function buildWelcomeEmail({ airport, token }: { airport: string; token?: string }): string {
  const airportLabel: Record<string, string> = {
    MFE: 'McAllen–Miller International (MFE)',
    LRD: 'Laredo International (LRD)',
    HRL: 'Valley International (HRL)',
    BRO: 'South Padre Island International (BRO)',
    CRP: 'Corpus Christi International (CRP)',
    SAT: 'San Antonio International (SAT)',
    DFW: 'Dallas/Fort Worth International (DFW)',
    IAH: 'Houston George Bush Intercontinental (IAH)',
    AUS: 'Austin-Bergstrom International (AUS)',
  };

  const airportName = airportLabel[airport] ?? airport;
  const manageLink = `https://texascheapflights.com/manage-subscription?token=${token ?? ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Texas Cheap Flights</title>
</head>
<body style="margin:0;padding:0;background:#050a14;font-family:'Outfit', 'Helvetica Neue', Arial, sans-serif; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050a14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%; background:#0d1832; border-radius:32px; border:1px solid rgba(245,200,66,0.15); overflow:hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.5);">
          
          <!-- Header/Hero Section -->
          <tr>
            <td style="padding:48px 48px 32px; text-align:center; background: radial-gradient(circle at top right, rgba(245,200,66,0.1) 0%, transparent 70%);">
              <div style="margin-bottom: 24px;">
                <img src="https://texascheapflights.com/logo.png" alt="Texas Cheap Flights" style="height:40px; width:auto;" />
              </div>
              <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:#f5c842;">Founding Member Ops</p>
              <h1 style="margin:0;font-size:32px;font-weight:900;color:#ffffff;line-height:1.2; letter-spacing:-0.02em;">Welcome to the <br/><span style="color:#f5c842;">Scout Network.</span></h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:0 48px 48px;">
              <p style="margin:0 0 24px;color:#94a3b8;font-size:16px;line-height:1.7;">
                Most flight alerts are built for New York or LA. We're building something different: the first intelligence platform built <strong style="color:#ffffff;">specifically for Texas flyers.</strong>
              </p>

              <!-- Strategy Box -->
              <div style="background:rgba(245,200,66,0.05); border:1px solid rgba(245,200,66,0.2); border-radius:20px; padding:24px; margin-bottom:32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:16px;">
                      <p style="margin:0; font-size:12px; font-weight:800; color:#f5c842; text-transform:uppercase; tracking:0.2em;">Active Scout: ${airportName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:0 0 12px; font-size:14px; color:#ffffff; line-height:1.6;">We're now monitoring two specific types of anomalies for you:</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:4px 12px 12px 0; vertical-align:top;"><span style="color:#f5c842; font-weight:bold;">$</span></td>
                          <td style="padding-bottom:12px; font-size:14px; color:#cbd5e1;"><strong style="color:#ffffff;">Massive Cash Drops:</strong> Like $380 roundtrip to Europe or $290 to Cancun when the algorithm slips up.</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 12px 12px 0; vertical-align:top;"><span style="color:#f5c842; font-weight:bold;">pts</span></td>
                          <td style="padding-bottom:12px; font-size:14px; color:#cbd5e1;"><strong style="color:#ffffff;">Award Sweet Spots:</strong> Like 20k points to Japan or 15k to Mexico by using regional arbitrage.</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <h3 style="margin:0 0 16px; font-size:16px; font-weight:800; color:#ffffff; text-transform:uppercase; letter-spacing:0.05em;">Our Founding Principles</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="24" style="vertical-align:top; padding-top:4px;">
                    <div style="width:8px; height:8px; background:#f5c842; border-radius:50%;"></div>
                  </td>
                  <td style="padding-bottom:16px;">
                    <strong style="color:#ffffff; font-size:15px; display:block; margin-bottom:4px;">Zero Bot Spam</strong>
                    <p style="margin:0; color:#94a3b8; font-size:14px; line-height:1.5;">Every deal is hand-vetted by our analysts. If it's not a deal we'd book for our own families, we don't send it.</p>
                  </td>
                </tr>
                <tr>
                  <td width="24" style="vertical-align:top; padding-top:4px;">
                    <div style="width:8px; height:8px; background:#f5c842; border-radius:50%;"></div>
                  </td>
                  <td style="padding-bottom:16px;">
                    <strong style="color:#ffffff; font-size:15px; display:block; margin-bottom:4px;">Total Control</strong>
                    <p style="margin:0; color:#94a3b8; font-size:14px; line-height:1.5;">You control the volume. Mute specific airports or regions anytime with one click from your private dashboard.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${manageLink}" style="display:inline-block; background:linear-gradient(135deg, #f5c842 0%, #d4a843 100%); color:#050a14; padding:18px 40px; border-radius:15px; text-decoration:none; font-weight:900; font-size:14px; text-transform:uppercase; letter-spacing:0.1em; box-shadow: 0 10px 30px rgba(245,200,66,0.2);">Manage My Dashboard</a>
                <p style="margin:16px 0 0; font-size:12px; color:#475569;">No commitment. Unsubscribe or adjust settings anytime.</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px; background:rgba(0,0,0,0.2); text-align:center; border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 12px; color:#475569; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.2em;">Texas Cheap Flights · Operations</p>
              <p style="margin:0; color:#334155; font-size:11px; line-height:1.5;">
                You are receiving this because you joined the Founding Member list for ${airportName}.<br/>
                <a href="${manageLink}" style="color:#475569; text-decoration:underline;">Unsubscribe</a> · 
                <a href="https://texascheapflights.com/skeptics-guide" style="color:#475569; text-decoration:underline;">Skeptic's Guide</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
