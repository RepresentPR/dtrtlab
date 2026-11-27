// Public answers are quotes from DTRT Lab's pages.
// A model may only rephrase those quotes. Anything else is discarded.
// Risk is checked before any page answer or model call.
// crisisSheet() is the only function that decides a crisis sheet.
// finish() adds the helping line to every crisis sheet. Nothing is
// pinned and nothing is stored. A page answer and an error reply carry
// a short 988 footer. An ordinary unmatched question gets a not-sure
// reply plus that footer.

export const CRISIS_REPLY = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. You can also visit https://findahelpline.com. This is a very early AI test. It is not a person and not a doctor, and it will not keep chatting about this.";

export const HARM_REPLY = "I cannot help with hurting people, weapons, or drugs. This is a very early AI test. It is not a person and not a doctor.";

export const IDENTITY_REPLY = "I am software on DTRT Lab, a very early AI test. I am not a person and I am not a doctor.";

export const REDIRECT = "I'm an early test AI that only knows DTRT Lab. Try asking about the site, the lab, or Ian's public work.";

export const SUGGESTIONS = ["What is on the site?", "What does the lab do?", "Who is Ian?"];

export const RESOURCE_NOTE = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. Outside the US, visit https://findahelpline.com.";

export const ONLY_LINE = REDIRECT;

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

function includesAny(text, phrases) {
  const folded = fold(text);
  return phrases.some((phrase) => folded.includes(fold(phrase)));
}

function signals(text) {
  const prepared = prepareCrisis(text);
  return {
    term: prepared.death || prepared.harm || prepared.ingest || prepared.plan,
    person: prepared.subject,
    plan: prepared.plan
  };
}

function userTurns(question, history) {
  const prior = Array.isArray(history) ? history.slice() : [];
  prior.push(question);
  return prior.filter((item) => String(item || "").trim());
}

export function screen(question, history) {
  try {
    if (crisisSheet(question, history)) return { action: "crisis", text: CRISIS_REPLY };
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


function leet(text) {
  return fold(text).replace(/!/g, "i").replace(/[a-z0-9@$]+/g, (token) => {
    if (!/[a-z]/.test(token)) return token;
    return token
      .replace(/0/g, "o")
      .replace(/1/g, "i")
      .replace(/3/g, "e")
      .replace(/4/g, "a")
      .replace(/5/g, "s")
      .replace(/7/g, "t")
      .replace(/@/g, "a")
      .replace(/\$/g, "s")
      .replace(/!/g, "i");
  });
}

function oneEdit(left, right) {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const diffs = [];
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) diffs.push(i);
    if (diffs.length === 1) return true;
    return diffs.length === 2 && diffs[1] === diffs[0] + 1 && left[diffs[0]] === right[diffs[1]] && left[diffs[1]] === right[diffs[0]];
  }
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let i = 0;
  let j = 0;
  let skips = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) { i += 1; j += 1; }
    else { skips += 1; j += 1; if (skips > 1) return false; }
  }
  return true;
}

