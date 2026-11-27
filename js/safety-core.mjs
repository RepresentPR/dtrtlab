// One crisis classifier for the chat and the shop.
// Returns "tier1", "tier2", or "none". Tier 1 is a hard sheet.
// Tier 2 keeps the ordinary answer and adds the gentle line.
// Normalization runs before every match. Object and idiom spans
// are removed before the tier-1 shapes are tested.

export const GENTLE_LINE = "If you're going through something hard, you can call or text 988 anytime / Si estás pasando por algo difícil, llama o escribe al 988.";

const HARM_EMOJI = { "🔪": " knife ", "🩸": " blood ", "💀": " death ", "⚰️": " coffin ", "💊": " pill ", "🪢": " noose ", "🔫": " gun ", "😵": " dead " };

const FUZZY = ["suicide", "suicidal", "myself", "yourself", "himself", "herself", "themselves", "existing", "disappear", "forever", "tonight", "overdose", "hanging", "poison", "goodbye", "wrists", "cutting", "unalive", "bridge", "paracetamol"];
const TYPO = { kil: "kill", kll: "kill", ded: "dead", dye: "die", lyfe: "life", lfe: "life", lfie: "life", wnat: "want", deth: "death", myslef: "myself", mysef: "myself", suicde: "suicide", sucidie: "suicide", tomorow: "tomorrow", tonite: "tonight", tonihgt: "tonight", anymroe: "anymore", existng: "existing", exstng: "existing", dissapear: "disappear", permanantly: "permanently", pilz: "pills", pils: "pills", hnag: "hang", jumo: "jump", ened: "end", tke: "take", wrold: "world", goin: "going", evrything: "everything", alve: "alive" };

const COMMON = new Set(("a an the and or of to for in on at by with from into over after before out off not yes no please just then than there here too very also still only own when while have has had do does did this that these those what whats where who how can will would should may might am are was were been being is it its my your our their his her we they he she you i im ive id ill me mine them him page pages site lab price prices plan plans planned planning form forms fill bill bills link links map desk contact notebook privacy refund brand shop list public free note notes class people day days time date today early company real wide shown optional stuck come comes sell use used stay turn two person share send find clear report happen get ask fix wrong need apply update see save device change delete remove close cancel make look great tab tabs built build read much many new old same other another any some such live love like line life last long give fire fine file five lift home hope open door city want wish told said anymore doesnt dont cant wont isnt wasnt didnt couldnt wouldnt shouldnt lets thats heres theres youre theyre proof night eight wake photo photos minute minutes hour hours cake recipe weather video feature office email password checkout donate browser kit band catalog candle shipping human question answer data bug bugs term terms job jobs ian dtrt demo partner partners coffee battery phone plant plane plank play pizza showcase trailer cookie cookies session account accounts chat history mute sound lights poster wall download downloads clip clips subscription cost costs template pixel status preorder invoice invoices overdue sample pack aquarium tablet tablets organizer sticker stickers badge button buttons logo design deal deals idea playlist mystery valley theme story stories about news article guide hang tag cut paste jump section pricing pro office lead pill pills load head meal real tell well call fall full film held help hell hill hall all log sign reset most".split(" ")));

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
  next = next.replace(/\b2\b/g, " to ").replace(/\b1\b/g, " i ").replace(/\b4\b/g, " for ");
  next = next.replace(/[a-z0-9@$!|#]+/g, (token) => leetToken(token));
  next = next.replace(/([a-z])\1{2,}/g, "$1$1");
  const parts = next.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((token) => {
    if (TYPO[token]) return TYPO[token];
    if (token.length < 5 || COMMON.has(token)) return token;
    for (const target of FUZZY) {
      if (Math.abs(target.length - token.length) > 1) continue;
      if (oneEdit(token, target)) return target;
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
  const stems = ["死", "自杀", "自殺", "不想活", "自残", "умере", "суицид", "самоубий", "покончить", "أموت", "أعيش", "أؤذي", "मरना", "जीना", "मरायचे", "आत्महत्या", "죽", "자살", "자해", "chết", "mati", "למות", "mamatay", "patay", "magpakamatay", "mabuhay", "mouri", "傷つけ"];
  return stems.some((stem) => text.toLowerCase().includes(stem.toLowerCase()));
}

function tier1(text) {
  if (!text) return false;
  const patterns = [
    /\b(suicid\w*|unaliv\w*|kms|self ?harm\w*)\b/,
    /\b(an od|took an od|rope setup|envie de mourir|umbringen|hacerme dano|farmi del male|mi taglio|farla finita)\b/,
    /\b(kill\w*|hurt\w*|cut\w*|hang\w*|shoot\w*|off\w*|harm\w*) (myself|himself|herself|themselves|yourself|my self)\b/,
    /\b(wants?|wanna|wana|wnat|wanted|going|gonna|planning|bout) to (die|dye|be dead|kill|disappear|stop existing|wake|end it|not be alive)\b/,
    /\b(i|im|he|she|they|we|me|my)\b[^.]{0,48}\b(die|dies|dying|dead|suicide|kill myself|end it|not be alive|be over)\b/,
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
    /\b(already gone|checking out|final wishes|my last (post|message|email|note|night)|last night (alive|on earth)|my will|empty flat|made up my mind)\b/,
    /\b(wrote|written|writing) (my |a )?(goodbye |farewell )?(note|letter|letters)\b/,
    /\b(took|taken|taking|swallowed|drank|ate|eaten|downed|inhaled|stabbed|injected|oded?|tome|tomo|trague)[^.]{0,48}\b(pill|pills|tablet|tablets|pilz|meds|painkiller|painkillers|poison|poisonous|antifreeze|insulin|gas|prescription|medication|medicine|bottle|veneno|lejia|tylenol|ibuprofen|aspirin|paracetamol|whole|entire|too many|on purpose|fistful|everything|box)\b/,
    /\b(pastillas|ready to die|end it)\b/,
    /\b(cliff|bridge)[^.]{0,40}\b(bridge|cliff)\b/,
    /\b(pistol|gun|shotgun|rifle|blade|knife|rope|bridge|cliff|roof)[^.]{0,40}\b(plan|sunday|tonight|midnight|dawn)\b/,
    /\b(plan|sunday|tonight)[^.]{0,50}\b(pistol|gun|shotgun|rifle|blade|knife|rope|bridge|cliff|roof|garage|bath|balcony|park|dawn)\b/,
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
    /\b(are cutting|plan for tonight|in the bath)\b/,
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
    /\b(voglio|non voglio)[^.]{0,40}\b(morire|uccid\w*|vivere)\b/,
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
    /\b(compridos|comprimidos|pastiglie|tabletten)[^.]{0,20}\b(morrer|morir|finita|sterben|die)\b/
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function classifyCurrent(text) {
  if (scriptCrisis(text)) return "tier1";
  const norm = normalize(text);
  const stripped = stripBenign(norm);
  if (tier1(stripped)) return "tier1";
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
