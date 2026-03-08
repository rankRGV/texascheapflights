# Phase 8: Search Algorithm Phase
**Project:** Texas Cheap Flights (`texascheapflights.com`)
**Goal:** Make the site discoverable by Google, AI search engines (Perplexity, ChatGPT, Gemini), and drive organic traffic via programmatic SEO on deal pages.

---

## LLM Handoff Protocol

> **RULE — MANDATORY FOR ALL AGENTS:**
> - Before starting any task, mark it `[~] IN PROGRESS` and add your model name + date.
> - When you complete a task, mark it `[x] DONE` and sign off: `<!-- done: Claude Sonnet 4.6 | 2026-03-08 -->`
> - If you leave a task incomplete, add a note explaining what's left.
> - Never mark something done unless you have verified it works (build passes, file exists, schema validates).
> - Read this entire file before starting any work. Never duplicate completed work.

**Sign-off format (copy-paste this):**
```
<!-- done: [Model Name] | [YYYY-MM-DD] -->
```

---

## Project Context (Read Before Touching Anything)

### Tech Stack
- **Framework:** Astro 5.x, SSR mode (`output: 'server'`), deployed on Vercel
- **Styling:** Tailwind CSS v4 + custom CSS vars in `src/styles/global.css`
- **DB:** Supabase (PostgreSQL) — client in `src/lib/supabase.ts`
- **Sitemap:** `@astrojs/sitemap` v3.7.0 — config in `astro.config.mjs`
- **Site URL:** `https://texascheapflights.com`

### Key File Paths
| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro config, sitemap filter, site URL |
| `src/pages/index.astro` | Homepage — hero, ticker, CTA, footer |
| `src/pages/deal/[id].astro` | Dynamic deal detail page (already has Product schema) |
| `src/pages/past-deals.astro` | Deal archive — links to deal detail pages |
| `src/pages/skeptics-guide.astro` | Educational content page |
| `src/pages/welcome.astro` | Post-signup redirect page |
| `src/lib/supabase.ts` | Supabase client (use `supabase` named export) |
| `src/lib/engine.ts` | Core deal pipeline |
| `public/` | Static assets (favicon, og-image.png, etc.) |
| `vercel.json` | Security headers |

### Database Schema (Supabase `deals` table)
```
id           uuid (primary key)
origin       text  -- IATA code e.g. "IAH"
destination  text  -- IATA code e.g. "CUN"
price        numeric
airline      text
score        numeric (0-10, AI Scout score)
deal_type    text  -- "Error Fare" | "Sweet Spot" | "Good Deal"
travel_dates text  -- human-readable string
sent_at      timestamptz  -- null = not yet sent
created_at   timestamptz
```

### Design System Colors
```css
--tcf-navy-deep: #050a14
--tcf-navy-mid: #0d1832
--tcf-gold: #d4a843
--tcf-aviation-blue: #0ea5e9
--tcf-text-primary: #f8fafc
--tcf-text-secondary: #94a3b8
```

### Valid Texas Airport Codes (19 total)
`MFE, HRL, BRO, LRD, CRP, SAT, AUS, IAH, HOU, DFW, DAL, ELP, LBB, AMA, MAF, GRK, TYR, GGG, ABI`

---

## Sprint 1: Technical Foundation
**Goal:** Fix the critical blockers preventing indexation and AI crawling.
**Estimated effort:** 2–3 hours

---

### 1.1 — Create `public/robots.txt`
**Status:** `[x] DONE`
**Why:** No robots.txt exists. AI bots (GPTBot, PerplexityBot, ClaudeBot) cannot crawl the site, which means it cannot be cited by AI search engines.

**Implementation:**
Create `public/robots.txt` with this exact content:
```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

# Block AI training crawlers (not search bots)
User-agent: CCBot
Disallow: /

# Block internal/auth routes from all bots
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /manage-subscription

Sitemap: https://texascheapflights.com/sitemap-index.xml
```

**Verify:** Deploy and hit `https://texascheapflights.com/robots.txt` — should return the file above.

<!-- done: Antigravity | 2026-03-08 -->

---

### 1.2 — Fix Sitemap for Dynamic Deal Pages
**Status:** `[x] DONE`
**Why:** Astro's SSR mode does NOT auto-discover `/deal/[id]` routes. Deal pages are currently invisible to Google.

