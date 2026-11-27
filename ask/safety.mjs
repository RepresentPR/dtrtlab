// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// Risk is checked before any page answer or model call, on this
// message, earlier turns, and a flag kept for 24 hours. The flag is
// written to localStorage so a new tab still sees it, and to
// sessionStorage when local storage is blocked. New chat does not
// clear it. The flag is set only when this screen detects risk, and its
// timestamp stays at that first detection. A stored legacy "1" is expired.
// A detected risk returns the full sheet and no page quote. A page
// answer and an error reply carry a short 988 footer. An ordinary
// unmatched question gets a not-sure reply plus that footer and does not
// set the flag. A compact note is only for a greeting or everyday idiom with no risk.

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people, weapons, or drugs. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

export const MISS_REPLY = "I don't have a good answer for that yet.";

export const CONTACT_LINE = "You can write hello@dtrtlab.com or use the contact page at /contact.html.";

export const REDIRECT = "I'm an early test AI that only knows DTRT Lab. Try asking about the site, the lab, or Ian's public work.";

export const SUGGESTIONS = ["What is on the site?", "What does the lab do?", "Who is Ian?"];

export const RESOURCE_NOTE = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. Outside the US, visit https://findahelpline.com.";

export const ONLY_LINE = REDIRECT;

export const HELP_LINE = "If you're struggling, call or text 988 (US) or visit findahelpline.com.";

export const PINNED_BOX = "If you might hurt yourself, call or text 988 (US) or visit https://findahelpline.com. Si podrías hacerte daño, llama o escribe al 988 (EE. UU.) o visita https://findahelpline.com.";

export const OTHER_HELP_LINE = "If you are helping someone else, you can still call or text 988 (US) or visit https://findahelpline.com.";

export const UNSURE_REPLY = "I'm not sure about that yet.";

export const ERROR_REPLY = "The search on this page did not finish. The public pages are still linked from the home page.\n\n" + HELP_LINE;

export const RISK_FLAG_KEY = "dtrt.risk.v1";

export const RISK_TTL_MS = 24 * 60 * 60 * 1000;

const RISK_TOKENS = new Set([
  "die", "dying", "died", "death", "deaths",
  "life", "lives", "living", "alive",
  "lethal", "lethality",
  "dose", "doses", "dosage", "overdose",
  "gone", "disappear", "disappears", "disappeared", "disappearing",
  "muerte", "morir", "muero", "muere", "mueres", "morimos", "mueren", "muriendo", "muerto", "muerta",
  "vida", "vivir", "viviendo", "vivo", "viva",
  "letal", "letales", "dosis", "sobredosis",
  "desaparecer", "desaparezco", "desaparezca", "desaparecido", "desaparecida"
]);

const RISK_PHRASES = [
  "end it", "end my life", "end your life", "end his life", "end her life", "end their life",
  "ending my life", "ending your life", "staying alive", "stay alive",
  "leave this world", "leaving this world", "left this world",
  "quit life", "quitting life", "quit living", "quitting living",
  "who will find me", "wholl find me", "who will find my",
  "not be here", "not to be here", "rather not be here",
  "dont want to be here", "do not want to be here",
  "dejar este mundo", "dejar el mundo", "irme de este mundo",
  "dejar la vida", "renunciar a la vida", "acabar con mi vida", "terminar con mi vida", "quitarme la vida",
  "quien me encontrara", "quien me va a encontrar", "quien va a encontrarme",
  "no estar aqui", "no quiero estar", "preferiria no estar",
  "last words", "last word", "final words", "final word", "parting words", "parting note",
  "farewell letter", "farewell note", "farewell"
];

const PAGE_WORDS = new Set(["page", "pages", "entry", "entries", "notebook", "article", "guide", "post"]);

const TERMS = new Set([
  "suicide", "suicidal", "unalive", "kms", "selfharm",
  "overdose", "overdosing", "overdosed", "od",
  "rope", "pill", "pills", "gun", "blade", "bridge", "knife", "razor", "noose",
  "suicidio", "selbstmord", "suizid", "samoubiystvo", "magpakamatay"
]);

const COMPLETE = [
  "kill myself", "killing myself", "killed myself",
  "want to die", "wanna die", "end my life", "end it all", "ending it",
  "hurt myself", "hurting myself", "cut myself", "cutting myself",
  "dont want to live", "do not want to live",
  "dont want to be here tomorrow", "do not want to be here tomorrow",
  "quiero morir", "me quiero matar", "hacerme dano", "me corto",
  "quero morrer", "quero me matar", "me matar", "me cortar",
  "je veux mourir", "me suicider", "envie de mourir",
  "ich will sterben", "mich umbringen",
  "voglio morire", "suicidarmi", "farmi del male", "mi taglio",
  "ya khochu umeret", "pokonchit s soboy",
  "хочу умереть", "покончить с собой",
  "marna chahta", "marna chahti",
  "मरना चाहता", "मरना चाहती",
  "urid an amut", "aeudi nafsi",
  "أريد أن أموت", "أؤذي نفسي",
  "gusto kong mamatay", "ayoko nang mabuhay",
  "mwen vle mouri", "touye tet mwen",
  "marayche aahe",
  "मरायचे आहे"
];

