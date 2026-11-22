// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// The crisis check is an extra layer over the recent user turns. If it errors, the reply is the fixed help line.

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people, weapons, or drugs. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

export const OFF_TOPIC = "I can only answer questions about DTRT Lab right now (very early test).";

export const HELP_LINE = "If you're struggling, call or text 988 (US) or visit findahelpline.com.";

const TURN_LIMIT = 6;

const CRISIS_WORDS = new Set([
  "suicide", "suicidal", "unalive", "kms", "selfharm", "overdose", "overdosing", "overdosed", "od",
  "cutting", "cut",
  "suicidarme", "suicidio", "autolesion", "cortarme",
  "suicidio",
  "suizid", "selbstmord", "selbstverletzung",
  "suicidio",
  "magpakamatay"
]);

const CRISIS_PHRASES = [
  "kill myself", "killing myself", "killed myself",
  "want to die", "wanna die", "end my life", "end it all", "ending it",
  "hurt myself", "hurting myself", "cut myself", "cutting myself",
  "dont want to live", "do not want to live", "dont want to be here tomorrow", "do not want to be here tomorrow",
  "quiero morir", "me quiero matar", "hacerme dano", "me corto",
  "quero morrer", "quero me matar", "me matar", "me cortar",
  "je veux mourir", "me suicider", "envie de mourir", "me couper",
  "ich will sterben", "mich umbringen",
  "voglio morire", "suicidarmi", "farmi del male", "mi taglio",
  "ya khochu umeret", "pokonchit s soboy", "samoubiystvo",
  "хочу умереть", "покончить с собой", "самоубийство",
  "marna chahta", "marna chahti", "aatmahatya",
  "मरना चाहता", "मरना चाहती", "आत्महत्या",
  "urid an amut", "aeudi nafsi",
  "أريد أن أموت", "أؤذي نفسي",
  "gusto kong mamatay", "ayoko nang mabuhay",
  "mwen vle mouri", "touye tet mwen",
  "marayche aahe",
  "मरायचे आहे"
];

const CJK_CRISIS = [
  "自杀", "自残", "不想活", "想死", "割腕",
  "自殺", "死にたい", "自分を傷つけ",
  "자살", "자해", "죽고 싶"
];

const MEANS = new Set(["pill", "pills", "rope", "gun", "blade", "bridge", "knife", "razor", "noose", "belt"]);

const INTENT_PHRASES = [
  "should i use it", "should i do it", "should i use that", "should i do that"
];

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

function cjkCrisis(text) {
  const folded = fold(text);
  return CJK_CRISIS.some((phrase) => folded.includes(fold(phrase)));
}

function directCrisis(text) {
  const tokens = tokensOf(text);
  if (tokens.some((token) => CRISIS_WORDS.has(token))) return true;
  if (hasAnyPhrase(tokens, CRISIS_PHRASES)) return true;
  return cjkCrisis(text);
}

function mentionsMeans(tokens) {
  return tokens.some((token) => MEANS.has(token));
}

function mentionsIntent(tokens) {
  return hasAnyPhrase(tokens, INTENT_PHRASES);
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
    let seenMeans = false;
    for (const turn of turns) {
      const tokens = tokensOf(turn);
      if (directCrisis(turn)) return { action: "crisis", text: CRISIS_REPLY };
      if (mentionsMeans(tokens) && mentionsIntent(tokens)) return { action: "crisis", text: CRISIS_REPLY };
      if (seenMeans && mentionsIntent(tokens)) return { action: "crisis", text: CRISIS_REPLY };
      if (mentionsMeans(tokens)) seenMeans = true;
      if (hasAnyPhrase(tokens, HARM_PHRASES)) return { action: "harm", text: HARM_REPLY };
    }
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
  if (directCrisis(text) || hasAnyPhrase(tokensOf(text), HARM_PHRASES)) return false;
  if (/\b(you should|i recommend|your plan|great plan|good plan|dose|weapon|bomb)\b/i.test(text)) return false;
  const allowed = sourceWords(matches);
  const words = text.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3);
  if (!words.length) return false;
  return words.every((word) => allowed.has(word) || TEMPLATE_WORDS.has(word));
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
  if (!matches.length) return { action: "offtopic", text: OFF_TOPIC, modelCalled: false, sources: [] };
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
