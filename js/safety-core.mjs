// One crisis classifier for the chat and the shop.
// Returns "tier1", "tier2", or "none". Tier 1 is a hard sheet.
// Tier 2 keeps the ordinary answer and adds the gentle line.
// Normalization runs before every match. Object and idiom spans
// are removed before the tier-1 shapes are tested.

export const GENTLE_LINE = "If you're going through something hard, you can call or text 988 anytime / Si estás pasando por algo difícil, llama o escribe al 988.";

const HARM_EMOJI = { "🔪": " knife ", "🩸": " blood ", "💀": " death ", "⚰️": " death ", "💊": " pill ", "🪢": " noose ", "🔫": " gun ", "😵": " dead ", "💉": " inject ", "🪦": " death ", "☠️": " death " };

const FUZZY = ["suicide", "suicidal", "myself", "yourself", "himself", "herself", "themselves", "existing", "disappear", "forever", "tonight", "overdose", "hanging", "poison", "goodbye", "wrist", "wrists", "cutting", "unalive", "bridge", "paracetamol", "jump", "kill", "killing", "life", "pills", "swallow", "swallowed", "tablets", "bottle", "dying", "alive", "here", "rope", "ending", "morir", "quiero", "saturday"];
const TYPO = { kil: "kill", kll: "kill", ded: "dead", dye: "die", lyfe: "life", lfe: "life", lfie: "life", wnat: "want", wanna: "want", wana: "want", deth: "death", myslef: "myself", mysef: "myself", suicde: "suicide", sucidie: "suicide", tomorow: "tomorrow", tonite: "tonight", tonihgt: "tonight", anymroe: "anymore", existng: "existing", exstng: "existing", dissapear: "disappear", permanantly: "permanently", pilz: "pills", pils: "pills", hnag: "hang", jumo: "jump", jum: "jump", rof: "roof", mtar: "matar", gunna: "going", ened: "end", tke: "take", wrold: "world", goin: "going", evrything: "everything", alve: "alive", matr: "matar" };

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
  next = fold(next).replace(/¢/g, "c").replace(/\b(?:[a-z0-9][_-]){2,}[a-z0-9]\b/g, (chunk) => chunk.replace(/[_-]/g, ""));
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
  /\b(?:phone|battery|laptop|device|detector|charger|screen|keyboard|link|session|plant|server|printer|page|video|demo|tab|brain|feet)(?: battery| link)? (?:is |are |was |were |will be |gonna be )?(?:dead|died|dying)\b/g,
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
const DRUG = /\b(pill\w*|tablet\w*|pastil\w*|tylenol|ibuprofen|aspirin|paracetamol|insulin\w*|veneno|meds|medicine|medication|prescription|bottle|frasco|painkiller\w*|capsule\w*)\b/;
const TOOK = /\b(take|took|taken|taking|ate|eaten|swallow\w*|drank|chugg\w*|tome|tomo|trague|inhal\w*|inject\w*|inyect\w*|\bod\b|oded)\b/;
const PLAN = /\b(plan|setup|dawn|midnight|sunday|drawer|closet|noche)\b/;
const PAGE = /\b(page|guide|article|notebook)\b/;
const RISK = /\b(lethal|fatal|deadly|overdos\w*|suicid\w*|noose|dose|painless\w*)\b/;

const PERSON = /\b(i|im|ive|ill|me|my|myself|yo|je|moi|ich|eu|io|kendimi)\b/;
const TIME = /\b(tonight|midnight|medianoche|dawn|amanecer|sunday|domingo|noche|madrugada)\b/;
const COMPARE = /\b(rather|better|happier|tired|done|cant|cannot|refuse|stop\w*|quit\w*|wish\w*|want\w*|wanna|gonna)\b/;