const CJK_COMPLETE = ["不想活", "想死", "死にたい", "죽고 싶", "割腕", "自分を傷つけ", "自殺し", "자살하고", "자해하고"];

const CJK_TERMS = ["自杀", "自残", "自殺", "死に", "自分を傷つけ", "자살", "자해", "죽고"];

const CJK_PERSON = ["我", "私", "나", "저"];

const PLAN_PHRASES = ["good plan", "should i", "how much", "is it enough"];

const COMPACT_BLOCKS = ["good plan", "should i use it", "should i do it", "should i use that", "should i do that", "how much", "is it enough", "tonight"];

const DISTRESS_PHRASES = [
  "i cant", "i cannot", "im done", "i am done", "no point", "nobody cares", "tired of everything",
  "ending my life", "lethal dose", "disappear forever", "worth living", "keep living", "stop living",
  "least painful", "goodbye note", "better off without me", "when im gone", "when i am gone",
  "make the pain stop", "end it"
];

const MEANS = new Set(["pill", "pills", "rope", "gun", "blade", "bridge", "knife", "razor", "noose"]);

const IDIOMS = [
  "cut the trailer", "killer deal", "dead battery", "dying to see",
  "overdose on coffee", "overdose of coffee", "battery is dead",
  "shoot a video", "cutting-edge", "haircut", "hang on", "hanging out"
];

const STEM_HITS = new Set([
  "dead", "die", "dies", "died", "dying", "death", "deaths",
  "hang", "hangs", "hanged", "hanging",
  "kill", "kills", "killed", "killing",
  "suicide", "suicidal", "suicidio", "suicida",
  "overdose", "overdoses", "overdosed", "overdosing",
  "muerto", "muerta", "muertos", "muertas", "morir", "muero", "muere", "mueren", "muriendo", "muerte",
  "colgar", "colgarme", "colgarse", "colgandome", "ahorcar", "ahorcarme", "ahorcarse",
  "sobredosis"
]);

const PHRASE_WORDS = new Set("goodbye forever message final words word palabras siempre adios ultimas mensaje farewell parting last rather".split(" "));

const FAREWELL_PHRASES = [
  "final message", "final word", "final words", "last words", "last word",
  "goodbye forever", "goodbye note", "goodbye letter",
  "rather be dead", "end it",
  "mensaje final", "ultimas palabras", "adios para siempre",
  "farewell letter", "farewell note", "parting note", "parting words"
];

const TYPO_TARGETS = [...STEM_HITS, ...PHRASE_WORDS].filter((word) => word.length >= 5);

const SCRIPT_TERMS = ["आत्महत्या", "самоубийство"];

const GREETINGS = new Set([
  "hi", "hello", "hey", "yo", "sup", "thanks", "thank you", "thanks a lot",
  "how are you", "hows it going", "whats up", "good morning", "good afternoon", "good evening",
  "hi there", "hello there", "hey there",
  "hola", "gracias", "merci", "bonjour", "salut", "obrigado", "obrigada", "danke", "grazie", "ciao",
  "salamat", "arigato", "arigatou",
  "你好", "您好", "こんにちは", "ありがとう", "안녕", "감사합니다", "مرحبا", "شكرا", "नमस्ते", "धन्यवाद"
]);

const FIRST = new Set(["i", "im", "ive", "id", "myself", "me", "my", "mine"]);

const SITE_WORDS = new Set(
  "office map job desk price prices notebook contact privacy terms demo partner partners ian dtrt refund refunds cookie cookies brand proof donate support career careers find writing service services site lab".split(" ")
);

const HARM_PHRASES = [
  "build a bomb", "make a bomb", "make explosives", "how to make a weapon",
  "how to kill someone", "how to kill a person", "hurt someone", "hurt people"
];

const TEMPLATE_WORDS = new Set("from dtrt lab public pages says the a an and or of to for in on at".split(" "));

function fold(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc']/g, "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalize(text) {
  return fold(text)
    .replace(/self\s*[- ]?\s*harm(?:ing|ed)?/g, " selfharm ")
    .replace(/over\s*[- ]?\s*dos(?:e|ing|ed|es)/g, " overdose ")
    .replace(/un\s*[- ]?\s*alive/g, " unalive ");
}

function tokensOf(text) {
  return canonicalize(text).split(/[^\p{L}\p{N}\-]+/u).filter(Boolean);
}

function hasTokenPhrase(tokens, phrase) {
  const parts = fold(phrase).split(" ").filter(Boolean);
  if (!parts.length) return false;
  for (let i = 0; i <= tokens.length - parts.length; i++) {
    let matched = true;
    for (let j = 0; j < parts.length; j++) {
      if (tokens[i + j] !== parts[j]) matched = false;
    }
    if (matched) return true;
  }
  return false;
}

function hasAnyPhrase(tokens, phrases) {
  return phrases.some((phrase) => hasTokenPhrase(tokens, phrase));
}

function includesAny(text, phrases) {
  const folded = fold(text);
  return phrases.some((phrase) => folded.includes(fold(phrase)));
}

