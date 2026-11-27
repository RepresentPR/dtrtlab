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

export const MISS_REPLY = "I don't have a good answer for that yet.";

export const CONTACT_LINE = "You can write hello@dtrtlab.com or use the contact page at /contact.html.";

export const REDIRECT = "I'm an early test AI that only knows DTRT Lab. Try asking about the site, the lab, or Ian's public work.";

export const SUGGESTIONS = ["What is on the site?", "What does the lab do?", "Who is Ian?"];

export const RESOURCE_NOTE = "If you might hurt yourself, get help now. In the US, call or text 988. You can chat at https://988lifeline.org. If you are in immediate danger, call 911. Outside the US, visit https://findahelpline.com.";

export const ONLY_LINE = REDIRECT;

export const HELP_LINE = "If you're struggling, call or text 988 (US) or visit findahelpline.com.";

export const OTHER_HELP_LINE = "If this is about someone else: stay with them, call or text 988, or 911 if they're in immediate danger.\nSi se trata de otra persona: quédate con ella, llama o escribe al 988, o al 911 si está en peligro inmediato.";

export const UNSURE_REPLY = "I'm not sure about that yet.";

export const ERROR_REPLY = "The search on this page did not finish. The public pages are still linked from the home page.\n\n" + HELP_LINE;

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

function spell(text) {
  return tokensOf(deleet(text)).map((token) => TYPO_DICT[token] || token).join(" ");
}

function asksForHarmPage(text, tokens) {
  const folded = fold(text);
  const wantsPage = tokens.some((token) => PAGE_WORDS.has(token)) || /\b(show me|find the)\b/.test(folded);
  if (!wantsPage) return false;
  return hasAnyPhrase(tokens, HARM_PHRASES);
}

const CRISIS_EXACT = [
  "quiero morir", "me quiero matar", "hacerme dano", "hacerme daño", "me corto",
  "quero morrer", "quero me matar", "me cortar", "je veux mourir", "envie de mourir", "me suicider",
  "ich will sterben", "mich umbringen", "voglio morire", "suicidarmi", "farmi del male", "mi taglio",
  "我想自杀", "我不想活了", "想死", "死にたい", "自分を傷つけたい", "自殺したい",
  "죽고 싶어", "자살하고 싶어요", "자해하고 있어",
  "मैं मरना चाहता हूँ", "أريد أن أموت", "أؤذي نفسي", "я хочу умереть", "покончить с собой",
  "gusto kong magpakamatay", "ayoko nang mabuhay", "mwen vle mouri", "मला मरायचे आहे",
  "自残", "自杀", "自殺", "आत्महत्या", "самоубийство", "es un suicidio",
  "selbstmord", "selbstverletzung", "magpakamatay"
];