function anchored(text) {
  if (!text) return false;
  if (/\b(suicid\w*|unaliv\w*|kms|self ?harm\w*|overdos\w*|sobredos\w*|farmi|taglio|dano|lethal|letal|dosis|\bod\b|oded|olmek|oldur\w*|morrer\w*|morir\w*|muri\w*|muer\w*|morire|mourir|sterben|toten|matar\w*|muert\w*|tuer\b|uccid\w*|umbring\w*|intihar\w*|ahorc\w*|soga)\b/.test(text) && !/\bmuero de\b/.test(text)) return true;
  if (/\b(mat(?:ar\w*|arme|arse|are|ara|ase|o|a)|cortarme|cortarse|ahorcarme|quitarme|pegarme|colgarme|lanzarme|se mata|me mato)\b/.test(text)) return true;
  if (/\bme tuer\b/.test(text) || /\bkendimi\b/.test(text) && /\b(oldur\w*|olmek|intihar\w*)\b/.test(text)) return true;
  if (!/\ben vivo\b/.test(text) && near(text, NEG, /\bvivo\b/, 36)) return true;
  if (near(text, /\b(want\w*|wish\w*|quier\w*)\b/, /\bout\b/, 16) && /\b(life|living|alive|pointless|anymore|vida)\b/.test(text)) return true;
  if (near(text, /\bplan\w*\b/, DEATH, 40) || /\bplan\w* it\b/.test(text) || near(text, /\bplan\w*\b/, /\bdo it\b/, 24)) return true;
  if (/\b(do it|doing it|lo hago|way out)\b/.test(text) && /\b(dawn|noche|medianoche|amanecer|monday|tuesday|wednesday|thursday|saturday|friday|sunday|tomorrow|tonight|midnight|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(text)) return true;
  if (/\b(date is set|set a date|set the day|chosen the day|ya elegi|todo listo)\b/.test(text)) return true;
  if (near(text, TOOK, /\b(everything|whole|shelf|handful)\b/, 32)) return true;
  if (near(text, DRUG, DEATH, 48)) return true;
  if (near(text, /\b(slic\w*|inhal\w*|inject\w*|inyect\w*|engine)\b/, /\b(arm|wrist\w*|gas|fumes|insulin\w*|running|idling|exhaust|me|my|mi)\b/, 32)) return true;
  if (near(text, /\b(delet\w*|finish\w*)\b/, SELF, 16) || /\bfinish\w* me off\b/.test(text)) return true;
  if (near(text, /\bfin\b/, /\b(jours|vida)\b/, 24)) return true;
  if (/\bdriv\w* into\b[^.]{0,32}\b(wall|overpass|traffic)\b/.test(text)) return true;
  if (near(text, /\b(crash|hit)\b/, /\bme\b/, 24) && /\b(car|wall|coche)\b/.test(text)) return true;
  if (near(text, /\bdeshar\w*\b/, /\b(mi|me)\b/, 16)) return true;
  if (near(text, /\bdejar\w*\b/, /\brespir\w*\b/, 16)) return true;
  if (near(text, /\b(desped\w*|goodbye|farewell)\b/, /\b(vida|life)\b/, 16)) return true;
  if (near(text, /\b(voy|irme|quier\w*)\b/, /\bmundo\b/, 24) && (/\b(voy|irme|mejor)\b/.test(text) || NEG.test(text))) return true;
  if (near(text, /\bsleep\w*\b/, /\bforever\b/, 16)) return true;
  if (near(text, /\babout to\b/, /\b(jump\w*|die|kill\w*|cut\w*)\b/, 12)) return true;
  if (near(text, DEATH, /\b(easier|exit|painless\w*|better)\b/, 32)) return true;
  if (near(text, /\balive\b/, /\btoo many\b/, 32) || /\bnever been born\b/.test(text)) return true;
  if (near(text, /\bwhy\b/, /\b(breath\w*|living|alive)\b/, 28) && /\b(should|keep|bother)\b/.test(text)) return true;
  if (near(text, /\b(giving|give)\b/, /\bup\b/, 8) && LIVE.test(text)) return true;
  if (near(text, NEG, /\bsurviv\w*\b/, 16)) return true;
  if (near(text, DEATH, /\bmorning\b/, 20) && /\b(will|by|be)\b/.test(text) && !/\b(phone|battery|plant|link|session)\b/.test(text)) return true;
  if (near(text, /\b(not coming back|not come back)\b/, /\b(bridge|puente|water|tonight|forever|sunrise)\b/, 48)) return true;
  if (near(text, /\bjump\w*\b/, /\b(puente|again|surviv\w*)\b/, 24)) return true;
  if (/\bnot be here\b/.test(text) || /\bwont be coming back\b/.test(text)) return true;
  if (near(text, /\bya no\b/, /\bestar\b/, 24)) return true;
  if (near(text, /\b(point|reason)\b/, /\bwak\w*\b/, 24)) return true;
  if (/\b(im|ill|i will|should i) (do it|doing it)\b/.test(text)) return true;
  if (/\bfinish\w* it\b/.test(text) && /\b(weekend|tonight|cabin|alone|sunday|tomorrow|garage|bath\w*|friday|saturday)\b/.test(text)) return true;
  if ((/\btonight is the\b/.test(text) && /\bnight\b/.test(text)) || (/\blast night\b/.test(text) && /\bearth\b/.test(text)) || /\bthats the day\b/.test(text)) return true;
  if (/\bcant go on\b/.test(text)) return true;
  if (near(text, /\b(goodbye|farewell|adios)\b/, /\b(world|cruel|mundo)\b/, 20)) return true;
  if (/\bsee tomorrow\b/.test(text) && NEG.test(text)) return true;
  if (near(text, /\bdone\b/, /\b(lake|lago|bridge|puente|garage|roof|quarry|overpass|tracks|woods)\b/, 40) && /\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|tonight|tomorrow|domingo|sabado)\b/.test(text)) return true;
  if (near(text, COMPARE, DEATH, 48) || near(text, COMPARE, /\b(gone|wak\w*|exist\w*|disappear\w*)\b/, 36)) return true;
  if (NEG.test(text) && near(text, COMPARE, LIVE, 40)) return true;
  if (near(text, /\b(cant|cannot|dont|wont)\b/, LIVE, 24)) return true;
  if (near(text, /\b(stop\w*|quit\w*|tired|done|cant|cannot|refuse|rather|better|happier|sick|exhaust\w*)\b/, LIVE, 32)) return true;
  if (near(text, /\bnot\b/, /\b(alive|exist\w*|wak\w*)\b/, 16)) return true;
  if (near(text, DEATH, TIME, 40)) return true;
  if (near(text, /\b(die|dies|died|dying|dead|death|alive|gone|no more)\b/, /\b(tonight|morning|tomorrow|last)\b/, 24)) return true;
  if (near(text, /\b(do it|doing it|lo hago)\b/, /\b(river|rio|lake|lago|pier|highway|tracks|vias|garage|garaje|roof|bridge|puente|cliff\w*|bath\w*|bano|banera|balcony|balcon\w*|azotea|carretera|parking|overpass|quarry|subway|platform|woods|presa|cantera|estacionamiento|cabin|patio)\b/, 48)) return true;
  if (near(text, TIME, /\b(river|rio|lake|lago|pier|highway|tracks|vias|garage|garaje|roof|bridge|puente|cliff\w*|bath\w*|bano|banera|balcony|balcon\w*|azotea|carretera|parking|overpass|quarry|subway|platform|woods|presa|cantera|estacionamiento|cabin|patio|mall)\b/, 48) || near(text, /\bdecid\w*\b/, TIME, 32)) return true;
  if (near(text, /\b(tomorrow|friday|monday|manana|sabado|domingo|jueves)\b/, /\b(river|rio|lake|lago|pier|highway|tracks|vias|garage|garaje|roof|bridge|puente|cliff\w*|bath\w*|bano|banera|balcony|balcon\w*|azotea|carretera|parking|overpass|quarry|subway|platform|woods|presa|cantera|estacionamiento|cabin|patio)\b/, 48)) return true;
  if (/\b(ahog|estrangul|inyect|lanz|salt|dispar|clav|prend|estrell|arroj)(ar\w*|er\w*|ir\w*|e|o)\b/.test(text)) return true;
  if (near(text, /\b(dejar\w*|ire|irme)\b/, /\b(mundo|balcon\w*|caer)\b/, 28)) return true;
  if (near(text, /\bquitar\w*\b/, /\b(me|yo|medio)\b/, 18)) return true;
  if (near(text, /\bend\w*\b/, /\bthings\b/, 12)) return true;
  if (/\b(wont|will not) be (here|around)\b/.test(text) || /\bya no estar\w*\b/.test(text)) return true;
  if (near(text, /\b(meter\w*|via|vias)\b/, /\b(tren|vias|via)\b/, 24)) return true;
  if ((near(text, /\b(going|walking|driving)\b/, /\b(tracks|vias|highway|railway|cliff\w*|roof|pier|bridge|puente)\b/, 32) || near(text, /\bgo to\b/, /\b(garage|garaje|bridge|puente|roof)\b/, 28) && /\b(sleep\w*|tonight|alone|midnight)\b/.test(text)) && !/\bpage\b/.test(text)) return true;
  if (near(text, DRUG, /\b(bath\w*|bano|banera)\b/, 32)) return true;
  if (near(text, /\bwont\b/, /\bhere\b/, 12) || near(text, /\bwant\w*\b/, /\bhere\b/, 16) && NEG.test(text)) return true;
  if (near(text, MEANS, /\b(garage|garaje|closet|drawer|bath\w*)\b/, 28)) return true;
  if (near(text, /\b(wrist\w*|munec\w*)\b/, TIME, 28) || near(text, /\b(cut\w*|cort\w*|slit\w*)\b/, /\bmunec\w*\b/, 16)) return true;
  if (near(text, /\bpurpose\b/, /\b(wall|drive|car|crash)\b/, 24)) return true;
  if (near(text, /\bsick\b/, LIVE, 16)) return true;
  if (near(text, /\breason\w*\b/, /\b(live|going|vivir)\b/, 20)) return true;
  if (near(text, /\bmethod\b/, /\b(night|garage|picked|chose|chosen)\b/, 64)) return true;
  if (near(text, /\b(do it|doing it)\b/, /\b(tomorrow|tonight|midnight|friday|sunday)\b/, 32)) return true;
  if (near(text, PERSON, DEATH, 48)) return true;
  if (near(text, HARM, SELF, 40)) return true;
  if (near(text, TOOK, /\b(poison\w*|veneno|bleach)\b/, 36)) return true;
  if (near(text, TOOK, DRUG, 40) && !/\b(aquarium|organizer|dissolve|vitamin)\b/.test(text) && !(/\bsomeone\b/.test(text) && !PERSON.test(text))) return true;
  if (near(text, TIME, MEANS, 48) || near(text, TIME, HARD, 48)) return true;
  if (near(text, MEANS, /\b(have|got|holding|ready|mano|hand|with|con)\b/, 32) || near(text, HARD, /\b(have|got|holding|ready|mano|hand|with|con)\b/, 32)) return true;
  if (near(text, /\b(how many|how much|how to|how high|how far|what dose|which)\b/, /\b(die|dead|death|kill\w*|lethal|fatal|overdos\w*|fall|dose|noose|bleed\w*)\b/, 56)) return true;
  if (near(text, /\bend\w*\b/, /\b(it|myself|himself|herself|life|lives|vida|todo)\b/, 18)) return true;
  if (near(text, PAGE, /\b(last words|final message|suicid\w*|disappear\w*|lethal|overdos\w*|painless\w*|deadly)\b/, 48) || near(text, /\b(about|cover|store)\b/, /\b(final message|last words|mensaje final|ultimas palabras|goodbye forever|adios para siempre)\b/, 40)) return true;
  if (near(text, DEATH, WISH, 40) || near(text, DEATH, SELF, 40)) return true;
  if (near(text, /\bbetter\b/, /\bwithout\b/, 16) && /\bme\b/.test(text)) return true;
  if (near(text, /\bgone\b/, /\b(when|im|am)\b/, 16)) return true;
  if (near(text, /\bpain\b/, /\bstop\w*\b/, 16)) return true;
  if (near(text, /\blife\b/, /\bworth\b/, 16)) return true;
  if (near(text, /\blife\b/, /\b(over|own)\b/, 16)) return true;
  if (near(text, /\b(cansad\w*|hart\w*|tired)\b/, /\b(vivir|vivo|living|alive)\b/, 24)) return true;
  if (near(text, /\b(do it|doing it)\b/, /\b(garage|bath|bridge|cliff\w*|roof|balcon\w*|balcony)\b/, 40)) return true;
  if (near(text, /\bplan\b/, /\b(bath|balcon\w*|balcony|garage|roof|bridge|midnight|dawn)\b/, 40)) return true;
  if (/\b(take|taking|end\w*|ended) (her|his|their|my|own) (life|lives)\b/.test(text) || near(text, /\bstay\b/, /\balive\b/, 16)) return true;
  if (near(text, /\btir(ar|are|arme|arse)\w*\b/, /\b(balcon\w*|puente|bridge|cliff\w*)\b/, 32)) return true;
  if (near(text, /\bdesaparec\w*\b/, /\b(siempre|forever|permanent\w*)\b/, 24)) return true;
  if (near(text, WISH, HARM, 24)) return true;
  if (near(text, DRUG, /\bpurpose\b/, 32)) return true;
  if (near(text, /\btired\b/, /\b(living|life|exist\w*)\b/, 16)) return true;
  if (near(text, /\bend\w*\b/, /\beverything\b/, 16)) return true;
  if (near(text, /\bplan\b/, /\b(banera|bath)\b/, 40)) return true;
  if (/\b(tirare|tirarme|tirarse|ahorc\w*|matarme|matarse)\b/.test(text)) return true;
  if (near(text, /\bjump\w*\b/, /\b(train|tonight|will|front|plan(?:s|ned|ning)?|she|he|they)\b/, 32)) return true;
  if (near(text, WISH, /\bjump\w*\b/, 24)) return true;
  if (near(text, HARM, PLAN, 32)) return true;
  if (/\b(cortarme|cortarse|cortare|tomarme|tomarse|colgarme|colgarse|colgare|envenen\w*|pegarme|pegare|quitarme|intihar\w*|uccid\w*|zabi\w*|finita|lejia|antifreeze|tramadol|benzos|desatascador|escopeta|cuchillo|botiquin|acantilado|umbring\w*)\b/.test(text)) return true;
  if (near(text, /\boff\b/, /\bmyself\b/, 12)) return true;
  if (near(text, /\brather\b/, /\blive\b/, 16)) return true;
  if (near(text, /\b(refuse|done)\b/, /\b(live|life)\b/, 16)) return true;
  if (near(text, /\bout\b/, /\blife\b/, 12)) return true;
  if (near(text, /\bend\w*\b/, /\blives\b/, 16)) return true;
  if (near(text, /\bdejar\w*\b/, CEASE, 16)) return true;
  if (near(text, /\bno\b/, /\bllegar\w*\b/, 12)) return true;
  if (near(text, /\bpondr\w*\b/, /\bfin\b/, 12)) return true;
  if (near(text, /\bmy will\b/, /\b\w+\b/, 8)) return true;
  if (/\b(desaparec\w*|conmigo|cleaner|painful\w*)\b/.test(text)) return true;
  if (near(text, /\bquitarme\b/, /\b\w+\b/, 4)) return true;
  if (near(text, /\blive\b/, /\b(wont|cant|cannot|nothing|refuse)\b/, 24)) return true;
  if (near(text, /\bvida\b/, /\b(vale|fin)\b/, 16)) return true;
  if (near(text, /\b(take|taking)\b/, /\beverything\b/, 16)) return true;
  if (near(text, /\bwithout me\b/, /\b(lighter|world|everyone|cope)\b/, 24)) return true;
  if (/\b(rage quit|six feet|let me go)\b/.test(text)) return true;
  if (/\bis cutting\b/.test(text)) return true;
  if (near(text, /\bbarrel\b/, /\bmouth\b/, 24)) return true;
  if (near(text, /\b(slit\w*|cut\w*|cort\w*)\b/, /\bthroat\b/, 16)) return true;
  if (near(text, /\bacab\w*\b/, /\b(se|me)\b/, 16)) return true;
  if (near(text, /\btirar\w*\b/, /\b(se|me|vida|balcon\w*|puente)\b/, 24)) return true;
  if (near(text, HARM, SELF, 32) || near(text, /\bfire\b/, SELF, 24) || near(text, /\b(cut\w*|slit\w*|cort\w*|slic\w*)\b/, TIME, 32) || near(text, HARM, /\b(me|mi|yo|se|su|ella|el|he|she|his|her|their|they|them|vecin\w*|amig\w*|herman\w*|pacient\w*)\b/, 80) || near(text, /\b(cut\w*|cort\w*|slit\w*|slash\w*|bleed\w*)\b/, /\b(wrist\w*|arm\w*|brazos)\b/, 24)) return true;
  if (near(text, WISH, CEASE, 32) || near(text, WISH, /\b(die|dead|death|gone|alive)\b/, 32)) return true;
  if (near(text, NEG, WISH, 16) && (LIVE.test(text) || CEASE.test(text))) return true;
  if (near(text, NEG, /\b(leben|vivre|vivere|vivir|exist\w*|seguir|wake\w*|despert\w*|acord\w*|svegli\w*|yasamak)\b/, 32)) return true;
  if (HARD.test(text)) return true;
  if (!/\b(aquarium|organizer|dissolve|vitamin|sample)\b/.test(text) && (near(text, MEANS, SELF, 40) || near(text, MEANS, PLAN, 40) || near(text, MEANS, /\b(jump\w*|tonight|myself|i|im|ive|me|my|he|she|him|her|they|yo)\b/, 40))) return true;
  if (near(text, /\bbridge\b/, /\b(close|jump\w*|tonight|plan|midnight|sunday)\b/, 32)) return true;
  if (near(text, /\bplan\b/, /\b(dawn|midnight|cliff\w*|bridge|rope|gun|sunday|noche)\b/, 32)) return true;
  if (near(text, /\b(cliff\w*|bridge|rope|gun|blade)\b/, /\b(cliff\w*|bridge|rope|gun|blade|table|note)\b/, 40)) return true;
  if (near(text, DEATH, /\b(ich|je|moi|eu|io|i|im|me|my|he|she|they|yo|vill|wil|jag)\b/, 40)) return true;
  if (near(text, DEATH, PLAN, 32)) return true;
  if (near(text, TOOK, /\b(poison\w*|veneno)\b/, 32)) return true;
  if (near(text, HARM, /\bpurpose\b/, 24)) return true;
  if (near(text, TOOK, DRUG, 40) && !/\b(aquarium|organizer|dissolve|vitamin)\b/.test(text) && (!/\bsomeone\b/.test(text) || /\b(i|im|ive|me|my|you|she|he|they|her|his)\b/.test(text))) return true;
  if (!/\b(aquarium|dissolve|vitamin|sample|organizer)\b/.test(text) && near(text, /\b(whole|entire|handful|all|twenty|thirty|forty|fifteen)\b/, DRUG, 24)) return true;
  if (near(text, /\b(how many|how much|how to|what dose|which)\b/, RISK, 48)) return true;
  if (near(text, /\b(how many|how much|how to|what dose)\b/, DEATH, 48)) return true;
  if (near(text, PAGE, RISK, 48)) return true;
  if (near(text, PAGE, /\b(bomb|explosive|weapon)\b/, 48) && /\b(how|make|build)\b/.test(text)) return true;
  if (near(text, /\bend\w*\b/, /\b(it|life|vida|todo)\b/, 16)) return true;
  if (near(text, /\b(acab\w*|quit\w*|termin\w*|dejar\w*|leave|leaving)\b/, /\b(vida|todo|life|mundo|world)\b/, 24)) return true;
  if (near(text, /\brather\b/, /\b(here|die|dead|alive|exist\w*)\b/, 24)) return true;
  if (near(text, /\b(point|reason|sentido)\b/, /\b(alive|live|living|vida|vivir)\b/, 24)) return true;
  if (near(text, /\b(who|quien)\b/, /\b(find|encontrar)\b/, 24) && /\bme\b/.test(text)) return true;
  if (near(text, /\bstop\w*\b/, /\b(breath\w*|heart)\b/, 24)) return true;
  if (near(text, /\bjump\w*\b/, /\b(bridge|cliff\w*|off|from)\b/, 24)) return true;
  if (near(text, /\bdisappear\w*\b/, /\b(forever|permanent\w*|siempre)\b/, 16)) return true;
  if (near(text, /\b(goodbye|farewell|adios)\b/, /\b(forever|siempre)\b/, 24)) return true;
  if (near(text, /\blost\b/, /\bwill\b/, 16)) return true;
  if (near(text, /\b(forever|siempre)\b/, /\b(me|myself|exist\w*)\b/, 24)) return true;
  if (/\b(quier\w*|quer\w*|voglio|veux|istiyor\w*)\b/.test(text) && (DEATH.test(text) || CEASE.test(text) || LIVE.test(text))) return true;
  if (near(text, /\b(tonight|midnight|dawn|sunday)\b/, /\b(roof|bridge|garage|cliff\w*|balcony)\b/, 32)) return true;
  if (/\bme mato\b/.test(text)) return true;
  if (/\b(painless\w*|en finir|verschwind\w*|atropell\w*|estuvier\w*|umrz\w*)\b/.test(text)) return true;
  if (near(text, /\bover\b/, /\bfor me\b/, 12)) return true;
  if (near(text, /\b(yeet|sewer)\b/, /\b(myself|slide)\b/, 16)) return true;
  if (near(text, /\bpermanently\b/, /\b(clock|quit|end|stop|out|exit\w*|game)\b/, 24)) return true;
  if (near(text, /\bdood\b/, /\bwil\b/, 12)) return true;
  if (near(text, /\bcar\b/, /\bhit\b/, 24) && /\bme\b/.test(text)) return true;
  if (near(text, /\b(never|not)\b/, /\bwok\w*\b/, 16)) return true;
  if (near(text, /\bcabinet\b/, /\b(tonight|take|everything)\b/, 24)) return true;
  if (near(text, DRUG, /\b(listas|tengo|todas|ready)\b/, 24)) return true;
  if (near(text, PAGE, /\b(last words|final message|deadly|painless\w*)\b/, 48)) return true;
  if (near(text, /\b(last|hears|hear)\b/, /\bfrom me\b/, 24)) return true;
  if (near(text, /\btonight\b/, /\bend\b/, 16)) return true;
  if (near(text, TOOK, /\bhandful\b/, 24)) return true;
  if (near(text, TOOK, /\bfell\b/, 32)) return true;
  if (near(text, /\b(me|mi)\b/, /\b(tiro|pegare|pegarme)\b/, 24)) return true;
  return false;
}

