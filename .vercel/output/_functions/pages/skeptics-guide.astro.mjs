import { e as createComponent, k as renderHead, g as addAttribute, u as unescapeHTML, r as renderTemplate, l as renderScript } from '../chunks/astro/server_DRMO4r1I.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$SkepticsGuide = createComponent(($$result, $$props, $$slots) => {
  const OBJECTIONS = [
    {
      id: "credit",
      q: "Isn't opening more cards bad for my credit score?",
      a: "Short term? A small dip (5-10 points) from the inquiry. Long term? Your score usually goes UP. More accounts mean a higher total credit limit, which lowers your relative 'utilization.' Higher limits + on-time payments = a bulletproof score. We teach you to pace it so you never trigger a red flag.",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><path d="M17 6h6v6"/></svg>`
    },
    {
      id: "spend",
      q: "I don't spend thousands. How can I hit those bonuses?",
      a: "If you spend $1,000/mo on life (groceries, gas, insurance), you can hit almost any starter bonus. We show you how to 'time' your applications around natural big spends\u2014like car insurance renewals or holiday shopping\u2014so you hit the goal without spending a penny more than you already do.",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`
    },
    {
      id: "regional",
      q: "I fly from McAllen/Laredo. The deals are only for DFW.",
      a: "This is the biggest lie in travel. While cash prices from regional hubs are high, award prices are often 'zone-based' or distance-based. That means a flight from MFE to London can cost the SAME points as a flight from DFW. We specialize in finding these 'arbitrage' sweet spots built for Texas regional flyers.",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
    }
  ];
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>The Skeptic's Guide to Texas Travel Hacking</title><meta name="description" content="No hype, no fluff. Just the math and logic of how travel hacking actually works for Texas regional flyers."><link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>">${renderHead()}</head> <body class="bg-primary text-primary font-body selection:bg-tcf-aviation-blue/30 selection:text-white"> <!-- Nav --> <nav class="fixed top-0 left-0 right-0 z-50 px-6 py-5 glass border-b border-white/5"> <div class="max-w-7xl mx-auto flex items-center justify-between"> <a href="/" class="flex items-center gap-3 no-underline group"> <div class="p-2 rounded-xl bg-tcf-aviation-blue/10 border border-tcf-aviation-blue/20"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-tcf-aviation-blue"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg> </div> <span class="font-black text-lg uppercase tracking-tight text-white">Texas Cheap Flights</span> </a> <a href="/#waitlist" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.875rem;">
Join the Waitlist
</a> </div> </nav> <main class="pt-32 pb-20 px-6"> <div class="max-w-4xl mx-auto"> <!-- Hero --> <header class="text-center mb-20 anim-fade-up"> <span class="label text-gold uppercase tracking-[0.3em] font-bold text-xs mb-6 inline-block">Full Disclosure</span> <h1 class="text-5xl md:text-7xl mb-8 text-white font-black leading-tight">
The Skeptic's Guide to <span class="text-gold">Texas Points</span> </h1> <p class="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
We built this because we were sick of "travel gurus" promising the moon while hiding the math. Here is exactly how travel hacking works for normal Texans.
</p> </header> <!-- The Math Section --> <section class="mb-32"> <div class="liquid-glass p-10 md:p-16 rounded-[3rem] relative overflow-hidden"> <div class="absolute -top-20 -left-20 w-64 h-64 bg-tcf-aviation-blue/10 blur-[120px] rounded-full"></div> <h2 class="text-3xl font-black mb-10 text-white">Rule #1: This is not "Free."</h2> <p class="text-slate-400 mb-8 leading-relaxed text-lg font-body">
Let's be clear: You aren't getting anything for free. You are performing a service for the banks.
</p> <div class="grid md:grid-cols-2 gap-10"> <div class="space-y-4"> <h3 class="text-white font-bold flex items-center gap-2"> <span class="w-6 h-6 rounded-full bg-tcf-aviation-blue/20 flex items-center justify-center text-[10px] text-tcf-aviation-blue">1</span>
Customer Acquisition
</h3> <p class="text-sm text-slate-500 leading-relaxed font-body">
Banks spend billions to find reliable customers. They would rather give YOU 60,000 points (worth ~$900) than spend $900 on a generic TV ad. You are just a high-value customer being 'acquired.'
</p> </div> <div class="space-y-4"> <h3 class="text-white font-bold flex items-center gap-2"> <span class="w-6 h-6 rounded-full bg-tcf-aviation-blue/20 flex items-center justify-center text-[10px] text-tcf-aviation-blue">2</span>
Interchange Fees
</h3> <p class="text-sm text-slate-500 leading-relaxed font-body">
Every time you buy a taco in San Antonio, the merchant pays a 2-3% fee. The bank keeps most of that — but when you use the right card, they give half of it back to you as points.
</p> </div> </div> </div> </section> <!-- Objections List --> <section class="space-y-12 mb-32"> <h2 class="text-3xl font-black text-center text-white mb-16">Common Objections, Answered.</h2> <div class="grid gap-8"> ${OBJECTIONS.map((obj) => renderTemplate`<div${addAttribute(obj.id, "id")} class="liquid-glass p-8 md:p-12 rounded-[2.5rem] border-white/5 hover:border-white/20 transition-all duration-300"> <div class="flex flex-col md:flex-row gap-8"> <div class="w-16 h-16 rounded-2xl bg-tcf-gold/10 flex items-center justify-center text-tcf-gold flex-shrink-0">${unescapeHTML(obj.icon)}</div> <div> <h3 class="text-2xl font-black text-white mb-4 tracking-tight">${obj.q}</h3> <p class="text-lg text-slate-400 leading-relaxed font-body">${obj.a}</p> </div> </div> </div>`)} </div> </section> <!-- The Texas Edge --> <section class="mb-32 text-center"> <div class="p-12 md:p-20 rounded-[4rem] bg-tcf-gold/5 border border-tcf-gold/10 relative overflow-hidden"> <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tcf-gold)_0%,_transparent_20%)] opacity-10"></div> <h2 class="text-4xl md:text-5xl font-black text-white mb-8">The Texas "Zone" Arbitrage</h2> <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-body">
Because we are in the middle of the country, Texas regional flyers have unique 'Sweet Spots' that people in coastal hubs don't. We track the specific routes from <span class="text-gold font-bold">MFE, LRD, BRO, and CRP</span> where your points buy 2x more travel than cash.
</p> <a href="/#waitlist" class="btn-primary px-12 py-5 text-lg">
Start My Texas Plan
</a> </div> </section> </div> </main> <!-- Footer --> <footer class="py-20 bg-tcf-navy-deep border-t border-white/5 text-center"> <p class="text-slate-600 text-xs font-bold uppercase tracking-widest">
© 2026 Texas Cheap Flights. No fluff, just math.
</p> </footer> ${renderScript($$result, "C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro", void 0);

const $$file = "C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro";
const $$url = "/skeptics-guide";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$SkepticsGuide,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
