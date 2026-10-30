// Fix 7 site gate: shared rules, word lists, allowlists and helpers.
// Used by scripts/fix7-static.test.cjs (no browser) and scripts/fix7-browser.test.cjs
// (headless Chromium). Every allowlist below is explicit: add a path or pattern
// with a reason, never widen a regex to make a failure go away.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------- page types
// AFTERLIGHT fiction keeps its real-world island setting, demonyms and towns as Ian
// wrote them (Co-Founder 10/15 8:20 PM). Exempt ONLY from the place/demonym
// rules; every other banned term still applies.
const FICTION_PATHS = [
  /^afterlight\.html$/,
  /^story\.html$/,
  /^worlds\.html$/,
  /^game\.html$/,
  /^stories\/afterlight\//,
  /^content\/afterlight\.json$/,
  /^content\/product\.json$/, // the AFTERLIGHT game product record
  /^css\/afterlight\.css$/,
  /^js\/afterlight\.js$/,
  /^tools\/build_afterlight\.py$/,
];
const isFiction = (rel) => FICTION_PATHS.some((rx) => rx.test(rel));

// Directories never served as site copy or that name banned phrases on purpose.
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts', 'tools', 'brand-assets', 'img', 'media', 'clips-media']);

function walk(dir = ROOT, filter = () => true, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || (e.name.startsWith('.') && e.name !== '.well-known')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, filter, out);
    else if (filter(p) && fs.statSync(p).size < 5e6) out.push(p);
  }
  return out;
}
const rel = (p, root) => path.relative(typeof root === 'string' ? root : ROOT, p).split(path.sep).join('/');
const htmlPages = (root = ROOT) => walk(root, (p) => p.endsWith('.html')).map((p) => rel(p, root)).sort();

