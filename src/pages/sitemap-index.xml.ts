import { supabase } from '../lib/supabase';

const TX_AIRPORT_CODES = [
    'MFE', 'HRL', 'BRO', 'LRD', 'CRP', 'SAT', 'AUS', 'IAH', 'HOU',
    'DFW', 'DAL', 'ELP', 'LBB', 'AMA', 'MAF', 'GRK', 'TYR', 'GGG', 'ABI'
];

export async function GET() {
    const siteUrl = 'https://texascheapflights.com';

    // Static pages
    const staticPages = [
        '',
        '/past-deals',
        '/skeptics-guide',
        '/privacy',
        '/terms',
    ];

    // Hub pages (one per TX airport)
    const hubPages = TX_AIRPORT_CODES.map(code => `/deals/from/${code.toLowerCase()}`);

    // Fetch deal IDs from Supabase
    const { data: deals } = await supabase
        .from('deals')
        .select('id, created_at')
        .not('sent_at', 'is', null);

    const dealPages = (deals ?? []).map(d => ({
        url: `/deal/${d.id}`,
        lastmod: d.created_at
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${siteUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  ${hubPages.map(page => `
  <url>
    <loc>${siteUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${dealPages.map(page => `
  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${new Date(page.lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
