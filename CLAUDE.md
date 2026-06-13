# Texas Cheap Flights — Agent Instructions

## Global Marketing Skills Path

**ALWAYS check `C:\Users\Eddie\.claude\skills\` FIRST for any marketing, copywriting, CRO, or UI/UX work.**

The following skills are available globally and should be loaded before doing any related work:

| Skill | Use When |
|-------|----------|
| `copywriting` | Writing or improving any page copy |
| `page-cro` | Optimizing pages for conversions |
| `marketing-psychology` | Applying behavioral psychology principles |
| `trust-psychology` | Building trust signals on conversion pages |
| `content-strategy` | Planning content structure and messaging |
| `copy-editing` | Polishing existing copy |
| `signup-flow-cro` | Optimizing subscription/waitlist forms |
| `email-sequence` | Writing email drip campaigns |
| `social-content` | Twitter/social media content |
| `ad-creative` | Ad copy and creatives |
| `launch-strategy` | Planning product launches |
| `ai-seo` | SEO-optimized content |
| `ui-ux-pro-max-skill` | Premium UI/UX upgrades |

**Path on this machine:** `C:\Users\Eddie\.claude\skills\`

## Project Overview

Texas Cheap Flights (`texascheapflights.com`) — An AI-powered deal alert system for Texas travelers. Monitors RSS feeds, Google Flights (SerpAPI), and email webhooks for error fares and award sweet spots departing from Texas airports. Features a "Regional Moat" strategy with 16 dedicated airport guides and a centralized intelligence hub.

## Tech Stack

- **Frontend**: Astro + Tailwind CSS (Satoshi/Outfit fonts), deployed on Vercel
- **Backend**: Supabase (PostgreSQL) for deal persistence + subscriber management
- **Email**: Resend (broadcasts + transactional)
- **AI**: Google Gemini (deal parsing and scoring)
- **Monitoring**: Google Flights via SerpAPI, RSS feeds
- **Scheduling**: n8n (external)

## Key Files

- `src/lib/engine.ts` — Core deal processing pipeline
- `src/lib/gemini.ts` — AI parsing
- `src/lib/supabase.ts` — DB client
- `src/pages/api/poll-rss.ts` — RSS ingestion
- `src/pages/api/scout.ts` — SerpAPI price monitoring
- `src/pages/api/ingest.ts` — Email webhook handler
- `src/pages/api/subscribe.ts` — Waitlist signup
- `src/pages/api/update-preferences.ts` — User preferences backend API
- `src/pages/manage-subscription.astro` — Token-gated User Preference Center
- `src/components/GlobalNav.astro` — Global navigation with Regional Hub dropdown
- `src/components/GlobalFooter.astro` — Standardized site-wide footer
- `src/pages/guides/index.astro` — Regional Intelligence Hub

## Design System

Dark "Aviation Tech Luxury" theme:
- Navy Deep: `#050a14`
- Texas Gold: `#d4a843`
- Aviation Blue: `#0ea5e9`
- Fonts: Satoshi (headings), Outfit (body)
- Components: `GlobalNav`, `GlobalFooter`, `AirportGuide`

## Agent Reminders

- Load relevant global marketing skills before any conversion/copy work
- All backend env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`, `SERP_API_KEY`
- Fatigue check window: 7 days (score < 9)
- Texas airport allowlist enforced on subscription endpoint
