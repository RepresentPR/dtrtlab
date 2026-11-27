// One crisis classifier for the chat and the shop.
// Returns "tier1", "tier2", or "none". Tier 1 is a hard sheet.
// Tier 2 keeps the ordinary answer and adds the gentle line.
// Normalization runs before every match. Object and idiom spans
// are removed before the tier-1 shapes are tested.

export const GENTLE_LINE = "If you're going through something hard, you can call or text 988 anytime / Si estás pasando por algo difícil, llama o escribe al 988.";

const HARM_EMOJI = { "🔪": " knife ", "🩸": " blood ", "💀": " death ", "⚰️": " coffin ", "💊": " pill ", "🪢": " noose ", "🔫": " gun ", "😵": " dead " };

const FUZZY = ["suicide", "suicidal", "myself", "yourself", "himself", "herself", "themselves", "existing", "disappear", "forever", "tonight", "overdose", "hanging", "poison", "goodbye", "wrists", "cutting", "unalive", "bridge", "paracetamol", "jump", "kill", "killing", "life", "pills", "swallow", "swallowed", "tablets", "bottle", "dying", "alive", "here", "rope", "ending", "morir", "quiero", "saturday"];
const TYPO = { kil: "kill", kll: "kill", ded: "dead", dye: "die", lyfe: "life", lfe: "life", lfie: "life", wnat: "want", deth: "death", myslef: "myself", mysef: "myself", suicde: "suicide", sucidie: "suicide", tomorow: "tomorrow", tonite: "tonight", tonihgt: "tonight", anymroe: "anymore", existng: "existing", exstng: "existing", dissapear: "disappear", permanantly: "permanently", pilz: "pills", pils: "pills", hnag: "hang", jumo: "jump", ened: "end", tke: "take", wrold: "world", goin: "going", evrything: "everything", alve: "alive" };

const COMMON = new Set(("a an the and or of to for in on at by with from into over after before out off not yes no please just then than there here too very also still only own when while have has had do does did this that these those what whats where who how can will would should may might am are was were been being is it its my your our their his her we they he she you i im ive id ill me mine them him page pages site lab price prices plan plans planned planning form forms fill bill bills link links map desk contact notebook privacy refund brand shop list public free note notes class people day days time date today early company real wide shown optional stuck come comes sell use used stay turn two person share send find clear report happen get ask fix wrong need apply update see save device change delete remove close cancel make look great tab tabs built build read much many new old same other another any some such live love like line life last long give fire fine file five lift home hope open door city want wish told said anymore doesnt dont cant wont isnt wasnt didnt couldnt wouldnt shouldnt lets thats heres theres youre theyre proof night eight wake photo photos minute minutes hour hours cake recipe weather video feature office email password checkout donate browser kit band catalog candle shipping human question answer data bug bugs term terms job jobs ian dtrt demo partner partners coffee battery phone plant plane plank play pizza showcase trailer cookie cookies session account accounts chat history mute sound lights poster wall download downloads clip clips subscription cost costs template pixel status preorder invoice invoices overdue sample pack aquarium tablet tablets organizer sticker stickers badge button buttons logo design deal deals idea playlist mystery valley theme story stories about news article guide hang tag cut paste jump section pricing pro office lead pill pills load head meal real tell well call fall full film held help hell hill hall all log sign reset most hand band land sand rang bang song long king kind mind find wind back polls pool pull dad mom there where hear these those doing going coming being having making taking saying looking getting using seeing asking reading working trying living giving due hare vill exiting".split(" ")));

export function fold(value) {
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
  next = fold(next).replace(/¢/g, "c").replace(/\b(?:[a-z0-9]_+){2,}[a-z0-9]\b/g, (chunk) => chunk.replace(/_/g, ""));
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
      for (const target of FUZZY) {
        if (Math.abs(target.length - candidate.length) > 1) continue;
        if (oneEdit(candidate, target)) return target;
      }
    }
    return token;
  });
  const joined = [];
  for (let i = 0; i < parts.length; i++) {
    const pair = i + 1 < parts.length ? parts[i] + parts[i + 1] : "";
    if (pair && FUZZY.includes(pair)) { joined.push(pair); i += 1; }
    else if (/^(kill|hurt|hang|cut|off|shoot)(myself|himself|herself)$/.test(parts[i])) joined.push(parts[i].replace(/myself|himself|herself/, " $&"));
    else joined.push(parts[i]);
  }
  return joined.join(" ");
}

