/* Shopping helper (beta). Matches a query to the on-page catalog only.
   No network calls. Not a live AI. Same idea as the local Ask index:
   fold the text, typo-tolerant score, return the top matches. */
(function (root) {
  "use strict";

  function fold(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  var CATALOG = [
    {
      id: "motion",
      href: "/links/#motion",
      title: { en: "MOTION caffeine pouches", es: "Bolsitas de cafeína MOTION" },
      keywords: ["energy", "energia", "energetica", "energetico", "caffeine", "cafeina", "pouch", "pouches", "bolsita", "bolsitas", "motion"]
    },
    {
      id: "jafra",
      href: "/links/#jafra",
      title: { en: "My mom's Jafra shop", es: "La tienda Jafra de mi mamá" },
      keywords: ["skin", "skincare", "perfume", "fragancia", "fragrance", "maquillaje", "makeup", "belleza", "beauty", "jafra", "cosmetic", "cosmetico", "cosmetics", "crema", "cream"]
    },
    {
      id: "ai",
      href: "/links/#ai",
      title: { en: "Ask DTRT Lab, our AI", es: "Ask DTRT Lab, nuestra IA" },
      keywords: ["ai", "ia", "negocio", "negocios", "business", "chatbot", "chat", "ask", "dtrt", "assistant", "asistente"]
    },
    {
      id: "candles",
      href: "/links/#candles",
      title: { en: "Candles", es: "Candles" },
      keywords: ["trading", "trade", "trader", "crypto", "cripto", "candles", "operar"]
    },
    {
      id: "sell",
      href: "/mercado/",
      title: { en: "Vende con nosotros", es: "Vende con nosotros" },
      keywords: ["sell", "selling", "seller", "vender", "venta", "vendedores", "mercado", "tienda"]
    }
  ];

  function tokens(q) {
    return fold(q).split(" ").filter(function (t) {
      return t.length >= 3 || t === "ai" || t === "ia";
    });
  }

  function dist(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, i, j, prev, cur;
    if (Math.abs(m - n) > 2) return 99;
    prev = [];
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  function closeTo(t, k) {
    if (!k) return false;
    if (k === t) return true;
    if (t.length >= 3 && k.length >= 3 && (k.indexOf(t) === 0 || t.indexOf(k) === 0)) return true;
    var d = dist(t, k);
    if (t.length >= 4 && k.length >= 4 && d <= 1) return true;
    if (t.length >= 7 && k.length >= 7 && d <= 2) return true;
    return false;
  }

  function hitsFor(item, toks) {
    var found = [];
    var foldedKw = item.keywords.map(function (kw) { return { raw: kw, fold: fold(kw) }; });
    toks.forEach(function (t) {
      foldedKw.forEach(function (kw) {
        if (closeTo(t, kw.fold) && found.indexOf(kw.raw) === -1) found.push(kw.raw);
      });
    });
    return found;
  }

  function why(item, hit, lang) {
    var title = item.title[lang === "es" ? "es" : "en"];
    if (lang === "es") return "Coincide con " + title + " por “" + hit + "”.";
    return "Matches " + title + " for “" + hit + "”.";
  }

  function search(query, lang) {
    var toks = tokens(query);
    if (!toks.length) return [];
    var out = [];
    CATALOG.forEach(function (item) {
      var hits = hitsFor(item, toks);
      if (hits.length) out.push({ id: item.id, href: item.href, title: item.title, hits: hits, score: hits.length, why: why(item, hits[0], lang || "en") });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  function langOf() {
    if (root.document && root.document.documentElement && root.document.documentElement.lang === "es") return "es";
    try {
      if (root.location && /(?:\?|&)lang=es(?:&|$)/.test(root.location.search)) return "es";
      if (root.location && /(?:\?|&)lang=en(?:&|$)/.test(root.location.search)) return "en";
      var saved = root.localStorage && root.localStorage.getItem("dtrt-lang");
      if (saved === "es" || saved === "en") return saved;
    } catch (e) {}
    return "es";
  }

  function bind(doc) {
    if (!doc) return;
    var input = doc.getElementById("shop-q");
    var results = doc.getElementById("shop-results");
    if (!input || !results) return;
    var emptyEn = results.getAttribute("data-empty-en") || "No catalog match for that yet. Write to us and we will point you to the closest page.";
    var emptyEs = results.getAttribute("data-empty-es") || "Todavía no hay una coincidencia en el catálogo. Escríbenos y te señalamos la página más cercana.";
    var contact = results.getAttribute("data-contact") || "/contact.html";

    function render() {
      var q = input.value;
      var lang = langOf();
      var cards = doc.querySelectorAll("[data-shop-id]");
      var matches = search(q, lang);
      while (results.firstChild) results.removeChild(results.firstChild);
      if (!fold(q)) {
        results.hidden = true;
        for (var i = 0; i < cards.length; i++) cards[i].hidden = false;
        return;
      }
      results.hidden = false;
      var shown = {};
      if (!matches.length) {
        var p = doc.createElement("p");
        p.className = "shop-empty";
        p.appendChild(doc.createTextNode((lang === "es" ? emptyEs : emptyEn) + " "));
        var a = doc.createElement("a");
        a.href = contact;
        a.textContent = lang === "es" ? "Contacto" : "Contact";
        p.appendChild(a);
        results.appendChild(p);
        for (var j = 0; j < cards.length; j++) cards[j].hidden = true;
        return;
      }
      var list = doc.createElement("ul");
      list.className = "shop-matches";
      matches.forEach(function (m) {
        shown[m.id] = true;
        var li = doc.createElement("li");
        var link = doc.createElement("a");
        link.href = m.href;
        link.textContent = m.title[lang === "es" ? "es" : "en"];
        var whyEl = doc.createElement("span");
        whyEl.className = "shop-why";
        whyEl.textContent = m.why;
        li.appendChild(link);
        li.appendChild(whyEl);
        list.appendChild(li);
      });
      results.appendChild(list);
      for (var k = 0; k < cards.length; k++) {
        cards[k].hidden = !shown[cards[k].getAttribute("data-shop-id")];
      }
    }

    input.addEventListener("input", render);
    var go = doc.getElementById("shop-go");
    if (go) go.addEventListener("click", render);
  }

  var api = { fold: fold, search: search, catalog: CATALOG, bind: bind, dist: dist };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DTRT_SHOP = api;
  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", function () { bind(root.document); });
    else bind(root.document);
  }
})(typeof window !== "undefined" ? window : globalThis);
