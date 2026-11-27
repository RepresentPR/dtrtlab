/* Shopping helper + contact pop-up: one isCrisisText. Not live AI.
   Prominent 988 card when this returns true. Always-on 988 line is separate UI. */
(function (g) {
  "use strict";

  var LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

  function nfkc(s) { return String(s || "").normalize("NFKC"); }

  function foldAccents(s) {
    return nfkc(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function applyLeet(s) {
    return String(s).replace(/[013457@$!]/g, function (ch) { return LEET[ch]; });
  }

  function collapseSpacedLetters(s) {
    var prev = "", out = " " + String(s) + " ";
    while (out !== prev) {
      prev = out;
      out = out.replace(/(\s)([a-z](?: [a-z]){2,})(\s)/g, function (_, a, body, b) {
        return a + body.replace(/ /g, "") + b;
      });
    }
    return out.replace(/\s+/g, " ").trim();
  }

  var SPACELESS_CRISIS = /killme|killingmyself|iwanttodie|wanttodie|suicid|quieromourir|endmenow|takemylife|imatarmed|dieteonight|dieby/;

  function squeezeTo(s, keep) {
    var re = new RegExp("([a-z])\\1{" + keep + ",}", "g");
    var rep = keep === 1 ? "$1" : "$1$1";
    return String(s).replace(re, rep);
  }

  function variants(raw) {
    var f = foldAccents(raw);
    var L = applyLeet(f);
    var sp = collapseSpacedLetters(L);
    var set = {};
    [f, L, sp, collapseSpacedLetters(f), squeezeTo(sp, 2), squeezeTo(sp, 1), squeezeTo(L, 2), squeezeTo(L, 1)].forEach(function (v) {
      if (v) set[v] = true;
    });
    return Object.keys(set);
  }

  function isLatinLetter(code) {
    if (code >= 0x41 && code <= 0x5a) return true;
    if (code >= 0x61 && code <= 0x7a) return true;
    if (code >= 0x00c0 && code <= 0x024f && code !== 0x00d7 && code !== 0x00f7) return true;
    if (code >= 0x1e00 && code <= 0x1eff) return true;
    return false;
  }

  function hasHarmEmoji(s) {
    var t = String(s || "");
    // 🔪🩸💀⚰️💊🪢🔫 plus skull/coffin/pill/blade already used in r5
    if (/[\u{1F52A}\u{1FA78}\u{1F480}\u{26B0}\u{1F48A}\u{1FAA2}\u{1F52B}\u{2620}\u{26B1}\u{1F5A4}\u{1F9EA}]/u.test(t)) return true;
    // 😵 combined with another weapon/harm sign
    if (/\u{1F635}/u.test(t) && /[\u{1F52B}\u{1F52A}\u{1FAA2}\u{1F480}\u{26B0}\u{1F48A}]/u.test(t)) return true;
    return false;
  }

  function hasDisallowedScript(s) {
    var t = nfkc(s);
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      var code = t.charCodeAt(i);
      if (isLatinLetter(code)) continue;
      if (c >= "0" && c <= "9") continue;
      if (c === " " || c === "\t" || c === "\n" || c === "\r") continue;
      if (code >= 0x21 && code <= 0x7e) continue;
      if (code >= 0x0300 && code <= 0x036f) continue;
      // skip emoji / dingbats; those are handled by hasHarmEmoji
      if (code >= 0xd800 && code <= 0xdfff) {
        // surrogate; skip pair
        i++;
        continue;
      }
      if (code >= 0x2000 && code <= 0x27bf) continue;
      if (code >= 0x0370 && code <= 0x1fff) return true;
      if (code >= 0x2c00 && code <= 0xd7ff) return true;
      if (code >= 0x0800 && code <= 0x0fff) return true;
      if (code >= 0x0590 && code <= 0x07ff) return true;
    }
    return false;
  }

  var INGEST_RE = /\b(drink|eat|swallow|sip|sipping|ingerir|chupar|beb(?:er|o|es|e|emos|en|i|iste|io|erme|erte)?|tom(?:ar|o|as|a|amos|an|e|arme|arte|arlo|arla|arnos)?|com(?:er|o|es|e|emos|en|i|erme|erlo)?|trag(?:ar|o|as|a|amos|an|arme|arlo)?)\b/;
  var NONFOOD_RE = /\b(jafra|cosmetica|cosmeticos|cosmetic|cosmetics|belleza|beauty|skin|piel|perfume|perfum|shampoo|champu|esmalte|lotion|locion|candle|candles|vela|velas|wax|cera|cream|crema|soap|jabon|serum|cologne|colonia|makeup|maquillaje|skincare|fragrance|fragancia|nail|sunscreen|protector solar|protectores solares|hand sanitizer|sanitizer|hand gel|gel de manos|gel antibacterial|antibacterial|bleach|cloro|detergent|detergente|pills|pill|pastillas|pastilla)\b/;
  var POUCH_UNIT_RE = /\b(pouch|pouches|bolsita|bolsitas|can|cans|lata|latas|tin|tins)\b/;

  function qtyAtLeast(term, n) {
    var m, re = /\d+/g;
    while ((m = re.exec(term))) {
      if (parseInt(m[0], 10) >= n) return true;
    }
    if (/\b(dozen|docena|doce)\b/.test(term) && n <= 12) return true;
    if (/\b(diez|ten|once|eleven)\b/.test(term) && n <= 10) return true;
    return false;
  }

  function hasIngestNonfood(term) {
    if (!INGEST_RE.test(term)) return false;
    if (NONFOOD_RE.test(term)) return true;
    if (/\bnail polish\b/.test(term)) return true;
    if (/\bprotector solar\b/.test(term) || /\bhand sanitizer\b/.test(term) || /\bgel antibacterial\b/.test(term)) return true;
    if (POUCH_UNIT_RE.test(term) && qtyAtLeast(term, 10)) return true;
    return false;
  }

  var ALL_QTY_RE = /\b(all|whole|entire|every last|too many|too much|demasiad[oa]s?|toda la|todo el|todas las|todos los)\b/;
  var CONSUME_PRODUCT_RE = /\b(energy|pouch|pouches|bolsita|bolsitas|caffeine|cafeina|motion|can|cans|lata|latas|tin|tins)\b/;

  function hasOverConsume(term) {
    // all/whole/entire/too many/demasiadas/toda la/todo el paired with a product or ingest word
    if (ALL_QTY_RE.test(term) && (INGEST_RE.test(term) || CONSUME_PRODUCT_RE.test(term))) return true;
    return false;
  }

  function hasDangerDose(term) {
    if (hasOverConsume(term)) return true;
    if (/\b(at once|at the same time|whole can|heart stops|overdose|\bod\b|sobredosis|de una vez)\b/.test(term)) return true;
    if (/\bhow many\b[\s\S]{0,48}\bat once\b/.test(term)) return true;
    if (/\bhow much\b[\s\S]{0,48}\b(kills|to die|lethal|mata)\b/.test(term)) return true;
    if (/\bcuanto\b[\s\S]{0,48}\bmata\b/.test(term)) return true;
    if (/\bmax(?:imum)?\b[\s\S]{0,48}\bbefore\b/.test(term)) return true;
    if (/\b(lethal amount|heart quit beating|empty(?: the)? tin|all the pouches together|entire (?:can|tin) emptied|every pouch in the sleeve|paquete entero|acabo todas las bolsitas|in one (?:sitting|go)|single sitting)\b/.test(term)) return true;
    if (/\b(limit of pouches|stacking pouches|dose that makes a heart)\b/.test(term)) return true;
    return false;
  }

  var HARM_COMPLEMENT = /\b(morir|morirme|suicid|matar|matarme|quitar(?:me)? la vida|acabar con|despedida|cort(?:ar|arme)|hang|rope|pills?|pastillas?|overdose|od|lastim|dano|death|die|kill|vida\b|noche lo termino|end (?:it|me|my))\b/;

  function isMueroIdiom(term) {
    var m = term.match(/\bme muero (?:por|de) (.+)$/);
    if (!m) return false;
    return !HARM_COMPLEMENT.test(m[1]);
  }

  function isIdiom(term) {
    if (isMueroIdiom(term)) return true;
    if (/\b((?:price|deadline|traffic|work|homework|boss|schedule|budget|presupuesto|oferta|descuento).{0,40}is killing me|is killing me this week|killing my (?:schedule|deadline|morning|budget|run|weekly budget)|(?:i(?:['’]?d)? would |i would )?die for\b|dying for\b|kill(?:ing)? some time|killing it\b)\b/.test(term)) return true;
    if (/\bme muero de (?:risa|hambre|sueno|frio|calor|ganas)\b/.test(term)) return true;
    if (/\bel precio me esta matando el presupuesto\b/.test(term)) return true;
    return false;
  }

  var CRISIS_RE = new RegExp([
    "\\b(kill me|please kill me|killing myself|kill myself|end my life|take my (?:own )?life|want to die|wanna die|i(?:['’]| a)?m going to die|end me\\b)",
    "\\b(suicide|suicidal|suicidarme|suicidar(?:me)?|suicid)",
    "\\b(self[ -]?harm(?:ing)?|cutting myself|keep cutting my (?:arms|wrists|forearms)|cutting my (?:arms|wrists|forearms)|cut my (?:arms|wrists|forearms)|sigo cortandome(?: los brazos)?|cortandome los brazos|sliced my (?:arms|forearms)|opening the same cuts)",
    "\\b(stockpil(?:e|ing) my meds|saving up every pill|goodbye letter|carta (?:de |para )?despedida|ya redacte la carta)",
    "\\b(no le (?:veo|encuentro) (?:sentido|proposito)|esta noche lo termino todo|esta madrugada cierro|tonight i end)",
    "\\b(better off dead|better off (?:with me gone|without me|if i were dead)|mejor muert[oa]|happier after i(?:['’]m| am) gone|le iria mejor si yo no)",
    "\\b(disappear forever|fade out of the world|esfumarme para siempre|vanish(?:ed)? for good)",
    "\\b(no way out but (?:death|dying)|no me queda otra salida|exit except dying)",
    "\\b(ready to go,? tonight|this is the night|ya estoy listo, esta es la noche)",
    "\\b(keep hurting myself|can['’]?t stop injuring|sigo lastimandome|me estoy haciendo dano)",
    "\\b(lanzarme del|lanzarme desde|tirarme al vacio|jump off)",
    "\\b(acabar con mi vida|no quiero seguir viviendo|quitar(?:me)? la vida|me voy a quitar la vida|me quito la vida|quito la vida|quiero morir(?:me)?|matarme)",
    "\\b(no quiero continuar con vida|me voy a quitar de en medio|prefiero morirme|necesito matarme|voy a suicidarme|quiero morir ya|debo desaparecer)",
    "\\b(not be here after sunrise|don['’]?t want to wake up|let me not exist|bought a rope|pills are counted|hang this up for good)",
    "\\b(help me stop living|plan to take my own life|need a person to end me|please end my life)",
    "\\b(je veux mourir|me tuer|je ne veux plus vivre|envie de me suicider|decide de me tuer|compte mourir|boire l['’]?eau de javel)",
    "\\b(ich will sterben|selbstmord|umbringen|nicht mehr leben|lass mich sterben|trinke den bleiche)",
    "\\b(intihar|kendimi oldur|hayatta kalmak istemiyorum)",
    "\\b(quero morrer|quero acabar com a minha vida|nao quero mais viver|vou me matar|beber o cloro)",
    "\\b(voglio morire|voglio farla finita|non voglio piu vivere|voglio uccidermi)",
    "\\b(cortarme los brazos|volvi a cortarme|keep living here|reason to keep living|do better if i vanished|voy a acabar con todo|esta vez si lo voy a terminar|die tonight|die by|with a rope|a rope tonight|want to die|end it with)"
  ].join("|"));

  function isCrisisText(raw) {
    var s = String(raw || "");
    if (!s.trim()) return false;
    if (hasHarmEmoji(s)) return true;
    if (hasDisallowedScript(s)) return true;
    var vars = variants(s);
    var spaceless = applyLeet(foldAccents(s)).replace(/\s+/g, "");
    if (SPACELESS_CRISIS.test(spaceless)) return true;
    var i;
    // Idiom guard first, but only if no hard crisis phrase remains after removing the idiom span.
    for (i = 0; i < vars.length; i++) {
      if (isIdiom(vars[i]) && !CRISIS_RE.test(vars[i].replace(/\bme muero (?:por|de) [^]+$/, "").replace(/\b(?:price|deadline|traffic|work|homework|boss|schedule|budget|presupuesto|oferta|descuento).{0,40}is killing me\b/, "").replace(/\b(?:die for|dying for|kill(?:ing)? some time|killing it)\b/, ""))) {
        // still catch danger / ingest in the same string
        if (!hasIngestNonfood(vars[i]) && !hasDangerDose(vars[i]) && !CRISIS_RE.test(vars[i])) return false;
      }
    }
    for (i = 0; i < vars.length; i++) {
      var t = vars[i];
      if (CRISIS_RE.test(t)) return true;
      if (hasIngestNonfood(t)) return true;
      if (hasDangerDose(t)) return true;
    }
    return false;
  }

  g.DtrtMercado = g.DtrtMercado || {};
  g.DtrtMercado.fold = foldAccents;
  g.DtrtMercado.normalizeCrisis = function (s) { return variants(s)[0] || ""; };
  g.DtrtMercado.isCrisisText = isCrisisText;
  g.DtrtMercado.hasIngestNonfood = function (s) {
    return variants(s).some(hasIngestNonfood);
  };
  g.DtrtMercado.hasDangerDose = function (s) {
    return variants(s).some(hasDangerDose);
  };
  // kept for older callers; shop UI must not use this for 988
  g.DtrtMercado.isSafeProductQuery = function (s) { return !isCrisisText(s); };
})(typeof window !== "undefined" ? window : globalThis);
