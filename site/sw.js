/* deal'ke service worker: shows the daily notification, and keeps the last copy of the site for when there is no internet.
   Always network first: with internet you get exactly what the server has (the deals change every morning and must never be
   stale); the saved copy is only used when the network fails. Only this site's own files are kept, nothing from other sites. */
const CACHE = "dealke-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

const mine = url => url.origin === self.location.origin && !/\/admin\.|\/sw\.js$/.test(url.pathname);
async function keep(req, res) {
  if (!res || !res.ok || res.type !== "basic") return;
  const c = await caches.open(CACHE), url = new URL(req.url || req);
  // a new release gets new ?v= names: drop the older copies of the same file so the cache never grows
  if (url.search) for (const k of await c.keys()) { const o = new URL(k.url); if (o.pathname === url.pathname && o.search !== url.search) await c.delete(k); }
  await c.put(req, res);
}
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || !mine(url)) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      e.waitUntil(keep(req, res.clone()));
      return res;
    } catch (err) {
      const c = await caches.open(CACHE);
      const hit = await c.match(req) || await c.match(req, { ignoreSearch: true })
        || (req.mode === "navigate" ? await c.match(new URL("./", self.registration.scope).href) || await c.match(new URL("index.html", self.registration.scope).href) : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
// the page sends the files it loaded before this worker was running, so the first visit already works offline
self.addEventListener("message", e => {
  if (e.data?.type !== "keep") return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const u of (e.data.urls || []).slice(0, 60)) {
      const url = new URL(u, self.registration.scope); if (!mine(url)) continue;
      if (await c.match(url.href)) continue;
      try { await keep(url.href, await fetch(url.href)); } catch { /* try again next visit */ }
    }
  })());
});

self.addEventListener("push", e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch { m = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(m.title || "deal'ke", {
    body: m.body || "", tag: m.tag || "daily", renotify: true,
    icon: "icon-192.png", badge: "badge-96.png", data: { url: m.url || "./#list" },
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./#list", self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const w = wins.find(c => c.url.startsWith(self.registration.scope));
    if (w) { await w.focus(); return w.navigate ? w.navigate(url) : null; }
    return self.clients.openWindow(url);
  })());
});
