/* Language switch for the storefront. Spanish-first. Remembers Español/English.
   Query ?lang=es or ?lang=en wins and is saved. No flags, no geo redirect. */
(function () {
  "use strict";
  var search = typeof location !== "undefined" ? location.search : "";
  var param = /(?:\?|&)lang=es(?:&|$)/.test(search) ? "es" : /(?:\?|&)lang=en(?:&|$)/.test(search) ? "en" : null;
  var saved = null;
  try { saved = localStorage.getItem("dtrt-lang"); } catch (e) {}
  var lang = param || (saved === "en" || saved === "es" ? saved : "es");
  if (param) {
    try { localStorage.setItem("dtrt-lang", param); } catch (e2) {}
  }
  var links = document.querySelectorAll("[data-lang-link]");
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute("data-lang-link") === lang) links[i].setAttribute("aria-current", "true");
    else links[i].removeAttribute("aria-current");
  }
  if (lang !== "es") return;
  document.documentElement.lang = "es";
  var t = document.body.getAttribute("data-es-title");
  if (t) document.title = t;
  var nodes = document.querySelectorAll("[data-es]");
  for (var j = 0; j < nodes.length; j++) nodes[j].textContent = nodes[j].getAttribute("data-es");
  var firsts = document.querySelectorAll("[data-es-first]");
  for (var f = 0; f < firsts.length; f++) if (firsts[f].firstChild && firsts[f].firstChild.nodeType === 3) firsts[f].firstChild.nodeValue = firsts[f].getAttribute("data-es-first");
  var phs = document.querySelectorAll("[data-es-placeholder]");
  for (var p = 0; p < phs.length; p++) phs[p].setAttribute("placeholder", phs[p].getAttribute("data-es-placeholder"));
  var alts = document.querySelectorAll("[data-es-alt]");
  for (var k = 0; k < alts.length; k++) alts[k].setAttribute("alt", alts[k].getAttribute("data-es-alt"));
})();
