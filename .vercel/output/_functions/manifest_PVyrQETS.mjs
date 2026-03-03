import 'piccolore';
import { n as decodeKey } from './chunks/astro/server_BnqMIvsc.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_B00aTBUi.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/Eddie/Desktop/TravelHack/","cacheDir":"file:///C:/Users/Eddie/Desktop/TravelHack/node_modules/.astro/","outDir":"file:///C:/Users/Eddie/Desktop/TravelHack/dist/","srcDir":"file:///C:/Users/Eddie/Desktop/TravelHack/src/","publicDir":"file:///C:/Users/Eddie/Desktop/TravelHack/public/","buildClientDir":"file:///C:/Users/Eddie/Desktop/TravelHack/dist/client/","buildServerDir":"file:///C:/Users/Eddie/Desktop/TravelHack/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"skeptics-guide/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/skeptics-guide","isIndex":false,"type":"page","pattern":"^\\/skeptics-guide\\/?$","segments":[[{"content":"skeptics-guide","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/skeptics-guide.astro","pathname":"/skeptics-guide","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/subscribe","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/subscribe\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"subscribe","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/subscribe.ts","pathname":"/api/subscribe","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/index.bEJjirry.css"}],"routeData":{"route":"/welcome","isIndex":false,"type":"page","pattern":"^\\/welcome\\/?$","segments":[[{"content":"welcome","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/welcome.astro","pathname":"/welcome","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro",{"propagation":"none","containsHead":true}],["C:/Users/Eddie/Desktop/TravelHack/src/pages/welcome.astro",{"propagation":"none","containsHead":true}],["C:/Users/Eddie/Desktop/TravelHack/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/api/subscribe@_@ts":"pages/api/subscribe.astro.mjs","\u0000@astro-page:src/pages/skeptics-guide@_@astro":"pages/skeptics-guide.astro.mjs","\u0000@astro-page:src/pages/welcome@_@astro":"pages/welcome.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_PVyrQETS.mjs","C:/Users/Eddie/Desktop/TravelHack/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_DJYGvxUq.mjs","C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro?astro&type=script&index=0&lang.ts":"_astro/skeptics-guide.astro_astro_type_script_index_0_lang.CsJR5LLD.js","C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro?astro&type=script&index=1&lang.ts":"_astro/skeptics-guide.astro_astro_type_script_index_1_lang.BTp3zknq.js","C:/Users/Eddie/Desktop/TravelHack/src/pages/welcome.astro?astro&type=script&index=0&lang.ts":"_astro/welcome.astro_astro_type_script_index_0_lang.Xm7VB2oZ.js","C:/Users/Eddie/Desktop/TravelHack/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.BCRY-v_W.js","C:/Users/Eddie/Desktop/TravelHack/src/pages/index.astro?astro&type=script&index=1&lang.ts":"_astro/index.astro_astro_type_script_index_1_lang.BTp3zknq.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro?astro&type=script&index=0&lang.ts","const r=new IntersectionObserver(e=>{e.forEach(s=>{s.isIntersecting&&s.target.classList.add(\"anim-fade-up\")})},{threshold:.1});document.querySelectorAll(\".anim-fade-up, .liquid-glass\").forEach(e=>r.observe(e));"],["C:/Users/Eddie/Desktop/TravelHack/src/pages/skeptics-guide.astro?astro&type=script&index=1&lang.ts","window.dataLayer=window.dataLayer||[];function a(){dataLayer.push(arguments)}a(\"js\",new Date);a(\"config\",\"G-XSTNVD0CLC\");"],["C:/Users/Eddie/Desktop/TravelHack/src/pages/welcome.astro?astro&type=script&index=0&lang.ts","const n=new URLSearchParams(window.location.search),o=n.get(\"email\"),t=n.get(\"airport\"),s={MFE:\"McAllen (MFE)\",LRD:\"Laredo (LRD)\",HRL:\"Harlingen (HRL)\",BRO:\"South Padre Island (BRO)\",CRP:\"Corpus Christi (CRP)\",SAT:\"San Antonio (SAT)\",DFW:\"Dallas (DFW)\",IAH:\"Houston (IAH)\",AUS:\"Austin (AUS)\",AMA:\"Amarillo (AMA)\",LBB:\"Lubbock (LBB)\",ELP:\"El Paso (ELP)\",MAF:\"Midland (MAF)\",HOU:\"Houston (HOU)\",DAL:\"Dallas Love (DAL)\"};o&&(document.getElementById(\"display-email\").textContent=o);t&&(document.getElementById(\"display-airport\").textContent=s[t]||t);const r=new IntersectionObserver(e=>{e.forEach(a=>{a.isIntersecting&&a.target.classList.add(\"anim-fade-up\")})},{threshold:.1});document.querySelectorAll(\".anim-fade-up, .liquid-glass\").forEach(e=>r.observe(e));"],["C:/Users/Eddie/Desktop/TravelHack/src/pages/index.astro?astro&type=script&index=0&lang.ts","const u=document.getElementById(\"waitlist-form\");document.getElementById(\"success-state\");const r=document.getElementById(\"submit-btn\"),c=document.getElementById(\"referral-link\"),s=document.getElementById(\"copy-btn\");u?.addEventListener(\"submit\",async n=>{n.preventDefault();const e=document.getElementById(\"email\"),o=document.getElementById(\"airport\");if(!(!e?.value||!o?.value)){r&&(r.innerHTML='<span class=\"flex items-center justify-center gap-3\"><svg class=\"animate-spin h-5 w-5 text-white\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\"><circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle><path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path></svg> Securing your spot...</span>',r.disabled=!0);try{const t=await fetch(\"/api/subscribe\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({email:e.value,airport:o.value})});if(!t.ok){const i=await t.json().catch(()=>({}));throw new Error(i.details||i.error||\"Subscription failed\")}window.location.href=`/welcome?email=${encodeURIComponent(e.value)}&airport=${encodeURIComponent(o.value)}`}catch(t){r&&(r.innerHTML=\"Try Again\",r.disabled=!1),console.error(\"Signup error:\",t),alert(`Error: ${t.message||\"Something went wrong. Please try again.\"}`)}}});s?.addEventListener(\"click\",()=>{c&&(navigator.clipboard.writeText(c.value),s.textContent=\"Copied!\",setTimeout(()=>s.textContent=\"Copy\",2e3))});const m={threshold:.1,rootMargin:\"0px 0px -50px 0px\"},l=new IntersectionObserver(n=>{n.forEach(e=>{e.isIntersecting&&(e.target.classList.add(\"anim-fade-up\"),l.unobserve(e.target))})},m);document.querySelectorAll(\".anim-fade-up\").forEach(n=>l.observe(n));const a=document.getElementById(\"nav\");window.addEventListener(\"scroll\",()=>{window.scrollY>50?a?.classList.add(\"nav-scrolled\"):a?.classList.remove(\"nav-scrolled\")});document.querySelectorAll('a[href^=\"#\"]').forEach(n=>{n.addEventListener(\"click\",function(e){e.preventDefault();const o=this.getAttribute(\"href\");if(!o||o===\"#\")return;const t=document.querySelector(o);if(t){const i=a?.offsetHeight||80,d=t.getBoundingClientRect().top+window.pageYOffset-i;window.scrollTo({top:d,behavior:\"smooth\"})}})});"],["C:/Users/Eddie/Desktop/TravelHack/src/pages/index.astro?astro&type=script&index=1&lang.ts","window.dataLayer=window.dataLayer||[];function a(){dataLayer.push(arguments)}a(\"js\",new Date);a(\"config\",\"G-XSTNVD0CLC\");"]],"assets":["/_astro/index.bEJjirry.css","/favicon.ico","/favicon.svg","/logo-dark.png","/logo-light.png","/skeptics-guide/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"aEd4xuCOlow+TgJ9S+OHep6cHH5YRSAXopCldTUOjIs="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