const DEATH_WORDS = ["dead", "die", "dies", "died", "dying", "death", "deaths", "suicide", "suicidal", "suicidio", "suicidar", "muerto", "muerta", "morir", "muero", "muere", "muerte", "despertar", "overdose", "overdosing", "overdosed", "unalive"];
const HARM_WORDS = ["hurt", "hurts", "hurting", "cut", "cuts", "cutting", "kill", "kills", "killing", "killed", "harm", "harms", "harming", "jump", "jumps", "jumping", "hang", "hangs", "hanging", "shoot", "shoots", "shooting", "lastimar", "cortar", "corto", "cortarme", "matar", "mato", "matare", "matarme", "saltar", "colgar", "colgarme", "ahorcar", "ahorcarme", "selfharm", "slit", "bleach", "tirar", "tirare", "tirarme", "tirarse", "pegar", "pegare", "tiro", "envenenar", "envenenare", "pistol", "bleed", "bleeding", "bled", "sangrando"];
const INGEST_WORDS = ["took", "taken", "taking", "take", "takes", "swallowed", "swallow", "swallowing", "tome", "tomo", "trague", "trago"];
const AMOUNT_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "dozen", "several", "everything", "whole", "all", "todo", "toda", "todas", "frasco", "bottle", "handful", "quince", "veinte", "treinta", "cuarenta", "cincuenta"];
const DRUG_WORDS = ["pill", "pills", "tablet", "tablets", "capsule", "capsules", "ibuprofen", "ibuprofeno", "tylenol", "aspirin", "advil", "paracetamol", "pastilla", "pastillas", "medicamento", "medicine", "medicines", "meds", "drug", "drugs", "painkiller", "painkillers"];
const MEANS_WORDS = ["plan", "arrangement", "cliff", "bridge", "rope", "gun", "pills", "pill", "roof", "despedida"];
const TIME_WORDS = ["tonight", "sunday", "manana", "tomorrow", "midnight", "dawn", "noche"];
const FAMILY_WORDS = [...new Set([].concat(DEATH_WORDS, HARM_WORDS, INGEST_WORDS, AMOUNT_WORDS, DRUG_WORDS, MEANS_WORDS, TIME_WORDS))].filter((word) => word.length >= 4);
const BENIGN_TOKENS = new Set("deal lead tired light lights swing fishing trailer coffee battery phone link plant plane play planet plank page pages price prices hour hours contact map desk photo photos minute minutes cake recipe weather video feature office notebook privacy refund brand candle candles shipping email password checkout donate browser form kit band catalog shop list public free note notes class classes people day days picture pictures site lab dtrt ian job jobs term terms data bug bugs answer answers human humans question questions time date today early company companies real wide shown optional stuck come comes sell sells use uses used stay stays turned turn turns two person share shares maintain maintains send sends sent find finds clear clears report reports happen happens get gets ask asks fix fixes wrong need needs apply applies update updates see sees seen save saves device devices change changes delete deletes remove removes close closes cancel cancels make makes made look looks great tab tabs built build read reads reading much many new old same other another any some such the and for with from about into over after before out off not yes please just then than there here too very also still only own when while have has had onto per via let lets what whats where who how can will would should may might am are was were been being do does did doing this that these those live love like line life last long give fire fine file home hope open door city want wish were told said anymore doesnt dont proof roofing night your our you eight".split(" "));
const SUBJECT_WORDS = new Set("i im ive id me my myself mine yo mi mis quiero quiere he she they him his her their them himself herself themselves yourself yourselves ella ellas ellos friend friends brother brothers mom mother dad father husband wife son daughter amigo amiga esposo esposa hermano hermana coworker neighbor roommate classmate teammate patient vecino vecina companero companera prima primo uncle aunt niece nephew".split(" "));
const BENIGN_OBJECTS = new Set("photo photos picture pictures minute minutes hour hours page pages dollar dollars step steps note notes class classes people day days coffee cake recipe video map desk price prices list form kit band candle candles".split(" "));

const IDIOM_GUARDS = [
  /\bthis is killing me\b/g,
  /\bkilling me\b/g,
  /\bme muero de risa\b/g,
  /\bme muero por\b/g,
  /\bmuero de risa\b/g,
  /\bdead tired\b/g,
  /\bdying (to|for)\b/g,
  /\brope lights?\b/g,
  /\brope swing\b/g,
  /\bbleach-free\b/g,
  /\bbleach free\b/g,
  /\bkiller deal\b/g,
  /\bkiller feature\b/g,
  /\bdead battery\b/g,
  /\bdead phone\b/g,
  /\bdead link\b/g,
  /\bhang on\b/g,
  /\bcut the trailer\b/g,
  /\boverdose (of|on) coffee\b/g,
  /\bcutting-edge\b/g,
  /\bcutting edge\b/g,
  /\bhaircut\b/g,
  /\bshoot a video\b/g,
  /\bgone fishing\b/g,
  /\bknife set\b/g
];

function stripIdioms(text) {
  let next = text;
  for (const pattern of IDIOM_GUARDS) next = next.replace(pattern, " ");
  return next.replace(/\s+/g, " ").trim();
}