function softRisk(text) {
  return /\b(tonight|tomorrow|friday|sunday|midnight|dawn|garage|highway|tracks|pier|river|lake|roof|bridge|cliff\w*|pills|pill|rope|gun|plan|sorry|forever|alive|living|cant|cannot|puente|balcon\w*|soga|frasco|noche|manana|lanz\w*|ahog\w*|inyect\w*|estrangul\w*|saltar\w*|estare|oded|vias|mundo|caer|edificio|cable|medio|medication|prescription|handful|sunrise|mall|lot|wall|cabinet|fighting|mornings|burden|yeet|sewer|dood|umrz\w*|vill|finir|verschwind\w*|atropell\w*|pastill\w*|vio|cuarto|bano|carretera|azotea|lago|rio|garaje|decid|listo|despido|accounts|coming back|engine|roommate|bath|bathtub|wrists|wrist|tub|carta|cabeza|capsules|cantera|napkin|quarry|cabin|overpass|respawn|vanish|exiting|deleting|fade|mensaje|llaves|amanecer|prender\w*|estrell\w*|arrojar\w*|clav\w*|jours|via|tren|fuego|coche|bala|gas|arm|deep|born|breathing|breath|underwater|fall|floor|shelf|crash|vivo|method|reasons|keys|letters|bedroom|desk|jump\w*|tuer|finita|returned|packed|guitar|room|regal\w*|necesitar|volver\w*|gato|puedo|weekend|monday|handed|sleep|problem|date|hora|viernes|lunes|dia|perro|boxes|family|waking|saturday|decision|office|cosas|amigos|neighbor|going|nobody|permanently|close|long|calm|exit|today)\b/.test(text);
}

function warningOnly(text) {
  return /\b(goodbye|farewell|adios|desped\w*|bye\b|last day|last post|last night|final message|last message|no point|no reason|paid off|gave away|giving away|be around|be here|been decided|next month|next year|finished being|later for me|no longer|no more|stop fighting|burden|way out|mornings|me voy|the end|wont be back|wont need|for good|funeral|empty|passwords|checking out|final wishes|do it|doing it|morning|soon|nothing left|time to go|not around|ready to go|letter|letters|dog|keys|care|donated|giving|carta|perro|note)\b/.test(text) || (/\bmade\b/.test(text) && /\bmind\b/.test(text)) || (/\bpicked\b/.test(text) && /\bday\b/.test(text));
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
