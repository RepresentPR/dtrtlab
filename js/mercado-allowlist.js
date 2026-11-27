/* Referral link. We earn from fees. Trading is risky, not financial advice. */
/* Shopping helper + contact pop-up: one isCrisisText. Not live AI.
   988 only on a positive crisis match (including ingest + non-food). */
(function (g) {
  "use strict";

  function nfkcLower(s) {
    return String(s || "").normalize("NFKC").toLowerCase();
  }
  function fold(s) {
    return nfkcLower(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function isLatinLetter(code) {
    if (code >= 0x41 && code <= 0x5a) return true;
    if (code >= 0x61 && code <= 0x7a) return true;
    if (code >= 0x00c0 && code <= 0x024f && code !== 0x00d7 && code !== 0x00f7) return true;
    if (code >= 0x1e00 && code <= 0x1eff) return true;
    return false;
  }

  // Harm-script / harm-emoji only. Smileys and ordinary punctuation are not crisis.
  var HARM_EMOJI = /[\u2620\u2694\u26B0\u26B1\uD83D\uDC80\uD83D\uDDA4\uD83E\uDEA6\uD83D\uDD2A\uD83E\uDE78\uD83D\uDC8A\uD83E\uDDEA\uD83D\uDC80\u2620\u9760\u9F13]/;
  // skull, coffin, blade, drop of blood, pill, test tube — also check code points simply:
  function hasHarmEmoji(s) {
    var t = String(s || "");
    if (/[\u2620\u26B0\u26B1\u2694]/.test(t)) return true;
    if (/\uD83D[\uDC80\uDDA4\uDD2A\uDC8A]/.test(t)) return true;
    if (/\uD83E[\uDEA6\uDE78\uDDEA]/.test(t)) return true;
    if (/[\u{1F480}\u{1F9A6}\u{1F5A4}\u{1F52A}\u{1FA78}\u{1F48A}\u{1F9EA}\u{26B0}\u{26B1}\u{2620}]/u.test(t)) return true;
    return false;
  }

  function hasDisallowedScript(s) {
    var t = nfkcLower(s);
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      var code = t.charCodeAt(i);
      if (isLatinLetter(code)) continue;
      if (c >= "0" && c <= "9") continue;
      if (c === " " || c === "\t" || c === "\n" || c === "\r") continue;
      if (code >= 0x21 && code <= 0x7e) continue;
      if (code >= 0x0300 && code <= 0x036f) continue;
      // combining already stripped in fold; leftover marks ok
      // Emoji / other scripts: only crisis if it's a letter from another script
      if (code >= 0x0370 && code <= 0x1fff) return true; // Greek, Cyrillic, etc.
      if (code >= 0x2c00 && code <= 0xd7ff) return true;
      if (code >= 0x0800 && code <= 0x0fff) return true; // Arabic, Devanagari, Thai, Hebrew
      if (code >= 0x0590 && code <= 0x07ff) return true;
    }
    return false;
  }

  var INGEST_RE = /\b(drink|eat|swallow|beber|tomar|comer|tragar|sip|sipping|ingerir|chupar)\b/;
  var NONFOOD_RE = /\b(jafra|cosmetica|belleza|beauty|skin|piel|perfume|perfum|shampoo|champu|esmalte|lotion|locion|candle|candles|vela|velas|wax|cera|cream|crema|soap|jabon|serum|cologne|colonia|makeup|maquillaje|cosmetic|cosmetics|skincare|fragrance|fragancia|nail)\b/;
  var POUCH_UNIT_RE = /\b(pouch|pouches|bolsita|bolsitas|can|cans|lata|latas|tin|tins)\b/;

  function qtyAtLeast(term, n) {
    var f = fold(term);
    var m, re = /\d+/g;
    while ((m = re.exec(f))) {
      if (parseInt(m[0], 10) >= n) return true;
    }
    if (/\b(dozen|docena|doce)\b/.test(f) && n <= 12) return true;
    if (/\b(diez|ten|once|eleven|doce)\b/.test(f) && n <= 10) return true;
    return false;
  }

  function hasIngestNonfood(term) {
    var f = fold(term);
    if (!INGEST_RE.test(f)) return false;
    if (NONFOOD_RE.test(f)) return true;
    if (/\bnail polish\b/.test(f)) return true;
    if (POUCH_UNIT_RE.test(f) && qtyAtLeast(term, 10)) return true;
    return false;
  }

  // Idioms that must never swallow "kill me" / "please kill me".
  // Only the gerund "killing me" in ordinary complaint, "die for", "kill time", "me muero de risa/hambre".
  var IDIOM_RE = /\b((?:price|deadline|traffic|work|homework|boss|schedule|presupuesto|oferta).{0,40}is killing me|is killing me this week|killing my (?:schedule|deadline|morning|budget|run)|(?:i(?:['’]?d)? would |i would )?die for\b|dying for\b|kill(?:ing)? some time|killing it\b|me muero de (?:risa|hambre|sueno|frio|calor))\b/;

  var CRISIS_RES = [
    /\bsuicid(?:e|io|al|arme|arse)?\b/,
    /\bsuicde\b/,
    /\b(?:kys|kms)\b/,
    /\bun-?alive\b/,
    /\bself-?harm\b/,
    /\bover\s*dose\b/,
    /\bsobredosis\b/,
    /\bahorcar(?:me|se)?\b/,
    /\bcolgar(?:me|se)?\b/,
    /\benvenen(?:ar(?:me)?)?\b/,
    /\bcortarme\b/,
    /\bslit\b/,
    /\boff\s+myself\b/,
    /\bquitar(?:me)?\s+la\s+vida\b/,
    /\bme voy a quitar la vida\b/,
    /\bno\s+quiero\s+(?:seguir\s+)?viv(?:ir|iendo)\b/,
    /\bno\s+pienso\s+seguir\s+viviendo\b/,
    /\bacabar\s+con\s+mi\s+vida\b/,
    /\bacabo de decidir acabar\b/,
    /\bquiero\s+morir(?:me)?\b/,
    /\bmatar(?:me|se)?\b/,
    /\bvoy a matarme\b/,
    /\b(?:morir|muero|muerte)\b/,
    /\bwant\s+to\s+die\b/,
    /\bhurt\s+myself\b/,
    /\bnot\s+wake\s+(?:up\s+)?tomorrow\b/,
    /\bnot wake tomorrow\b/,
    /\bsleep and not wake\b/,
    /\bno\s+despertar\b/,
    /\bno amanecer\b/,
    /\bend(?:ing)?\s+(?:it(?:\s+all)?|things|my\s+life|my own story)\b/,
    /\bend my own story\b/,
    /\btake\s+(?:my|your|his|her|their)\s+own\s+life\b/,
    /\btake\s+my\s+life\b/,
    /\bhang(?:ing)?\s+myself\b/,
    /\bjump(?:ing)?\s+(?:off|from)\b/,
    /\bpicturing a jump\b/,
    /\bcut(?:ting)?\s+(?:myself|tonight|again)\b/,
    /\bcutting tonight\b/,
    /\bno(?:body|\s+one)\s+would\s+(?:even\s+)?(?:miss|notice)/,
    /\banyone\s+would\s+notice\b/,
    /\bnotice\s+i\s+(?:was|were|am)\s+gone\b/,
    /\bplan\s+to\s+disappear\b/,
    /\bdisappear\s+for\s+good\b/,
    /\bintihar\b/,
    /\bselbstmord\b/,
    /\bsewer[\s-]?slide\b/,
    /\bsewerslide\b/,
    /\bquiero\s+desaparecer\b/,
    /\bme\s+quiero\s+ir\s+de\s+este\s+mundo\b/,
    /\bdormir\s+(?:y\s+no\s+despertar|para\s+siempre)\b/,
    /\beasy\s+(?:way\s+out|exit)\b/,
    /\bmake\s+the\s+pain\s+stop\b/,
    /\bpain\s+needs\s+to\s+stop\b/,
    /\bkill(?:ing)?\s+(?:myself|himself|herself|themselves|him|her|them)\b/,
    /\b(?:please\s+)?kill me\b/,
    /\bwant (?:someone|a person|a stranger) to kill me\b/,
    /\bneed (?:someone|a person|a stranger) to kill me\b/,
    /\bgo ahead and kill me\b/,
    /\bwant out for good\b/,
    /\bi want out\b/,
    /\bnot be here by sunrise\b/,
    /\bnot be around much longer\b/,
    /\bonly a burden\b/,
    /\ba burden now\b/,
    /\bbought rope\b/,
    /\bpainless way to leave\b/,
    /\bquiero que todo termine\b/,
    /\bausente para siempre\b/,
    /\bultimo dia que aguanto\b/,
    /\bdespedirme de todos\b/,
    /\bpastillas para esta noche\b/,
    /\bno hay salida salvo irme\b/,
    /\bthis pain is killing me\b/,
    /\blife (?:hurts|is killing me)\b/,
    /\bforme de no amanecer\b/
  ];

  function hasCrisisPhrase(term) {
    var f = fold(term);
    for (var i = 0; i < CRISIS_RES.length; i++) {
      if (CRISIS_RES[i].test(f)) return true;
    }
    // spaced / compact "die" as its own word, not inside "studies"
    if (/\bd\W*i\W*e(?:d|s|ing)?\b/.test(f) && !/\bdie for\b/.test(f) && !/\bdying for\b/.test(f) && !/\bme muero de\b/.test(f)) return true;
    if (/\b(?:fatal|letal|lethal|poison|poisoned|pills|pill|pastilla|pastillas|goodbye|unalive)\b/.test(f)) return true;
    return false;
  }

  function isIdiomOnly(term) {
    var f = fold(term);
    if (!IDIOM_RE.test(f)) return false;
    // "kill me" is never an idiom, even if some other idiom fragment appears
    if (/\b(?:please\s+)?kill me\b/.test(f)) return false;
    if (/\b(?:someone|a person|a stranger) to kill me\b/.test(f)) return false;
    var stripped = f.replace(IDIOM_RE, " ");
    if (hasCrisisPhrase(stripped)) return false;
    if (hasIngestNonfood(stripped)) return false;
    return true;
  }

  function tokens(term) {
    return fold(term).split(/[^a-z0-9]+/).filter(Boolean);
  }

  function isCrisisText(term) {
    var raw = String(term || "").trim();
    if (!raw) return false;
    if (isIdiomOnly(raw)) return false;
    if (hasHarmEmoji(raw)) return true;
    if (hasDisallowedScript(raw)) return true;
    if (hasIngestNonfood(raw)) return true;
    if (hasCrisisPhrase(raw)) return true;
    return false;
  }

  // Kept for tests / tooling. The shop UI does not use this to show 988.
  function isSafeProductQuery(term) {
    var raw = String(term || "").trim();
    if (!raw) return { ok: false, reason: "empty" };
    if (isCrisisText(raw)) return { ok: false, reason: "crisis" };
    return { ok: true };
  }

  var api = {
    nfkcLower: nfkcLower,
    fold: fold,
    tokens: tokens,
    isSafeProductQuery: isSafeProductQuery,
    isCrisisText: isCrisisText,
    hasIngestNonfood: hasIngestNonfood,
    PRODUCT: [],
    STOP: []
  };
  g.DtrtMercado = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
