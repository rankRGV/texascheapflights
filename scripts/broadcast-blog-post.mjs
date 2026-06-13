import { Resend } from 'resend';
import { postsBySlug } from '../src/data/blog.ts';

const dryRun = process.argv.includes('--dry-run');
const [slug, subjectOverride] = process.argv.slice(2).filter((arg) => arg !== '--dry-run');

if (!slug) {
  console.error('Usage: node --experimental-strip-types --env-file=.env scripts/broadcast-blog-post.mjs <slug> ["Custom subject line"] [--dry-run]');
  process.exit(1);
}

const post = postsBySlug.get(slug);
if (!post) {
  console.error(`No blog post found with slug "${slug}"`);
  process.exit(1);
}

const postUrl = `https://texascheapflights.com/blog/${post.slug}`;
const heroImage = post.heroImage?.src ? `https://texascheapflights.com${post.heroImage.src}` : null;
const manageLink = 'https://texascheapflights.com/manage-subscription?token={{contact.magical_token}}';
const subject = subjectOverride || post.metaTitle || post.title;
const previewText = post.description.length > 140 ? `${post.description.slice(0, 137)}...` : post.description;
const tldrItems = (post.tldr || []).slice(0, 3);

const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b; overflow: hidden; border: 1px solid #e2e8f0;">

    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

    <!-- Header -->
    <div style="background-color: #050a14; padding: 28px 24px; text-align: center; border-bottom: 3px solid #d4a843;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px;">Texas <span style="color: #d4a843;">Cheap Flights</span></h1>
    </div>

    <!-- Tag strip -->
    <div style="background-color: #fff7ed; border-bottom: 2px solid #fde68a; padding: 11px 24px; text-align: center;">
      <p style="margin: 0; font-size: 13px; font-weight: 700; color: #92400e;">New on the blog: ${post.heroLabel}</p>
    </div>

    ${heroImage ? `<img src="${heroImage}" alt="${post.heroImage.alt}" style="display:block; width:100%; height:auto;" />` : ''}

    <!-- Main content -->
    <div style="padding: 32px 32px 28px 32px;">
      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 800; color: #d4a843; text-transform: uppercase; letter-spacing: 2.5px;">${post.category}</p>

      <h2 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1.25; letter-spacing: -0.5px;">${post.title}</h2>

      <p style="margin: 0 0 24px 0; font-size: 16px; color: #334155; line-height: 1.75;">${post.description}</p>

      ${tldrItems.length ? `
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d4a843; border-radius: 6px; padding: 20px 24px; margin-bottom: 28px;">
        <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1.5px;">Quick takeaways</p>
        <ul style="margin: 0; padding-left: 20px; color: #1e293b; font-size: 14px; line-height: 1.7;">
          ${tldrItems.map((item) => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ul>
      </div>` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 4px;">
        <a href="${postUrl}" style="display: inline-block; background-color: #d4a843; color: #0f172a; font-size: 15px; font-weight: 900; text-decoration: none; padding: 18px 44px; border-radius: 6px; text-transform: uppercase; letter-spacing: 2px;">Read the Full Post &rarr;</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">You're receiving this as a founding member of Texas Cheap Flights.</p>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: inline-block;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
          <a href="${manageLink}" style="color: #0ea5e9; text-decoration: none;">Manage Preferences &nbsp;&bull;&nbsp; One-Click Access</a>
        </p>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 10px; color: #cbd5e1;">We only alert you when we find something genuinely worth your attention in Texas.</p>
    </div>

  </div>
`;

if (dryRun) {
  console.log(`Subject: ${subject}`);
  console.log(`Preview: ${previewText}`);
  console.log(`Post URL: ${postUrl}`);
  console.log(`Hero image: ${heroImage || '(none)'}`);
  console.log(`TLDR items used: ${tldrItems.length}`);
  console.log('\n--- HTML ---\n');
  console.log(html);
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const audiences = await resend.audiences.list();
const audienceId = audiences.data?.data?.[0]?.id;

if (!audienceId) {
  console.error('No Resend audience found.');
  process.exit(1);
}

const draft = await resend.broadcasts.create({
  audienceId,
  from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
  subject,
  name: `Blog: ${post.title}`,
  send: false,
  html,
});

if (draft.error) {
  console.error('Failed to create draft:', draft.error);
  process.exit(1);
}

console.log(`Draft created: https://resend.com/broadcasts/${draft.data.id}`);
console.log(`Subject was: "${subject}"`);
console.log('Tip: pass a custom subject as the 2nd argument for a punchier hook, e.g.');
console.log(`  node --experimental-strip-types --env-file=.env scripts/broadcast-blog-post.mjs ${slug} "Your custom subject here"`);
