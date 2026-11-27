/* Language toggle only. No search. */
(function () {
  if (!/(?:\?|&)lang=en(?:&|$)/.test(location.search)) return;
  var en = { home: "Home", contact: "Contact", "switch": "Español",
    h1: "Ask is coming soon",
    lead: "This page is not available yet. In the meantime, write to me with the contact form.",
    cta: "Go to contact" };
  document.documentElement.lang = "en";
  document.title = "Ask DTRT — coming soon — Ian | DTRT Lab";
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var k = el.getAttribute("data-i18n");
    if (en[k]) el.textContent = en[k];
    var h = el.getAttribute("data-href-en");
    if (h) el.setAttribute("href", h);
  });
  document.querySelectorAll('[data-i18n="switch"]').forEach(function (el) {
    el.setAttribute("href", "/ask/"); el.setAttribute("lang", "es");
  });
})();