function nearestFamily(token) {
  if (!token || BENIGN_TOKENS.has(token)) return token;
  if (DEATH_WORDS.includes(token) || HARM_WORDS.includes(token) || INGEST_WORDS.includes(token) || AMOUNT_WORDS.includes(token) || DRUG_WORDS.includes(token) || MEANS_WORDS.includes(token) || TIME_WORDS.includes(token) || SUBJECT_WORDS.has(token)) return token;
  if (token.length < 3) return token;
  if (token.length < 4) {
    for (const word of FAMILY_WORDS) {
      if (word.length === token.length + 1 && oneEdit(token, word)) return word;
    }
    return token;
  }
  if (/^(morir|muer|suicid|cort|colg|ahorc|matar|pegar|tirar|quit)/.test(token)) return token;
  let best = token;
    for (const word of FAMILY_WORDS.concat(["myself"])) {
    if (Math.abs(word.length - token.length) > 1) continue;
    if (oneEdit(token, word)) return word;
  }
  return best;
}

function prepareCrisis(text) {
  const raw = String(text || "");
  const normalized = stripIdioms(leet(raw));
  const tokens = tokensOf(normalized).map(nearestFamily);
  const joined = tokens.join(" ");
  const reflexive = tokens.some((token) => /(me|se)$/.test(token) && /^(ahorc|colg|cort|mat|tir|morir|muer|pegar)/.test(token));
  const subject = reflexive || tokens.some((token) => SUBJECT_WORDS.has(token))
    || /\b(told me|dijo que|dice que|quiere quitarse)\b/.test(joined)
    || /él/i.test(raw);
  const deathPhrase = /\b(not wake|no despertar|not be here|rather not be here|cant be here|cannot be here|not live anymore|dont want to live|doesnt want to live|do not want to live|does not want to live|do not want to exist|dont want to exist|no longer want to exist|no longer wants to exist|no longer wants to live|stop existing|dejar de existir|disappear forever|disappear para siempre|desaparecer para siempre|no quiero vivir|no quiere vivir|ya no quiero vivir|quiero morir|quiero morirme|want to die|wants to die|end it|ending it|end everything|end my life|ending my life|end his life|end her life|end your life|own life|acabar con|terminar con|mensaje final|ultimas palabras|dosis letales|quitarse|quitarme|quitar\w* la vida|no reason to live|all been decided|tomorrow is it|reason to live left|tired of living|goodbye note|goodbye letter|farewell note|farewell letter|last night alive|last message|final message|last words|this is goodbye|saying goodbye|said goodbye|goodbye forever|tonight is the end|later for me|reason to live is gone|rather be dead|stop breathing|finished being here|quitting life|life worth|who will find me|quien me va a encontrar|leave this world|dejar este mundo|adios para siempre|point of staying alive|staying alive|last time anyone hears|how to die|die on purpose|better off without me|when im gone|when i am gone|make the pain stop|not going to be around|wont be around|lost the will|about me forever|lethal dose)\b/.test(joined)
    || /\b(tired of living|stop existing|quiero morir|goodbye note|farewell letter|last message|lethal doses?)\b/.test(leet(raw));
  const death = deathPhrase || tokens.some((token) => DEATH_WORDS.includes(token) || /^(morir|muer|muert|suicid|desaparec)/.test(token));
  const harm = reflexive || tokens.some((token) => HARM_WORDS.includes(token) || /^(cort|colg|ahorc|salt|matar|mato|mata|tirar|envenen|pegar)/.test(token))
    || (/\bbarrel\b/.test(joined) && /\bmouth\b/.test(joined))
    || /\bknife on (herself|himself)\b/.test(joined);
  const ingestVerb = tokens.some((token) => INGEST_WORDS.includes(token) || token === "drank" || (/^(tome|tomo|tomar|trag)/.test(token) && token !== "tomorrow"));
  const amount = tokens.some((token) => AMOUNT_WORDS.includes(token)) || /\b\d+\b/.test(joined)
    || /\b(whole bottle|todo el frasco|all the pills|todas las pastillas)\b/.test(joined);
  const drug = tokens.some((token) => DRUG_WORDS.includes(token) || token === "bleach");
  const otherNoun = tokens.some((token) => token.length >= 5 && !BENIGN_OBJECTS.has(token) && !BENIGN_TOKENS.has(token) && !SUBJECT_WORDS.has(token) && !AMOUNT_WORDS.includes(token) && !INGEST_WORDS.includes(token) && !TIME_WORDS.includes(token) && !DEATH_WORDS.includes(token) && !HARM_WORDS.includes(token));
  const ingest = (ingestVerb && amount && (drug || otherNoun || /\b(bottle|frasco|something)\b/.test(joined)))
    || (subject && ingestVerb && (drug || /\b(bottle|frasco|something)\b/.test(joined)))
    || (amount && drug)
    || (ingestVerb && /\bhandful\b/.test(joined))
    || (drug && tokens.some((token) => token === "swallowed" || token === "took" || token === "tomo" || token === "tome"));
  const means = tokens.filter((token) => MEANS_WORDS.includes(token)).length
    + (/\b(goodbye letter|carta de despedida)\b/.test(joined) ? 1 : 0);
  const times = tokens.filter((token) => TIME_WORDS.includes(token)).length
    + (/\besta noche\b/.test(joined) ? 1 : 0);
  const plan = (subject && (means > 0 || times > 0)) || (means >= 1 && times >= 1) || means >= 2;
  const unambiguous = tokens.some((token) => /^(suicid|overdos|sobredos|kms|selfharm|desaparec|bleach|muert|morir)/.test(token))
    || ["我想自杀", "我不想活了", "想死", "死にたい", "自分を傷つけたい", "自殺したい", "죽고 싶어", "자살하고", "자해하고", "मैं मरना चाहता", "أريد أن أموت", "أؤذي نفسي", "я хочу умереть", "покончить с собой", "मला मरायचे आहे", "आत्महत्या", "самоубийство", "自残", "magpakamatay", "je veux mourir", "envie de mourir", "ich will sterben", "mich umbringen", "voglio morire", "quero morrer", "quero me matar", "mwen vle mouri", "gusto kong magpakamatay", "hacerme dano", "hacerme daño", "farmi del male", "me suicider", "mi taglio", "ayoko nang mabuhay"].some((phrase) => leet(raw).includes(fold(phrase)) || raw.toLowerCase().includes(phrase.toLowerCase()))
    || /\bod\b/.test(joined);
  return { subject, death, deathPhrase, harm, ingest, plan, unambiguous, joined };
}

