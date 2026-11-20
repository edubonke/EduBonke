const cachePrefix = "edubonke-shell-";
const cacheName = cachePrefix + "v4";
const base = self.registration.scope.replace(/\/$/, "");
const shell = [`${base}/`, `${base}/demo/`, `${base}/demo/student/`, `${base}/demo/staff/`, `${base}/login/`, `${base}/portal/`, `${base}/privacy/`, `${base}/manifest.webmanifest`, `${base}/favicon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(cachePrefix) && key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (event.request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        // A disabled or full cache must still allow a successful network response.
        await caches.open(cacheName).then((cache) => cache.put(event.request, response.clone())).catch(() => {});
      }
      return response;
    } catch {
      const cache = await caches.open(cacheName).catch(() => null);
      if (!cache) return Response.error();
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") return (await cache.match(`${base}/`)) ?? Response.error();
      return Response.error();
    }
  })());
});
