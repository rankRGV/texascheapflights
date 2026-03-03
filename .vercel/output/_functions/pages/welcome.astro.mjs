import { e as createComponent, l as renderHead, u as unescapeHTML, r as renderTemplate, g as addAttribute, k as renderScript } from '../chunks/astro/server_BnqMIvsc.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const deals = [
	{
		origin: "MFE",
		dest: "London",
		points: "60,000",
		cash: "$1,450",
		airline: "Virgin Atlantic",
		alliance: "SkyTeam",
		tags: [
			"Business Class Possible",
			"Low Surcharge"
		],
		icon: "diamond"
	},
	{
		origin: "SAT",
		dest: "Tokyo",
		points: "70,000",
		cash: "$1,820",
		airline: "ANA",
		alliance: "Star Alliance",
		tags: [
			"The \"Virgin Loop\"",
			"Direct from Hub"
		],
		icon: "globe"
	},
	{
		origin: "LRD",
		dest: "Cancun",
		points: "15,000",
		cash: "$580",
		airline: "United",
		alliance: "Star Alliance",
		tags: [
			"Regional Shortcut",
			"Zero Fees"
		],
		icon: "map-pin"
	}
];

const prerender = false;
const $$Welcome = createComponent(($$result, $$props, $$slots) => {
  const ICON_MAP = {
    diamond: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M12 22 4.5 9"/><path d="M12 22 19.5 9"/><path d="M2 9h20"/><path d="M10 3 4.5 9"/><path d="M14 3 19.5 9"/></svg>`,
    globe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    "map-pin": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
  };
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome | Texas Cheap Flights</title><link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✈️</text></svg>">${renderHead()}</head> <body class="bg-primary text-primary font-body selection:bg-tcf-aviation-blue/30 selection:text-white"> <!-- Nav --> <nav class="fixed top-0 left-0 right-0 z-50 px-6 py-5 glass border-b border-white/5"> <div class="max-w-7xl mx-auto flex items-center justify-between"> <a href="/" class="flex items-center gap-3 no-underline group"> <div class="p-2 rounded-xl bg-tcf-aviation-blue/10 border border-tcf-aviation-blue/20"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-tcf-aviation-blue"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg> </div> <span class="font-black text-lg uppercase tracking-tight text-white">Texas Cheap Flights</span> </a> <div id="user-badge" class="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-5 py-2"> <span id="display-email" class="text-xs font-bold text-slate-400">...</span> <div class="w-2 h-2 rounded-full bg-tcf-success animate-pulse"></div> </div> </div> </nav> <main class="pt-32 pb-20 px-6"> <div class="max-w-7xl mx-auto"> <!-- Dashboard Header --> <header class="mb-16 anim-fade-up"> <div class="flex flex-col md:flex-row md:items-end justify-between gap-8"> <div> <span class="label text-gold uppercase tracking-[0.3em] font-bold text-[10px] mb-4 inline-block">Priority Access Active</span> <h1 class="text-4xl md:text-6xl text-white font-black leading-tight">
Welcome aboard, <br><span class="text-gold italic">Founding Member.</span> </h1> </div> <div class="liquid-glass p-6 rounded-3xl border border-white/10 min-w-[300px]"> <div class="flex items-center justify-between mb-4"> <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Monitoring System</span> <span class="text-[10px] font-black uppercase tracking-widest text-tcf-success">Active</span> </div> <div class="text-2xl font-black text-white mb-2" id="display-airport">...</div> <p class="text-[10px] text-slate-500 font-medium">We're scanning every award route from your home hub.</p> </div> </div> </header> <div class="grid lg:grid-cols-3 gap-12"> <!-- Left Col: The Deals --> <div class="lg:col-span-2 space-y-12"> <section> <div class="flex items-center justify-between mb-8"> <h2 class="text-2xl font-black text-white uppercase tracking-tight">Recent Sweet Spots</h2> <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Updated 2h ago</span> </div> <div class="grid md:grid-cols-2 gap-6"> ${deals.map((deal) => renderTemplate`<div class="liquid-glass group overflow-hidden rounded-[2.5rem] border border-white/5 hover:border-tcf-aviation-blue/30 transition-all duration-500"> <div class="p-8 pb-4"> <div class="flex justify-between items-start mb-6"> <div class="p-4 rounded-2xl bg-white/5 text-white group-hover:scale-110 group-hover:bg-tcf-aviation-blue/10 transition-all duration-500">${unescapeHTML(ICON_MAP[deal.icon])}</div> <div class="text-right"> <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Origin</div> <div class="text-lg font-black text-white">${deal.origin}</div> </div> </div> <div class="mb-6"> <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Destination</div> <div class="text-2xl font-black text-white">${deal.dest}</div> </div> </div> <div class="p-8 pt-0 mt-auto"> <div class="h-px w-full bg-white/5 mb-6"></div> <div class="flex items-end justify-between"> <div> <div class="text-[10px] font-black uppercase tracking-[0.2em] text-tcf-aviation-blue mb-1">Hedge Value</div> <div class="flex items-baseline gap-1.5"> <span class="text-2xl font-black text-white">${deal.points}</span> <span class="text-[10px] font-bold text-slate-500">pts</span> </div> </div> <div class="text-right"> <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Cash Value</div> <div class="text-md font-bold text-slate-400 line-through decoration-red-900/50">${deal.cash}</div> </div> </div> </div> </div>`)} </div> </section> <!-- The Guide Callout --> <section class="liquid-glass p-10 md:p-16 rounded-[4rem] border-white/10 relative overflow-hidden group"> <div class="absolute -top-24 -right-24 w-64 h-64 bg-tcf-aviation-blue/10 blur-[120px] rounded-full group-hover:bg-tcf-aviation-blue/20 transition-all duration-700"></div> <div class="relative z-10"> <span class="label text-gold uppercase tracking-[0.3em] font-bold text-[10px] mb-6 inline-block">Next Step</span> <h2 class="text-3xl md:text-5xl text-white font-black mb-6 leading-tight">Review the <br><span class="text-gold">Skeptic's Masterclass.</span></h2> <p class="text-slate-400 mb-10 max-w-xl leading-relaxed">
Before we send your first alert, you need to understand the "Aviation Hedge." Our guide breaks down the math behind why Texas flyers have a 2x points advantage.
</p> <a href="/skeptics-guide" class="btn-primary px-10 py-4 inline-flex items-center gap-3">
Read the Guide
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg> </a> </div> </section> </div> <!-- Right Col: Checklists & Status --> <div class="space-y-8"> <div class="liquid-glass p-8 rounded-3xl border border-white/5"> <h3 class="text-sm font-black text-white uppercase tracking-widest mb-8">Onboarding Status</h3> <div class="space-y-6"> ${[
    { label: "Priority Account Reserved", done: true },
    { label: "Home Airport Monitored", done: true },
    { label: "Skeptic's Guide Unlocked", done: true },
    { label: "First Deal Analysis", done: false },
    { label: "Platform Alpha Access", done: false }
  ].map((item) => renderTemplate`<div class="flex items-center gap-4"> <div${addAttribute(`w-5 h-5 rounded-full flex items-center justify-center border ${item.done ? "bg-tcf-success/20 border-tcf-success/50 text-tcf-success" : "border-white/10 text-transparent"}`, "class")}> <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> </div> <span${addAttribute(`text-xs font-bold ${item.done ? "text-slate-300" : "text-slate-600"}`, "class")}>${item.label}</span> </div>`)} </div> <div class="mt-10 pt-8 border-t border-white/5"> <p class="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">Sharing Loop</p> <p class="text-xs text-slate-400 mb-6 leading-relaxed">Skip 500 spots on the waitlist by sharing your link.</p> <div class="flex gap-4"> <button class="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg> </button> <button class="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg> </button> </div> </div> </div> <div class="liquid-glass p-8 rounded-3xl border border-white/5"> <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Support</h3> <p class="text-xs text-slate-400 leading-relaxed mb-6">Need help with your Texas plan? Reply to any of our emails for a direct response from our founding team.</p> <a href="mailto:waitlist@texascheapflights.com" class="text-gold text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Contact Founder</a> </div> </div> </div> </div> </main> ${renderScript($$result, "C:/Users/Eddie/Desktop/TravelHack/src/pages/welcome.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "C:/Users/Eddie/Desktop/TravelHack/src/pages/welcome.astro", void 0);

const $$file = "C:/Users/Eddie/Desktop/TravelHack/src/pages/welcome.astro";
const $$url = "/welcome";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Welcome,
    file: $$file,
    prerender,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