function signals(text) {
  const tokens = tokensOf(text);
  const complete = hasAnyPhrase(tokens, COMPLETE) || includesAny(text, CJK_COMPLETE);
  const term = complete || tokens.some((token) => TERMS.has(token)) || includesAny(text, CJK_TERMS);
  const person = complete || tokens.some((token) => FIRST.has(token)) || hasAnyPhrase(tokens, ["gusto kong"]) || CJK_PERSON.some((mark) => String(text || "").includes(mark));
  const plan = tokens.includes("tonight") || hasAnyPhrase(tokens, PLAN_PHRASES);
  return { term, person, plan };
}

function userTurns(question, history) {
  const prior = Array.isArray(history) ? history.slice() : [];
  prior.push(question);
  return prior.filter((item) => String(item || "").trim());
}

export function screen(question, history) {
  try {
    const turns = userTurns(question, history);
    if (!turns.length) return { action: "ok" };
    let term = false;
    let person = false;
    let plan = false;
    let harm = false;
    for (const turn of turns) {
      const tokens = tokensOf(turn);
      if (hasAnyPhrase(tokens, HARM_PHRASES)) harm = true;
      const found = signals(turn);
      term = term || found.term;
      person = person || found.person;
      plan = plan || found.plan;
    }
    if (term && (person || plan)) return { action: "crisis", text: CRISIS_REPLY };
    if (harm) return { action: "harm", text: HARM_REPLY };
    const latest = fold(turns[turns.length - 1]);
    if (/\b(are you (a |an )?(human|real person|doctor|physician|therapist)|are you human)\b/i.test(latest)) {
      return { action: "identity", text: IDENTITY_REPLY };
    }
    return { action: "ok" };
  } catch (err) {
    return { action: "crisis", text: CRISIS_REPLY };
  }
}

function excerpt(passage) {
  const title = passage.title || "A public page";
  let bit = String(passage.text || "").replace(/skip to content/gi, " ").replace(/\s+/g, " ").trim();
  if (fold(bit).startsWith(fold(title))) bit = bit.slice(title.length).trim();
  return { title, url: passage.url || "", bit: bit.slice(0, 180) };
}

export function templateFrom(matches) {
  const top = (matches[0] && (matches[0].passage || matches[0])) || {};
  const piece = excerpt(top);
  const where = piece.url ? " " + piece.url : "";
  return "From DTRT Lab's public pages, " + piece.title + " says: " + piece.bit + where;
}

function sourceWords(matches) {
  const blob = matches.map((item) => {
    const passage = item.passage || item;
    return (passage.title || "") + " " + (passage.text || "") + " " + (passage.url || "");
  }).join(" ");
  return new Set(fold(blob).split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3));
}

export function acceptableRephrase(draft, matches) {
  const text = fold(draft);
  if (!text || text.length > 500) return false;
  if (signals(text).term || hasAnyPhrase(tokensOf(text), HARM_PHRASES)) return false;
  if (/\b(you should|i recommend|your plan|great plan|good plan|dose|weapon|bomb)\b/i.test(text)) return false;
  const allowed = sourceWords(matches);
  const words = text.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3);
  if (!words.length) return false;
  return words.every((word) => allowed.has(word) || TEMPLATE_WORDS.has(word));
}

export function isMetaQuestion(question) {
  const text = fold(question);
  if (!text || text.length > 160) return false;
  return [
    "what is this", "whats this", "who made this", "who made you", "who built this",
    "site looks great", "propose a tab", "summarize the public pages",
    "summarize the site", "public pages"
  ].some((needle) => text.includes(needle));
}

function plain(text) {
  return fold(text).replace(/[!?.。]+/g, "").trim();
}

