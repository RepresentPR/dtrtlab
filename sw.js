// golive: uncache worker only. Do not precache "/". Do not list old share images.
// golive hotfix: unregister any previous worker that precached the key page.
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    var clients = await self.clients.matchAll({ type: "window" });
    clients.forEach(function (c) { if (c.navigate) c.navigate(c.url); });
  })());
});
