const cacheName = "edubonke-shell-v3";
const base = self.registration.scope.replace(/\/$/, "");
const shell = [`${base}/`, `${base}/demo/`, `${base}/demo/student/`, `${base}/demo/staff/`, `${base}/login/`, `${base}/portal/`, `${base}/privacy/`, `${base}/manifest.webmanifest`, `${base}/favicon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin) || event.request.url.includes("supabase.co")) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    if (response.ok) caches.open(cacheName).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((response) => response || caches.match(`${base}/`))));
});