// ---------------------------------------------------------------- text extraction
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', rsquo: '’', lsquo: '‘', mdash: '—', ndash: '–', hellip: '…' };
function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
// Visitor-facing text of an HTML file: body text, JSON-LD, and the attributes a
// visitor, a search engine or a link chip shows (alt, title, aria-label, meta content,
// placeholder, value). Other inline <script> code is scanned separately (codeOf).
function visibleText(html) {
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const attrs = [...html.matchAll(/\s(?:alt|title|aria-label|content|placeholder|value|data-label)\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
  const body = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h\d|td|th|tr|section|article|header|footer|nav|summary|details|figcaption|label|option|button|a)>/gi, '$&\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decode([body, ...attrs, ...ld].join('\n')).replace(/[ \t]+/g, ' ');
}
function codeOf(html) {
  return [...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
}

// ---------------------------------------------------------------- banned terms (rules.md §2 L21-23)
// scope: 'site' = served HTML/JS/JSON only; 'all' = also AGENTS.md, README.md, docs/, brand-kit.md
const BANNED = [
  { id: 'reply-system', rx: /\bReply\s+SYSTEM\b/i, scope: 'site', why: 'rules §2: "Reply SYSTEM" never on a page or in JS, and never bare in a doc (docs/*.md and *.md are served too); only the full canonical email/social line may carry it in a doc' },
  { id: 'public-data', rx: /\bpublic\s+(data|sources)\b/i, why: 'rules §2 banned' },
  { id: 'playbooks', rx: /\bplaybooks\b/i, why: 'rules §2 banned' },
  { id: 'study-big-companies', rx: /\bstudy(ing)?\s+big\s+companies\b|\bcompanies\s+studied\b/i, why: 'rules §2 / checklist row 12' },
  { id: 'start-at-50', rx: /\bStart(s|ing)?\s+at\s+\$50\b|\bStarter\s+Fix\b|\$50(?![\d,.])/i, why: 'retired $50 offer / Starter Fix' },
  { id: 'free-rewrite', rx: /\bfree\s+(first-line\s+)?rewrite\b|\brewrite\s+it\s+free\b|\bfirst-line\s+rewrite\b/i, why: 'retired free rewrite' },
  { id: '30-day-numbers', rx: /\b(30|day-30)[- ]day\s+numbers\b|\bday-30\s+numbers\b/i, why: 'retired "30-day numbers"' },
  { id: 'writing-plans', rx: /\bWriting\s+plans\b/i, why: 'retired "Writing plans"' },
  { id: '7-day-guarantee', rx: /\b7-Day\s+Do-It-Right\b|\bDo-It-Right\s+Guarantee\b/i, why: 'retired guarantee name (Co-Founder 10/15 8:45 PM)' },
  { id: 'mini', rx: /\bMini\s+(Social\s+)?Pack\b|\bthe\s+Mini\b|\bMini\s+(plan|offer|tier)\b|\bMini\s*[·—–-]?\s*\$|["“]Mini["”]/, why: 'retired offer Mini' },
  { id: 'week-pack', rx: /\bWeek\s+Pack\b/i, why: 'retired offer Week Pack' },
  { id: 'writing-retainer', rx: /\bWriting\s+Retainer\b/i, why: 'retired offer Writing Retainer' },
  { id: 'review-desk', rx: /\bReview\s+Desk\b/i, why: 'retired offer Review Desk' },
  { id: 'stay-on-chair', rx: /\bStay\s+on\s+the\s+chair\b|\bWe\s+write\s+your\s+posts\b/i, why: 'retired pitch' },
  { id: 'cheapest', rx: /\bcheapest\b/i, why: 'rules §2: never "cheapest"' },
  { id: '94-percent', rx: /(^|[^\d.])(94|93\.9)\s?%/, why: 'rules §2: 94%/93.9% banned' },
  { id: 'guaranteed-viral', rx: /\bguaranteed\s+viral\b/i, why: 'rules §2 banned' },
  // agent-inbox: any e-mail address whose domain (or a parent domain) is an agent mail host. The
  // hosts are stored as hashes (AGENT_MAIL_HOSTS) so this public file never names them.
  { id: 'agent-inbox', rx: /[\w.+-]+@(?:[\w-]+\.)+[a-z]{2,}\b/i, test: (m, extra) => agentHost(m.split('@')[1], extra), why: 'internal agent inbox address must not be public (use hello@dtrtlab.com)' },
  { id: 'auto-body', rx: /\bauto\s*body\b|\bbody\s+shops?\b|\bcollision\s+(center|repair|shop)s?\b|\bauto\s+repair\b/i, why: 'rules §2: no auto/body shop examples' },
];

// Sensitive terms are stored ONLY as hashes, like scripts/private-terms.test.cjs, because this
// repo is public: the employer, an internal-only topic, real towns, regions and
// demonyms must not be published by the guard that bans them. Text is normalized (accents
// stripped, lowercased, split on non-alphanumerics) and every 1- to 4-word sequence is hashed
// (sha256, first 16 hex). Hits print the category and hash, never the word. The plain list
// lives in the founder's private notes (Brain: company/fix7-ci-gate.md).
// Categories: employer (rules §1) · reloc (an internal-only topic), island-town (rules §2; fiction exempt) ·
// town, region, demonym (rules §2 real places; fiction exempt).
const HASHED = {
  'e424dce6bf0bec35': ['employer', 1], 'a667a46600f88c35': ['employer', 2], '26d0e1a0f43a43d3': ['employer', 2], '28d2618f42edb1e6': ['employer', 2],
  'f50b92b29527bc02': ['reloc', 2], '1fe126dec6de7aa2': ['reloc', 2], '7ca1971afd40a68f': ['reloc', 2], '682a4851da0c4e36': ['reloc', 1],
  '0a67d2d78921b15c': ['reloc', 1], '8a5a339c41a84188': ['reloc', 1], '4140ea46ab618ff1': ['reloc', 2], '2752b36ed0af42f3': ['reloc', 2],
  'f951a792f8da0701': ['reloc', 2], 'afeacc461eaa9436': ['island-town', 2], '72b978cf9608f1ed': ['island-town', 1], 'f0cd63a491438eb0': ['island-town', 1],
  '45f43b33da941900': ['island-town', 1], '4d0a1d7083938f2b': ['island-town', 2], '8d002b8524b688cd': ['island-town', 1], '923e5a75dba9ddda': ['island-town', 1],
  'e6514173a1e5373b': ['island-town', 1], 'dea232cb6b94b2cf': ['island-town', 1], '2438dcb037799f1e': ['island-town', 1], 'a404a6875858bdbc': ['island-town', 1],
  '390960b4e68d8ec6': ['island-town', 1], '77cfacfa1b07d0cf': ['island-town', 1], 'a01b91c1c5aad9e6': ['island-town', 1], '43f0264f3fd02aaf': ['island-town', 1],
  'd858227f2bd5de49': ['island-town', 1], '56a5deb4a33ec689': ['island-town', 1], 'af869f0f3f7e1727': ['island-town', 1], '2891c6d4ec295377': ['island-town', 1],
  '018afde6f464db68': ['island-town', 1], 'b7f104a404ee10a1': ['island-town', 1], '36766af3aa65c623': ['island-town', 1], 'ce8288c67f62da51': ['island-town', 1],
  'd374b7957d914441': ['island-town', 1], 'f3a984412f6c671f': ['island-town', 1], 'fb9283d7d781a5a0': ['island-town', 1], '6b53c6d23d835df0': ['island-town', 1],
  '63e292aea502eb21': ['island-town', 1], '5072f198bd5e3aab': ['town', 1], '9ef22ea4c9318be2': ['town', 1], 'a8c4647e79f9629c': ['town', 1],
  '59eaa3d60bda3c9b': ['town', 1], '3640f4ccc6437d29': ['town', 1], '2c15efaff108ba54': ['town', 2], '550139a3a4338ebe': ['town', 1],
  'f87f26c2458f8e54': ['town', 2], '7cf55690b5965aee': ['town', 1], '568b5f44b1ee9b67': ['town', 1], '5d1d8b6eb3422a48': ['town', 2],
  '9db7b444dee76f2a': ['town', 2], 'cce300282c1bd640': ['town', 2], 'e4a5a29db6a5d833': ['town', 1], 'efa9f298d4b26349': ['town', 2],
  'a517a80e9aebe26b': ['town', 2], '2b3d3dcbfd856ebb': ['town', 1], '92e2ffcb186519bf': ['town', 1], '18ff4b8149f2ff99': ['town', 2],
  '6aceb17707c23c40': ['town', 1], 'a3172cefd8732e10': ['town', 2], 'a6b5acedece607d6': ['town', 1], '387212e95c53ffd3': ['town', 1],
  'de21ab2e9209402c': ['town', 1], 'f14ad02674b930f8': ['town', 1], 'fd364175088c1f37': ['town', 2], 'c93e2a9516fc976e': ['town', 2],
  '79747b95961bdf8d': ['town', 1], 'd353fafe0a25649e': ['town', 1], '1ba09ad8035bfb2f': ['town', 2], '4becb2d14a941ab3': ['town', 1],
  'a1c19c8903acd9d8': ['town', 1], 'eff6a628040e457b': ['town', 2], '8722d7a6b99f333f': ['town', 2], 'd707e7802f278c54': ['town', 2],
  'fdf52b8ef178e2f9': ['town', 2], 'e9867be7757ce022': ['town', 1], 'fd3f7147ef8d2026': ['town', 1], '59bf356a2967d8b5': ['town', 1],
  'a6249a3cc5547fbb': ['town', 1], '0bb82c25c4cd85af': ['town', 2], '40602f2f304e438d': ['town', 1], 'ca8c5173504a8fbe': ['town', 2],
  '05dbde866addaa14': ['town', 2], '3ddf9d9ee5751367': ['town', 2], 'f081feadbc0c8d9c': ['town', 1], 'edc7e9aca4697e1d': ['town', 2],
  'a47d2202b0097354': ['town', 1], '044d2b955eadc721': ['town', 1], '8ee68da841902b2c': ['town', 1], '6f92e08b1619ba63': ['town', 1],
  'f8ce85591c31f9f9': ['town', 1], '7b8d92a4afb4265a': ['town', 1], '4ecfad5efbc93c7e': ['town', 1], '0ffa1577c719eada': ['town', 2],
  'a2509422c27d9ba2': ['town', 1], '2b8f12e599c5dee9': ['town', 1], '436daa0647b28d2f': ['town', 1], 'bca0ee8167cbe69f': ['town', 1],
  'df23f3e65b7d6bb7': ['town', 1], '6c519e51fc349f18': ['town', 1], '6cd92b4128dbb7dd': ['town', 1], '19d2c797d81657ff': ['town', 2],
  'a08bb641c0baac9b': ['town', 1], 'c059ded52be79f21': ['town', 1], 'bb7363fc40dee956': ['town', 1], '03ea86d943b2cd46': ['town', 1],
  'beefa00dc8a0991c': ['town', 1], '1e8bb4033b528cfe': ['town', 1], '9672797b5a225e97': ['town', 1], '5746248425e78ffe': ['town', 2],
  '1c536e84b27b8b16': ['town', 2], '5780211eec40dced': ['town', 2], 'c16503fae8980291': ['town', 2], 'bc32f0d5b6ee371a': ['town', 1],
  '8be0d5f1c5c12dea': ['town', 2], '5c18bb3ebe404349': ['town', 2], '9969c7610e7114c0': ['town', 1], '2a0a132ef29ecdc4': ['town', 1],
  '45f4e17b3f02ee1f': ['region', 2], '4f80902c333e7bd9': ['region', 1], '00c8f13cc81cd3f3': ['region', 3], '19af69956580d694': ['region', 2],
  '70f07964bb3cbb18': ['region', 2], '74151008fd5f0890': ['region', 2], '9c07bb3e63cab845': ['region', 2], '66ad4cfbcf4b1440': ['region', 2],
  '646a42312e7c19b7': ['region', 4], '42c140a3d3eacd3d': ['region', 2], '19d1c418cbf79784': ['region', 2], '1904a87710764024': ['region', 1],
  '76d04f03d2a7d38c': ['region', 3], '17e70e3e24a1d7d2': ['region', 2], '5e1035d3d2ba8999': ['region', 2], '562229661a2cd302': ['demonym', 1],
  '71a429ab2553e33f': ['demonym', 1], '96d9b9f77e7f535e': ['demonym', 1], '78e6235da48f458c': ['demonym', 1], 'fe58005a9b745e23': ['demonym', 1],
  'f7cf71c6bc618e79': ['demonym', 1], '1318ef88d6899051': ['demonym', 2], '43f3dcc7b028ec3a': ['demonym', 2],
};
// sha256 (first 16 hex) of the agent mail host domains (the bot's own mail domain and the third-party agent
// inbox domain). Plain names: Brain company/fix7-ci-gate.md (private). Never write them in this repo:
// scripts/map-form.test.cjs fails on the bot host name anywhere in scripts/ or docs/.
const AGENT_MAIL_HOSTS = new Set(['331a8a8683aebb49', '9fb0402a72691f58']);
function agentHost(domain, extra = []) {
  const labels = String(domain || '').toLowerCase().split('.');
  for (let i = 0; i < labels.length - 1; i++) {
    const d = labels.slice(i).join('.');
    if (AGENT_MAIL_HOSTS.has(sha(d)) || extra.includes(sha(d))) return true;
  }
  return false;
}
const PLACE_CATS = new Set(['reloc', 'island-town', 'town', 'region', 'demonym']);
const crypto = require('node:crypto');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
function hashedHits(text, extra = {}) {
  const table = { ...HASHED, ...extra };
  const toks = [...text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').matchAll(/[A-Za-z0-9]+/g)].map((m) => ({ t: m[0].toLowerCase(), i: m.index }));
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    let gram = '';
    for (let n = 1; n <= 4 && i + n <= toks.length; n++) {
      gram = n === 1 ? toks[i].t : gram + ' ' + toks[i + n - 1].t;
      const hit = table[sha(gram)];
      if (hit && hit[1] === n) out.push({ cat: hit[0], hash: sha(gram), index: toks[i].i });
    }
  }
  return out;
}
// State names / DC: pending Co-Founder ruling OI-021 ("DMV AREA · DC · MARYLAND · VIRGINIA"). Reported, not failed.
const PENDING_STATES = /\b(Maryland|Virginia|District\s+of\s+Columbia|Washington,?\s+DC|Washington\s+D\.C\.)\b/;
// ZIP codes for DC (200-205), MD (206-219), VA (220-246). Visible text only, never code.
const ZIP = /(^|[^\w$#.\-/:%])(20[0-5]\d{2}|20[6-9]\d{2}|21\d{3}|2[23]\d{3}|24[0-6]\d{2})(-\d{4})?(?![\w%.,]\d|\w|%|px)/;

// Explicit allowlist: [path regex, term id, exact snippet regex, reason]. Keep it short.
const TERM_ALLOW = [
  [/^legal\/(privacy|cookies|terms|refunds|dmca|preorder-terms)\.html$/, 'pending-state', /Maryland|Virginia/, 'governing-law / consumer-law wording, not a service-area claim'],
  [/^js\/live-pulse\.js$/, 'public-data', /Keyless public sources only/, 'developer code comment about API keys, never rendered to visitors'],
];
function allowed(file, id, snippet) {
  return TERM_ALLOW.some(([p, t, s]) => p.test(file) && t === id && s.test(snippet));
}

function lineOf(text, index) { return text.slice(0, index).split('\n').length; }
function context(text, index, len) {
  return text.slice(Math.max(0, index - 40), index + len + 40).replace(/\s+/g, ' ').trim();
}
function allMatches(text, rx) {
  const g = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
  return [...text.matchAll(g)];
}

// Scan one file's text. kind: 'html' | 'md' | 'code' | 'json'.
function scanText(file, text, opts = {}) {
  const { kind = 'html', visible = text } = opts;
  const hits = [];
  const fiction = isFiction(file);
  const isDoc = kind === 'md';
  for (const b of BANNED) {
    if (b.place && fiction) continue;
    for (const m of allMatches(text, b.rx)) {
      if (b.test && !b.test(m[0], opts.extraMailHosts)) continue;
      // QA #72 (checklist row 27): 'site' terms are no longer skipped in docs. A served doc may
      // only carry "Reply SYSTEM" as the start of the exact canonical email/social line.
      if (b.scope === 'site' && isDoc && norm(text.slice(m.index, m.index + EMAIL_MAP_LINE.length + 40)).toLowerCase().startsWith(EMAIL_MAP_LINE.toLowerCase())) continue;
      const snip = context(text, m.index, m[0].length);
      if (!allowed(file, b.id, snip)) hits.push({ file, id: b.id, term: m[0].trim(), line: lineOf(text, m.index), snip, why: b.why });
    }
  }
  for (const h of hashedHits(text, opts.extraHashes)) {
    if (fiction && PLACE_CATS.has(h.cat)) continue;
    const id = h.cat;
    if (!allowed(file, id, h.hash)) hits.push({ file, id, term: 'term#' + h.hash, line: lineOf(text, h.index), snip: '(hashed term; see the private list)', why: id === 'employer' ? 'rules §1: employer never in public files' : 'rules §2: no real places/demonyms/internal-only topic on business pages' });
  }
  if (!fiction) {
    // html/md: visible text; code/json: string literals only (numbers in code are not copy).
    if (kind === 'html' || kind === 'md' || kind === 'code' || kind === 'json') {
      for (const m of allMatches(visible, ZIP)) {
        const snip = context(visible, m.index, m[0].length);
        if (!allowed(file, 'zip', snip)) hits.push({ file, id: 'zip', term: m[2], line: 0, snip, why: 'rules §2: no ZIP codes' });
      }
    }
  }
  return hits;
}
function pendingStates(file, visible) {
  if (isFiction(file)) return [];
  return allMatches(visible, PENDING_STATES)
    .map((m) => ({ file, id: 'pending-state', term: m[0], snip: context(visible, m.index, m[0].length) }))
    .filter((h) => !allowed(file, h.id, h.snip));
}

// Files in scope for the words check.
// Netlify publishes the repo root (netlify.toml publish = ".") and GitHub shows every file, so the
// sweep covers EVERY text file in the tree, found by walking it, not by a list of named files or
// named directories (QA #72 FAIL, checklist row 27: a term caught only in named files is a miss).
// Only .git/ and node_modules/ are skipped; binary files are skipped by extension and NUL sniff.
const BINARY = /\.(png|jpe?g|webp|avif|gif|ico|bmp|tiff?|mp4|webm|mov|mp3|wav|ogg|m4a|woff2?|ttf|otf|eot|pdf|epub|zip|gz|tgz|br|7z|wasm|psd|blend|fbx|glb)$/i;
const TEXTISH = /\.(html?|js|mjs|cjs|json|webmanifest|md|mdc|txt|py|sh|yml|yaml|toml|css|xml|svg|csv|example)$/i;
function isTextFile(p) {
  if (BINARY.test(p)) return false;
  const base = path.basename(p);
  if (!TEXTISH.test(base) && /\.[^.]+$/.test(base.replace(/^\./, ''))) return false; // unknown extension
  try { const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(8192); const n = fs.readSync(fd, buf, 0, 8192, 0); fs.closeSync(fd); return !buf.subarray(0, n).includes(0); } catch { return false; }
}
function walkAll(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkAll(p, out);
    else if (e.isFile() && fs.statSync(p).size < 5e6 && isTextFile(p)) out.push(p);
  }
  return out;
}
function wordScanFiles(root = ROOT) {
  return [...new Set(walkAll(root).map((p) => rel(p, root)))].sort();
}
// Repo tooling: lines that BAN a term are fine here, lines that USE it are not.
const REPO_CODE = /^(scripts|tools|\.github|\.cursor)\/|\.(py|sh|cjs|ya?ml|toml)$/;
// Kind of a scanned file (decides which text is "copy").
function kindOf(file) {
  // Tooling paths first: a planted .html fixture under scripts/ is not a served page.
  if (REPO_CODE.test(file)) return 'repo';
  if (/\.(html?|svg)$/i.test(file)) return 'html';
  if (/\.(json|webmanifest)$/i.test(file)) return 'json';
  if (/\.(m?js|css|xml)$/i.test(file)) return 'code';
  return 'md'; // .md .mdc .txt .csv .example and extension-less (_headers, CNAME): served as text
}
// String literals in JS/CSS/XML (where a ZIP would be copy, not a number in code).
function stringsOf(src) {
  return [...src.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`|>([^<]+)</g)].map((m) => m[1] ?? m[0].slice(1, -1)).join('\n');
}
function jsonStrings(src) {
  try { const out = []; (function f(v) { if (typeof v === 'string') out.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(f); })(JSON.parse(src)); return out.join('\n'); } catch { return stringsOf(src); }
}
// Guard files: they must name banned terms in order to ban them. Exempt from the sweep (not from
// the "no test may REQUIRE a retired term" rule). Named, with a reason; keep this list short.
const GUARD_FILES = [
  [/^scripts\/fix7\/lib\.cjs$/, 'Fix 7 banned-term definitions'],
  [/^scripts\/fix7-static\.test\.cjs$/, 'Fix 7 planted-violation strings'],
  [/^scripts\/fix7-browser\.test\.cjs$/, 'Fix 7 seeded-fixture assertions'],
  [/^scripts\/fix7\/fixtures\//, 'Fix 7 planted bad-case pages'],
  [/^scripts\/retired-copy\.test\.cjs$/, 'retired-copy guard list'],
];
const isGuardFile = (f) => GUARD_FILES.some(([rx]) => rx.test(f));
// In other repo code (scripts/, tools/, .github/), a line that bans a term is fine; a line that
// uses or requires it is not.
const NEGATIVE_LINE = /doesNotMatch|notEqual|notStrictEqual|notDeepEqual|assert\.ok\(\s*!|\.not\.|!\s*\/|banned|retired|must not|never|\bno\b|const\s+[A-Z_]{3,}\s*=\s*[\/\[]/i;

// "No test may REQUIRE a retired name or CTA" (checklist, PR #71): a positive assertion in a test
// that mentions a retired offer/pitch, "Reply SYSTEM" or a mailto: link pins the site to old copy.
const POSITIVE_ASSERT = /\bassert\.(match|equal|strictEqual|deepEqual|deepStrictEqual|ok|includes)\s*\(/;
const REQUIRE_TERMS = /Review\s+Desk|Writing\s+Retainer|Week\s+Pack|\bMini\b|\$50(?![\d,.])|Starter\s+Fix|7-Day|Do-It-Right|rewrite\s+it\s+free|free\s+(first-line\s+)?rewrite|Reply\s+SYSTEM|mailto:|Writing\s+plans|30-day\s+numbers/i;
function requiresRetired(file, text) {
  if (isGuardFile(file) || !/\.test\.(c?js|mjs)$/.test(file)) return [];
  const out = [];
  text.split('\n').forEach((line, i) => {
    if (!POSITIVE_ASSERT.test(line) || /doesNotMatch|notEqual|notStrictEqual|notDeepEqual|assert\.ok\(\s*!/.test(line)) return;
    const m = line.match(REQUIRE_TERMS);
    if (m) out.push({ file, line: i + 1, term: m[0], snip: line.trim().slice(0, 140) });
  });
  return out;
}

// A "live" refresh job that logs "secret not set; skipping" and exits 0 is a FAIL (checklist,
// PR #71): the run goes green while the data goes stale.
function silentSkipProblems(file, yml) {
  const out = [];
  for (const m of yml.matchAll(/[^\n]*\b(echo|printf|::warning::|::notice::)[^\n]*(not\s+set|missing|unset|empty)[^\n]*skip[^\n]*/gi)) {
    if (/exit\s+0\b/.test(m[0]) || !/exit\s+[1-9]/.test(m[0])) out.push({ file, line: yml.slice(0, m.index).split('\n').length, snip: m[0].trim().slice(0, 140) });
  }
  return out;
}
function sourceLine(src, term) {
  const i = src.indexOf(term);
  return i < 0 ? 0 : src.slice(0, i).split('\n').length;
}
function scanFile(file, root = ROOT, opts = {}) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const { extraHashes, extraMailHosts } = opts;
  const kind = kindOf(file);
  if (kind === 'html') {
    const visible = visibleText(text);
    const hits = scanText(file, visible + '\n' + codeOf(text), { kind: 'html', visible, extraHashes, extraMailHosts }).map((h) => ({ ...h, line: sourceLine(text, h.term) }));
    // attributes (form action, href) can leak an agent inbox without any visible text
    const inbox = BANNED.find((b) => b.id === 'agent-inbox');
    for (const m of allMatches(text, inbox.rx)) if (inbox.test(m[0], extraMailHosts) && !hits.some((h) => h.id === 'agent-inbox' && h.term === m[0])) hits.push({ file, id: 'agent-inbox', term: m[0], line: lineOf(text, m.index), snip: context(text, m.index, m[0].length), why: inbox.why });
    return hits;
  }
  if (kind === 'repo') {
    if (isGuardFile(file)) return [];
    const lines = text.split('\n');
    return scanText(file, text, { kind: 'code', visible: stringsOf(text), extraHashes, extraMailHosts }).filter((h) => h.id === 'zip' || !NEGATIVE_LINE.test(lines[h.line - 1] || ''));
  }
  if (kind === 'json') return scanText(file, text, { kind: 'json', visible: jsonStrings(text), extraHashes, extraMailHosts });
  if (kind === 'code') return scanText(file, text, { kind: 'code', visible: stringsOf(text), extraHashes, extraMailHosts });
  return scanText(file, text, { kind: 'md', visible: text, extraHashes, extraMailHosts });
}

// ---------------------------------------------------------------- mailto (Fix 7 #2)
// Every mailto: in a served file fails: page, doc, JS, JSON, text (checklist "Site PR rows": the
// site AI check goes through /map/?want=check). Repo tooling (scripts/, tools/, .github/) is
// covered by requiresRetired instead. Explicit allowlist: [file regex, line regex, reason].
const MAILTO_ALLOW = [
  [/^(\.well-known\/)?security\.txt$/, /^Contact:\s*mailto:/, 'RFC 9116 security.txt requires a Contact: URI; not a page link'],
  [/^docs\/business-email-asap\.md$/, /DMARC/, 'internal DNS note: a DMARC rua mailbox URI is not a page link'],
];
function mailtoProblems(file, src) {
  const out = [];
  const lines = src.split('\n');
  const lineAt = (i) => src.slice(0, i).split('\n').length;
  for (const m of src.matchAll(/mailto:[^"'`\s)<>]*/gi)) {
    const ln = lineAt(m.index);
    if (MAILTO_ALLOW.some(([p, l]) => p.test(file) && l.test(lines[ln - 1] || ''))) continue;
    out.push(`${file}:${ln}: ${/\.(m?js)$/.test(file) ? 'script builds a mailto link' : 'mailto link'} -> ${m[0].slice(0, 70)}`);
  }
  return out;
}
function mailtoScan(root = ROOT) {
  return wordScanFiles(root).filter((f) => kindOf(f) !== 'repo').flatMap((f) => mailtoProblems(f, fs.readFileSync(path.join(root, f), 'utf8')));
}

