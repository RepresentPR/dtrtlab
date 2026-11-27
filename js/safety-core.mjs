// One crisis classifier for the chat and the shop.
// Returns "tier1", "tier2", or "none". Tier 1 is a hard sheet.
// Tier 2 keeps the ordinary answer and adds the gentle line.
// Normalization runs before every match. Object and idiom spans
// are removed before the tier-1 shapes are tested.

export const GENTLE_LINE = "If you're going through something hard, you can call or text 988 anytime / Si estás pasando por algo difícil, llama o escribe al 988.";

const HARM_EMOJI = { "🔪": " knife ", "🩸": " blood ", "💀": " death ", "⚰️": " death ", "💊": " pill ", "🪢": " noose ", "🔫": " gun ", "😵": " dead ", "💉": " inject ", "🪦": " death ", "☠️": " death " };

const FUZZY = ["suicide", "suicidal", "myself", "yourself", "himself", "herself", "themselves", "existing", "disappear", "forever", "tonight", "overdose", "hanging", "poison", "goodbye", "wrist", "wrists", "cutting", "unalive", "bridge", "paracetamol", "jump", "kill", "killing", "life", "pills", "swallow", "swallowed", "tablets", "bottle", "dying", "alive", "here", "rope", "ending", "morir", "quiero", "saturday"];
const TYPO = { kil: "kill", kll: "kill", ded: "dead", dye: "die", lyfe: "life", lfe: "life", lfie: "life", wnat: "want", wanna: "want", wana: "want", deth: "death", myslef: "myself", mysef: "myself", suicde: "suicide", sucidie: "suicide", scide: "suicide", sucide: "suicide", sicide: "suicide", tomorow: "tomorrow", tonite: "tonight", tonihgt: "tonight", anymroe: "anymore", existng: "existing", exstng: "existing", dissapear: "disappear", permanantly: "permanently", pilz: "pills", pils: "pills", hnag: "hang", jumo: "jump", jum: "jump", rof: "roof", mtar: "matar", gunna: "going", ened: "end", tke: "take", wrold: "world", goin: "going", evrything: "everything", alve: "alive", matr: "matar" };

const COMMON = new Set(("a an the and or of to for in on at by with from into over after before out off not yes no please just then than there here too very also still only own when while have has had do does did this that these those what whats where who how can will would should may might am are was were been being is it its my your our their his her we they he she you i im ive id ill me mine them him page pages site lab price prices plan plans planned planning form forms fill bill bills link links map desk contact notebook privacy refund brand shop list public free note notes class people day days time date today early company real wide shown optional stuck come comes sell use used stay turn two person share send find clear report happen get ask fix wrong need apply update see save device change delete remove close cancel make look great tab tabs built build read much many new old same other another any some such live love like line life last long give fire fine file five lift home hope open door city want wish told said anymore doesnt dont cant wont isnt wasnt didnt couldnt wouldnt shouldnt lets thats heres theres youre theyre proof night eight wake photo photos minute minutes hour hours cake recipe weather video feature office email password checkout donate browser kit band catalog candle shipping human question answer data bug bugs term terms job jobs ian dtrt demo partner partners coffee battery phone plant plane plank play pizza showcase trailer cookie cookies session account accounts chat history mute sound lights poster wall download downloads clip clips subscription cost costs template pixel status preorder invoice invoices overdue sample pack aquarium tablet tablets organizer sticker stickers badge button buttons logo design deal deals idea playlist mystery valley theme story stories about news article guide hang tag cut paste jump section pricing pro office lead pill pills load head meal real tell well call fall full film held help hell hill hall all log sign reset most hand band land sand rang bang song long king kind mind find wind back polls pool pull dad mom there where hear these those doing going coming being having making taking saying looking getting using seeing asking reading working trying living giving due hare vill exiting".split(" ")));

