// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// Risk is checked before any page answer, on this message, earlier
// turns, and a browser-session flag that New chat does not clear.
// A detected risk returns the full 988 sheet. A page answer and an
// error reply carry a short 988 footer. A message with no confident
// page match gets the full sheet, then the closest pages or contact.
// A compact note is only for a greeting or everyday idiom with no risk.

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

export const ERROR_REPLY = "The search on this page did not finish. The public pages are still linked from the home page.\n\n" + HELP_LINE;

export const RISK_FLAG_KEY = "dtrt.risk.v1";

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
  "no estar aqui", "no quiero estar", "preferiria no estar"
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
  "shoot a video", "cutting-edge", "haircut"
];

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
  if (tokens.some((token) => MEANS.has(token) || TERMS.has(token) || RISK_TOKENS.has(token))) return true;
  if (hasAnyPhrase(tokens, DISTRESS_PHRASES) || hasAnyPhrase(tokens, COMPACT_BLOCKS) || hasAnyPhrase(tokens, RISK_PHRASES)) return true;
  if (hasAnyPhrase(tokens, COMPLETE) || includesAny(scan, CJK_COMPLETE) || includesAny(scan, CJK_TERMS)) return true;
  if (/\b(hurt|die|dying|died|death|kill|killed|killing)\b/.test(fold(scan))) return true;
  const folded = fold(scan);
  if (folded.includes("worth it") && /\b(life|living|alive)\b/.test(folded)) return true;
  if (asksForHarmPage(scan, tokens)) return true;
  return false;
}

export function readRiskFlag(storage) {
  try {
    return !!(storage && storage.getItem(RISK_FLAG_KEY) === "1");
  } catch (err) {
    return false;
  }
}

export function writeRiskFlag(storage) {
  try {
    if (storage && storage.setItem) storage.setItem(RISK_FLAG_KEY, "1");
  } catch (err) {
    /* A blocked store still returns the sheet for this turn. */
  }
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

function sheetWithHelp(matches) {
  const bits = (matches || []).slice(0, 3).map((item) => {
    const passage = item.passage || item;
    const title = passage.title || "A public page";
    const url = passage.url || "";
    return url ? title + " " + url : title;
  }).filter(Boolean);
  const extra = bits.length ? "Closest pages: " + bits.join("; ") + ". " + CONTACT_LINE : CONTACT_LINE;
  return {
    action: "sheet",
    text: CRISIS_REPLY + "\n\n" + extra,
    sources: (matches || []).slice(0, 3),
    modelCalled: false
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

function crisisReply(storage) {
  writeRiskFlag(storage);
  return { action: "crisis", text: CRISIS_REPLY, modelCalled: false, sources: [] };
}

function pageReply(text, sources, modelCalled) {
  return { action: "pages", text: withFooter(text), modelCalled: modelCalled, sources: sources };
}

export async function replyFor(question, corpus, options) {
  const opts = options || {};
  try {
    if (readRiskFlag(opts.storage) || hasRisk(question, opts.history)) return crisisReply(opts.storage);
    const screened = screen(question, opts.history);
    if (screened.action === "crisis") return crisisReply(opts.storage);
    if (screened.action === "harm") return { action: "harm", text: HARM_REPLY, modelCalled: false, sources: [] };
    if (screened.action === "identity") return { action: "identity", text: IDENTITY_REPLY, modelCalled: false, sources: [] };
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
    if (unmatched) {
      if (clearlyClean(question, opts.history)) return compactReply();
      return sheetWithHelp(matches);
    }
    const sources = matches.slice(0, 3);
    const template = templateFrom(sources);
    if (typeof opts.tryModel !== "function") return pageReply(template, sources, false);
    try {
      const drafted = await opts.tryModel(question, sources);
      if (acceptableRephrase(drafted, sources)) return pageReply(String(drafted).trim(), sources, true);
    } catch (err) {
      /* Keep the page quote. */
    }
    return pageReply(template, sources, true);
  } catch (err) {
    return { action: "error", text: ERROR_REPLY, modelCalled: false, sources: [] };
  }
}