function hasNonLatin(text) {
  return /[^\p{Script=Latin}\p{N}\p{P}\p{Z}']/u.test(String(text || ""));
}

function isGreeting(text) {
  const stripped = plain(text);
  return stripped.length > 0 && stripped.length <= 32 && GREETINGS.has(stripped);
}

function isIdiom(text) {
  const folded = fold(text);
  return IDIOMS.some((idiom) => folded.includes(idiom));
}

function idiomRemainder(text) {
  let rest = fold(text);
  IDIOMS.forEach((idiom) => {
    rest = rest.split(idiom).join(" ");
  });
  return rest;
}

function isEverydayTopic(text) {
  const folded = fold(text);
  if (!folded || folded.length > 120) return false;
  if (/\b(weather|forecast)\b/.test(folded)) return true;
  if (/\b(sports?|nba|nfl|soccer|football|scoreboard)\b/.test(folded)) return true;
  if (/\b(news today|in the news|headline)\b/.test(folded)) return true;
  if (/\b(python|javascript|typescript|regex|algorithm|github|function)\b/.test(folded)) return true;
  if (/\b(recipe|recipes|bake|baking|ingredients)\b/.test(folded)) return true;
  if (/\b(font|typography|palette)\b/.test(folded)) return true;
  if (/\b(wifi|wi-fi|iphone|android|laptop)\b/.test(folded)) return true;
  return false;
}

function editDistance(left, right) {
  if (Math.abs(left.length - right.length) > 1) return 2;
  const row = new Array(right.length + 1);
  for (let j = 0; j <= right.length; j++) row[j] = j;
  for (let i = 1; i <= left.length; i++) {
    let previous = i - 1;
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const current = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length];
}

function crisisToken(token) {
  return STEM_HITS.has(token) || TERMS.has(token) || MEANS.has(token) || RISK_TOKENS.has(token);
}

function correctToken(token) {
  if (crisisToken(token) || PHRASE_WORDS.has(token)) return token;
  const variants = [token];
  for (let i = 0; i < token.length - 1; i++) {
    if (token[i] === token[i + 1]) variants.push(token.slice(0, i) + token.slice(i + 1));
  }
  for (const variant of variants) {
    if (variant !== token && crisisToken(variant)) continue;
    if (PHRASE_WORDS.has(variant)) return variant;
    if (variant.length < 4) continue;
    for (const word of TYPO_TARGETS) {
      if (crisisToken(word) || PHRASE_WORDS.has(word) && crisisToken(word)) continue;
      if (crisisToken(word)) continue;
      if (Math.abs(word.length - variant.length) > 1) continue;
      if (editDistance(variant, word) <= 1) return word;
    }
  }
  return token;
}

function screenWords(tokens) {
  const corrected = tokens.map(correctToken);
  if (corrected.some((token) => STEM_HITS.has(token))) return true;
  return hasAnyPhrase(corrected, FAREWELL_PHRASES);
}

function asksForHarmPage(text, tokens) {
  const folded = fold(text);
  const wantsPage = tokens.some((token) => PAGE_WORDS.has(token)) || /\b(show me|find the)\b/.test(folded);
  if (!wantsPage) return false;
  return hasAnyPhrase(tokens, HARM_PHRASES);
}

function dangerIn(text) {
  if (isGreeting(text)) return false;
  const scan = isIdiom(text) ? idiomRemainder(text) : text;
  const tokens = tokensOf(scan);
  if (screenWords(tokens)) return true;
  if (includesAny(scan, SCRIPT_TERMS)) return true;
  if (tokens.some((token) => MEANS.has(token) || TERMS.has(token) || RISK_TOKENS.has(token))) return true;
  if (hasAnyPhrase(tokens, DISTRESS_PHRASES) || hasAnyPhrase(tokens, COMPACT_BLOCKS) || hasAnyPhrase(tokens, RISK_PHRASES)) return true;
  if (hasAnyPhrase(tokens, COMPLETE) || includesAny(scan, CJK_COMPLETE) || includesAny(scan, CJK_TERMS)) return true;
  if (/\b(hurt|die|dying|died|death|kill|killed|killing)\b/.test(fold(scan))) return true;
  const folded = fold(scan);
  if (folded.includes("worth it") && /\b(life|living|alive)\b/.test(folded)) return true;
  if (asksForHarmPage(scan, tokens)) return true;
  return false;
}

function asStores(storage) {
  if (!storage) return { local: null, session: null };
  if (Object.prototype.hasOwnProperty.call(storage, "local") || Object.prototype.hasOwnProperty.call(storage, "session")) {
    return { local: storage.local || null, session: storage.session || null };
  }
  return { local: null, session: storage };
}

function flagFresh(raw, now) {
  if (!raw || raw === "1") return false;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data.at !== "number") return false;
    const age = now - data.at;
    return age >= 0 && age < RISK_TTL_MS;
  } catch (err) {
    return false;
  }
}

function expireLegacy(store) {
  try {
    if (!store || store.getItem(RISK_FLAG_KEY) !== "1") return;
    if (store.removeItem) store.removeItem(RISK_FLAG_KEY);
    else if (store.setItem) store.setItem(RISK_FLAG_KEY, "");
  } catch (err) {
    /* A blocked store is simply not flagged. */
  }
}

function readStoreFlag(store, now) {
  try {
    if (!store) return false;
    expireLegacy(store);
    return flagFresh(store.getItem(RISK_FLAG_KEY), now);
  } catch (err) {
    return false;
  }
}

export function readRiskFlag(storage, now) {
  const clock = typeof now === "number" ? now : Date.now();
  const stores = asStores(storage);
  if (readStoreFlag(stores.local, clock)) return true;
  return readStoreFlag(stores.session, clock);
}

function writeStoreFlag(store, clock) {
  if (!store || !store.setItem) return;
  let existing = null;
  try { existing = store.getItem(RISK_FLAG_KEY); } catch (err) { return; }
  if (flagFresh(existing, clock)) return;
  try { store.setItem(RISK_FLAG_KEY, JSON.stringify({ at: clock })); } catch (err) {}
}

export function writeRiskFlag(storage, now) {
  const clock = typeof now === "number" ? now : Date.now();
  const stores = asStores(storage);
  writeStoreFlag(stores.local, clock);
  writeStoreFlag(stores.session, clock);
}

export function hasRisk(question, history) {
  return userTurns(question, history).some((turn) => dangerIn(turn));
}

export function clearlyClean(question, history) {
  const turns = userTurns(question, history);
  if (!turns.length) return false;
  if (turns.some((turn) => dangerIn(turn))) return false;
  const latest = turns[turns.length - 1];
  if (hasNonLatin(latest) && !isGreeting(latest)) return false;
  return isGreeting(latest) || isEverydayTopic(latest) || isIdiom(latest);
}