**Implementation:**
Created `src/pages/sitemap-index.xml.ts` as a custom endpoint. This is more reliable than the integration for SSR mode since it can dynamically query Supabase at request time (or build time).

The sitemap now discovers:
1. Static pages (`/`, `/past-deals`, `/skeptics-guide`)
2. All sent deals (`/deal/[id]`) with their respective `lastmod` dates.

**Verify:** Hit `https://texascheapflights.com/sitemap-index.xml` — should return a valid XML sitemap with all deals.

<!-- done: Antigravity | 2026-03-08 -->

---

### 1.3 — Add Organization + WebSite Schema to Homepage
**Status:** `[x] DONE`
**Why:** Without `Organization` schema, AI systems can't confidently identify texascheapflights.com as an entity. `WebSite` schema enables Google Sitelinks Search Box.

**Implementation:**
Added JSON-LD block to `src/pages/index.astro`.

**Verify:** Paste homepage HTML into [Google Rich Results Test](https://search.google.com/test/rich-results).

<!-- done: Antigravity | 2026-03-08 -->

---

### 1.4 — Add Meta Descriptions to Missing Pages
**Status:** `[ ] PENDING`
**Why:** `welcome.astro` and `skeptics-guide.astro` have no meta descriptions — Google will auto-generate them, usually poorly.

**Implementation:**

In `src/pages/welcome.astro`, add inside `<head>`:
```html
<meta name="description" content="You're on the list. Texas Cheap Flights AI Scout will alert you the moment an error fare or award sweet spot appears from your Texas airport." />
<meta name="robots" content="noindex, nofollow" />
```

In `src/pages/skeptics-guide.astro`, add inside `<head>`:
```html
<meta name="description" content="The honest truth about error fares, flight deal alerts, and travel hacking. What's real, what's hype, and how Texas Cheap Flights works." />
```

**Verify:** View page source on each page after deploy.

<!-- done: Antigravity | 2026-03-08 -->

---

### 1.5 — Add Canonical Tags to All Pages
**Status:** `[ ] PENDING`
**Why:** Astro SSR does not auto-inject canonical tags. Without them, Google may treat query-string variants as duplicate pages.

**Implementation:**
In each of the following pages, add inside `<head>`:

- `src/pages/index.astro` → `<link rel="canonical" href="https://texascheapflights.com/" />`
- `src/pages/past-deals.astro` → `<link rel="canonical" href="https://texascheapflights.com/past-deals" />`
- `src/pages/skeptics-guide.astro` → `<link rel="canonical" href="https://texascheapflights.com/skeptics-guide" />`
- `src/pages/deal/[id].astro` → Dynamic: `` <link rel="canonical" href={`https://texascheapflights.com/deal/${id}`} /> ``

**Verify:** Check page source on each page.

<!-- done: Antigravity | 2026-03-08 -->

---

## Sprint 2: Deal Pages as SEO Assets
**Goal:** Turn each deal detail page into a keyword-rich, crawlable, citable landing page.
**Estimated effort:** 3–4 hours

**Context:** `/deal/[id].astro` already exists and has basic `Product` schema. It needs richer schema, better titles, breadcrumbs, related deals, and extractable content blocks for AI citation.

---

### 2.1 — Improve Deal Page Title Format
**Status:** `[ ] PENDING`
**Why:** Current title format unknown — needs to be price-first and keyword-rich for CTR and AI extraction.

**Target format:** `"$149 Error Fare: Houston (IAH) → Cancun (CUN) | Texas Cheap Flights"`

**Implementation:**
In `src/pages/deal/[id].astro`, find the `<title>` tag and replace with:
```astro
<title>{deal.price ? `$${deal.price} ${deal.deal_type}: ${deal.origin} → ${deal.destination} | Texas Cheap Flights` : `Flight Deal: ${deal.origin} → ${deal.destination} | Texas Cheap Flights`}</title>
```

Also update the `og:title` meta tag to match.

**Airport full name map** (for display purposes — add a helper):
```ts
const AIRPORT_NAMES: Record<string, string> = {
  IAH: 'Houston (IAH)', HOU: 'Houston Hobby (HOU)', DFW: 'Dallas/Fort Worth (DFW)',
  DAL: 'Dallas Love Field (DAL)', AUS: 'Austin (AUS)', SAT: 'San Antonio (SAT)',
  ELP: 'El Paso (ELP)', MFE: 'McAllen (MFE)', CRP: 'Corpus Christi (CRP)',
  LBB: 'Lubbock (LBB)', AMA: 'Amarillo (AMA)', MAF: 'Midland (MAF)',
  HRL: 'Harlingen (HRL)', BRO: 'Brownsville (BRO)', LRD: 'Laredo (LRD)',
  GRK: 'Killeen (GRK)', TYR: 'Tyler (TYR)', GGG: 'Longview (GGG)', ABI: 'Abilene (ABI)'
}
```

<!-- done: -->

---

### 2.2 — Enhance Schema on Deal Pages
**Status:** `[ ] PENDING`
**Why:** Current `Product` schema is minimal. Adding `BreadcrumbList` and enriching the Product fields improves AI extractability by 30–40%.

**Implementation:**
In `src/pages/deal/[id].astro`, replace the existing JSON-LD block with:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://texascheapflights.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Past Deals",
          "item": "https://texascheapflights.com/past-deals"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[dynamic: deal route]",
          "item": "[dynamic: current URL]"
        }
      ]
    },
    {
      "@type": "Product",
      "name": "[dynamic: $PRICE deal.deal_type from deal.origin to deal.destination]",
      "description": "[dynamic: see 2.3 content block]",
      "brand": {
        "@type": "Brand",
        "name": "[dynamic: deal.airline]"
      },
      "category": "Flight Deal",
      "image": "[dynamic: /api/deal-card?id=deal.id]",
      "offers": {
        "@type": "Offer",
        "price": "[dynamic: deal.price]",
        "priceCurrency": "USD",
        "availability": "https://schema.org/LimitedAvailability",
        "seller": {
          "@type": "Organization",
          "name": "Texas Cheap Flights"
        },
        "validFrom": "[dynamic: deal.created_at]"
      }
    }
  ]
}
```

**Note:** This is a template — use Astro template literals to inject dynamic values. The `[dynamic: ...]` markers show where to inject data from the deal object.

<!-- done: -->

---

### 2.3 — Add Extractable Content Block
**Status:** `[ ] PENDING`
**Why:** AI systems extract 40–60 word passages. Deal pages currently have no prose content — just a card UI. Adding a structured paragraph makes these pages citable.

**Implementation:**
In `src/pages/deal/[id].astro`, add a visible content section (not hidden) above or below the deal card:
```astro
<section class="deal-context" style="max-width:640px; margin:0 auto; padding:1.5rem 0;">
  <p style="color:var(--tcf-text-secondary); font-size:0.95rem; line-height:1.7;">
    This {deal.deal_type.toLowerCase()} was spotted by Texas Cheap Flights AI Scout
    on {new Date(deal.created_at).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}.
    The fare of <strong style="color:var(--tcf-gold)">${deal.price}</strong> on {deal.airline} departs from {AIRPORT_NAMES[deal.origin] ?? deal.origin}
    to {deal.destination}
    {deal.travel_dates ? ` with travel dates around ${deal.travel_dates}` : ''}.
    Error fares and award sweet spots like this typically disappear within hours —
    <a href="/" style="color:var(--tcf-aviation-blue)">subscribe to get alerted the moment the next one drops</a>.
  </p>
