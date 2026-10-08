/* Work Log · offline support. The app shell is refreshed from the network when online and served
   from the cache when not; fonts, icons and stickers are cached the first time they're used. */
const VERSION="90e8bf0d03",SHELL="wl-shell-"+VERSION,ASSETS="wl-assets-"+VERSION;
const SHELL_FILES=["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png",
  "fonts/Geist-latin.woff2","fonts/Geist-latin-ext.woff2","fonts/GeistMono-latin.woff2","fonts/GeistMono-latin-ext.woff2"];
self.addEventListener("install",e=>e.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_FILES.map(f=>new Request(f,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==SHELL&&k!==ASSETS)await caches.delete(k);
  await self.clients.claim()})()));
async function networkFirst(req){
  const c=await caches.open(SHELL);
  try{const r=await fetch(req,{cache:"no-cache"});if(r.ok)c.put(req.mode==="navigate"?"./":req,r.clone());return r}
  catch{return (await c.match(req,{ignoreSearch:true}))||(req.mode==="navigate"&&await c.match("./"))||Response.error()}
}
async function savedFirst(req){
  const hit=await caches.match(req);if(hit)return hit;
  const r=await fetch(req);if(r.ok)(await caches.open(ASSETS)).put(req,r.clone());return r;
}
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const u=new URL(req.url);if(u.origin!==location.origin)return;
  const path=u.pathname.slice(new URL(self.registration.scope).pathname.length);
  if(req.mode==="navigate"||path===""||path==="index.html")e.respondWith(networkFirst(req));
  else e.respondWith(savedFirst(req));
});