// ---------------------------------------------------------------- canonical wording (rules.md §2)
// Site form line per rules.md 10/15 9:27 PM ET (replaced "within 3 business days after you answer
// 3 short questions"). The email/social line starts with "Reply SYSTEM", which is banned on the site.
const FREE_MAP_LINE = "Answer 3 short questions and you'll get a free one-page office map within 3 business days.";
// Email/social line (Co-Founder ruling ~9:22 PM 10/15, decisions/2026-10-15-free-map-canonical-lines).
// Never on a page or in JS; allowed in a served doc only in this exact form (e.g. brand-kit paste text).
const EMAIL_MAP_LINE = "Reply SYSTEM, answer 3 short questions, and you'll get a free one-page office map within 3 business days.";
const GUARANTEE = "If it's not right, I fix it at no charge.";
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
// Returns problems in one text blob (visible text / doc text).
function wordingProblems(file, raw) {
  const text = norm(raw);
  const out = [];
  // Free-map timing promise: every "N business days" must sit inside the exact canonical
  // line; any other turnaround promise for the map is a deviation. ("Answer 3 short
  // questions" alone, with no timing promise, is fine.)
  const canon = allMatches(text, new RegExp(FREE_MAP_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).map((m) => [m.index, m.index + m[0].length]);
  const inCanon = (i) => canon.some(([a, b]) => i >= a && i < b);
  for (const m of allMatches(text, /\b(\d+|one|two|three|a few)\s+business\s+days?\b/i)) {
    if (!inCanon(m.index)) out.push({ file, id: 'free-map-line', snip: context(text, m.index, m[0].length) });
  }
  for (const m of allMatches(text, /\bmap\b[^.\n]{0,80}\b(within|in)\s+(\d+|one|two|three|24|48|72)\s+(hours?|days?)\b/i)) {
    if (/business days/.test(m[0])) continue; // handled above
    out.push({ file, id: 'free-map-line', snip: context(text, m.index, m[0].length) });
  }
  // JSON-LD / meta free-map offer lines (OI-018): a "free ... map" offer sentence must carry the line.
  for (const m of allMatches(text, /[^.\n"]*\bfree\s+(written\s+|one-page\s+)?map\b[^.\n"]*\b(first|arrives|you get|I send|delivered)\b[^.\n"]*/i)) {
    if (!inCanon(m.index + (m[0].length - m[0].trimStart().length))) out.push({ file, id: 'free-map-line', snip: m[0].trim().slice(0, 160) });
  }
  // Guarantee wording: retired name or any "fix ... free/no charge" variant that isn't the exact line.
  for (const m of allMatches(text, /[^.\n]*\b(guarantee|fix it (at|for) no charge|fix it free|rewrite it free|do-it-right)\b[^.\n]*\.?/i)) {
    const s = m[0].trim();
    if (/\bno\s+(fake\s+)?guarantee|not\s+guarantee|guaranteed\s+(results|ROI)|no guaranteed|\b(?:is|are)\s+not\b[^.\n]{0,80}\ba\s+guarantee\b/i.test(s)) continue; // honest disclaimers
    if (/^\s*(class|id)=/.test(s)) continue;
    if (s.includes(GUARANTEE) && !/7-Day|Do-It-Right/i.test(s)) continue;
    if (/^guarantee$/i.test(s)) continue;
    out.push({ file, id: 'guarantee-wording', snip: s.slice(0, 160) });
  }
  return out;
}

// ---------------------------------------------------------------- /proof freshness (Fix 7 #4)
// updated_et like "2026-10-15 11:20 ET" (America/New_York wall time).
function parseEt(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::\d{2})?\s*(ET|EDT|EST)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // New York offset at that instant: try -4 then -5, keep the one that round-trips.
  for (const off of [4, 5]) {
    const t = asUtc + off * 3600e3;
    const wall = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(t));
    const get = (k) => +wall.find((p) => p.type === k).value;
    if (get('hour') === h && get('minute') === mi && get('day') === d) return new Date(t);
  }
  return null;
}
const MAX_PROOF_AGE_H = 26;

// ---------------------------------------------------------------- edited files (Fix 7 #5)
// In a PR the workflow sets FIX7_BASE_REF=origin/<base>. With no base (schedule, local run
// without a remote) every JS/CSS file is checked.
function editedFiles() {
  const base = process.env.FIX7_BASE_REF;
  if (!base) return null;
  try {
    const mb = execFileSync('git', ['merge-base', base, 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    return execFileSync('git', ['diff', '--name-only', '--diff-filter=AMR', mb, 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch (e) {
    throw new Error(`FIX7_BASE_REF=${base} set but git diff failed (fetch-depth 0 needed): ${e.message}`);
  }
}
// Content of a file at the merge-base with FIX7_BASE_REF (null if it did not exist there).
function baseContent(file) {
  const base = process.env.FIX7_BASE_REF;
  if (!base) return null;
  const mb = execFileSync('git', ['merge-base', base, 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  try { return execFileSync('git', ['show', `${mb}:${file}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; }
}

// ---------------------------------------------------------------- legal "Last updated" (QA #72, checklist row 30)
// Every legal page a PR edits must show a fresh "Last updated <Month D, YYYY>" date: later than the
// base version's date and not in the future (ET).
const LEGAL_PAGE = /^legal\/[^/]+\.html$/;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function lastUpdated(html) {
  const m = String(html || '').match(/Last\s+updated:?\s+([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[1].toLowerCase());
  return mo < 0 ? null : `${m[3]}-${String(mo + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}
const todayEt = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
function legalStampProblems(file, baseHtml, headHtml, now = new Date()) {
  const head = lastUpdated(headHtml);
  if (!head) return [`${file}: no "Last updated <Month D, YYYY>" line`];
  const base = lastUpdated(baseHtml);
  const out = [];
  if (base && head <= base) out.push(`${file}: edited but "Last updated" is still ${head} (base ${base})`);
  if (head > todayEt(now)) out.push(`${file}: "Last updated" ${head} is in the future (today ET ${todayEt(now)})`);
  return out;
}

// JS/CSS that exist for Node tests or tooling, not for pages. Reason required.
const UNREFERENCED_ALLOW = [
  // none yet: [/^js\/example\.js$/, 'why it is not loaded by a page'],
];

module.exports = {
  requiresRetired, silentSkipProblems, HASHED, GUARD_FILES, isGuardFile, NEGATIVE_LINE, walkAll, kindOf, stringsOf, jsonStrings,
  mailtoProblems, mailtoScan, MAILTO_ALLOW, EMAIL_MAP_LINE, isTextFile, baseContent, LEGAL_PAGE, lastUpdated, legalStampProblems, todayEt,
  ROOT, walk, rel, htmlPages, visibleText, codeOf, decode, isFiction, FICTION_PATHS, BANNED, scanText, scanFile, wordScanFiles,
  pendingStates, TERM_ALLOW, FREE_MAP_LINE, GUARANTEE, wordingProblems, norm, parseEt, MAX_PROOF_AGE_H, editedFiles, UNREFERENCED_ALLOW,
  allMatches, context, hashedHits, sha, PLACE_CATS, AGENT_MAIL_HOSTS, agentHost,
};
