// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// Crisis-first wording is a separate decision: a means or a self-harm term
// together with first-person or plan-seeking language in the recent turns.
// A message that is not a confident page match still shows the full help sheet.

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people, weapons, or drugs. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

export const REDIRECT = "I'm an early test AI that only knows DTRT Lab. Try asking about the site, the lab, or Ian's public work.";

export const SUGGESTIONS = ["What is on the site?", "What does the lab do?", "Who is Ian?"];

export const RESOURCE_NOTE = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. Outside the US, visit https://findahelpline.com.";

export const ONLY_LINE = REDIRECT;

export const HELP_LINE = "If you're struggling, call or text 988 (US) or visit findahelpline.com.";

const TURN_LIMIT = 6;

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
    .replace(/over\s*[- ]?\s*dos(?:e|ing|ed|es)/g, " overdose ");
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
  return prior.filter((item) => String(item || "").trim()).slice(-TURN_LIMIT);
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
  if (/^(hi|hello|hey|hola|thanks|thank you|good morning|good afternoon|good evening)\b/.test(text)) return true;
  return [
    "what is this", "whats this", "who made this", "who made you", "who built this",
    "site looks great", "propose a tab", "summarize the public pages",
    "summarize the site", "public pages"
  ].some((needle) => text.includes(needle));
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

function closedReply() {
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

export async function replyFor(question, corpus, options) {
  const opts = options || {};
  const screened = screen(question, opts.history);
  if (screened.action === "crisis") return { action: "crisis", text: CRISIS_REPLY, modelCalled: false, sources: [] };
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
  if (!confidentMatch(question, matches) && !meta) return closedReply();
  if (!matches.length) return closedReply();
  const sources = matches.slice(0, 3);
  const template = templateFrom(sources);
  if (typeof opts.tryModel !== "function") {
    return { action: "pages", text: template, modelCalled: false, sources };
  }
  try {
    const drafted = await opts.tryModel(question, sources);
    if (acceptableRephrase(drafted, sources)) {
      return { action: "pages", text: String(drafted).trim(), modelCalled: true, sources };
    }
  } catch (err) {
    /* Keep the page quote. */
  }
  return { action: "pages", text: template, modelCalled: true, sources };
}