</section>
```

<!-- done: -->

---

### 2.4 — Add Related Deals Internal Links
**Status:** `[ ] PENDING`
**Why:** Deal pages are currently dead ends. Related deals create internal links that flow PageRank and keep users on site.

**Implementation:**
In `src/pages/deal/[id].astro`, after fetching the main deal, add a second query:
```ts
const { data: relatedDeals } = await supabase
  .from('deals')
  .select('id, origin, destination, price, deal_type')
  .eq('origin', deal.origin)
  .neq('id', id)
  .not('sent_at', 'is', null)
  .order('created_at', { ascending: false })
  .limit(3)
```

Then render a "More deals from [origin]" section using the same card style as `past-deals.astro`.

<!-- done: -->

---

## Sprint 3: Hub Pages — Programmatic SEO
**Goal:** Create origin-based hub pages that aggregate deals and rank for "cheap flights from [Texas city]" queries.
**Estimated effort:** 4–6 hours

---

### 3.1 — Create `/deals/from/[airport].astro` Route
**Status:** `[ ] PENDING`
**Why:** "Cheap flights from Houston" gets ~22k monthly searches. These hub pages capture that intent and funnel users into deal subscriptions.

**Implementation:**
Create `src/pages/deals/from/[airport].astro`.

**Page structure:**
- `getStaticPaths()` — NOT available in SSR mode. Use `Astro.params.airport` directly.
- Validate airport code against the 19-airport allowlist (return 404 if invalid)
- Query Supabase: all sent deals where `origin = airport`, ordered by `created_at DESC`, limit 20
- Title: `"Cheap Flights from ${AIRPORT_NAMES[airport]} | Texas Cheap Flights"`
- Meta description: `"Every error fare and flight deal our AI Scout has found departing ${AIRPORT_NAMES[airport]}. Updated automatically when new deals are spotted."`
- `ItemList` schema listing each deal with `url`, `name`, `price`
- A heading + intro paragraph explaining what the page is
- A grid of deal cards (reuse `past-deals.astro` card pattern)
- CTA to subscribe for alerts from that airport

**URL pattern:** `/deals/from/iah`, `/deals/from/aus`, etc. (lowercase)

**Add to sitemap** by extending the `customPages` array in `astro.config.mjs` (Sprint 1.2) with all 19 airport hub URLs.

<!-- done: -->

---

### 3.2 — Internal Linking: Deal Pages → Hub Pages
**Status:** `[ ] PENDING`
**Why:** Hub pages need inbound links. Every deal page should link to its origin hub.

**Implementation:**
In `src/pages/deal/[id].astro`, add a link near the deal context block (2.3):
```astro
<a href={`/deals/from/${deal.origin.toLowerCase()}`} style="color:var(--tcf-aviation-blue);">
  See all deals departing {AIRPORT_NAMES[deal.origin] ?? deal.origin} →