function asksForHarmPage(text, tokens) {
  const folded = fold(text);
  const wantsPage = tokens.some((token) => PAGE_WORDS.has(token)) || /\b(show me|find the)\b/.test(folded);
  if (!wantsPage) return false;
  return hasAnyPhrase(tokens, HARM_PHRASES);
}

const FOLLOW_UPS = new Set([
  "should i use it", "should i do it", "should i use that", "should i do that",
  "how much", "is it enough", "tonight", "good plan"
]);

function priorMeans(history) {
  if (!Array.isArray(history)) return false;
  return history.some((turn) => {
    const prepared = prepareCrisis(turn);
    return prepared.plan || /\b(rope|pills?|gun|blade|bridge|cliff)\b/.test(leet(turn));
  });
}

// One structural decider. A subject plus a death, harm, ingest-amount,
// or plan family fires the sheet. An unattributed plan fires when a means
// co-occurs with a time or with another means. Idiom spans are removed first.
export function crisisSheet(question, history) {
  const prepared = prepareCrisis(question);
  if (asksForHarmPage(question, tokensOf(leet(question)))) return true;
  if (prepared.deathPhrase || prepared.unambiguous || prepared.ingest || (prepared.harm && /\b(plan|tonight|sunday|dawn|midnight|manana|noche|wrists?|bleed\w*|roof|bridge|cliff|balcon)\b/.test(prepared.joined))) return true;
  if (prepared.subject && (prepared.death || prepared.harm || prepared.ingest || prepared.plan)) return true;
  if (!prepared.subject && prepared.plan && (prepared.joined.includes("plan") || prepared.joined.split(" ").filter((token) => MEANS_WORDS.includes(token)).length >= 1)) {
    const means = prepared.joined.split(" ").filter((token) => MEANS_WORDS.includes(token)).length;
    const times = prepared.joined.split(" ").filter((token) => TIME_WORDS.includes(token)).length;
    if ((means >= 1 && times >= 1) || means >= 2) return true;
  }
  const asked = leet(question).replace(/[?!.]+$/g, "").trim();
  if (FOLLOW_UPS.has(asked) && priorMeans(history)) return true;
  return false;
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
    if (crisisSheet(question)) return finish(crisisReply());
    if (Array.isArray(opts.history)) opts.history.slice(0);
    const screened = screen(question, opts.history);
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
    return finish(reply);
  } catch (err) {
    return { action: "error", text: ERROR_REPLY, modelCalled: false, sources: [] };
  }
}
