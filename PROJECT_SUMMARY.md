# Project Overview: Texas Cheap Flights (Regional Scout)

## 📌 Elevator Pitch
An automated, AI-powered flight discovery engine and notification system specifically engineered for residents of Texas regional hubs (The Valley, Laredo, El Paso, etc.) who are typically ignored by mainstream aggregators. The system "outsmarts" the major search engines by scanning live airline data recursively and using AI to score deals based on "Hedge Value" and "Price Strength."

---

## 🛠️ Technical Stack
*   **Framework**: Astro 5.0 (SSR enabled for dynamic API routing)
*   **Language**: TypeScript (End-to-end type safety)
*   **Styling**: Tailwind CSS 4.0 + "Liquid Glass" Custom Design System (Premium UI/UX)
*   **AI Engine**: Google Gemini 2.5 Flash (via `@google/generative-ai`)
*   **Data Scraper**: SerpApi (Google Flights & Google Travel Explore Engines)
*   **Communication**: Resend (Email Automation & Inbound Webhooks), Discord (Real-time Alerting)
*   **Infrastructure**: Vercel (Edge Functions, Serverless API, Automated Cron Jobs)

---

## 🤖 AI Implementation & Strategy
The system utilizes **LLM-based unstructured data extraction** to bypass the "inbox rot" of travel newsletters.
*   **Inbound Email Parsing**: Developed an AI-powered ingestion engine that listens for inbound webhooks from Resend.
*   **Heuristic Scoring Model**:
    *   **Price Strength Score (1-5)**: Measures the raw price anomaly against global benchmarks (e.g., <$400 to Europe is a 5/5).
    *   **Hedge Value Score (1-5)**: Calculates the discount against "typical" market rates to identify the true ROI for the traveler.
    *   **Automated Filtering**: Deals with a combined score < 7/10 are filtered out automatically, ensuring only premium signals reach the user.

---

## 🦅 The "Regional Scout" (Core Innovation)
A proprietary scanning script that proactively hunts for deals where aggregators fail.
*   **Direct-to-Source Scanning**: Bypasses traditional affiliate feeds by polling Google's internal travel explore engine directly for regional "ghost hubs" like MFE, LRD, BRO, and HRL.
*   **Smart Hub Randomization**: Implemented a recursive scanning logic that rotates through 20+ Texas regional airports daily while maintaining strict API rate-limit compliance.
*   **Human-In-The-Loop Workflow**: Alerts are sent to a private Discord channel for validation before the AI-generated email broadcasts are drafted for the public list.

---

## 📊 Performance & Efficiency Metrics
*   **Zero-Cost Infrastructure**: Engineered to operate 100% on free-tier limits (Vercel, SerpApi, Resend) through master-cron consolidation and request batching.
*   **High-Conversion UI**: Applied psychological conversion principles (Aviation Tech Luxury aesthetic) to the welcome flow and referral systems.
*   **Resiliency**: Implemented robust error handling for incomplete webhook payloads and "Human-Support" fallbacks for non-deal inbound messages.

---

## 💼 Resume-Ready Bullet Points
*   **Architected a serverless flight deal discovery engine** using Astro and TypeScript, reducing the time-to-alert for regional users by bypasssing standard affiliate aggregation delays.
*   **Integrated Google Gemini (LLM)** to automate the parsing and scoring of unstructured travel data from inbound email newsletters, identifying high-ROI deals with a custom heuristic scoring model.
*   **Developed a proprietary "Regional Scout" script** using SerpApi to scrap live airline data from 20+ underserved Texas airports, implemented with recursive batching to stay within strict API usage quotas.
*   **Engineered a premium brand experience** incorporating a custom-built "Liquid Glass" design system and responsive HTML email templates, resulting in a high-fidelity "Aviation Luxury" user experience.
*   **Configured automated Cron jobs and Master Orchestrators** on Vercel to handle daily statewide scans and RSS polling, ensuring 100% system uptime on zero-cost infrastructure.
