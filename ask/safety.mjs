// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// The crisis check is an extra layer over the recent user turns. If it errors, the reply is the fixed help line.

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people, weapons, or drugs. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

export const OFF_TOPIC = "I can only answer questions about DTRT Lab right now (very early test).";

export const HELP_LINE = "If you're struggling, call or text 988 (US) or visit findahelpline.com.";

const TURN_LIMIT = 6;

const CRISIS_PHRASES = [
  "kill myself", "killing myself", "want to die", "wanna die", "end my life", "end it all",
  "suicide", "suicidal", "self-harm", "self harm", "hurt myself", "cut myself",
  "don't want to live", "do not want to live", "ending it", "unalive", "kms",
  "rope setup", "don't want to be here tomorrow", "do not want to be here tomorrow",
  "quiero morir", "me quiero matar", "suicidarme", "hacerme dano", "hacerme daño",
  "quero morrer", "quero me matar", "me matar",
  "je veux mourir", "me suicider", "envie de mourir",
  "我想自杀", "不想活了", "想死",
  "मरना चाहता", "मरना चाहती", "आत्महत्या",
  "أريد أن أموت", "انتحار", "أؤذي نفسي",
  "magpakamatay", "gusto kong mamatay", "ayoko nang mabuhay",
  "mwen vle mouri", "touye tet mwen", "touye tèt mwen",
  "मरायचे आहे", "आत्महत्या"
];

const HARM_PHRASES = [
  "build a bomb", "make a bomb", "make explosives", "how to make a weapon",
  "how to kill someone", "how to kill a person", "hurt someone", "hurt people"
];

const TEMPLATE_WORDS = new Set("from dtrt lab public pages says the a an and or of to for in on at".split(" "));

function fold(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function userTurns(question, history) {
  const prior = Array.isArray(history) ? history.map((item) => fold(item)) : [];
  prior.push(fold(question));
  return prior.filter(Boolean).slice(-TURN_LIMIT);
}

function hasPhrase(text, phrases) {
  const tokens = new Set(text.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  return phrases.some((phrase) => {
    const needle = fold(phrase);
    if (!needle) return false;
    if (needle.includes(" ")) return text.includes(needle);
    return tokens.has(needle);
  });
}

export function screen(question, history) {
  try {
    const text = userTurns(question, history).join("\n");
    if (!text) return { action: "ok" };
    if (hasPhrase(text, CRISIS_PHRASES)) return { action: "crisis", text: CRISIS_REPLY };
    if (hasPhrase(text, HARM_PHRASES)) return { action: "harm", text: HARM_REPLY };
    if (/\b(are you (a |an )?(human|real person|doctor|physician|therapist)|are you human)\b/i.test(text)) {
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
  if (hasPhrase(text, CRISIS_PHRASES) || hasPhrase(text, HARM_PHRASES)) return false;
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
