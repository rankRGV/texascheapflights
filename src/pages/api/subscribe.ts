import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Audience ID from Resend — we'll create this on first run or you can hardcode
// after creating one at resend.com/audiences
const AUDIENCE_ID = import.meta.env.RESEND_AUDIENCE_ID ?? '';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, airport } = body as { email: string; airport: string };

        if (!email || !airport) {
            return new Response(JSON.stringify({ error: 'Email and airport are required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 1. Add contact to Resend Audience with metadata
        if (AUDIENCE_ID) {
            await resend.contacts.create({
                email,
                audienceId: AUDIENCE_ID,
                unsubscribed: false,
                firstName: '',
                lastName: '',
            });
        }

        // 2. Send welcome email
        await resend.emails.send({
            from: 'Texas Cheap Flights <waitlist@texascheapflights.co>',
            to: email,
            subject: '✈️ You\'re on the list, Texas traveler.',
            html: buildWelcomeEmail({ email, airport }),
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Subscribe error:', err);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

function buildWelcomeEmail({ email, airport }: { email: string; airport: string }): string {
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

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Texas Cheap Flights</title>
</head>
<body style="margin:0;padding:0;background:#050a14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050a14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1832 0%,#050a14 100%);border:1px solid rgba(255,255,255,0.08);border-radius:32px 32px 0 0;padding:40px 48px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:#d4a843;">Texas Cheap Flights</p>
              <h1 style="margin:0;font-size:36px;font-weight:900;color:#ffffff;line-height:1.1;">You're on the list,<br/><span style="color:#d4a843;font-style:italic;">Texas traveler.</span></h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0d1832;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.08);padding:40px 48px;">

              <p style="margin:0 0 24px;color:#94a3b8;font-size:16px;line-height:1.7;">
                Hey! We're building the first points intelligence platform built <em>specifically for Texas regional flyers</em>. 
                Most travel hacking advice is written for people in New York. We're fixing that.
              </p>

              <!-- Airport callout -->
              <div style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-radius:16px;padding:20px 24px;margin:0 0 32px;">
                <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;">Your Home Airport</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${airportName}</p>
                <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">We'll track the best sweet spots departing from your area. If you ever change airports, just reply to this email.</p>
              </div>

              <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.7;font-weight:700;color:#f8fafc;">Here's what you get as a <span style="color:#d4a843;">Founding Member:</span></p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;">
                    <span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin:6px 12px 0 0;"></span>
                  </td>
                  <td style="padding:10px 0;color:#94a3b8;font-size:15px;line-height:1.6;">
                    <strong style="color:#f8fafc;">Monthly TX Points Digest</strong> — The top 3 sweet spots from Texas airports each month, hand-curated.
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;">
                    <span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin:6px 12px 0 0;"></span>
                  </td>
                  <td style="padding:10px 0;color:#94a3b8;font-size:15px;line-height:1.6;">
                    <strong style="color:#f8fafc;">Founding Member Access</strong> — Early access to the full platform before public launch.
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;">
                    <span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin:6px 12px 0 0;"></span>
                  </td>
                  <td style="padding:10px 0;color:#94a3b8;font-size:15px;line-height:1.6;">
                    <strong style="color:#f8fafc;">The Skeptic's Guide</strong> — Our full breakdown of the bank math behind travel hacking, written for Texas flyers.
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                In the meantime, bookmark our <a href="https://texascheapflights.co/skeptics-guide" style="color:#0ea5e9;text-decoration:none;font-weight:600;">Skeptic's Guide</a> — it's the best crash course on why Texas flyers have a unique advantage that nobody's talking about.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#050a14;border:1px solid rgba(255,255,255,0.05);border-radius:0 0 32px 32px;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px;color:#334155;font-size:11px;">© 2026 Texas Cheap Flights. No spam, ever.</p>
              <p style="margin:0;color:#334155;font-size:11px;">
                <a href="#" style="color:#475569;text-decoration:none;">Unsubscribe</a> · 
                <a href="https://texascheapflights.co/skeptics-guide" style="color:#475569;text-decoration:none;">Skeptic's Guide</a>
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
