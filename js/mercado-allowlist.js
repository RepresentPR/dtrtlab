/* Shopping helper allowlist — product/category/brand terms + stopwords only. Not live AI. */
(function (g) {
  "use strict";
  function fold(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  var PRODUCT = [
    "motion", "pouch", "pouches", "bolsa", "bolsas", "bolsita", "bolsitas",
    "cafeina", "caffeine", "cafe", "energia", "energy", "mint", "drink", "alternative",
    "nicotina", "nicotine", "tobacco", "tabaco",
    "jafra", "belleza", "beauty", "perfume", "piel", "skin", "skincare",
    "maquillaje", "makeup", "cosmetica", "cosmetic", "mama", "mom",
    "consultora", "consultant", "tienda", "shop",
    "candles", "candle", "trading", "crypto", "bitcoin", "btc", "fees", "referral",
    "ia", "ai", "negocio", "negocios", "business", "chatbot", "oficina", "office",
    "inteligencia", "dtrt", "lab",
    "vende", "vender", "sell", "selling", "listar", "list", "local",
    "product", "products", "producto", "productos",
    "affiliate", "affiliates", "afiliado", "afiliados",
    "todo", "all",
    "pr",
    "see", "ver", "link", "enlace", "commission", "comision"
  ];

  var STOP = [
    "a", "an", "the", "of", "for", "to", "my", "me", "in", "on", "and", "or", "with",
    "from", "at", "is", "are", "be", "i", "you", "we", "it", "our", "your", "this",
    "that", "these", "those", "vs", "as", "by", "if", "but", "about", "into", "over",
    "out", "so", "than", "then", "also", "can", "will", "just", "only", "their",
    "them", "they", "he", "she", "his", "her", "its", "do", "does", "did", "been",
    "being", "was", "were", "am", "how", "what", "where", "when", "which", "who",
    "why", "please", "looking", "look", "need", "want", "show", "find", "search",
    "de", "del", "al", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o",
    "para", "por", "con", "en", "mi", "mis", "tu", "tus", "su", "sus", "es", "son",
    "que", "se", "lo", "le", "les", "nos", "te", "yo", "usted", "nosotros",
    "esto", "esta", "este", "estos", "estas", "eso", "esa", "ese", "aqui", "alli",
    "muy", "ya", "tan", "mas", "como", "cuando", "donde", "cual", "cuales",
    "cuanto", "cuantos", "cuantas", "hay", "ser", "tiene", "tienen", "busco",
    "buscar", "ver", "quiero", "necesito"
  ];

  // "quiero" as stopword: "quiero matarme" still fails on matarme.
  // "want"/"need" as stopwords: leftover crisis tokens still fail.
  // "ver" is both product-ish CTA and stopword — already in PRODUCT too.

  var ALLOW = {};
  function addAll(arr) {
    for (var i = 0; i < arr.length; i++) ALLOW[arr[i]] = true;
  }
  addAll(PRODUCT);
  addAll(STOP);

  var BANNED = [
    "amount", "fatal", "die", "died", "dies", "dying",
    "poison", "poisoned", "poisoning",
    "pills", "pill", "pastilla", "pastillas",
    "goodbye", "wake", "kms", "unalive", "un-alive",
    "harm", "wrists", "wrist"
  ];

  function tokens(term) {
    return fold(term).split(/[^a-z0-9]+/).filter(Boolean);
  }

  function hasBanned(term) {
    var f = fold(term);
    var spaced = " " + f.replace(/[^a-z0-9]+/g, " ") + " ";
    var compact = f.replace(/[^a-z0-9]+/g, "");
    for (var i = 0; i < BANNED.length; i++) {
      var w = BANNED[i];
      if (spaced.indexOf(" " + w + " ") !== -1) return true;
      if (spaced.indexOf(" " + w) !== -1 && w.length >= 4) return true;
      if (compact.indexOf(w.replace(/-/g, "")) !== -1 && w.length >= 4) return true;
    }
    if (/\bkms\b/.test(spaced) || compact.indexOf("kms") !== -1) return true;
    if (compact.indexOf("unalive") !== -1) return true;
    return false;
  }

  function isSafeProductQuery(term) {
    var raw = String(term || "").trim();
    if (!raw) return { ok: false, reason: "empty" };
    if (hasBanned(raw)) return { ok: false, reason: "banned" };
    var toks = tokens(raw);
    if (!toks.length) return { ok: false, reason: "empty" };
    for (var i = 0; i < toks.length; i++) {
      var tok = toks[i];
      if (/\d/.test(tok)) return { ok: false, reason: "number" };
      if (!ALLOW[tok]) return { ok: false, reason: "unknown" };
    }
    return { ok: true };
  }

  var api = {
    fold: fold,
    tokens: tokens,
    isSafeProductQuery: isSafeProductQuery,
    PRODUCT: PRODUCT,
    STOP: STOP
  };
  g.DtrtMercado = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
