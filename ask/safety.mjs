// Crisis and harm checks run before any model output.

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people or with making weapons. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

const CRISIS = /\b(suicide|suicidal|kill myself|killing myself|end my life|want to die|wanna die|self[-\s]?harm|hurt myself|cut myself|cutting myself|overdose|don't want to live|do not want to live)\b/i;

const HARM = /\b(build a bomb|make a bomb|make explosives|how to make a weapon|how to kill (someone|a person|people|him|her|them)|hurt (someone|people|a person))\b/i;

const IDENTITY = /\b(are you (a |an )?(human|real person|doctor|physician|therapist)|are you human|you are a doctor|you're a doctor)\b/i;

const CLAIM = /\b(i am|i'm) an? (human|real person|doctor|physician|therapist)\b/i;

export function screen(question) {
  const text = String(question || "");
  if (CRISIS.test(text)) return { action: "crisis", text: CRISIS_REPLY };
  if (HARM.test(text)) return { action: "harm", text: HARM_REPLY };
  if (IDENTITY.test(text)) return { action: "identity", text: IDENTITY_REPLY };
  return { action: "ok" };
}

export function guardClaims(text) {
  const value = String(text || "").trim();
  if (!value || CLAIM.test(value)) return IDENTITY_REPLY;
  return value;
}

export function fromPages(matches) {
  const list = matches || [];
  if (!list.length) {
    return "Nothing on the public pages matches that closely. This is a very early AI test, so it will not guess. Try words from the site, or open the notebook and the office map.";
  }
  const top = list[0].passage || list[0];
  const title = top.title || "A public page";
  let bit = String(top.text || "").replace(/skip to content/gi, " ").replace(/\s+/g, " ").trim();
  if (bit.toLowerCase().startsWith(title.toLowerCase())) bit = bit.slice(title.length).trim();
  bit = bit.slice(0, 180);
  return "From the public pages, " + title + " says: " + bit;
}

export async function replyFor(question, corpus, options) {
  const screened = screen(question);
  if (screened.action !== "ok") return { action: screened.action, text: screened.text, modelCalled: false, sources: [] };
  const opts = options || {};
  const matches = typeof opts.search === "function" ? (await opts.search(question, corpus)) || [] : [];
  if (typeof opts.tryModel === "function") {
    try {
      const generated = await opts.tryModel(question, matches);
      const text = guardClaims(generated);
      if (text) return { action: "model", text, modelCalled: true, sources: matches.slice(0, 3) };
    } catch (err) {
      /* The page search below is the fallback. */
    }
    return { action: "pages", text: fromPages(matches), modelCalled: true, sources: matches.slice(0, 3) };
  }
  return { action: "pages", text: fromPages(matches), modelCalled: false, sources: matches.slice(0, 3) };
}
