const CACHE = "mf-v1";

// Pre-cache the shell — pages that should work offline
const PRECACHE = ["/", "/login", "/logo.png", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try the network, fall back to cache for GETs
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Don't intercept API or auth routes — they must be fresh
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful navigation responses
        if (res.ok && e.request.mode === "navigate") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
