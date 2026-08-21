# Texas Cheap Flights analytics tracking plan

Last updated: 2026-08-20

## Purpose

Measure the path from Texas search visitor to airport-specific subscriber, then connect published deals to booking-link engagement and alert quality.

## Events

| Event | Trigger | Properties |
| --- | --- | --- |
| `page_view` | Every public page | `page_title`, `page_location`, `page_referrer` |
| `signup_view` | Waitlist form becomes visible | `form_name`, `location` |
| `airport_selected` | Airport selector changes | `airport`, `location` |
| `signup_submit` | Waitlist form submits | `form_name`, `airport` |
| `signup_success` | `/welcome` loads after signup | `airport`, `source` |
| `deal_view` | Deal detail page loads | `deal_id`, `origin`, `destination`, `airline`, `price` |
| `booking_link_click` | User opens a booking link | `deal_id`, `origin`, `destination` |
| `share_click` | User uses a share action | `network`, `location` |
| `unsubscribe` | Subscriber pauses or unsubscribes | `location` |

## Rules

- Never send email addresses or other personal information to GA4.
- Use lowercase event names with underscores.
- Keep airport codes, route, and deal IDs as properties rather than creating separate event names.
- Mark `signup_success` and `booking_link_click` as conversions after validating them in GA4 DebugView.
- Review source/medium and airport performance weekly.