const STRIP = [
  /\b(this|that|it|work|monday|traffic|heat|queue|meeting|form|bug|page|joke|exam|deadline|commute|song|spreadsheet|game|market|forum|printer|conversation|hill|show|feature|demo|video|tab|link|session)\b(?:\s+\w+){0,4}\s+(?:is |are )?(?:killing|killed|kills) (?:me|my \w+|it|the room|our release)\b/g,
  /\b(?:killing|killed|kills) me\b/g,
  /\bkilling (?:it|time|my afternoon|my soul|my battery|my mood|our release|the room)\b/g,
  /\b(?:i d|i would|i could|could|id) (?:kill|die|murder) (?:for|a)\b/g,
  /\bto die for(?! real)\b/g,
  /\b(?<!to )die for (?!real)\b/g,
  /\bdying (?:for|to|of)\b/g,
  /\b(?:dead|died) (?:tired|serious|link|simple|slow|weight|end|heat|silence|pixel)(?! of (?:living|life|everything))\b/g,
  /\b(?:almost |nearly )?died (?:laughing|of embarrassment)\b/g,
  /\b(?:phone|battery|laptop|link|session|plant|server|printer|page|video|demo|tab|brain|feet)(?: battery| link)? (?:is |are |was |were )?(?:dead|died|dying)\b/g,
  /\b(?:my |the |our |el |la )?(?:phone|battery|laptop|link|enlace|session|plant|server|printer) (?:is |esta |are )?(?:dead|died|dying|muerto|muerta)\b/g,
  /\bkill (?:the |a |an )?(?:lights|sound|autoplay|banner|cookie|tab|chat|switch|two birds|background)\b/g,
  /\b(?:kill|killing|hang|hanging|hung|cut|cutting) (?:the |a |an |my |your )?(?:stuck )?(?:process|browser|tab|banner|cookie|poster|picture|map|video|clip|subscription|trailer|laundry|background|music|answer|logo)\b/g,
  /\bhang (?:on|in there|tight|up|out|onto|tag)\b/g,
  /\bjump to\b/g,
  /\b(?:kill switch|bleeding edge|bleeding heart|die cut|diecast|cut and paste|cut costs|cut off|killer (?:deal|feature|app|playlist|idea|page))\b/g,
  /\b(?:murder mystery|could murder|was murder|traffic was murder|i could murder)\b/g,
  /\b(?:starving|bored|scared) to death\b/g,
  /\bdead inside after\b/g,
  /\boverdos\w* (?:of|on) (?:the )?(?:coffee|caffeine|chocolate|downloads|free|office|map)\b/g,
  /\bme muero de (?:risa|hambre)\b/g,
  /\bmuero de (?:risa|hambre)\b/g,
  /\bmourir de rire\b/g,
  /\ba mourir\b/g,
  /\b(?:death valley|life and death|alive or dead|dead link|dead pixel|dead simple|dead slow|dead heat|dead weight|dead end|dead silence)\b/g,
  /\bdrop dead\b/g,
  /\bkilled it\b/g,
  /\b(?:was |is )?a killer\b/g,
  /\brope (?:light|lights|swing)\b/g,
  /\bblade of grass\b/g,
  /\bgun for the photo\b/g,
  /\bpill shaped\b/g,
  /\bhow many pills are in\b/g,
  /\bcould die\b/g,
  /\bgonna die (?:laughing|if)\b/g,
  /\bdying art\b/g,
  /\bcutting edge\b/g,
  /\bhaircut\b/g,
  /\bbleach[- ]free\b/g,
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
  const text = String(raw || "");
  const stems = ["死", "自杀", "自殺", "不想活", "自残", "умере", "суицид", "самоубий", "покончить", "أموت", "أعيش", "أؤذي", "मरना", "जीना", "मरायचे", "आत्महत्या", "죽", "자살", "자해", "chết", "mati", "למות", "mamatay", "patay", "magpakamatay", "mabuhay", "mouri", "傷つけ", "사라"];
  return stems.some((stem) => text.toLowerCase().includes(stem.toLowerCase()));
}