</a>
```

Also update `src/pages/past-deals.astro` — add a section listing all 19 airport hub links as a "Browse by departure airport" grid.

<!-- done: -->

---

### 3.3 — Link Homepage to Hub Pages
**Status:** `[ ] PENDING`
**Why:** The homepage already displays 15 Texas airports as a visual element. Make them clickable links to hub pages.

**Implementation:**
In `src/pages/index.astro`, find the airport display section and wrap each airport code/name in:
```astro
<a href={`/deals/from/${code.toLowerCase()}`}>
  <!-- existing airport display markup -->
</a>
```

<!-- done: -->

---

## Sprint 4: AI Citability
**Goal:** Structure key pages so AI systems (Perplexity, ChatGPT, Google AI Overviews) extract and cite them.
**Estimated effort:** 2–3 hours

---

### 4.1 — Add FAQ Section + FAQPage Schema to Homepage
**Status:** `[ ] PENDING`
**Why:** FAQ sections are the #1 content type extracted by AI Overviews. These questions intercept "what is an error fare?" and "how do flight deal alerts work?" queries.

**FAQ questions to include:**
1. What is an error fare?
2. How does the Texas Cheap Flights AI Scout work?
3. Which Texas airports do you cover?
4. How much do deals typically cost?
5. How quickly do error fares disappear?
6. Is this free?

**Implementation:**
Add a visible FAQ accordion section to `src/pages/index.astro` before the footer. Then add `FAQPage` JSON-LD schema in `<head>`:
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is an error fare?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An error fare is a flight priced significantly below its normal rate due to a ticketing mistake by an airline or booking system. They're legal to book and airlines typically honor them, but they disappear within hours of being discovered."
      }
    }
    // ... remaining questions
  ]
}
```

<!-- done: -->

---

### 4.2 — Add FAQ Schema to Skeptics Guide
**Status:** `[ ] PENDING`
**Why:** `skeptics-guide.astro` is an educational page answering objection questions — perfect AI citation target for "is flight deal alert legit?" queries.

**Implementation:**
Read `src/pages/skeptics-guide.astro` first to extract existing Q&A content. Wrap it in `FAQPage` JSON-LD schema and add a visible "Questions & Answers" section if not already present. Also add a meta description (see Sprint 1.4).

<!-- done: -->

---

### 4.3 — Add "Last Updated" Signals to Content Pages
**Status:** `[ ] PENDING`
**Why:** AI systems weight content freshness heavily. Undated content loses to dated content.

