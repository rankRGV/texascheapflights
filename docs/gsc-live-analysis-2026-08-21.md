# Texas Cheap Flights live GSC analysis

Captured: 2026-08-21

Source: RankRGV/scripts/search-console-report.mjs, using the
sc-domain:texascheapflights.com property and the existing service-account
credential. Google Search Console data has an approximately two-to-three-day
reporting delay; these reports end on 2026-08-18.

## Performance baseline

| Window | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| 28 days | 4 | 12,315 | 0.03% | 33.70 |
| 90 days | 22 | 45,621 | 0.05% | 27.32 |
| Approx. 16 months | 41 | 70,333 | 0.06% | 30.28 |

The site is earning meaningful impressions but very few clicks. The immediate
growth lever is moving pages from positions 20–40 into the top 10–20 and
improving titles and snippets on pages already being shown.

## Priority pages

### DFW: highest-volume page

- 90 days: 8,567 impressions, 3 clicks, position 25.80
- 16 months: 13,861 impressions, 10 clicks, position 28.22
- It lost 4 clicks versus the previous 90-day comparison period.

Action: make DFW the first landing-page experiment. Tighten the title and
opening copy around “cheap flights from DFW,” show current verified deals,
explain DFW versus DAL, and add stronger internal links from the homepage,
guides, and blog.

### SAT: closest to a major ranking breakthrough

- 90 days: 7,166 impressions, 3 clicks, position 20.43
- 16 months: 9,558 impressions, 5 clicks, position 24.74
- Query: “cheap flights from san antonio” produced 378 impressions at
  position 34.11 in the last 90 days.

Action: prioritize SAT title/H1 alignment, FAQ coverage, recent deal proof, and
the signup CTA. This page is closest to the top 20 and should be measured
weekly after deployment.

### HOU, AUS, BRO, and ABI: next expansion group

| Page | 90-day impressions | Clicks | Position |
| --- | ---: | ---: | ---: |
| HOU | 4,901 | 2 | 28.54 |
| AUS | 3,440 | 1 | 30.19 |
| BRO | 2,440 | 1 | 25.72 |
| ABI | 2,152 | 1 | 22.99 |

These pages already have enough search demand to justify page-specific
improvements rather than generic template changes.

### DAL: urgent content and intent review

- 28 days: 932 impressions, 0 clicks, position 39.44
- 90 days: 2,244 impressions, 0 clicks, position 45.01
- 16 months: 3,801 impressions, 1 click, position 49.04

Action: separate DAL clearly from DFW. Add Dallas Love Field-specific route
and airline information, a DFW comparison, and a distinct title/meta package.

## Query opportunities

- “cheap flights from san antonio”: 378 impressions, position 34.11 in 90
  days; 714 impressions, position 37.72 across 16 months.
- “cheap flights from austin”: 350 impressions, position 40.05 across 16
  months.
- “cheap flights from dfw”: 332 impressions, position 35.68 across 16
  months.
- “cheap flights dfw”: 92 impressions, position 40.12 across 16 months.
- “flights to brownsville”: 51 impressions in 90 days and 70 across 16
  months, both around position 42–44.
- “cheap flights to killeen tx”: position 21.80 in 90 days.
- “southwest $49 flights from houston”: position 12.62 in 90 days.

The query set supports airport-origin landing pages, regional-airport
comparisons, and deal-specific pages. It does not support publishing a large
set of generic destination articles yet.

## Short-term work order

1. Deploy and measure the current tracking/metadata changes.
2. Run DFW and SAT title/meta/hero experiments first.
3. Rewrite DAL as a distinct Love Field page.
4. Improve HOU, AUS, BRO, and ABI with airport-specific proof and FAQs.
5. Track weekly clicks, impressions, CTR, average position, and signup
   conversion by airport.
6. Re-run the same report after 28 days and compare page-level deltas.