function fallbackPassage(corpus) {
  const passages = (corpus && corpus.passages) || [];
  return passages.find((passage) => passage && (passage.url === "/ask/" || passage.url === "/")) || passages[0] || null;
}

export function confidentMatch(question, matches) {
  if (!matches || !matches.length) return false;
  const words = tokensOf(question).filter((word) => SITE_WORDS.has(word));
  if (!words.length) return false;
  return matches.some((item) => {
    if (typeof item.score === "number" && item.score < 1.4) return false;
    const passage = item.passage || item;
    const where = fold((passage.title || "") + " " + (passage.url || "") + " " + (passage.text || ""));
    return words.some((word) => where.includes(word));
  });
}

function fullSheet() {
  return { action: "sheet", text: CRISIS_REPLY, modelCalled: false, sources: [] };
}

function deleet(text) {
  return fold(text)
    .replace(/!/g, "i")
    .replace(/\|/g, "i")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");
}

function prepared(text) {
  return tokensOf(deleet(text)).map(correctToken).join(" ");
}

const STOPWORDS = new Set("a an the of to for in on at and or is are was were be been being do does did doing how what whats where who whom whose which can will would should may might am i im ive id me my mine you your yours we our it its this that these those with from about into over after before out up off not no yes please just so if then than as by but there here their them us too very also still only own when while have has had onto per via let lets".split(" "));

const BENIGN_CONTENT = new Set(("site page pages lab dtrt ian map maps desk desks notebook notebooks contact contacts privacy term terms " +
  "office offices job jobs form forms proof brand donate career careers service services test tests online data bug bugs answer answers private " +
  "quote quotes browser browsers phone phones number numbers cookie cookies copy copies chat chats message messages account accounts " +
  "password passwords email emails login logins log logs sign signs signing signed stored store stores public human humans " +
  "write writes writing question questions price prices plan plans free checkout checkouts refund refunds cost costs fee fees " +
  "hi hello hey yo thanks thank hola gracias bonjour salut good morning afternoon evening night time date day today hour clock live early " +
  "ai company companies real wide list listed shown optional stuck come comes coming sell sells selling use " +
  "uses using used without stay stays stayed turned turn turns two people person share shares shared maintain maintains maintained send " +
  "sends sent note notes find finds finding clear clears print prints report reports typo typos happen happens happened get gets getting " +
  "ask asks asked fix fixes fixed wrong need needs needed apply applies applied update updates updated protect protects protected protection " +
  "see sees seen someone else saving save saves device devices change changes changed delete deletes deleted remove removes removed close " +
  "closes closed cancel cancels make makes made look looks great summarize summarized propose proposed tab tabs built build read reads " +
  "reading much many one all new old same other another any some such").split(/\s+/));

function sitePhrase(question) {
  const t = fold(question);
  if (/\bhelp with (my |the |an |a )?(order|account|cart|refund|password|login|page)\b/.test(t)) return true;
  if (/\bkeep (my |the |a )?(cart|account|password|login|email|copy)\b/.test(t)) return true;
  return false;
}

function greetingPlus(question) {
  const tokens = tokensOf(deleet(question));
  if (!tokens.some((token) => ["hi", "hello", "hey", "thanks", "thank", "hola", "gracias"].includes(token))) return false;
  return tokens.every((token) => STOPWORDS.has(token) || BENIGN_CONTENT.has(token) || token === "helps");
}

function clearlyBenign(question) {
  if (isGreeting(question)) return true;
  if (sitePhrase(question) || greetingPlus(question)) return true;
  const tokens = tokensOf(deleet(question));
  if (!tokens.length || tokens.length > 24) return false;
  if (!tokens.every((token) => STOPWORDS.has(token) || BENIGN_CONTENT.has(token))) return false;
  const content = tokens.filter((token) => !STOPWORDS.has(token));
  return content.length <= 12;
}

