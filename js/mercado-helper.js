/* Mercado category tiles and filter chips. No free-text search. */
(function () {
  "use strict";
  var isEn = /(?:\?|&)lang=en(?:&|$)/.test(location.search);
  var en = {
    home: "Home", contact: "Contact", "switch": "Español", privacy: "Privacy", terms: "Terms",
    h1: "Puerto Rico Market", cats: "Categories", filters: "Filters",
    lede: "Pick a category. The catalog is short on purpose.",
    t0: "All", t1: "Our AI", t4: "Beauty", t5: "Energy", t6: "Candles", t7: "Our products",
    s0: "See the catalog", s1: "Early test", s6: "Trading",
    always988: "Need to talk? Call or text 988 (24/7)",
    c1t: "DTRT Lab AI for Puerto Rico businesses",
    c1d: "I help you put AI to work in your business, step by step.",
    c1n: "Very early AI test, not live yet.",
    c1b: "Write to me",
    c3a: "Affiliate link. We earn a commission.",
    c3b: "Zero nicotine and zero tobacco, too.",
    c3c: "40mg caffeine per pouch. Adults 18+.",
    c3l: "See MOTION",
    c4a: "Referral link. We earn from fees. Trading is risky, not financial advice.",
    c4l: "See Candles",
    c5t: "My mom's Jafra shop",
    c5a: "My mom's Jafra consultant link. She earns from sales.",
    c5l: "See Jafra",
    c6t: "Our products",
    c6d: "What we make at DTRT Lab. We list it here when it is ready.",
    c6b: "Write to me",
    st: "Sell with us",
    sd: "Run a local business? Ask to be listed here.",
    sb: "Ask to be listed"
  };

  if (isEn) {
    document.documentElement.lang = "en";
    document.title = "Puerto Rico Market — Ian | DTRT Lab";
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-i18n");
      if (en[k]) els[i].textContent = en[k];
      var h = els[i].getAttribute("data-href-en");
      if (h) els[i].setAttribute("href", h);
    }
    var sws = document.querySelectorAll('[data-i18n="switch"]');
    for (var z = 0; z < sws.length; z++) { sws[z].setAttribute("href", "/mercado/"); sws[z].setAttribute("lang", "es"); }
    var tg = document.querySelector(".mk-tiles"); if (tg) tg.setAttribute("aria-label", en.cats);
    var cg = document.getElementById("mk-chips"); if (cg) cg.setAttribute("aria-label", en.filters);
  }

  var cat = "all";
  var cards = document.querySelectorAll("#mk-grid .mk-card");
  var buttons = document.querySelectorAll(".mk-tiles button[data-cat], #mk-chips button[data-cat]");

  function apply() {
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var id = c.getAttribute("data-cat") || "";
      var ok = cat === "all" || id === cat;
      c.hidden = !ok;
    }
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute("aria-pressed", buttons[j].getAttribute("data-cat") === cat ? "true" : "false");
    }
  }

  for (var j = 0; j < buttons.length; j++) {
    buttons[j].addEventListener("click", function () {
      cat = this.getAttribute("data-cat") || "all";
      apply();
    });
  }
  var pre = new URLSearchParams(location.search).get("cat");
  if (pre && /^(all|beauty|energy|candles|ours|ai)$/.test(pre)) cat = pre;
  apply();
})();
