/* DTRT Lab service worker.
   Cache name and ?v= query strings share one version so a new deploy
   drops the old cache. GitHub Pages cannot set Cache-Control.
   HTML is network-first (updates roll out). Other same-origin files
   are stale-while-revalidate. JSON and third parties are not cached.
*/
var VERSION = "20261009f";
var CACHE = "dtrtlab-" + VERSION;
var PRECACHE = [
  "/",
  "/index.html",
  "/404.html",
  "/afterlight.html",
  "/bug.html",
  "/catalog.html",
  "/contact.html",
  "/donate.html",
  "/faq.html",
  "/game.html",
  "/history.html",
  "/isabella.html",
  "/legal/preorder-terms.html",
  "/legal/privacy.html",
  "/legal/refunds.html",
  "/legal/terms.html",
  "/media.html",
  "/news.html",
  "/preorder.html",
  "/press.html",
  "/radio.html",
  "/stories/afterlight/index.html",
  "/stories/afterlight/",
  "/stories/afterlight/island.html",
  "/stories/afterlight/people.html",
  "/stories/afterlight/volume-one/index.html",
  "/stories/afterlight/volume-one/",
  "/story.html",
  "/support.html",
  "/training.html",
  "/worlds.html",
  "/css/fonts.css?v=20261009f",
  "/css/lab.css?v=20261009f",
  "/css/adapt.css?v=20261009f",
  "/css/hub.css?v=20261009f",
  "/css/afterlight.css?v=20261009f",
  "/js/nav.js?v=20261009f",
  "/js/hub.js?v=20261009f",
  "/js/analytics.js?v=20261009f",
  "/js/product.js?v=20261009f",
  "/js/media.js?v=20261009f",
  "/js/content.js?v=20261009f",
  "/js/forms.js?v=20261009f",
  "/js/radio.js?v=20261009f",
  "/js/afterlight.js?v=20261009f",
  "/js/releases.js?v=20261009f",
  "/content/clips.js?v=20261009f",
  "/content/socials.js?v=20261009f",
  "/favicon.ico",
  "/site.webmanifest",
  "/img/icon.svg",
  "/img/icon-48.png",
  "/img/icon-192.png",
  "/assets/fonts/big-shoulders-stencil-latin.woff2?v=20261009f",
  "/assets/fonts/ibm-plex-mono-400-latin.woff2?v=20261009f",
  "/assets/fonts/ibm-plex-mono-500-latin.woff2?v=20261009f",
  "/assets/fonts/ibm-plex-mono-600-latin.woff2?v=20261009f",
  "/assets/fonts/instrument-serif-italic-latin.woff2?v=20261009f",
  "/assets/fonts/source-sans-3-italic-latin.woff2?v=20261009f",
  "/assets/fonts/source-sans-3-latin.woff2?v=20261009f",
  "/assets/fonts/source-serif-4-italic-latin.woff2?v=20261009f",
  "/assets/fonts/source-serif-4-latin.woff2?v=20261009f",
  "/img/reticle.svg",
  "/assets/clips/AverageApatheticCockroachPJSugar-6Q1neY-R6gdxtciw-320.webp",
  "/assets/clips/AverageApatheticCockroachPJSugar-6Q1neY-R6gdxtciw.webp",
  "/assets/clips/EvilRespectfulMonkeyLeeroyJenkins-5RAFxUmkGSD-t4GC-320.webp",
  "/assets/clips/EvilRespectfulMonkeyLeeroyJenkins-5RAFxUmkGSD-t4GC.webp",
  "/assets/clips/GeniusSwissOkapiPMSTwin-duYLliqZdd1FzIeF-320.webp",
  "/assets/clips/GeniusSwissOkapiPMSTwin-duYLliqZdd1FzIeF.webp",
  "/assets/clips/GiantBoringFlyEleGiggle-uUSE5sJQTFBguyu3-320.webp",
  "/assets/clips/GiantBoringFlyEleGiggle-uUSE5sJQTFBguyu3.webp",
  "/assets/clips/InventiveNastySashimiNononoCat-MxON-cLfRUIgnmoY-320.webp",
  "/assets/clips/InventiveNastySashimiNononoCat-MxON-cLfRUIgnmoY.webp",
  "/assets/clips/KawaiiMildAlbatrossDatBoi-wJFt6HdvJx9dZqfN-320.webp",
  "/assets/clips/KawaiiMildAlbatrossDatBoi-wJFt6HdvJx9dZqfN.webp",
  "/assets/clips/MildHandsomeHedgehogSoonerLater-quqE9w-TP1wRRGov-320.webp",
  "/assets/clips/MildHandsomeHedgehogSoonerLater-quqE9w-TP1wRRGov.webp",
  "/assets/clips/SmallCalmLlamaImGlitch-E61IvMc563GrIRub-320.webp",
  "/assets/clips/SmallCalmLlamaImGlitch-E61IvMc563GrIRub.webp",
  "/assets/clips/SuaveConcernedRaisinEagleEye--Ww8MHcdddZRo8sp-320.webp",
  "/assets/clips/SuaveConcernedRaisinEagleEye--Ww8MHcdddZRo8sp.webp"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function isDocument(request, url) {
  if (request.mode === "navigate" || request.destination === "document") return true;
  if (/\.html$/i.test(url.pathname) || url.pathname.endsWith("/")) return true;
  return false;
}

function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      return cached || caches.match("/index.html");
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var network = fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || network;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url;
  try { url = new URL(request.url); } catch (error) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf("/content/") === 0 && /\.json$/i.test(url.pathname)) return;
  if (isDocument(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
