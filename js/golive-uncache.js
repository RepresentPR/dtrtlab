/* Drop a stale service worker that may still be serving the old key page. */
(function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (rs) {
      rs.forEach(function (r) { r.unregister(); });
    });
  }
  if (window.caches) {
    caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); });
  }
})();
