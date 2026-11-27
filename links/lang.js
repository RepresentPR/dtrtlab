/* Spanish copy for /links/ via ?lang=es, same switch as js/nav.js. Text comes from data-es attributes. */
(function () {
  "use strict";
  var es = /(?:\?|&)lang=es(?:&|$)/.test(location.search);
  var links = document.querySelectorAll("[data-lang-link]");
  for (var i = 0; i < links.length; i++) {
    if ((links[i].getAttribute("data-lang-link") === "es") === es) links[i].setAttribute("aria-current", "true");
  }
  if (!es) return;
  document.documentElement.lang = "es";
  var self = document.querySelectorAll('a[aria-current="page"]');
  for (var k = 0; k < self.length; k++) self[k].setAttribute("href", "/links/?lang=es");
  var t = document.body.getAttribute("data-es-title");
  if (t) document.title = t;
  var nodes = document.querySelectorAll("[data-es]");
  for (var j = 0; j < nodes.length; j++) nodes[j].textContent = nodes[j].getAttribute("data-es");
})();
