const CACHE = "webry-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          void caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request) ?? caches.match("/")),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ??
        fetch(e.request).then((res) => {
          if (res.ok) void caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        }),
    ),
  );
});