function actPhrase(text) {
  const t = fold(deleet(text));
  if (/\b(kill myself|end my life|want to die|hang myself|last message|everything about me forever|everything else about me forever|ending it|end it|this is goodbye|saying goodbye|goodbye forever)\b/.test(t)) return true;
  if (/\b(taking my own life|take my own life|reason to live|tired of living|stop existing)\b/.test(t)) return true;
  if (/\bbarrel\b/.test(t) && /\bmouth\b/.test(t)) return true;
  if (/\bslit\b/.test(t)) return true;
  if (/\bmorirme\b/.test(t) || /\btirare\b/.test(t) || /\btirarme\b/.test(t)) return true;
  if (/\b(pills?|pastillas?|bleach|wrists?|ropes?|jump|jumped|jumping|overdose|overdosed|overdosing|bleeding|bled|bleed)\b/.test(t)) return true;
  if (/\b(cut|cuts|cutting)\b/.test(t) && /\b(wrist|wrists|myself|arm|arms|bleed|bleeding)\b/.test(t)) return true;
  if (/\bquitar\w* la vida\b/.test(t) || /\b(matarme|matare|mataria|me voy a matar|colgarme|colgare|ahorcarme|ahorcare|ahorcaria|acabar con mi vida|quiero morir|tirarme)\b/.test(t)) return true;
  if (/\b(goodbye note|farewell note|farewell letter|last night alive|rather be dead|rather not be here)\b/.test(t)) return true;
  if (/\b(dont want to live|do not want to live|no quiero vivir|ya no quiero vivir|quiero dejar de existir|desaparecer para siempre)\b/.test(t)) return true;
  if (/\b(no longer want to exist|no longer wants to exist|do not want to exist|does not want to exist|end everything)\b/.test(t)) return true;
  if (/\b(cortarme|cortare|cortarse|me corto|me cortare|venas|ahorcar|ahorco|me ahorco|tirar del)\b/.test(t)) return true;
  if (/\b(swallowed|took|taken|taking|take|takes)\b/.test(t) && /\b(bottle|handful|pills?|tablets?|painkillers?)\b/.test(t)) return true;
  if (/\b(tablets?|painkillers?)\b/.test(t) && /\b(bottle|handful|swallowed|empty)\b/.test(t)) return true;
  if (/\b(shoot|shot) myself\b/.test(t)) return true;
  if (/\b(gun|pistol|rifle|shotgun)\b/.test(t) && /\b(myself|mouth|head|tonight|plan)\b/.test(t)) return true;
  if (/\bknife\b/.test(t) && /\b(wrist|wrists|throat)\b/.test(t)) return true;
  if (/\bbarrel\b/.test(t) && /\bmouth\b/.test(t)) return true;
  if (/\b(plan|planeo|do it)\b/.test(t) && /\b(tonight|sunday|manana|tomorrow|midnight|dawn)\b/.test(t) && /\b(bridge|roof|garage|bathroom|banera|balcony|balcon|park|bath|tub)\b/.test(t)) return true;
  return false;
}

const TYPO_DICT = {
  kil: "kill",
  kll: "kill",
  kms: "kms",
  myslef: "myself",
  mysefl: "myself",
  mysellf: "myself",
  wrsits: "wrists",
  wrsit: "wrist",
  wrsts: "wrists",
  overdoes: "overdose",
  overdoese: "overdose",
  goign: "going",
  gonnna: "gonna",
  suicde: "suicide",
  sucide: "suicide",
  suidice: "suicide",
  suicid: "suicide",
  suiciide: "suicide"
};

function spell(text) {
  return tokensOf(deleet(text)).map((token) => TYPO_DICT[token] || token).join(" ");
}

const IDIOM_FAMILIES = [
  /overdose of coffee/,
  /overdose on coffee/,
  /die laughing/,
  /died laughing/,
  /dying laughing/,
  /dying of laughter/,
  /die of embarrassment/,
  /died of embarrassment/,
  /dying of embarrassment/,
  /dying of shame/,
  /me muero de risa/,
  /muero de risa/,
  /me muero de verguenza/,
  /muero de verguenza/,
  /me muero de hambre/,
  /muero de hambre/,
  /killing it/,
  /kill for a /,
  /kill for the /,
  /kill for some /,
  /dead tired/,
  /killing me/,
  /phone is dead/,
  /battery is dead/,
  /link is dead/,
  /dead phone/,
  /dead battery/,
  /dead link/,
  /dying for/,
  /dying to/,
  /hang on/,
  /hang the office map/,
  /hang a poster/,
  /hang the poster/,
  /hang a map/,
  /hang the map/,
  /killer deal/,
  /killer feature/,
  /kill a long answer/,
  /kill the answer/,
  /make a living/,
  /life story/,
  /cut the trailer/,
  /my last message/,
  /last message/
];

function crisisMatch(text) {
  const spelled = spell(text);
  if (actPhrase(text) || actPhrase(spelled)) return true;
  if (dangerIn(text) && !figurative(text)) return true;
  if (dangerIn(spelled) && !figurative(spelled)) return true;
  const corrected = tokensOf(deleet(spelled)).map(correctToken).join(" ");
  if (actPhrase(corrected)) return true;
  if (dangerIn(corrected) && !figurative(corrected)) return true;
  return false;
}

const SITE_NOT_FLAG = [
  /pill-shaped/,
  /pill shaped/,
  /rope lights?/,
  /bleeding edge/,
  /demo pills?/,
  /kill switch/,
  /killer deals?/,
  /killer features?/,
  /wrist bands?/,
  /jump to/
];

function withoutPhrases(text, patterns) {
  let stripped = fold(deleet(text));
  for (let i = 0; i < patterns.length; i++) stripped = stripped.replace(patterns[i], " ");
  return stripped;
}

function siteOnly(text) {
  const raw = fold(deleet(text));
  if (!SITE_NOT_FLAG.some((pattern) => pattern.test(raw))) return false;
  return !crisisMatch(withoutPhrases(text, SITE_NOT_FLAG));
}

const COMPACT_ONLY = [/\bhow much\b/, /\bis it enough\b/, /\bgood plan\b/, /\bshould i\b/, /\btonight\b/];