function fold(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc']/g, "")
    .replace(/[\u2010-\u2015]/g, "-");
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

const SKELETON_TARGETS = ["stop", "dont", "cant", "wont", "want", "kill", "life", "hang", "jump", "pill", "pills", "with", "from"];
const SKELETON = new Map();
for (const target of SKELETON_TARGETS) {
  const bones = target.replace(/[aeiou]/g, "");
  if (bones.length >= 2 && !SKELETON.has(bones)) SKELETON.set(bones, target);
}
function vowelSkeleton(token) {
  if (!token || token.length < 3 || token.length > 6 || /[aeiou]/.test(token) === false && token.length < 2) return "";
  const bones = token.replace(/[aeiou]/g, "");
  const hit = SKELETON.get(bones);
  return hit && hit !== token && token.length < hit.length ? hit : "";
}

function leetToken(token) {
  if (!/[0-9@$!|#]/.test(token)) return token;
  const map = (digit, bar) => token
    .replace(/0/g, "o")
    .replace(/1/g, digit)
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/!/g, "i")
    .replace(/\|/g, bar)
    .replace(/#/g, "")
    .replace(/^2(?=[a-z])/, "to");
  const asI = map("i", "i").replace(/([a-z])\1{2,}/g, "$1$1");
  const asL = map("l", "i").replace(/([a-z])\1{2,}/g, "$1$1");
  const asU = map("i", "u").replace(/([a-z])\1{2,}/g, "$1$1");
  const hit = (value) => /\b(kill\w*|pill\w*|myself|life|alive|jump\w*|dead|die|dying|hang\w*)\b/.test(value);
  if (hit(asL) && !hit(asI)) return asL;
  if (hit(asU) && !hit(asI)) return asU;
  return asI;
}

function normalize(text) {
  let next = String(text || "");
  for (const [mark, word] of Object.entries(HARM_EMOJI)) next = next.split(mark).join(word);
  next = next.replace(/\bODed\b/gi, " oded ").replace(/\bOD['’]d\b/gi, " oded ");
  next = next.replace(/död/gi, " dead ").replace(/dö/gi, " die ");
  next = fold(next).replace(/¢/g, "c").replace(/\*/g, "").replace(/\b(?:[a-z0-9][_-]){2,}[a-z0-9]\b/g, (chunk) => chunk.replace(/[_-]/g, ""));
  next = next.replace(/([a-z]{2,})-([a-z]{2,})/g, "$1$2");
  next = next.replace(/\b(?:[a-z0-9] ){2,}[a-z0-9]\b/g, (chunk) => chunk.replace(/ /g, ""));
  next = next.replace(/\b(?:[a-z0-9]\.){2,}[a-z0-9]\b/g, (chunk) => chunk.replace(/\./g, ""));
  next = next.replace(/\b2\b/g, " to ").replace(/\b1\b/g, " i ").replace(/\b4\b/g, " a ");
  next = next.replace(/[a-z0-9@$!|#]+/g, (token) => leetToken(token).replace(/z$/g, "s"));
  next = next.replace(/([a-z])\1{2,}/g, "$1$1");
  const parts = next.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((token) => {
    if (COMMON.has(token)) return token;
    if (TYPO[token]) return TYPO[token];
    const bones = vowelSkeleton(token);
    if (bones) return bones;
    const candidates = [token];
    if (/(.)\1/.test(token)) candidates.push(token.replace(/(.)\1/g, "$1"));
    if (candidates.includes("die") || candidates.includes("kill")) return candidates.includes("die") ? "die" : "kill";
    for (const candidate of candidates) {
      if (candidate.length === 3 && oneEdit(candidate, "here")) return "here";
      if (candidate.length < 4) continue;
      if (FUZZY.includes(candidate)) return candidate;
      for (const target of FUZZY) {
        if (Math.abs(target.length - candidate.length) > 1) continue;
        if (candidate[0] === target[0] && oneEdit(candidate, target)) return target;
      }
    }
    return token;
  });
  const joined = [];
  for (let i = 0; i < parts.length; i++) {
    const pair = i + 1 < parts.length ? parts[i] + parts[i + 1] : "";
    if (pair && parts[i].length > 1 && FUZZY.includes(pair)) { joined.push(pair); i += 1; }
    else if (/^(kill|hurt|hang|cut|off|shoot)(myself|himself|herself)$/.test(parts[i])) joined.push(parts[i].replace(/myself|himself|herself/, " $&"));
    else joined.push(parts[i]);
  }
  return joined.join(" ");
}

const STRIP = [
  /\b(this|that|it|work|monday|traffic|heat|queue|meeting|form|bug|page|joke|exam|deadline|task|homework|shift|commute|song|spreadsheet|game|market|forum|printer|conversation|hill|show|feature|demo|video|tab|link|session)\b(?:\s+\w+){0,4}\s+(?:is |are )?(?:killing|killed|kills) (?:me|my \w+|it|the room|our release)\b/g,
  /\b(?:killing|killed|kills) me\b/g,
  /\bkilling (?:it|time|my afternoon|my soul|my battery|my mood|our release|the room)\b/g,
  /\b(?:i d|i would|i could|could|id) (?:kill|die|murder) (?:for|a)\b/g,
  /\bto die for(?! [r]eal)\b/g,
  /\b(?<!to )die for (?![r]eal)\b/g,
  /\bdying (?:for|to|of)\b/g,
  /\b(?:dead|died) (?:tired|serious|link|simple|slow|weight|end|heat|silence|pixel)(?! of (?:living|life|everything))\b/g,
  /\b(?:almost |nearly )?died (?:laughing|of embarrassment)\b/g,
  /\b(?:the|my|our|el|la|a|an)\s+(?!friend|mom|dad|mother|father|brother|sister|kid|baby|person|neighbor|patient|hijo|hija|madre|padre|hermano|hermana)\w+\s+(?:is|are|was|were|esta|estan)\s+(?:dead|died|dying|muerto|muerta)\b/g,
  /\b(?:phone|battery|laptop|device|detector|charger|screen|keyboard|link|session|plant|server|printer|page|video|demo|tab|brain|feet)(?: battery| link)? (?:is |are |was |were |will be |gonna be )?(?:dead|died|dying|muerto|muerta)\b/g,
  /\b(?:my |the |our |el |la )?(?:phone|battery|laptop|link|enlace|session|plant|server|printer) (?:is |esta |are )?(?:dead|died|dying|muerto|muerta)\b/g,
  /\bbattery\b[^.]{0,48}\b(?:dead|died|dying)\b/g,
  /\bkill (?:the |a |an )?(?:lights|sound|autoplay|banner|cookie|tab|chat|switch|two birds|background)\b/g,
  /\b(?:kill|killing|hang|hanging|hung|cut|cutting) (?:the |a |an |my |your )?(?:\w+ )?(?:stuck )?(?:process|browser|tab|banner|cookie|poster|picture|map|video|clip|subscription|trailer|laundry|background|music|answer|logo)\b/g,
  /\bhang (?:on|in there|tight|up|out|onto|tag)\b/g,
  /\bjump to\b/g,
  /\b(?:kill switch|bleeding edge|bleeding heart|die cut|diecast|cut and paste|cut costs|cut off|killer (?:deal|feature|app|playlist|idea|page))\b/g,
  /\b(?:murder mystery|could murder|was murder|traffic was murder|i could murder)\b/g,
  /\b(?:starving|bored|scared) to death\b/g,
  /\bdead inside after\b/g,
  /\boverdos\w* (?:of|on) (?:the )?(?:coffee|caffeine|chocolate|downloads|free|office|map)\b/g,
  /\bmuero de (?:risa|hambre|sueno|ganas)\b/g,
  /\bmourir de rire\b/g,
  /\bdeath of me\b/g,
  /\bwrists? bands?\b/g,
  /\bmurder (?:this |the )?(?:workout|meeting|traffic|inbox)\b/g,
  /\bplant\b[^.]{0,40}\b(?:dead|died|dying)\b/g,
  /\bdead on my feet\b/g,
  /\bim gone after\b/g,
  /\bmourir de rire\b/g,
  /\bmorir de rire\b/g,
  /\ba mourir\b/g,
  /\ba morir\b/g,
  /\b(?:death valley|life and death|alive or dead|dead link|dead pixel|dead simple|dead slow|dead heat|dead weight|dead end|dead silence)\b/g,
  /\bdrop dead\b/g,
  /\bkilled it\b/g,
  /\b(?:was |is )?a killer\b/g,
  /\brope (?:light|lights|swing)\b/g,
  /\bblade of grass\b/g,
  /\bgun for the photo\b/g,
  /\bpill shaped\b/g,
  /\bcould die\b/g,
  /\bgonna die (?:laughing|if)\b/g,
  /\bdying art\b/g,
  /\bcutting ?edge\b/g,
  /\bcuttingedge\b/g,
  /\bhaircut\b/g,
  /\bbleach[- ]?free\b/g,
  /\bgone fishing\b/g,
  /\brope lights?\b/g,
  /\bshoot (?:a |the )?(?:video|link|me a)\b/g,
  /\bshoots video\b/g,
  /\bme muero por\b/g,
  /\bkill the lights\b/g,
  /\bhang the laundry\b/g,
  /\boverdose on chocolate\b/g,
  /\btodlich\b/g
];

function stripBenign(text) {
  let next = text;
  for (const pattern of STRIP) next = next.replace(pattern, " ");
  return next.replace(/\s+/g, " ").trim();
}

const TIER2_WORD = /\b(dead|die|died|dies|dying|death|kill\w*|murder\w*|suicid\w*|hurt\w*|harm\w*|cut\w*|hang\w*|hung|bleed\w*|overdos\w*|poison\w*|stab\w*|muero|muert\w*|morir|matar\w*|mourir|todlich|oluyorum)\b/;

function scriptCrisis(raw) {
  const text = String(raw || "").toLowerCase();
  const stems = ["死", "自杀", "自殺", "不想活", "自残", "умере", "суицид", "самоубий", "покончить", "أموت", "أعيش", "أؤذي", "मरना", "जीना", "मरायचे", "आत्महत्या", "죽", "자살", "자해", "chết", "mati", "למות", "mamatay", "patay", "magpakamatay", "mabuhay", "mouri", "傷つけ", "사라"];
  return stems.some((stem) => {
    const folded = stem.toLowerCase();
    if (/^[a-z]+$/.test(folded)) return new RegExp("\\b" + folded + "\\b").test(text);
    return text.includes(folded);
  });
}

function near(text, left, right, gap) {
  const span = "[^.]{0," + gap + "}";
  return new RegExp(left.source + span + right.source).test(text) || new RegExp(right.source + span + left.source).test(text);
}

const DEATH = /\b(die|dies|died|dying|dead|death|kill\w*|murder\w*|suicid\w*|unaliv\w*|morir\w*|muer\w*|matar\w*|morrer\w*|morire|uccid\w*|sterben|suizid\w*|selbstmord|olmek|oldur\w*|intihar\w*|mourir|umbring\w*|mouri)\b/;
const HARM = /\b(cut\w*|cort\w*|slit\w*|slash\w*|slic\w*|hang\w*|hung|shoot\w*|shot|hurt\w*|harm\w*|bleed\w*|sangr\w*|overdos\w*|poison\w*|stab\w*|wrist\w*|dano|taglio|farmi|ahorc\w*|venas|dispar\w*|offing)\b/;
const SELF = /\b(myself|himself|herself|themselves|yourself|my self|mich)\b/;
const WISH = /\b(want\w*|wish\w*|wanna|wana|gonna|going|quier\w*|quer\w*|voglio|veux|istiyor\w*|istem\w*|envie|ready)\b/;
const CEASE = /\b(exist\w*|esist\w*|vivir|viver|vivere|leben|vivre|disappear\w*|desaparec\w*|seguir|yasamak)\b/;
const LIVE = /\b(live|living|alive|life|vida)\b/;
const NEG = /\b(dont|doesnt|no|nao|non|nicht|not|never|ya)\b/;
const HARD = /\b(noose|gun|pistol|shotgun|razor|bleach|bala)\b/;
const MEANS = /\b(rope|soga|knife|blade|pill\w*|tablet\w*|pastill\w*|bridge|cliff\w*|bottle|veneno|insulin|tylenol|ibuprofen|aspirin|paracetamol|frasco|bullet)\b/;
const DRUG = /\b(pill\w*|tablet\w*|pastil\w*|tylenol|ibuprofen|aspirin|paracetamol|insulin\w*|veneno|meds|medicin\w*|benzo\w*|botiquin|cleaner|antifreeze|lejia|desatascador|medicine|medication|prescription|bottle|frasco|painkiller\w*|capsule\w*)\b/;
const TOOK = /\b(take|took|taken|taking|ate|eaten|swallow\w*|drank|downed|chugg\w*|tome|tomo|tomar\w*|trague|trag\w*|bebi\w*|inhal\w*|inject\w*|inyect\w*|\bod\b|oded)\b/;
const PLAN = /\b(plan|setup|dawn|midnight|sunday|drawer|closet|noche)\b/;
const PAGE = /\b(page|guide|article|notebook)\b/;
const RISK = /\b(lethal|fatal|deadly|overdos\w*|suicid\w*|noose|dose|painless\w*)\b/;

const PERSON = /\b(i|im|ive|ill|me|my|myself|yo|je|moi|ich|eu|io|kendimi)\b/;
const TIME = /\b(tonight|midnight|medianoche|dawn|amanecer|sunday|domingo|noche|madrugada)\b/;
const COMPARE = /\b(rather|better|happier|tired|done|cant|cannot|refuse|stop\w*|quit\w*|wish\w*|want\w*|wanna|gonna)\b/;

function anchored(text) {
  if (!text) return false;
  if (/\bwo finde ich\b/.test(text) && /\b(seite|preis|handy|schlussel|konto|karte|link|buero|formular)\b/.test(text)) {
    const rest = text.replace(/\bdie\b/g, " ");
    if (!DEATH.test(rest) && !MEANS.test(rest) && !HARD.test(rest)) return false;
  }
  if (/\bmy will\b/.test(text) && /\b(lawyer|estate|attorney|executor|signed|notar)\b/.test(text) && !DEATH.test(text) && !/\b(live|alive|life)\b/.test(text)) return false;
  if (near(text, /\blost\b/, /\bwill\b/, 16) && !/\b(lawyer|estate|attorney|executor|notar)\b/.test(text)) return true;
  if (/\b(suicid\w*|unaliv\w*|kms|self ?harm\w*|overdos\w*|sobredos\w*|lethal|letal|dosis|painless\w*|\bod\b|oded|olmek|oldur\w*|morrer\w*|morir\w*|muri\w*|muer\w*|morire|mourir|sterben|toten|matar\w*|muert\w*|tuer\b|uccid\w*|umbring\w*|intihar\w*|ahorc\w*|soga|noose|dano|farmi|taglio|zabi\w*)\b/.test(text) && !/\bmuero de\b/.test(text) && !/\b(?:mourir|morir) de rire\b/.test(text)) return true;
  if (/\b(mat(?:ar\w*|arme|arse|are|ara|ase|o|a)|cortarme|cortarse|cortare|ahorcarme|quitarme|pegarme|colgarme|colgarse|colgare|lanzarme|se mata|me mato|tomarme|tomarse|envenen\w*|me tuer|jogarme|me jogar|jogar me|asmak|asiyor\w*|asacag\w*|asilir\w*|hacerme)\b/.test(text)) return true;
  if (/\bkendimi\b/.test(text) && /\b(oldur\w*|olmek|intihar\w*|asmak|asiyor\w*|asacag\w*|asilir\w*)\b/.test(text)) return true;
  if (near(text, DEATH, PERSON, 48) || near(text, DEATH, SELF, 40) || near(text, DEATH, /\b(he|she|they|yo|vill|wil|jag)\b/, 40)) return true;
  if (near(text, COMPARE, DEATH, 48) || near(text, WISH, DEATH, 40)) return true;
  if (near(text, DEATH, /\b(easier|exit|better|tonight|morning|tomorrow)\b/, 32) && !/\b(phone|battery|plant|link|session|page)\b/.test(text)) return true;
  if (near(text, COMPARE, /\b(gone|wak\w*|exist\w*|disappear\w*)\b/, 36)) return true;
  if (NEG.test(text) && near(text, COMPARE, LIVE, 40)) return true;
  if ((NEG.test(text) || /\b(ne|pas|istemiyor\w*)\b/.test(text)) && near(text, /\b(quier\w*|quer\w*|voglio|veux|istiyor\w*|istem\w*|dese\w*|quisier\w*|prefier\w*|gust\w*|ganas|will)\b/, /\b(vivir|viver|vivre|vivere|leben|yasamak|vida|vivi\w*|seguir|exist\w*|esist\w*|despert\w*|acord\w*|svegli\w*|wak\w*|wok\w*)\b/, 36)) return true;
  if (near(text, /\b(quier\w*|quer\w*|voglio|veux|istiyor\w*|gust\w*)\b/, /\b(exist\w*|esist\w*|disappear\w*|desaparec\w*)\b/, 28)) return true;
  if (near(text, /\b(cant|cannot|dont|wont)\b/, /\b(alive|exist\w*|wak\w*|vivir|viver|life|living)\b/, 28)) return true;
  if (near(text, /\b(stop\w*|quit\w*|tired|done|refuse|rather|better|happier|sick|exhaust\w*|cansad\w*|hart\w*)\b/, /\b(live|living|alive|life|vida|exist\w*|vivir|vivo)\b/, 32)) return true;
  if (near(text, TOOK, DRUG, 40) && !/\b(aquarium|organizer|dissolve|vitamin|sample)\b/.test(text) && !(/\bsomeone\b/.test(text) && !PERSON.test(text))) return true;
  if (near(text, TOOK, /\b(poison\w*|veneno|bleach|cleaner|antifreeze|lejia|desatascador|everything|whole|shelf|handful|fell)\b/, 36)) return true;
  if (!/\b(aquarium|dissolve|vitamin|sample|organizer)\b/.test(text) && near(text, /\b(whole|entire|handful|all|twenty|thirty|forty|fifteen)\b/, DRUG, 24)) return true;
  if (near(text, /\b(slic\w*|inhal\w*|inject\w*|inyect\w*|engine)\b/, /\b(arm|wrist\w*|gas|fumes|insulin\w*|running|idling|exhaust)\b/, 32)) return true;
  if (near(text, HARM, SELF, 40) || near(text, /\bfire\b/, SELF, 24) || /\bis cutting\b/.test(text) || /\bcortand\w*\b/.test(text) || near(text, /\b(slit\w*|hang\w*|shoot\w*)\b/, /\bplan\w*\b/, 24) || near(text, HARM, /\b(wrist\w*|arm\w*|brazos|throat|munec\w*|purpose|his|her|their|she|he|they|sister|brother|friend|mom|dad|hijo|hija|hermano|hermana|amig\w*)\b/, 40) || near(text, /\b(cort\w*|colgar\w*|ahorcar\w*|pegar\w*|tiro)\b/, /\b(me|se|mi)\b/, 18) || near(text, /\b(barrel|gun|pistol)\b/, /\bmouth\b/, 24)) return true;
  if (HARD.test(text)) return true;
  if (near(text, MEANS, /\b(have|got|holding|ready|tied|mano|hand|myself|himself|herself|tonight|drawer|closet|cabinet|setup|plan\w*|close|wrist\w*|arm\w*)\b/, 32) && !/\b(aquarium|organizer|dissolve|vitamin|sample|poster|laundry|photo|lights|page)\b/.test(text)) return true;
  if (near(text, TIME, MEANS, 48) || near(text, TIME, /\b(river|rio|lake|lago|pier|highway|tracks|garage|garaje|roof|bridge|puente|cliff\w*|bath\w*|balcony|balcon\w*|overpass|quarry|subway|woods|presa|cantera)\b/, 48)) return true;
  if (near(text, /\b(do it|doing it|lo hago|way out)\b/, /\b(tonight|midnight|dawn|sunday|tomorrow|friday|monday|noche|medianoche|manana|domingo|lunes|viernes|garage|bridge|cliff\w*|roof|bath\w*|balcony|tracks|highway|quarry|overpass)\b/, 48)) return true;
  if (near(text, /\bplan\w*\b/, DEATH, 40) || near(text, /\bplan\w*\b/, /\b(do it|cliff\w*|bridge|rope|gun|noose|bath\w*|roof|balcon\w*|garage|midnight|dawn)\b/, 40) || (near(text, /\bplan\w*\b/, /\b(tonight|midnight|dawn|sunday|domingo|noche|tomorrow|manana|friday|monday)\b/, 32) && !/\b(pizza|meeting|invoice|shop|price)\b/.test(text))) return true;
  if (near(text, /\bdecid\w*\b/, TIME, 32)) return true;
  if (/\b(set|chosen|picked|elegi\w*)\b/.test(text) && /\b(day|date|dia|fecha)\b/.test(text) && PERSON.test(text) && !/\b(meeting|invoice|appointment|shop|price|knife)\b/.test(text)) return true;
  if (near(text, /\b(how many|how much|how to|how high|how quick|how fast|how long|what dose|which|amount)\b/, /\b(die|dead|death|kill\w*|lethal|fatal|overdos\w*|fall|dose|noose|bleed\w*|method|heart|breath\w*)\b/, 56)) return true;
  if (/\b(how|what|which|can|could|should)\b/.test(text) && /\b(method|floor|tracks|breath\w*|underwater|dose|height|peaceful|painless\w*)\b/.test(text) && PERSON.test(text) && !/\b(poster|laundry|picture|tag|shelf|costume|trailer|video|page|guide|notebook)\b/.test(text)) return true;
  if (/\b(wont|will not) be (here|around)\b/.test(text) || /\bnot be here\b/.test(text) || /\bwont be coming back\b/.test(text) || /\bya no estar\w*\b/.test(text) || (/\bestuvier\w*\b/.test(text) && NEG.test(text)) || (near(text, /\bgone\b/, /\b(when|already)\b/, 16) && /\b(im|i|me)\b/.test(text))) return true;
  if (/\bfor good\b/.test(text) && /\b(check\w*|leav\w*|gone|goodbye|life|myself|exit\w*)\b/.test(text) && !/\b(chat|account|delete|page|shop)\b/.test(text)) return true;
  if (/\bbetter off\b/.test(text) && /\b(everyone|everybody|without|dead|gone)\b/.test(text)) return true;
  if (near(text, /\b(want\w*|wish\w*)\b/, /\bout\b/, 16) && /\b(life|living|vida)\b/.test(text)) return true;
  if (near(text, /\bover\b/, /\bfor me\b/, 16) || (/\bwithout me\b/.test(text) && /\b(world|everyone|everybody|lighter|cope)\b/.test(text))) return true;
  if (near(text, /\boff\b/, /\b(myself|himself|herself)\b/, 12)) return true;
  if (near(text, /\bend\w*\b/, /\b(it|myself|himself|herself|life|lives|vida|todo|everything)\b/, 18) || near(text, TIME, /\bend\b/, 16)) return true;
  if (near(text, /\b(acab\w*|quit\w*|termin\w*|dejar\w*|leave|leaving|pondr\w*)\b/, /\b(vida|todo|life|mundo|world|se|me|noche|conmigo|fin|irl)\b/, 24)) return true;
  if (near(text, PAGE, /\b(last words|final message|mensaje final|ultimas palabras|goodbye forever|adios para siempre|suicid\w*|disappear\w*|lethal|overdos\w*|painless\w*|painful\w*|deadly|noose)\b/, 48) || near(text, /\b(about|cover|store)\b/, /\b(final message|last words|mensaje final|ultimas palabras|goodbye forever|adios para siempre)\b/, 40) || (/\bend it\b/.test(text) && (PAGE.test(text) || /\b(about|cover|store)\b/.test(text)))) return true;
  if (near(text, PAGE, /\b(bomb|explosive|weapon)\b/, 48) && /\b(how|make|build)\b/.test(text)) return true;
  if ((near(text, /\bjump\w*\b/, /\b(bridge|cliff\w*|puente|off|from|train|tonight|roof|balcony|garage|window|he|she|they|himself|herself)\b/, 32) || near(text, /\b(cliff\w*|bridge|puente|rope)\b/, /\b(cliff\w*|bridge|puente|rope)\b/, 40)) && !/\bpage\b/.test(text)) return true;
  if (near(text, /\b(goodbye|farewell|adios|desped\w*)\b/, /\b(forever|siempre|world|cruel|mundo|vida|life)\b/, 24) || near(text, /\bforever\b/, /\b(me|myself|gone)\b/, 24)) return true;
  if (/\b(ahog|estrangul|inyect|lanz|salt|dispar|clav|prend|estrell|arroj)(ar\w*|er\w*|ir\w*|e|o)\b/.test(text) || /\btirar\w*\b/.test(text)) return true;
  if (near(text, DRUG, DEATH, 48)) return true;
  if (near(text, /\b(disappear\w*|desaparec\w*)\b/, /\b(forever|permanent\w*|siempre)\b/, 24)) return true;
  if ((near(text, /\b(going|walking|driving)\b/, /\b(tracks|highway|cliff\w*|roof|bridge|puente|garage)\b/, 32) || near(text, /\b(do it|doing it)\b/, /\b(garage|bridge|cliff\w*|roof|bath\w*|balcony)\b/, 40)) && !/\bpage\b/.test(text)) return true;
  if (/\b(im|ill|i will|should i) (do it|doing it|use it)\b/.test(text)) return true;
  if (near(text, /\babout to\b/, /\b(jump\w*|die|kill\w*|cut\w*|end)\b/, 16)) return true;
  if (near(text, /\bfin\b/, /\b(jours|vida|life|me|conmigo)\b/, 16)) return true;
  if (/\bdriv\w* into\b[^.]{0,32}\b(wall|overpass)\b/.test(text) || (near(text, /\b(crash|hit)\b/, /\bme\b/, 24) && /\b(car|wall|coche)\b/.test(text))) return true;
  if (near(text, /\b(not|never|no)\b/, /\b(wak\w*|wok\w*|despert\w*|acord\w*|svegli\w*|vivir|viver|vivere)\b/, 18) || near(text, /\bsleep\w*\b/, /\bforever\b/, 16) || near(text, /\b(pain|heart)\b/, /\bstop\w*\b/, 20) || near(text, /\b(life|vida)\b/, /\b(worth|vale|over)\b/, 16) || near(text, /\b(point|reason|sentido|razon)\b/, /\b(alive|live|living|vida|vivir|vivi\w*|seguir)\b/, 28) || near(text, /\balive\b/, /\b(last|tonight)\b/, 24)) return true;
  if (/\b(take|taking|took|taken|end\w*)\b/.test(text) && /\b(my|her|his|their|own)\b/.test(text) && /\blife\b/.test(text)) return true;
  if (near(text, DRUG, /\b(purpose|alcohol|vodka|wine)\b/, 32)) return true;
  if (near(text, /\b(who|quien)\b/, /\b(find|encontrar)\b/, 24) && /\bme\b/.test(text)) return true;
  if (/\bfrom me\b/.test(text) && /\b(last|hear\w*)\b/.test(text)) return true;
  return false;
}


function softRisk(text) {
  return /\b(tonight|tomorrow|friday|sunday|midnight|dawn|garage|highway|tracks|pier|river|lake|roof|bridge|cliff\w*|pills|pill|rope|gun|plan|sorry|forever|alive|living|cant|cannot|puente|balcon\w*|soga|frasco|noche|manana|lanz\w*|ahog\w*|inyect\w*|estrangul\w*|saltar\w*|estare|oded|vias|mundo|caer|edificio|cable|medio|medication|prescription|handful|sunrise|mall|lot|wall|cabinet|fighting|mornings|burden|yeet|sewer|dood|umrz\w*|vill|finir|verschwind\w*|atropell\w*|pastill\w*|vio|cuarto|bano|carretera|azotea|lago|rio|garaje|decid|listo|despido|accounts|coming back|engine|roommate|bath|bathtub|wrists|wrist|tub|carta|cabeza|capsules|cantera|napkin|quarry|cabin|overpass|respawn|vanish|exiting|deleting|fade|mensaje|llaves|amanecer|prender\w*|estrell\w*|arrojar\w*|clav\w*|jours|via|tren|fuego|coche|bala|gas|arm|deep|born|breathing|breath|underwater|fall|floor|shelf|crash|vivo|method|reasons|keys|letters|bedroom|desk|jump\w*|tuer|finita|returned|packed|guitar|room|regal\w*|necesitar|volver\w*|gato|puedo|weekend|monday|handed|sleep|problem|date|hora|viernes|lunes|dia|perro|boxes|family|waking|saturday|decision|office|cosas|amigos|neighbor|going|nobody|permanently|close|long|calm|exit|today)\b/.test(text);
}

function warningOnly(text) {
  return /\b(goodbye|farewell|adios|desped\w*|bye\b|last day|last post|last night|final message|last message|no point|no reason|paid off|gave away|giving away|be around|be here|been decided|next month|next year|finished being|later for me|no longer|no more|stop fighting|burden|way out|mornings|me voy|the end|wont be back|wont need|for good|funeral|empty|passwords|checking out|final wishes|do it|doing it|morning|soon|nothing left|time to go|not around|ready to go|letter|letters|dog|keys|care|donated|giving|carta|perro|note|regal\w*|deje|dejo|cartas|asuntos|despedida|addio|hoscakal|finished|my will)\b/.test(text) || (/\bmade\b/.test(text) && /\bmind\b/.test(text)) || (/\bpicked\b/.test(text) && /\bday\b/.test(text));
}

function tier1(text) {
  return anchored(text);
}


function classifyCurrent(text) {
  if (scriptCrisis(text)) return "tier1";
  const norm = normalize(text);
  let stripped = stripBenign(norm);
  if (/\b(aquarium|dissolve|organizer)\b/.test(stripped) && !TOOK.test(stripped) && !/\b(whole|everything|handful)\b/.test(stripped)) stripped = stripped.replace(/\b(pill\w*|tablet\w*|organizer)\b/g, " ");
  if (anchored(stripped)) return "tier1";
  if (/\bfeet\b/.test(norm) && /\bunder\b/.test(norm)) return "tier2";
  if (warningOnly(norm) || warningOnly(stripped) || stripped !== norm || TIER2_WORD.test(norm) || TIER2_WORD.test(fold(text)) || softRisk(norm)) return "tier2";
  return "none";
}

export function classifyCrisis(text, history) {
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (classifyCurrent(turn) === "tier1") return "tier1";
    }
  }
  return classifyCurrent(text);
}
