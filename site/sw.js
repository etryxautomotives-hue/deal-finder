/* deal'ke service worker: only shows the daily notification and opens the list when it is tapped.
   No caching on purpose: the deals change every morning and must never be stale. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

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
