// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// Every message is classified by classifyCrisis() before any page
// answer or model call. finish() adds the helping line to every
// crisis sheet. Nothing is pinned and nothing is stored.

import { classifyCrisis, GENTLE_LINE } from "../js/safety-core.mjs?v=20261127-ask50";

export { classifyCrisis, GENTLE_LINE };

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people, weapons, or drugs. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

export const REDIRECT = "I'm an early test AI that only knows DTRT Lab. Try asking about the site, the lab, or Ian's public work.";

export const SUGGESTIONS = ["What is on the site?", "What does the lab do?", "Who is Ian?"];

export const RESOURCE_NOTE = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. Outside the US, visit https://findahelpline.com.";

export const HELP_LINE = "If you're struggling, call or text 988 (US) or visit findahelpline.com.";

export const OTHER_HELP_LINE = "If this is about someone else: stay with them, call or text 988, or 911 if they're in immediate danger.\nSi se trata de otra persona: quédate con ella, llama o escribe al 988, o al 911 si está en peligro inmediato.";

export const UNSURE_REPLY = "I'm not sure about that yet.";

export const ERROR_REPLY = "The search on this page did not finish. The public pages are still linked from the home page.\n\n" + HELP_LINE;

const PAGE_WORDS = new Set(["page", "pages", "entry", "entries", "notebook", "article", "guide", "post"]);

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

function signals(text) {
  const tier = classifyCrisis(text);
  return { term: tier !== "none", person: tier === "tier1", plan: tier === "tier1" };
}

function userTurns(question, history) {
  const prior = Array.isArray(history) ? history.slice() : [];
  prior.push(question);
  return prior.filter((item) => String(item || "").trim());
}

export function screen(question, history) {
  try {
    if (classifyCrisis(question, history) === "tier1") return { action: "crisis", text: CRISIS_REPLY };
    const turns = userTurns(question, history);
    if (!turns.length) return { action: "ok" };
    let harm = false;
    for (const turn of turns) {
      if (hasAnyPhrase(tokensOf(turn), HARM_PHRASES)) harm = true;
    }
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


export function crisisSheet(question, history) {
  return classifyCrisis(question, history) === "tier1";
}

export function gentleCrisis(text) {
  return classifyCrisis(text) === "tier2";
}

function finish(reply) {
  if (!reply || reply.action !== "crisis") return reply;
  const text = String(reply.text || "");
  if (!text.startsWith(CRISIS_REPLY)) return reply;
  if (text.includes("If this is about someone else")) return reply;
  return Object.assign({}, reply, { text: CRISIS_REPLY + "\n\n" + OTHER_HELP_LINE });
}

function crisisReply() {
  return { action: "crisis", text: CRISIS_REPLY, modelCalled: false, sources: [] };
}

function unsureReply() {
  return {
    action: "unsure",
    text: UNSURE_REPLY + "\n\n" + HELP_LINE,
    modelCalled: false,
    sources: []
  };
}

function withFooter(text) {
  const body = String(text || "").trim();
  if (body.includes(HELP_LINE)) return body;
  return body ? body + "\n\n" + HELP_LINE : HELP_LINE;
}

function pageReply(text, sources, modelCalled) {
  return { action: "pages", text: withFooter(text), modelCalled: modelCalled, sources: sources };
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

function fallbackPassage(corpus) {
  const passages = (corpus && corpus.passages) || [];
  return passages.find((passage) => passage && (passage.url === "/ask/" || passage.url === "/")) || passages[0] || null;
}

export async function replyFor(question, corpus, options) {
  const opts = options || {};
  try {
    const history = Array.isArray(opts.history) ? opts.history.slice(0) : [];
    const tier = classifyCrisis(question, history);
    if (tier === "tier1") return finish(crisisReply());
    const screened = screen(question, history);
    let reply;
    if (screened.action === "crisis") reply = crisisReply();
    else if (screened.action === "harm") reply = { action: "harm", text: HARM_REPLY, modelCalled: false, sources: [] };
    else if (screened.action === "identity") reply = { action: "identity", text: IDENTITY_REPLY, modelCalled: false, sources: [] };
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
    if (tier === "tier2" && reply && !String(reply.text || "").includes(GENTLE_LINE)) {
      reply = Object.assign({}, reply, { text: String(reply.text || "") + "\n\n" + GENTLE_LINE, gentle: true });
    }
    return finish(reply);
  } catch (err) {
    return { action: "error", text: ERROR_REPLY, modelCalled: false, sources: [] };
  }
}