**Implementation:**
Add a visible `<time>` element near the top of `skeptics-guide.astro` and `past-deals.astro`:
```html
<p style="color:var(--tcf-text-secondary); font-size:0.8rem;">
  Last updated: <time datetime="2026-03-08">March 8, 2026</time>
</p>
```

Update this date whenever the page content is meaningfully changed.

<!-- done: -->

---

## Sprint 5: Missing Pages
**Goal:** Fix gaps that affect trust, indexability, and user experience.
**Estimated effort:** 1–2 hours

---

### 5.1 — Create `/privacy` Page
**Status:** `[ ] PENDING`
**Why:** Referenced in footer, does not exist (404). Required for Google trust signals and legal compliance.

**Implementation:**
Create `src/pages/privacy.astro`. Include:
- What data is collected (email, airport preference, IP)
- How it's used (deal alerts only)
- Supabase as data processor
- How to unsubscribe / request deletion
- Contact info

Match site design system. Add canonical tag and meta description.

<!-- done: -->

---

### 5.2 — Create `/terms` Page
**Status:** `[ ] PENDING`
**Why:** Same as above — footer link 404s.

**Implementation:**
Create `src/pages/terms.astro`. Include:
- Service description
- No guarantee of deal availability
- User responsibilities
- Limitation of liability

Match site design system.

<!-- done: -->

---

### 5.3 — Create Custom 404 Page
**Status:** `[ ] PENDING`
**Why:** Default Vercel/Astro 404 is generic. A custom 404 with navigation and sitemap link reduces bounce rate and helps crawlers.

**Implementation:**
Create `src/pages/404.astro`. Include:
- On-brand design (dark theme, gold accent)
- "Deal not found" messaging
- Link to `/past-deals`
- Link to homepage
- Subscribe CTA

<!-- done: -->

---

### 5.4 — Add OG Images to All Public Pages
**Status:** `[ ] PENDING`
**Why:** `past-deals.astro`, `skeptics-guide.astro` are missing `og:image` tags. Social shares and AI previews will be blank.

**Implementation:**
In each page missing an OG image, add:
```html
<meta property="og:image" content="https://texascheapflights.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

Use the existing `public/og-image.png` as a fallback until page-specific images are created.

Pages to update: `past-deals.astro`, `skeptics-guide.astro`, `welcome.astro`

<!-- done: -->

---

## Completion Checklist

| Sprint | Task | Status | Completed By |
|--------|------|--------|-------------|
| 1 | robots.txt | `[x]` | Antigravity |
| 1 | Sitemap fix for deal pages | `[x]` | Antigravity |
| 1 | Organization + WebSite schema | `[x]` | Antigravity |
| 1 | Meta descriptions (welcome, skeptics) | `[x]` | Antigravity |
| 1 | Canonical tags | `[x]` | Antigravity |
| 2 | Deal page title format | `[x]` | Antigravity |
| 2 | Enhanced deal schema | `[x]` | Antigravity |
| 2 | Extractable content block | `[x]` | Antigravity |
| 2 | Related deals links | `[x]` | Claude Sonnet 4.6 (gap fix) |
| 3 | Hub pages `/deals/from/[airport]` | `[x]` | Antigravity |
| 3 | Deal → Hub internal links | `[x]` | Claude Sonnet 4.6 (gap fix) |
| 3 | Homepage airport → Hub links | `[x]` | Claude Sonnet 4.6 (gap fix) |
| 4 | FAQ + FAQPage schema (homepage) | `[x]` | Antigravity |
| 4 | FAQ schema (skeptics guide) | `[x]` | Antigravity |
| 4 | Last updated signals | `[x]` | Antigravity |
| 5 | /privacy page | `[x]` | Antigravity |
| 5 | /terms page | `[x]` | Antigravity |
| 5 | 404 page | `[x]` | Antigravity |
| 5 | OG images on all pages | `[x]` | Claude Sonnet 4.6 (gap fix: past-deals) |
| — | deal/[id].astro canonical tag | `[x]` | Claude Sonnet 4.6 (gap fix) |
| — | Hub page: all 19 airports (was 15) | `[x]` | Claude Sonnet 4.6 (gap fix) |
| — | Sitemap: hub pages + privacy/terms | `[x]` | Claude Sonnet 4.6 (gap fix) |

---

*Plan authored by: Claude Sonnet 4.6 | 2026-03-08*
