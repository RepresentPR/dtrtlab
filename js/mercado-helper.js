import { isCrisisText, fold } from '/js/safety-core.mjs?v=20261127h7';
/* Ayudante de compras (beta) — allowlist helper only. Not live AI. */
(function () {
  "use strict";
  var KEYS = {
    ia: ["ai", "ia", "negocio", "negocios", "business", "chatbot", "oficina", "office", "inteligencia", "artificial", "dtrt", "lab", "puerto", "rico", "store", "stores", "shop", "shops", "app", "shipping", "envio", "discount", "descuento", "deal", "deals", "oferta", "price", "precio", "local", "listing"],
    jafra: ["belleza", "beauty", "perfume", "piel", "skin", "skincare", "maquillaje", "makeup", "jafra", "cosmetica", "cosmetic", "cosmetics", "cosmeticos", "mama", "mom", "consultora", "tienda", "gift", "gifts", "regalo", "regalos", "present", "cream", "crema", "lotion", "locion", "serum", "soap", "jabon", "cologne", "care", "cheap", "barato", "barata", "price", "precio", "deal", "deals", "oferta", "ofertas", "best", "seller", "store", "stores", "shop", "shops", "link", "links", "enlace", "enlaces", "coupon", "cupon", "code", "codigo", "discount", "descuento", "shipping", "envio", "new", "nuevo", "nueva"],
    motion: ["energia", "energy", "cafeina", "caffeine", "cafe", "coffee", "pouch", "pouches", "bolsita", "bolsitas", "motion", "nicotina", "nicotine", "tobacco", "tabaco", "zero", "cero", "mint", "drink", "affiliate", "affiliates", "afiliado", "afiliados", "free", "gym", "focus", "workout", "ejercicio", "estudiar", "study", "studying", "class", "cheap", "barato", "price", "precio", "deal", "deals", "oferta", "pack", "packs", "can", "cans", "lata", "tin", "tins", "natural", "store", "stores", "shop", "link", "links", "enlace", "enlaces", "coupon", "cupon", "code", "codigo", "discount", "descuento", "shipping", "envio", "envios", "killer", "without", "sin", "vs"],
    candles: ["trading", "crypto", "candles", "candle", "bitcoin", "btc", "fees", "referral", "affiliate", "affiliates", "afiliado", "afiliados", "price", "precio", "deal", "deals", "cheap", "barato", "link", "links", "enlace", "app", "apps", "aplicacion", "coupon", "code", "discount", "shipping"],
    vende: ["vender", "vende", "sell", "selling", "listar", "list", "listing", "local", "locales", "product", "products", "producto", "productos", "negocio", "negocios", "business", "store", "stores", "shop", "shops", "shipping", "envio"]
  };

  var isEn = /(?:\?|&)lang=en(?:&|$)/.test(location.search);
  var en = {
    home: "Home", contact: "Contact", "switch": "Español", privacy: "Privacy", terms: "Terms",
    h1: "Puerto Rico Market", ph: "Search", searchlabel: "Shopping helper (beta)", cats: "Categories",
    hint: "Try: energy, beauty, business, trading, sell…",
    t0: "All", t1: "AI for business", t2: "Affiliates", t3: "Sell with us", t4: "Beauty", always988: "Need to talk? Call or text 988 (24/7)",
    empty: "No match, see all products", seeall: "See all products",
    try: "Try a category",
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
    var q0 = document.getElementById("mk-q"); if (q0) q0.setAttribute("placeholder", en.ph);
    var tg = document.querySelector(".mk-tiles"); if (tg) tg.setAttribute("aria-label", en.cats);
  }

  var q = document.getElementById("mk-q"), cat = "all";
  var cards = document.querySelectorAll("#mk-grid .mk-card"), empty = document.getElementById("mk-empty");
  var crisisEl = document.getElementById("mk-crisis");
  var grid = document.getElementById("mk-grid");

  function tokens(term) {
    return fold(term).split(/[^a-z0-9]+/).filter(Boolean);
  }
  function idsFor(term) {
    var toks = tokens(term);
    if (!toks.length) return null;
    var ids = {};
    Object.keys(KEYS).forEach(function (id) {
      KEYS[id].forEach(function (w) {
        var re = new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
        if (re.test(term)) ids[id] = true;
      });
    });
    return ids;
  }

  function setCrisisChrome(on) {
    var see = document.getElementById("mk-see-all-wrap");
    if (see) see.hidden = !!on;
    var chips = document.querySelectorAll("#mk-chips [data-cat], .mk-tiles [data-cat], .mk-crisis [data-cat]");
    for (var i = 0; i < chips.length; i++) {
      var cat = chips[i].getAttribute("data-cat") || "";
      if (cat === "af" || cat === "vende") chips[i].hidden = !!on;
    }
  }

  function showCrisis() {
    for (var i = 0; i < cards.length; i++) cards[i].hidden = true;
    if (empty) empty.hidden = true;
    if (grid) grid.hidden = true;
    if (crisisEl) crisisEl.hidden = false;
    setCrisisChrome(true);
  }

  function apply() {
    var t = (q && q.value || "").trim();
    if (!t) {
      if (grid) grid.hidden = false;
      if (crisisEl) crisisEl.hidden = true; setCrisisChrome(false);
      setCrisisChrome(false);
      var see0 = document.getElementById("mk-see-all-wrap"); if (see0) see0.hidden = true;
      var n0 = 0;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var ok = cat === "all" || c.getAttribute("data-cat") === cat;
        c.hidden = !ok; if (ok) n0++;
      }
      if (empty) empty.hidden = n0 !== 0;
      return;
    }
    if (isCrisisText(t)) {
      showCrisis();
      return;
    }
    if (grid) grid.hidden = false;
    if (crisisEl) crisisEl.hidden = true; setCrisisChrome(false);

    var mapped = idsFor(t);
    var n = 0;
    for (var j = 0; j < cards.length; j++) {
      var card = cards[j], id = card.getAttribute("data-id") || "";
      var inCat = cat === "all" || card.getAttribute("data-cat") === cat;
      var textHit = fold(card.textContent).indexOf(fold(t)) !== -1;
      var keyHit = !!(mapped && mapped[id]);
      var ok = inCat && (textHit || keyHit);
      card.hidden = !ok; if (ok) n++;
    }
    if (n === 0) {
      for (var z = 0; z < cards.length; z++) cards[z].hidden = true;
      if (empty) empty.hidden = false;
      var seeWrap = document.getElementById("mk-see-all-wrap");
      if (seeWrap) seeWrap.hidden = false;
      if (crisisEl) crisisEl.hidden = true; setCrisisChrome(false);
      if (grid) grid.hidden = false;
      return;
    }
    var seeWrapOk = document.getElementById("mk-see-all-wrap");
    if (seeWrapOk) seeWrapOk.hidden = true;
    if (empty) empty.hidden = true;
  }

  var form = document.querySelector(".mk-search");
  if (form) form.addEventListener("submit", function (ev) { ev.preventDefault(); apply(); });
  if (q) {
    var pre = new URLSearchParams(location.search).get("q");
    if (pre) q.value = pre;
    q.addEventListener("input", apply);
  }
  var seeBtn = document.getElementById("mk-see-all");
  if (seeBtn) seeBtn.addEventListener("click", function () { if (q) q.value = ""; cat = "all"; apply(); });
  apply();
  var tiles = document.querySelectorAll(".mk-tiles button");
  function setCat(btn) {
    cat = btn.getAttribute("data-cat");
    for (var k = 0; k < tiles.length; k++) tiles[k].setAttribute("aria-pressed", tiles[k] === btn ? "true" : "false");
    apply();
  }
  for (var j = 0; j < tiles.length; j++) tiles[j].addEventListener("click", function () { setCat(this); });
  var chips = document.querySelectorAll("#mk-chips button");
  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener("click", function () {
      if (q) q.value = "";
      var want = this.getAttribute("data-cat");
      var match = null;
      for (var k = 0; k < tiles.length; k++) {
        if (tiles[k].getAttribute("data-cat") === want) match = tiles[k];
      }
      if (match) setCat(match);
      else { cat = want || "all"; apply(); }
    });
  }
})();