function crisisWording(text) {
  const raw = String(text || "");
  const t = deleet(raw);
  if (asksForHarmPage(raw, tokensOf(t))) return true;
  if (CRISIS_EXACT.some((phrase) => raw.includes(phrase) || t.includes(fold(phrase)))) return true;
  if (/\b(kill myself|killing myself|killed myself|kill himself|kill herself|kill themselves)\b/.test(t)) return true;
  if (/\b(end|ending|take|taking|takes|took) (my|his|her|their|your) (own )?life\b/.test(t)) return true;
  if (/\bown life\b/.test(t)) return true;
  if (/\b(want|wants|wanted|wanna|going) to die\b/.test(t)) return true;
  if (/\b(die on purpose|stop breathing|tonight is the end|how to die)\b/.test(t)) return true;
  if (/\bhang (myself|himself|herself|themselves)\b/.test(t)) return true;
  if (/\b(do not|dont|does not|doesnt|no longer) (want|wants) to (live|exist)\b/.test(t)) return true;
  if (/\b(tired of living|stop existing|stop living|worth living|keep living)\b/.test(t)) return true;
  if (/\b(ending it|end it|end everything)\b/.test(t)) return true;
  if (/\bslit\b/.test(t)) return true;
  if (/\b(cut|cuts|cutting) (myself|himself|herself|my|his|her)\b/.test(t)) return true;
  if (/\b(selfharm|suicide|suicidal|suicidio|unalive|kms)\b/.test(t)) return true;
  if (/\b(rather be dead|rather not be here|not be here)\b/.test(t)) return true;
  if (/\bwho will find me\b/.test(t) || /\bquien me va a encontrar\b/.test(t)) return true;
  if (/\b(goodbye note|farewell note|farewell letter|last night alive|last message)\b/.test(t)) return true;
  if (/\b(i am not safe|im not safe|i need help)\b/.test(t) && !/\b(order|account|password|page|login|form)\b/.test(t)) return true;
  if (/\boverdose\w*\b/.test(t) && !/\bcoffee\b/.test(t)) return true;
  if (/\btook an od\b/.test(t)) return true;
  if (/\b(lethal dose|dosis letales|dosis letal)\b/.test(t)) return true;
  if (/\b(least painful|better off without me|make the pain stop|when im gone|when i am gone)\b/.test(t)) return true;
  if (/\b(leave this world|leaving this world|dejar este mundo|quiero desaparecer|desaparecer para siempre)\b/.test(t)) return true;
  if (/\b(quitting life|quit life|point of staying alive|staying alive)\b/.test(t)) return true;
  if (/\b(rope setup|the rope|a rope|bought a rope)\b/.test(t)) return true;
  if (/\b(pills?|pastillas?|tablets?|painkillers?)\b/.test(t) && /\b(took|taken|taking|take|swallowed|swallow|bottle|handful|all|every|got)\b/.test(t)) return true;
  if (/\bbleach\b/.test(t)) return true;
  if (/\bwrists?\b/.test(t) && /\b(cut|slit|bleed|bleeding)\b/.test(t)) return true;
  if (/\b(jump|jumped|jumping)\b/.test(t) && /\b(bridge|roof|window|balcony|myself|himself|herself|tonight|off|from)\b/.test(t)) return true;
  if (/\b(gun|pistol|rifle|shotgun)\b/.test(t) && /\b(myself|himself|herself|tonight|plan|head|mouth)\b/.test(t)) return true;
  if (/\bknife\b/.test(t) && /\b(wrist|wrists|throat)\b/.test(t)) return true;
  if (/\bbarrel\b/.test(t) && /\bmouth\b/.test(t)) return true;
  if (/\b(everything about me forever|everything else about me forever)\b/.test(t)) return true;
  if (/\bquitar\w* la vida\b/.test(t)) return true;
  if (/\b(matarme|me voy a matar|colgarme|ahorcarme|acabar con mi vida|terminar con mi vida)\b/.test(t)) return true;
  if (/\b(se quiere morir|se quiere matar|quiere morir|quiere quitarse)\b/.test(t)) return true;
  if (/\b(told me|dijo que)\b/.test(t) && /\b(die|live|kill|end|jump|pill|hurt|suicid|life|morir|quitar|vivir)\b/.test(t)) return true;
  if (/\b(wants|wanted) to\b/.test(t) && /\b(die|kill|end|jump|hang|cut|shoot|live|morir|quitar)\b/.test(t)) return true;
  if (/\b(plan|planeo|arrangement)\b/.test(t) && /\b(tonight|sunday|manana|tomorrow|midnight|dawn|friday)\b/.test(t) && /\b(bridge|roof|garage|bathroom|banera|balcony|balcon|park|bath|tub)\b/.test(t)) return true;
  if (/\b(tirare|tirarme|me tir)\b/.test(t)) return true;
  if (/\b(cortarme|cortare|cortarse|cortara|venas)\b/.test(t)) return true;
  if (/\b(colgarme|colgare|voy a colgar|me voy a colgar|ahorcarme|ahorcare)\b/.test(t)) return true;
  if (/\b(shoot|shot) (myself|himself|herself|themselves)\b/.test(t)) return true;
  if (/\b(swallowed|took|taken|taking)\b/.test(t) && /\b(bottle|pills?|tablets?|handful)\b/.test(t)) return true;
  if (/\bdejar de existir\b/.test(t)) return true;
  if (/\bahorc\w*\b/.test(t)) return true;
  if (/\bjump\w*\b/.test(t) && /\b(train|bridge|roof|window|balcony|off|from|front)\b/.test(t)) return true;
  if (/\blife worth\b/.test(t) || (/\bworth it\b/.test(t) && /\blife\b/.test(t))) return true;
  if (/\b(is cutting|are cutting|while cutting|esta cortandose|se tomo|se corto|se trago)\b/.test(t)) return true;
  if (/\b(pegare un tiro|un tiro|matare|suicidarme|suicidar|me quiero suicid)\b/.test(t)) return true;
  if (/\bpills?\b/.test(t) && /\b(sleeping|alcohol|down)\b/.test(t)) return true;
  if (/\bjump\b/.test(t) && /\b(plan|manana|tomorrow|tonight|going to)\b/.test(t)) return true;
  if (/\bgoing to jump\b/.test(t)) return true;
  if (/\bmyself\b/.test(t) && /\bkill\b/.test(t)) return true;
  if (/\b(no reason to live|reason to live|ya no quiero vivir|no quiero vivir)\b/.test(t)) return true;
  if (/\bdo it\b/.test(t) && /\b(tonight|sunday|tomorrow|midnight|dawn|manana)\b/.test(t) && /\b(bridge|roof|garage|bathroom|balcony|balcon|park)\b/.test(t)) return true;
  if (/\b(voy a tirar|tirar del|tirarme)\b/.test(t)) return true;
  if (/\b(not going to be around|cant be here anymore|cannot be here anymore|wont be around|this is goodbye|saying goodbye|goodbye forever|said goodbye|lost the will)\b/.test(t)) return true;
  if (/\b(isnt a later for me|see next month|finished being here|all been decided|tomorrow is it)\b/.test(t)) return true;
  if (/\blethal doses?\b/.test(t)) return true;
  if (/\b(envenen\w*|me mat\w*|tirarse|morirse|se acaba)\b/.test(t)) return true;
  if (/\b(va a tirar|se va a tirar|se va a cortar|se va a matar|will jump|killing himself|killing herself)\b/.test(t)) return true;
  if (/\bdo it\b/.test(t) && /\b(bridge|roof|garage|balcony)\b/.test(t)) return true;
  if (/\b(take|takes|took) the (whole )?bottle\b/.test(t)) return true;
  if (/\b(disappear forever|desaparecer para siempre|desaparecer)\b/.test(t)) return true;
  if (/\bdisappear\b/.test(t) && /\bpara siempre\b/.test(t)) return true;
  if (/\bdice que se quiere\b/.test(t) && /\b(die|morir|jump|kill|end|quitar|pegar|tiro)\b/.test(t)) return true;
  if (/\bswallow\w*\b/.test(t) && /\b(medicine|cabinet|pills?|bottle|something)\b/.test(t)) return true;
  if (/\b(esta cortando|se esta cortando|her cutting|hanging from|sangrando)\b/.test(t)) return true;
  if (/\bgun\b/.test(t) && /\b(will use|left the gun)\b/.test(t)) return true;
  if (/\bmedicine cabinet\b/.test(t)) return true;
  if (/\bme muero\b/.test(t) && !/\brisa\b/.test(t)) return true;
  if (/\bhang (yourself|myself|himself|herself)\b/.test(t)) return true;
  if (/\btodas las pastillas\b/.test(t)) return true;
  if (/\bknife\b/.test(t) && /\b(herself|himself)\b/.test(t)) return true;
  if (/\bwill die\b/.test(t) && /\b(by|tonight|sunday)\b/.test(t)) return true;
  if (/\b(final message|last words|mensaje final|ultimas palabras|adios para siempre|sobredosis|overdos)\b/.test(t)) return true;
  if (/\b(last time anyone hears|wanting to die|voy a morirme|morirme|tomarme las pastillas|dead by)\b/.test(t)) return true;
  if (/\bmorir\b/.test(t) && !/\brisa\b/.test(t)) return true;
  if (/\bmuert[oa]s?\b/.test(t)) return true;
  if (/\b(cutting|cortando|cortandose)\b/.test(t) && /\b(wrist|wrists|arm|arms|vena|venas|muneca|himself|herself|ban[o0])\b/.test(t)) return true;
  return false;
}

const FOLLOW_UPS = new Set([
  "should i use it", "should i do it", "should i use that", "should i do that",
  "how much", "is it enough", "tonight", "good plan"
]);

function priorMeans(history) {
  if (!Array.isArray(history)) return false;
  return history.some((turn) => /\b(rope|pills?|gun|blade|bridge)\b/.test(deleet(turn)));
}

// The only crisis decider. A short follow-up counts only when an earlier
// turn in this call already named a means. A benign later question does not.
export function crisisSheet(question, history) {
  if (crisisWording(question) || crisisWording(spell(question))) return true;
  const asked = fold(question).replace(/[?!.]+$/g, "").trim();
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