function tier1(text) {
  if (!text) return false;
  const patterns = [
    /\b(suicid\w*|unaliv\w*|kms|self ?harm\w*)\b/,
    /\b(an od|took an od|rope setup|envie de mourir|umbringen|hacerme dano|farmi del male|mi taglio|farla finita)\b/,
    /\b(kill\w*|hurt\w*|cut\w*|hang\w*|shoot\w*|off\w*|harm\w*) (myself|himself|herself|themselves|yourself|my self)\b/,
    /\b(wants?|wanna|wana|wnat|wanted|going|gonna|planning|bout) to (die|dye|be dead|kill|jump|disappear|stop existing|wake|end it|not be alive|morir|morire)\b/,
    /\b(i|im|he|she|they|we|me|my)\b[^.]{0,48}\b(die|dies|died|dying|dead|suicide|kill myself|end it|not be alive|be over)\b/,
    /\b(want|wanna|wana) (die|to die)\b/,
    /\b(doesnt|does not|dont|do not) want to (live|be alive|be here|wake|exist)\b/,
    /\brather be dead\b/,
    /\b(reason (to|too) (live|go on)|not going to be (alive|around|here)|wasnt alive|was not alive)\b/,
    /\b(ending (it|things|everything)|slit my wrists|cut\w* my wrists)\b/,
    /\bunaliv\w*\b/,
    /\b(stab\w*|slic\w*|slash\w*) (myself|my (arm|wrist|stomach))\b/,
    /\b(rather not live|done living|no longer wants?|stand being alive|staying alive|happier dead|keep breathing|keep living|go on living|being alive|want death|wanna live|end myself|swallow every|sleep forever|coming back|stop breathing|gone for good|let me go|drive into)\b/,
    /\b(take|takes) the (whole )?bottle\b/,
    /\bse va a (tirar|cortar|matar|saltar)\b/,
    /\bse acaba\b/,
    /\bcut (his|her|their|my) wrists\b/,
    /\bpistol is for\b/,
    /\b(despid\w*|wont be back|leaving for good|going away forever|ultimo mensaje|wont see them|forgive me|out of time|made peace|giving away|donated my|leaving tonight|lo hago|ya lo decidi|elegi el dia|tonight is the night|its over for me|para siempre|no despert|desaparecer|tirarme|muriera|mes jours|farla finita|hacer dano|dano de verdad)\b/,
    /\b(bleach|ibuprofen|painkillers|pain killers|handful|cabinet|vodka|whiskey)\b/,
    /\b(be dead|gonna be dead|final message|last words|way out|not be here|picked the day|written the note)\b/,
    /\b(going to do it|gonna do it|finishing it|stop trying|without me|walk into the water)\b/,
    /\b(botiquin|frasco|para siempre|morire|despert|desaparec|haria dano|inyect|prendere fuego|vale la pena)\b/,
    /\b(painful way|razor|bleed\w* (for|from)|from my wrists|od d|on purpose)\b/,
    /\b(gonna|going to|i) od\b/,
    /\bod tonight\b/,
    /\b(me voy a|voy a|quiero|quiere|quiere) (matar|morir|morirme|quitar|tirar|cortar|saltar|acabar)\w*\b/,
    /\b(quitar\w*|termin\w*|acab\w*) (con )?(mi |la |su |el )?(vida|todo)\b/,
    /\b(no quiero|no quiere|ya no quiere|ya no quiero) (vivir|estar|seguir|mas)?\b/,
    /\b(se quiere matar|se va a matar|quiere morirse|quiero morirme)\b/,
    /\b(want|wanna|wana|wnat|going|gonna|bout) to (die|dye|be dead|kill|disappear|stop existing)\b/,
    /\b(want|wanna|wana|going|gonna) to end (it|my life|his life|her life|everything|it all)\b/,
    /\b(end|ending) (it all|my life|his life|her life|their life|your life|everything)\b/,
    /\b(is to jump|plan for sunday|will do it|do it tomorrow|voy a (pegar|colgar|matar|tirar)|pegarme|colgarme|pegarse|gun in my mouth|use the rope|die on sunday|hears from me|last time anyone)\b/,
    /\bbarrel[^.]{0,24}mouth\b/,
    /\b(dont|do not|cant|cannot|wont|will not) (want to )?(live|be alive|exist|keep living|go on living|stay alive)\b/,
    /\b(done with|finished with|tired of) (life|living|being alive|existing)\b/,
    /\b(no reason|no point|nothing) (left )?(to )?(live|living|keep going|go on)\b/,
    /\b(not worth living|worth living|life worth|will to live|stop existing|stopped existing|disappear for good|disappear forever|better off dead|better off without|never wake|not wake|never woke|end it all|make the pain stop|pain stop)\b/,
    /\b(own life|leave this world|no longer around|wont be here|will not be here|cant be here|cannot be here|wont be around|will not be around|wont be alive|about me forever|me forever|later for me|see next month|finished being here)\b/,
    /\b(sewer slide|yeet myself|rage quit|clock out permanently|log off life|delete myself|deleting myself|six feet under|no respawn|exit the game|off myself)\b/,
    /\b(goodbye|good bye|farewell|adios) (forever|world|everyone|everybody|note|letter|letters|all|tonight)\b/,
    /\b(my|this is|said|saying) (goodbye|farewell|goodbyes)\b/,
    /\b(goodnight forever|desped\w*|adios a todos)\b/,
    /\b(already gone|checking out|final wishes|my last (post|email|note|night)|last night (alive|on earth)|my will|empty flat|made up my mind)\b/,
    /\b(wrote|written|writing) (my |a )?(goodbye |farewell )?(note|letter|letters)\b/,
    /\b(took|taken|taking|swallowed|drank|ate|eaten|downed|inhaled|stabbed|injected|oded?|tome|tomo|trague)[^.]{0,48}\b(pill|pills|tablet|tablets|pilz|meds|painkiller|painkillers|poison|poisonous|antifreeze|insulin|gas|prescription|medication|medicine|bottle|veneno|lejia|tylenol|ibuprofen|aspirin|paracetamol|whole|entire|too many|on purpose|fistful|everything|box)\b/,
    /\b(pastillas|ready to die|end it)\b/,
    /\b(cliff|bridge)[^.]{0,40}\b(bridge|cliff)\b/,
    /\b(pistol|gun|shotgun|rifle|blade|knife|rope|bridge|cliff|roof)[^.]{0,40}\b(plan|sunday|tonight|midnight|dawn)\b/,
    /\b(plan|sunday|tonight)[^.]{0,50}\b(pistol|gun|shotgun|rifle|blade|knife|rope|bridge|cliff|cliffs|roof|garage|bath|balcony|park|dawn)\b/,
    /\b(garage|bath|balcony|balcon|banera|park|roof|bridge|dawn|midnight|tonight|sunday)[^.]{0,50}\bplan\b/,
    /\b(cortandose|cortarse|se corto|quitting life|who will find me|quien me va a encontrar|dosis letales|dejar este mundo|swallowed something|while cutting|overdosed|swallow the bottle|sangrando|hanging from)\b/,
    /\b(plan|sunday|tonight)[^.]{0,40}\b(pistol|gun|blade|knife|rope|bridge|cliff|roof)\b/,
    /\b(pill|pills|tablet|tablets|bottle|painkiller|painkillers|pastillas|paracetamol)\w*[^.]{0,60}\b(took|taken|swallowed|alcohol|handful|empty)\b/,
    /\b(jump in front|in front of the train|dead inside|death would be easier|only exit|will end it|rope and a gun|slit|i jump|plan is written|knife on my|bleeding will not stop|both wrists|me muero|will to carry|lost the will|all been decided|tomorrow is it)\b/,
    /\b(midnight|bathroom|garage|roof|bridge|dawn|balcon)[^.]{0,40}(is the plan|ese es el plan)\b/,
    /\bplan is (dawn|tonight|sunday|midnight)\b/,
    /\b(is cutting|her cutting|him cutting)\b/,
    /\b(store|guide on|page cover)[^.]{0,40}\b(muerto|morir|suicid|overdose|colgar|end it)\b/,
    /\b(wrists is deep|i am bleeding|tonight is the end|decision is made|cutting (her|his|my) arm)\b/,
    /\b(guide|page|article|notebook)[^.]{0,40}\b(muerto|morir|suicidio|overdose)\b/,
    /\b(wrists|wrist)[^.]{0,40}\b(cut|slit|bleed)\b/,
    /\b(todas las pastillas|todo el frasco|pastillas y)\b/,
    /\b(pills|pill) (im |i am )?about to\b/,
    /\bpill(?: pill)+ all\b/,
    /\b(nothing matters|finished with all|it is over for me|noise in my head|want out|for real)\b/,
    /\b(actually|really) die\b/,
    /\b(wanting to die|planning to jump|end their lives|sick of being alive|set (herself|himself|myself) on fire)\b/,
    /\b(swallows pills|goodbye message|se quito la vida|tirarse|cortando|pondre fin|ya no existire|no llegare|no despertare|into my mouth|drank the bleach|drain cleaner|benzos|car would crash|better off if i|point in waking|not exist|feels pointless|wont need to)\b/,
    /\b(saltar|dejar|estrangul|desaparec|meter|volar|prend|pondr|existir|deshar|estrell|arroj|colgar|ahorcar|cortar|quitar|despert|llegar)(e|are|aria|ire|eria|are)\b/,
    /\b(how (much|many)|how to|how high|how fast)[^.]{0,70}\b(die|death|deadly|fatal|lethal|painless|overdose|noose|suicide|wake|bleed|bleach|swallow)\b/,
    /\b(lethal doses?|dosis letal|tie a noose|noose|heart stops|painless\w*|peaceful method|quickest way|easiest way|best way to die|hang a rope|rope that holds|quietly ending|surviving a fall|fall from|ways to (die|disappear)|household chemicals|hanging quick|train tracks|subway platform|bleed out)\b/,
    /\b(guide on|page cover| store )[^.]{0,40}\b(suicid\w*|overdos\w*|sobredos\w*|muerto|morir|colgar\w*|final message|last words|goodbye forever|rather be dead|end it|mensaje final|ultimas palabras|adios para siempre)\b/,
    /\b(are cutting|in the bath)\b/,
    /\b(too (much|many)|how many|how much)[^.]{0,40}\b(paracetamol|tylenol|aspirin|ibuprofen|pills|pill|insulin|tablets)\b/,
    /\boverdos\w*\b/,
    /\b(jump\w* (off|from|tonight|del)|going to jump|gonna jump|barrel in my mouth|drive into the wall|parking (structure|garage))\b/,
    /\b(i|he|she|they|me|my|yo|tengo|tiene)[^.]{0,50}\b(rope|noose|soga|bridge|cliff|razor|gun|blade|pills|pastillas|tablets)\b/,
    /\b(rope|noose|soga|gun|blade|razor|pills|pastillas)[^.]{0,40}\b(garage|tonight|bath|bridge|closet|ready|drawer|nobody|lined)\b/,
    /\b(writer|speaker|author|whoever|yours truly|this chatter|the user)[^.]{0,70}\b(dead|die|dying|jump|pill|rope|live|living|disappear|done|leave)\b/,
    /\bme [a-z]*(mat|ahor|cort|tir|colg|peg|envenen|dispar|lanz|ahog|clav|suicid|trag|beb)\w*\b/,
    /\b(cortarse|las venas|knife on (herself|himself)|on herself|on himself)\b/,
    /\b(matarme|matarse|matare|suicidare|suicidarme|ahorcar\w*|cortare|cortarme|quitarme|quitarse|me quito|me quiero|no quiero|ya no quiero|no tengo ganas|dejar\w* de existir|de este mundo|conmigo|no despert|ya no estare|me voy para siempre|acab\w* con|pienso en matar)\b/,
    /\b(ich|wir)[^.]{0,50}\b(sterben|umbringen|selbstmord|suizid|leben|verschwinden)\b/,
    /\b(je|moi)[^.]{0,40}\b(mourir|tuer|suicid|finir|vivre)\b/,
    /\bme tuer\b/,
    /\b(voglio|non voglio)[^.]{0,40}\b(morir\w*|uccid\w*|vivere)\b/,
    /\bmi uccid\w*\b/,
    /\b(quero|vou|nao quero)[^.]{0,40}\b(morrer|matar|viver|vida)\b/,
    /\b(intihar|yasamak istem|oldur\w*|olmek)\b/,
    /\b(ik wil dood|chce umrzec|chce sie zabic|jag vill do)\b/,
    /\b(knife|gun|coffin|noose|pill) (tonight|soon|myself)\b/,
    /\bwant (this|it) to end\b/,
    /\b(cant|cannot) (carry this|live like this|do this anymore)\b/,
    /\b(no more mornings|lighter without me|stop fighting|calling it quits|stay alive|done being a burden|never been born|wasnt alive|was not alive)\b/,
    /\b(show me|notebook|guide|article|page)[^.]{0,40}\bhow to (make|build) (a |an )?(bomb|explosive|weapon)\b/,
    /\b(will jump|plan is tonight|i will kill|blade is on|bridge is close)\b/,
    /\b(myself|himself|herself)[^.]{0,40}\b(kill|die|hang|cut)\b/,
    /\b(show me|find the|link me|which (article|page|guide)|what page)[^.]{0,60}\b(suicide|overdose|noose|painless|kill myself|end(ing)? (a |my )?life|disappear|fade out)\b/,
    /\b(cutting deeper|hurting myself|hurt myself|cut my wrists|cut your wrists)\b/,
    /\b(bridge at midnight|it ends tonight|when im gone|when i am gone|miss me when)\b/,
    /\b(compridos|comprimidos|pastiglie|tabletten)[^.]{0,20}\b(morrer|morir|finita|sterben|die)\b/,
    // Warning-sign family: farewell, giving things away, a last message, not being around.
    /\b(goodbye|good bye|farewell|adios|desped\w*)\b[^.]{0,24}\b(world|forever|everyone|everybody|tonight|family|all|note|letter)\b/,
    /\b(gave|given|giving|donat\w*|handed|regal\w*|deje|dejo)\b[^.]{0,36}\b(away|guitar|keys|clothes|bike|books|games|cosas|ropa|todo|watch|dog)\b/,
    /\b(wont|will not|no voy a|ya no)[^.]{0,24}\b(need|necesitar|around|here|back|volver)\b/,
    /\b(final|ultimo|ultima) (message|words|email|carta|mensaje)\b/,
    /\blast post ever\b/,
    /\b(this is|es) (the end|el final|it)\b/,
    /\b(cant|cannot|no puedo)[^.]{0,16}\b(anymore|any more|mas)\b/,
    /\bno (point|reason|sentido)\b[^.]{0,32}\b(live|living|exist|vivir|seguir|wake|morning|vida)\b/,
    /\b(no me van a volver|ya no volv)\w*/,
    // Referent and a harm word, either order, after idioms are stripped.
    /\b(slash\w*|slit\w*)\b[^.]{0,24}\b(wrist|wrists|arm|arms)\b/,
    /\b(stop living|existence to end|wish to be alive|rather not be alive|wanna be alive|dnt want|be alive)\b/,
    /\blife\b[^.]{0,16}\bworth\b/,
    /\b(cut|slash|slit|slashing)\w*\b[^.]{0,24}\b(wrist|wrists|arm|arms)\b/,
    /\b(swallow\w*|chugg\w*|drank|mixed|took)\b[^.]{0,36}\b(pill|pills|tablet|tablets|capsule|capsules|meds|syrup|poison|insulin|bottle|pastillas|medicina)\b/,
    // A plan, a time, and a place, without a death word.
    /\b(do it|doing it|im going|i m going|ill do)\b[^.]{0,48}\b(friday|saturday|sunday|tonight|tomorrow|bridge|river|garage|roof|tracks|highway|pier|quarry|overpass|lake|bath|balcony|cliff|dawn|midnight|carretera|azotea|cuarto|puente|rio|lago|presa|via|tren|balcon)\b/,
    /\bno despert/,
    /\bvida\b[^.]{0,20}\b(termine|acaba|vale)\b/,
    /\b(wrists|bathtub)\b[^.]{0,24}\b(tonight|bath|wrists)\b/,
    /\b(his|her|my|the) last night\b/,
    /\bliving\b[^.]{0,24}\b(stopped|sense)\b/,
    /\b(tonight|tomorrow|friday|saturday|sunday|monday|midnight|dawn|manana|noche|sabado|domingo|jueves|madrugada)\b[^.]{0,48}\b(bridge|roof|garage|highway|tracks|railway|pier|quarry|overpass|lake|bath|bathtub|balcony|cliff|cliffs|azotea|puente|rio|carretera|cuarto|presa|cantera|acantilado|via|tren|banera|lago|mall|estacionamiento)\b/,
    /\b(bridge|roof|garage|highway|tracks|railway|pier|quarry|overpass|lake|bath|balcony|cliff|azotea|puente|rio|carretera|cuarto|presa|cantera|acantilado|via|tren|banera|lago)\b[^.]{0,48}\b(tonight|friday|saturday|sunday|midnight|dawn|manana|noche|sabado|domingo|jueves|madrugada|plan|going|voy)\b/,
    /\b(walking|going|driving) to the (highway|tracks|bridge|roof|river|pier|overpass|quarry|cliffs)\b/,
    /\b(bridge|roof|garage|cliff|cliffs|quarry|overpass|pier|tracks)[^.]{0,40}\b(my|i|looking|plan|tonight|midnight|dawn)\b/,
    // Spanish, French, and Portuguese harm stems with an ending still attached.
    /\b(me|se|voy a|va a) (inyect|cort|tom(?:e|o|ar)|quit|mat|tir|ahorc|colg|clav|peg|dispar|lanz|ahog|trag|beb|morir|muer)\w*\b/,
    /\b(no deseo|no quiero|ya no quiero) vivir\b/,
    /\b(cansad\w*|hart\w*) de (vivir|estar vivo|la vida)\b/,
    /\bsentido a seguir\b/,
    /\b(quero|quiero|kerro|qiero)\w*\b[^.]{0,16}\bmor\w*\b/,
    /\bse matar\b/,
    /\ben finir\b/,
    /\bmedicament\w*[^.]{0,30}\b(finir|mourir|die|mort)\b/,
    /\b(person like me|meaning me|such as myself|narrador soy yo)\b/,
    /\bhypothetical\w*[^.]{0,40}\b(die|life|kill|jump|me|end)\b/,
    /\b(shot himself|shot herself|slits her|slits his|se ahorc|se mato|se corto)\b/,
    /\b(visitor|customer|account|chatter|speaker)[^.]{0,40}\b(die|life|jump|gone|leave|end|dead)\b/
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function warningSign(text) {
  const has = (pattern) => pattern.test(text);
  if (has(/\b(goodbye|good bye|adios|bye|farewell|desped\w*)\b/) && has(/\b(tonight|tomorrow|family|familia|text|going|everyone|everybody)\b/)) return true;
  if (has(/\b(gave|sold|packed|handed|left|cleared|paid|mailed|wrote|regal\w*|dejo|deje|escrib\w*)\b/) && has(/\b(guitar|keys|boxes|debts|passwords|accounts|testamento|carta|letters|note|pillow|cosas|perro|watch)\b/)) return true;
  if (has(/\b(gone|going) tonight\b/) || has(/\bno more tomorrow\b/) || has(/\b(going|gone|leaving|leave)\b[^.]{0,16}\bfor good\b/)) return true;
  if (has(/\b(funeral|testamento|ultima noche|ya no est|no estuviera|un corte|un tiro)\b/)) return true;
  if (has(/\bim done\b/) && has(/\b(sorry|tonight|life)\b/)) return true;
  if (has(/\b(cant|cannot|dont|do not)\b/) && has(/\b(see|plan to be)\b/) && has(/\b(tomorrow|here|next)\b/)) return true;
  if (has(/\b(no|not|nothing|refuse|point|reason|razon)\b/) && has(/\b(live|living|alive|life|vida|vivir|wake|waking|exist)\b/)) return true;
  if (has(/\btired\b/) && has(/\b(living|waking|vida|vivir)\b/)) return true;
  if (has(/\b(heart would|car would|atropell|no despert|hare dano|via del tren|me ire|oded|i od)\b/)) return true;
  if (has(/\b(the one|the writer|this chatter)\b/) && has(/\b(jump|life|survive|leave|end|dead)\b/)) return true;
  if (has(/\babout to do\b/) && has(/\b(sorry|mum|mom|tonight|end)\b/)) return true;
  if (has(/\b(finish\w*|cut) (me |deep)\b/) || has(/\bdisappear\w* permanently\b/) || has(/\bmaking it all end\b/)) return true;
  if (has(/\b(wont be a problem|deal with me|end date|not to see it|same exit|end me|end my pain)\b/)) return true;
  if (has(/\b(chosen the day|set a date|house is empty|acantilado|motel)\b/)) return true;
  if (has(/\b(pills|pill)\b/) && has(/\btonight\b/)) return true;
  if (has(/\b(nothing left in me|one more morning|handed out|check out early|fade out|another winter|for that to be it|va a notar|si me voy)\b/)) return true;
  if (has(/\bvanish\b/) && has(/\b(nothing|forever|page|permanently)\b/)) return true;
  if (has(/\bsaid everything\b/) || has(/\bfarewell before\b/) || has(/\bcleaned my room\b/) || has(/\bpaid off my\b/)) return true;
  if (has(/\b(i|im|ive|ill)\b/) && has(/\b(overpass|quarry|cliff|cliffs|tracks|acantilado)\b/)) return true;
  if (has(/\bjumped\b/) && has(/\b(again|survived)\b/)) return true;
  if (has(/\bhold\b/) && has(/\bbreath\b/)) return true;
  if (has(/\btoo many for me\b/)) return true;
  if (has(/\bno volv/) && has(/\bdespert/)) return true;
  if (has(/\bno despert/)) return true;
  if (has(/\b(returned everything|take care|engine running|im doing it|at the cliffs|go to the garage|estacionamiento|todo listo|time to go|planned it|after hours|estar muerto|atropell|hurting to stop|by exiting|vill do|die die)\b/) || has(/\batropell/)) return true;
  if (has(/\blast message\b/) && has(/\b(take care|anyone|family)\b/)) return true;
  if (has(/\blast message\b/) && !has(/\b(disappeared|chat|deleted)\b/)) return true;
  if (has(/\b(goodbye|adios)\b/) && has(/\b(phone|answer|answering)\b/)) return true;
  if (has(/\b(date is set|todo listo|time to go|dont look for me|ya no este|thats the day|not around|chose the method|where it ends|medianoche|set the day|cant go on|planning how|last message to|but go|exiting|isnt answering|hare dano)\b/)) return true;
  return false;
}

function classifyCurrent(text) {
  if (scriptCrisis(text)) return "tier1";
  // r7 shop hook: preprocess + extra idiom strip, then shopTier1 may upgrade to crisis-card (tier1).
  const norm = normalize(shopPreprocess(text));
  const stripped = shopStripIdioms(stripBenign(norm));
  const light = shopStripIdioms(stripBenign(shopLightNorm(text)));
  if (tier1(stripped) || warningSign(stripped) || shopTier1(stripped) || shopTier1(light)) return "tier1";
  if (stripped !== norm || TIER2_WORD.test(norm) || TIER2_WORD.test(fold(text))) return "tier2";
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

// ---------------------------------------------------------------------------
// Shop / contact rules added for go-live r7 (same module, not a parallel copy).
// Owner of the base classifier is PR #111 (classifyCrisis). These functions
// only add shop/contact families: a missed crisis is never OK; a false alarm
// is OK (keep shop FA at or under 5% per benign set). Crisis card = tier1.
// ---------------------------------------------------------------------------

const SHOP_CONFUSABLE = {
  "\u0430": "a", "\u0410": "a", "\u0435": "e", "\u0415": "e", "\u043e": "o", "\u041e": "o",
  "\u0440": "p", "\u0420": "p", "\u0441": "c", "\u0421": "c", "\u0443": "y", "\u0445": "x",
  "\u0425": "x", "\u0455": "s", "\u0405": "s", "\u0456": "i", "\u0406": "i", "\u0501": "d",
  "\u03b1": "a", "\u03bf": "o", "\u03c1": "p", "\u03c5": "y", "\u03c7": "x", "\u03f2": "c",
  "\u03f9": "c", "\u03f5": "e", "\u03b5": "e", "\u03b9": "i", "\u04bb": "h", "\u04ba": "h"
};

// (d) plus 🪦 and confusable letters, applied before PR #111 normalize.
function shopPreprocess(text) {
  let next = String(text || "");
  next = next.replace(/[ıİ]/g, "i");
  next = next.replace(/[€£]/g, "e");
  next = next.replace(/🪦/g, " grave ");
  next = next.replace(/[\u0430\u0410\u0435\u0415\u043e\u041e\u0440\u0420\u0441\u0421\u0443\u0445\u0425\u0455\u0405\u0456\u0406\u0501\u03b1\u03bf\u03c1\u03c5\u03c7\u03f2\u03f9\u03f5\u03b5\u03b9\u04bb\u04ba]/g, (ch) => SHOP_CONFUSABLE[ch] || ch);
  next = next.replace(/\b(?:[A-Za-z0-9]-){2,}[A-Za-z0-9]\b/g, (chunk) => chunk.replace(/-/g, ""));
  return next;
}

// Idiom spans that must not raise a shop/contact crisis card.
function shopStripIdioms(text) {
  return String(text || "")
    .replace(/\bme muero de (?:ganas|risa|hambre|sueno|frio|calor)\b/g, " ")
    .replace(/\bme morir de risa\b/g, " ")
    .replace(/\bme mori de risa\b/g, " ")
    .replace(/\bmorir de risa\b/g, " ")
    .replace(/\bfor real estate\b/g, " ")
    .replace(/\breal estate agents?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Light fold for shop rules. PR #111 leet maps 3->e and z$->s, which would
// hide amounts like "30" and phrases like "de una vez".
function shopLightNorm(text) {
  let next = fold(shopPreprocess(text));
  next = next.replace(/\b(?:[a-z0-9]-){2,}[a-z0-9]\b/g, (chunk) => chunk.replace(/-/g, ""));
  return next.replace(/\s+/g, " ").trim();
}

// (a) ingest, snort or inject plus any non-food substance or our product.
const SHOP_INGEST_RE = /\b(drink|drinking|drank|eaten?|eating|eat|swallow(?:ing|ed)?|sip(?:ping|ped)?|chug(?:ging|ged)?|gulp(?:ing|ed)?|chew(?:ing|ed)?|snort(?:ing|ed)?|inject(?:ing|ed)?|huff(?:ing|ed)?|inhal(?:e|ed|ing)|ingerir|chupar|beber(?:me|lo|la)?|bebo|bebes|bebi|bebiste|bebio|tomo|tomas|tomar(?:me|la|lo)?|tomamos|toman|comer(?:me|lo|la|te)?|comes|comi|come|como\s+(?:\d+|el|la|los|las|un|una|todo)|tragar(?:me|la|lo)?|trago|tragas|traga|meto|meter(?:me)?|inyect(?:ar|o|e|are)?)\b/;
const SHOP_NONFOOD_RE = /\b(bleach|cloro|lejia|acetona|acetone|antifreeze|drain|cleaner|mouthwash|rubbing alcohol|detergent|pods?|tide|batter(?:y|ies)|silica|lipstick|labial|toner|perfume|lotion|cream|solvent|chemical|toxin|poison|pouch(?:es)?|bolsita[s]?|caffeine|cafeina|motion|jafra|sunscreen|sanitizer|antibacterial|hand gel|pill[s]?|pastilla[s]?|unlisted|unknown|cosmetic[so]?s?|clorox|lye|ammonia|rat poison|thinner|gasoline|petrol|kerosene|methanol|isopropanol|alcohol|body lotion|nail polish|remover|cologne|colonia|soap|jabon|shampoo|champu|wax|cera|melts)\b/;
const SHOP_CHALLENGE_RE = /\b(tide )?pods? challenge\b|\b(detergent|tide) pods?\b/;

function shopIngestNonfood(text) {
  if (SHOP_CHALLENGE_RE.test(text)) return true;
  if (SHOP_INGEST_RE.test(text) && SHOP_NONFOOD_RE.test(text)) return true;
  if (/\bdrink(?:ing| all)? (?:all )?(?:the )?energy\b/.test(text)) return true;
  return false;
}

// (b) any amount plus kill, die, OD or never wake up.
const SHOP_AMOUNT_RE = /\b(how many|how much|cuant[ao]s?|all|whole|entire|too many|too much|demasiad[oa]s?|toda[s]? la[s]?|todo[s]? (?:el|la|lo[s]?)|every last|until|enough|at once|at the same time|in one go|de una vez|juntas?|lethal|letal|max|maximum)\b|\b\d{1,4}\s*mg\b|\b\d{1,3}\b/;
const SHOP_KILL_RE = /\b(kill|kills|killing|die|dying|dead|od|overdose|sobredosis|matan?|matar|morir|never wake|nunca despert|heart (?:stops|gives out|stop)|corazon pare|to die|to death|lethal|letal)\b/;

function shopAmountHarm(text) {
  return SHOP_AMOUNT_RE.test(text) && SHOP_KILL_RE.test(text);
}

// Shop over-consume of our product (amount / at-once / whole, even without a kill verb).
const SHOP_PRODUCT_RE = /\b(pouch(?:es)?|bolsita[s]?|motion|caffeine|cafeina|energy drinks?|lata de bolsitas|can of pouches|tin of pouches)\b/;
const SHOP_OVER_AMOUNT_RE = /\b(whole|entire|all|too many|too much|demasiad[oa]s?|toda[s]? la[s]?|todo[s]? (?:el|la|lo[s]?)|at once|at the same time|in one go|de una vez|juntas?|lethal|letal|in an hour|until)\b/;

function shopOverconsumeProduct(text) {
  if (SHOP_PRODUCT_RE.test(text) && SHOP_OVER_AMOUNT_RE.test(text)) return true;
  if (/\b(?:can|tin|lata)\b.{0,20}\b(?:pouch|bolsita)/.test(text) && /\b(whole|entire|all|toda|at once|use)\b/.test(text)) return true;
  return false;
}

// (c) fail-closed death-wish family, plus (d) DE/IT/FR/TR/PT core terms.
const SHOP_DEATHWISH_RE = /\b(end it all|ending my life|off myself|kms|unaliv\w*|sewer slide|dont want to be alive|do not want to be alive|dont wanna be alive|wanna die|want to (?:be dead|die|stop living|stop existing)|take all my pills|cut my veins|me corto las venas|cortarme|hacerme dano|lastimarme|lastimo a proposito|me lastimo|mejor sin mi|better off (?:without me|with me gone)|family is better off|nobody would miss me|if i were gone|siento que sobro|sobro en este mundo|burned myself|pain to stop|hurting to stop|pain to stop forever|drive off the road|using it on myself|prefiero estar muerto|preferiria estar muerto|acabar com tudo|bringe mich um|bridge mich um|kendimi oldur|canima kiymak|me matar|uccidermi|uccidere|me tuer|selbstmord|suizid|stop living|existence to end|vida termine|no deseo vivir|life is not worth|no reason.{0,24}to live|take (?:her|his|their|my) life|die tonight|dead tonight|stockpil\w* (?:my )?(?:meds|pills|medication|medicine)|lanzarme del (?:edificio|puente|techo|azotea)|saltar del (?:edificio|puente)|jump (?:off|from) (?:the )?(?:building|roof|bridge|edificio)|todos estarian mejor sin)\b/;

function shopDeathwish(text) {
  return SHOP_DEATHWISH_RE.test(text);
}

// (e) 🪦 ⚰️ 🔪🩸 and 💊 + amount; also death-emoji clusters after #111 emoji words.
const SHOP_EMOJI_CLUSTER_RE = /\b(grave|coffin|knife|blood|noose|gun|death|dead|pill)\b/;
const SHOP_PILL_AMOUNT_RE = /\b(pill(?:s)?)\b(?:\W+\b(pill(?:s)?)\b){1,}|\b(all|every|tonight|whole|enough)\b.{0,24}\bpill|\bpill.{0,24}\b(all|every|tonight|whole|enough)\b/;

function shopEmojiCluster(text) {
  if (!text) return false;
  if (SHOP_PILL_AMOUNT_RE.test(text)) return true;
  const hits = (text.match(/\b(grave|coffin|knife|blood|noose|gun|death|dead|pill)\b/g) || []);
  if (hits.length >= 2) return true;
  if (/^(?:death|dead|die|suicide|suicidal|kms|unalive|muerte|coffin|grave|knife|blood|noose|gun)(?:\s+(?:death|dead|die|suicide|kms|unalive|muerte|coffin|grave|knife|blood|noose|gun))*$/.test(text)) return true;
  return false;
}

function shopTier1(text) {
  if (!text) return false;
  return shopIngestNonfood(text) || shopAmountHarm(text) || shopOverconsumeProduct(text) || shopDeathwish(text) || shopEmojiCluster(text);
}

export function isCrisisText(text, history) {
  return classifyCrisis(text, history) === "tier1";
}