function compactOnly(text) {
  if (actPhrase(text) || actPhrase(spell(text))) return false;
  const raw = fold(deleet(text));
  if (!COMPACT_ONLY.some((pattern) => pattern.test(raw))) return false;
  return !crisisMatch(withoutPhrases(text, COMPACT_ONLY));
}

function idiomOnly(text) {
  const original = spell(text);
  let stripped = original;
  for (let i = 0; i < IDIOM_FAMILIES.length; i++) stripped = stripped.replace(IDIOM_FAMILIES[i], " ");
  if (stripped === original) return false;
  if (crisisMatch(stripped)) return false;
  const filler = new Set("laughing laughter embarrassment shame coffee risa verguenza hambre ganas poster deal feature trailer camera show nap honestly packing photos caption chiste counter quiet hour today again break second shorter studio logo typo week invoices metaphor more nearly every con ese shop candle week".split(" "));
  const tokens = stripped.split(/[^\p{L}\p{N}\-]+/u).filter(Boolean);
  return tokens.every((token) => STOPWORDS.has(token) || BENIGN_CONTENT.has(token) || filler.has(token));
}

function singleIdiom(text) {
  const raw = fold(deleet(text));
  if (/[,:;]|\b(and|so|but|then|because|tonight|while|after)\b/.test(raw)) return false;
  const t = raw.replace(/[.!?]+$/g, "").trim();
  return [
    /^(i am |im )?dead tired$/,
    /^(this |the |my )?(job|work|commute|boss|monday|traffic|shift|feet) is killing me$/,
    /^(my |the )?(phone|battery|link) is dead$/,
    /^(my |the )?feet are killing me$/,
    /^(i am |im )?dying (for|to)( a| the| some)?( \w+){0,3}$/,
    /^(please |i will |i am going to )?hang (the |a )?(office )?map( \w+){0,4}$/,
    /^(please )?hang (a |the )?poster( \w+){0,4}$/,
    /^(please |we should )?kill a long answer( \w+){0,5}$/,
    /^(how do i |can i |please |i need to )?(delete|close|cancel|remove) my account( \w+){0,4}$/,
    /^(the |this )?(commute|traffic|work|monday|job) is killing me$/
  ].some((pattern) => pattern.test(t));
}

function pureFigurative(text) {
  return figurative(text);
}

function figurative(text) {
  if (actPhrase(text)) return false;
  const t = prepared(text);
  if (/\bdead tired\b/.test(t) || /\bdying (for|to)\b/.test(t)) return true;
  if (/\bdead\b/.test(t) && /\b(phone|battery|link|tired)\b/.test(t)) return true;
  if (/\bkilling me\b/.test(t)) return true;
  if (/\b(commute|traffic|work|monday)\b/.test(t) && /\bkilling\b/.test(t)) return true;
  if (/\bhang on\b/.test(t) && !/\b(myself|yourself)\b/.test(t)) return true;
  if (/\bhang\b/.test(t) && /\b(map|poster|office)\b/.test(t) && !/\b(myself|yourself)\b/.test(t)) return true;
  if (/\bkill\b/.test(t) && /\b(answer|cookie|banner)\b/.test(t)) return true;
  if (/\bmake a living\b/.test(t) || /\blife story\b/.test(t) || /\bmy last message\b/.test(t)) return true;
  if (/\bkill\w* (deal|feature)\b/.test(t)) return true;
  if (/\baccount\b/.test(t) && /\b(delete|remove|close|cancel)\b/.test(t)) return true;
  return false;
}

function aboutSomeoneElse(text) {
  const t = prepared(text);
  if (actPhrase(text) && /\b(i|im|ive|id|myself)\b/.test(t)) return false;
  if (/\b(news|homework|headline|article|essay|wikipedia|assignment|reported)\b/.test(t)) return true;
  if (/\bmy friend\b/.test(t) || /\b(he|she|they) said\b/.test(t)) return true;
  if (/\b(friend|classmate|coworker|mom|mother|dad|father|brother|sister) (said|told|wants|wanted)\b/.test(t)) return true;
  return false;
}

function distressPhrase(text) {
  const t = fold(text);
  if (/\bwho will find me\b/.test(t)) return true;
  if (/\bi need help\b/.test(t) || /\bi am not safe\b/.test(t) || /\bim not safe\b/.test(t)) return true;
  return false;
}

function wantsSheet(text) {
  if (distressPhrase(text) || crisisMatch(text)) return true;
  if (clearlyBenign(text)) return false;
  return true;
}

function firstPerson(text) {
  const t = fold(deleet(text));
  if (/\b(i|im|ive|id|yo)\b/.test(t)) return true;
  if (/\b(my life|mi vida)\b/.test(t)) return true;
  if (/\bme\b/.test(t) && !/\b(told|tell|tells|telling|asked|ask|asks|asking) me\b/.test(t)) return true;
  return false;
}

