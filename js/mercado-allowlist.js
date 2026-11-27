/* Shopping helper allowlist — NFKC first; unknown script => crisis. Not live AI. */
(function (g) {
  "use strict";

  function nfkcLower(s) {
    return String(s || "").normalize("NFKC").toLowerCase();
  }
  function fold(s) {
    return nfkcLower(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // After NFKC+lower: basic Latin letters, digits, whitespace, ordinary ASCII
  // punctuation (printable ASCII), and Spanish accented letters are allowed.
  // Cyrillic, CJK, emoji, leftover full-width/circled letters, symbols, ZWSP => UNKNOWN.
  var SPANISH = "áéíóúüñ";
  function hasDisallowedChar(s) {
    var t = nfkcLower(s);
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      var code = t.charCodeAt(i);
      if (c >= "a" && c <= "z") continue;
      if (c >= "0" && c <= "9") continue;
      if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f" || c === "\v") continue;
      if (code >= 0x21 && code <= 0x7e) continue;
      if (SPANISH.indexOf(c) !== -1) continue;
      return true;
    }
    return false;
  }

  var PRODUCT = [
    "motion", "pouch", "pouches", "bolsa", "bolsas", "bolsita", "bolsitas",
    "cafeina", "caffeine", "cafe", "energia", "energy", "mint", "drink", "alternative",
    "nicotina", "nicotine", "tobacco", "tabaco", "zero", "cero",
    "jafra", "belleza", "beauty", "perfume", "piel", "skin", "skincare",
    "maquillaje", "makeup", "cosmetica", "cosmetic", "cosmetics", "cosmeticos",
    "mama", "mom", "consultora", "consultant", "tienda", "shop", "store", "stores",
    "candles", "candle", "trading", "crypto", "bitcoin", "btc", "fees", "referral",
    "ia", "ai", "negocio", "negocios", "business", "chatbot", "oficina", "office",
    "inteligencia", "artificial", "dtrt", "lab",
    "vende", "vender", "sell", "selling", "listar", "list", "local", "locales",
    "product", "products", "producto", "productos",
    "affiliate", "affiliates", "afiliado", "afiliados",
    "pr",
    "see", "ver", "link", "links", "enlace", "enlaces", "commission", "comision",
    "gift", "gifts", "regalo", "regalos", "present", "presents",
    "price", "prices", "precio", "precios", "cost", "costs", "costo", "costos",
    "cheap", "cheaper", "barato", "barata", "baratos", "baratas",
    "deal", "deals", "oferta", "ofertas", "sale", "discount", "descuento",
    "best", "seller", "sellers",
    "free", "care", "buy", "buying", "comprar", "compra",
    "gym", "focus", "enfoque", "workout", "ejercicio",
    "cream", "crema", "lotion", "serum", "jabon", "soap",
    "natural", "organic", "organico", "quality", "calidad",
    "pack", "packs", "can", "cans", "lata",
    "birthday", "cumple", "cumpleanos", "holiday", "navidad",
    "favorite", "favorito", "favorita", "popular", "top",
    "morning", "manana", "routine", "rutina"
  ];

  var STOP = [
    "a", "an", "the", "of", "for", "to", "my", "me", "in", "on", "and", "or", "with",
    "from", "at", "is", "are", "be", "i", "you", "we", "it", "our", "your", "this",
    "that", "these", "those", "vs", "as", "by", "if", "but", "about", "into", "over",
    "out", "so", "than", "then", "also", "can", "will", "just", "only", "their",
    "them", "they", "he", "she", "his", "her", "its", "do", "does", "did", "been",
    "being", "was", "were", "am", "how", "what", "where", "when", "which", "who",
    "why", "please", "looking", "look", "need", "want", "show", "find", "search",
    "something", "some", "any", "get", "got", "one", "good", "great", "nice",
    "de", "del", "al", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o",
    "para", "por", "con", "en", "mi", "mis", "tu", "tus", "su", "sus", "es", "son",
    "que", "se", "lo", "le", "les", "nos", "te", "yo", "usted", "nosotros",
    "esto", "esta", "este", "estos", "estas", "eso", "esa", "ese", "aqui", "alli",
    "muy", "ya", "tan", "mas", "como", "cuando", "donde", "cual", "cuales",
    "hay", "ser", "tiene", "tienen", "busco", "buscar", "ver", "quiero", "necesito",
    "algo", "mejor"
  ];

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

  var QUANTITY_RE = /\b((all the)|too much|too many|how many|\bwhole\b|\bentire\b|todo el|toda la|todos los|todas las|demasiado)\b/;

  var CRISIS_RE = /\b(suicid(?:e|io|al|arme)?|suicde|kys\b|kms\b|unalive|un-alive|kill(?:ing)?(?:\s+my(?:self)?)?|matar(?:me)?|morir|muero|muerte|overdose|over\s*dose|sobredosis|quitarme\s+la\s+vida|ahorcar(?:me)?|envenen(?:ar(?:me)?)?|cortarme|no\s+quiero\s+vivir|no\s+aguanto|self-?harm|slit|end(?:ing)?\s+(?:it|my\s+life)|off\s+myself)\b/;

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

  function hasQuantity(term) {
    return QUANTITY_RE.test(fold(term));
  }

  function isSafeProductQuery(term) {
    var raw = String(term || "").trim();
    if (!raw) return { ok: false, reason: "empty" };
    if (hasDisallowedChar(raw)) return { ok: false, reason: "script" };
    if (hasBanned(raw)) return { ok: false, reason: "banned" };
    if (hasQuantity(raw)) return { ok: false, reason: "quantity" };
    var toks = tokens(raw);
    if (!toks.length) return { ok: false, reason: "empty" };
    for (var i = 0; i < toks.length; i++) {
      var tok = toks[i];
      if (/\d/.test(tok)) return { ok: false, reason: "number" };
      if (!ALLOW[tok]) return { ok: false, reason: "unknown" };
    }
    return { ok: true };
  }

  function isCrisisText(term) {
    var raw = String(term || "").trim();
    if (!raw) return false;
    if (hasDisallowedChar(raw)) return true;
    if (hasBanned(raw)) return true;
    if (CRISIS_RE.test(fold(raw))) return true;
    return false;
  }

  var api = {
    nfkcLower: nfkcLower,
    fold: fold,
    tokens: tokens,
    isSafeProductQuery: isSafeProductQuery,
    isCrisisText: isCrisisText,
    PRODUCT: PRODUCT,
    STOP: STOP
  };
  g.DtrtMercado = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