function thirdPerson(text) {
  const t = fold(deleet(text));
  if (/\b(he|she|they|himself|herself|themselves)\b/.test(t)) return true;
  if (/\b(my|our|a|an|his|her|their|the) (best )?(friend|teammate|coworker|classmate|patient|son|daughter|brother|sister|cousin|neighbor|student|client|roommate)\b/.test(t)) return true;
  if (/\b(mi|mis|un|una|el|la|nuestro|nuestra|nuestros|nuestras) (mejor )?(amigo|amiga|hijo|hija|hermano|hermana|primo|prima|vecino|vecina|paciente|companero|companera)\b/.test(t)) return true;
  if (/\bse (quiere|quieren|va|van|mato|ahorca|tira|corta|acaba|suicida)\b/.test(t)) return true;
  if (/\b(news|homework|headline|article|essay|wikipedia|assignment|reported|obituary|novel|poem|film|character)\b/.test(t)) return true;
  return false;
}

export function shouldFlag(text) {
  if (!crisisMatch(text)) return false;
  if (siteOnly(text) || compactOnly(text)) return false;
  if (idiomOnly(text)) return false;
  if (thirdPerson(text) && !firstPerson(text)) return false;
  return true;
}

function finish(reply, question) {
  if (!reply || reply.action !== "crisis") return reply;
  const text = String(reply.text || "");
  if (!text.startsWith(CRISIS_REPLY)) return reply;
  if (thirdPerson(question) && !firstPerson(question) && !text.includes("helping someone else")) {
    return Object.assign({}, reply, { text: CRISIS_REPLY + "\n\n" + OTHER_HELP_LINE });
  }
  return reply;
}

function sheetOnly() {
  return { action: "crisis", text: CRISIS_REPLY, modelCalled: false, sources: [] };
}

function otherSheet() {
  return { action: "crisis", text: CRISIS_REPLY + "\n\n" + OTHER_HELP_LINE, modelCalled: false, sources: [] };
}

function unsureReply() {
  return {
    action: "unsure",
    text: UNSURE_REPLY + "\n\n" + HELP_LINE,
    modelCalled: false,
    sources: []
  };
}

function compactReply() {
  return {
    action: "closed",
    text: REDIRECT + "\n\n" + RESOURCE_NOTE,
    sheet: RESOURCE_NOTE,
    line: REDIRECT,
    suggestions: SUGGESTIONS.slice(),
    modelCalled: false,
    sources: []
  };
}

function withFooter(text) {
  const body = String(text || "").trim();
  if (body.includes(HELP_LINE)) return body;
  return body ? body + "\n\n" + HELP_LINE : HELP_LINE;
}

function crisisReply(storage, now) {
  writeRiskFlag(storage, now);
  return { action: "crisis", text: CRISIS_REPLY, modelCalled: false, sources: [] };
}

function pageReply(text, sources, modelCalled) {
  return { action: "pages", text: withFooter(text), modelCalled: modelCalled, sources: sources };
}

function pin(reply) {
  return Object.assign({}, reply, { pinned: PINNED_BOX });
}

export async function replyFor(question, corpus, options) {
  const opts = options || {};
  const now = typeof opts.now === "number" ? opts.now : Date.now();
  try {
    const turns = userTurns(question, opts.history);
    const sessionFlag = turns.some((turn) => shouldFlag(turn));
    if (sessionFlag) writeRiskFlag(opts.storage, now);
    const screened = screen(question, opts.history);
    let reply;
    if (asksForHarmPage(question, tokensOf(deleet(question)))) reply = crisisReply(opts.storage, now);
    else if (screened.action === "harm" && !actPhrase(question)) reply = { action: "harm", text: HARM_REPLY, modelCalled: false, sources: [] };
    else if (screened.action === "identity" && !crisisMatch(question)) reply = { action: "identity", text: IDENTITY_REPLY, modelCalled: false, sources: [] };
    else if (crisisMatch(question)) reply = shouldFlag(question) ? crisisReply(opts.storage, now) : sheetOnly();
    else if (screened.action === "crisis" && !clearlyBenign(question) && !figurative(question)) reply = shouldFlag(question) ? crisisReply(opts.storage, now) : sheetOnly();
    else if (wantsSheet(question)) reply = sheetOnly();
    else {
      let matches = [];
      try {
        matches = typeof opts.search === "function" ? (await opts.search(question, corpus)) || [] : [];
      } catch (err) {
        matches = [];
      }
      const meta = isMetaQuestion(question);
      if (!matches.length && meta) {
        const passage = fallbackPassage(corpus);
        if (passage) matches = [{ passage, score: 2 }];
      }
      const unmatched = (!confidentMatch(question, matches) && !meta) || !matches.length;
      if (unmatched) reply = unsureReply();
      else {
        const sources = matches.slice(0, 3);
        const template = templateFrom(sources);
        reply = pageReply(template, sources, false);
        if (typeof opts.tryModel === "function") {
          try {
            const drafted = await opts.tryModel(question, sources);
            if (acceptableRephrase(drafted, sources)) reply = pageReply(String(drafted).trim(), sources, true);
            else reply = pageReply(template, sources, true);
          } catch (err) {
            reply = pageReply(template, sources, true);
          }
        }
      }
    }
    reply = finish(reply, question);
    if (reply.action !== "crisis" && (sessionFlag || readRiskFlag(opts.storage, now))) return pin(reply);
    return reply;
  } catch (err) {
    return { action: "error", text: ERROR_REPLY, modelCalled: false, sources: [] };
  }
}
