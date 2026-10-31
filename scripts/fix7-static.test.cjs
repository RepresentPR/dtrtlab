// Fix 7 site gate, static half (no browser). Runs with the rest of the suite:
//   node --test scripts/*.test.cjs
// Every guard below has a "planted" test: one planted violation per thing the guard claims to
// catch, and the planted test fails if the guard misses ANY plant (checklist row, Co-Founder
// 10/15 9:23 PM). Real-site tests follow each planted test. Browser checks: fix7-browser.test.cjs.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const L = require('./fix7/lib.cjs');

const read = (f) => fs.readFileSync(path.join(L.ROOT, f), 'utf8');
const fmt = (hits) => hits.map((h) => `${h.file}${h.line ? ':' + h.line : ''} [${h.id}] "${h.term ?? ''}" … ${h.snip}`).join('\n');
// Run every plant through a detector; return the plants it missed.
function missed(plants, detect) { return plants.filter((p) => !detect(p)); }

// ================================================================== (3) banned terms, places, inboxes
// Synthetic hashed terms prove the hashed matcher without publishing real place names. The real
// list (DMV towns incl. the two the checklist names, regions, demonyms, island towns, employer)
// is planted term by term by the private runner (see NOTES: fix7-planted-private.cjs).
// Synthetic agent mail hosts (the real ones are hashed in lib, see AGENT_MAIL_HOSTS).
const SYN_MAIL = [L.sha('zorbmail.test'), L.sha('zorbinbox.test')];
const SYN = { [L.sha('zorbtown')]: ['town', 1], [L.sha('north zorb county')]: ['region', 3], [L.sha('zorb islander')]: ['demonym', 2], [L.sha('fakecorp')]: ['employer', 1], [L.sha('glorp isle')]: ['reloc', 2], [L.sha('port glorp')]: ['island-town', 2] };
const WORD_PLANTS = [
  ['reply-system', 'Reply SYSTEM and I map yours.'], ['public-data', 'Built on public data.'], ['public-data', 'From public sources.'],
  ['playbooks', 'Growth playbooks for you.'], ['study-big-companies', 'We study big companies.'],
  ['start-at-50', 'Start at $50.'], ['start-at-50', 'The Starter Fix.'], ['start-at-50', 'Only $50 today.'],
  ['free-rewrite', 'Get a free rewrite.'], ['free-rewrite', 'I rewrite it free.'], ['free-rewrite', 'free first-line rewrite'],
  ['30-day-numbers', 'Your 30-day numbers.'], ['writing-plans', 'Writing plans on Whop.'],
  ['7-day-guarantee', 'DTRT 7-Day Do-It-Right Guarantee'], ['mini', 'Mini Social Pack'], ['mini', 'Mini · $50'],
  ['week-pack', 'Week Pack $129'], ['writing-retainer', 'Writing Retainer'], ['review-desk', 'Review Desk $250'],
  ['stay-on-chair', 'Stay on the chair.'], ['cheapest', 'the cheapest option'], ['94-percent', '94% of owners'], ['94-percent', '93.9% of owners'],
  ['guaranteed-viral', 'guaranteed viral'], ['auto-body', 'your auto body shop'],
  // QA #72 (checklist row 28): a retired offer name reused as a module or feature name still fails
  ['review-desk', 'Job Desk includes the Review Desk module'], ['writing-retainer', 'Writing Retainer add-on'], ['week-pack', 'the Week Pack feature'],
  ['agent-inbox', 'write to planted-x@mail.zorbmail.test'], ['agent-inbox', 'or planted-y@zorbinbox.test'],
  ['zip', 'Clients near 20999.'],
  ['town', 'Owners in Zorbtown, MD'], ['region', 'all of North Zorb County'], ['demonym', 'a Zorb Islander'], ['employer', 'FakeCorp'], ['reloc', 'Glorp Isle'], ['island-town', 'Port Glorp'],
];
const hitIds = (file, text) => new Set(L.scanText(file, text, { kind: 'html', visible: text, extraHashes: SYN, extraMailHosts: SYN_MAIL }).map((h) => h.id));
test('fix7/3 planted: the word guard fails on EVERY planted banned term, place, demonym, ZIP and inbox', () => {
  const miss = missed(WORD_PLANTS, ([id, text]) => hitIds('index.html', `<p>${text}</p>`).has(id));
  assert.deepEqual(miss, [], 'guard missed plants');
  assert.deepEqual([...hitIds('index.html', 'Serving the DMV Area. 250 views, $1,500 setup, $250/mo. Write to hello@dtrtlab.com.')], [], 'clean copy passes');
  assert.equal(L.AGENT_MAIL_HOSTS.size, 2, 'both agent mail hosts are hashed');
});
test('fix7/3 planted: AFTERLIGHT fiction (named path list) is exempt from place rules only', () => {
  const placeIds = ['town', 'region', 'demonym', 'reloc', 'island-town', 'zip'];
  for (const f of ['stories/afterlight/island.html', 'afterlight.html', 'story.html', 'worlds.html', 'game.html', 'content/afterlight.json']) assert.ok(L.isFiction(f), f + ' is on the fiction list');
  assert.ok(!L.isFiction('index.html') && !L.isFiction('stories/other.html') && !L.isFiction('scripts/demo-page.test.cjs'));
  const leaks = missed(WORD_PLANTS.filter(([id]) => !placeIds.includes(id)), ([id, text]) => hitIds('stories/afterlight/island.html', text).has(id));
  assert.deepEqual(leaks, [], 'fiction must still fail business-term bans');
  const exempt = WORD_PLANTS.filter(([id]) => placeIds.includes(id)).filter(([id, text]) => hitIds('stories/afterlight/island.html', text).has(id));
  assert.deepEqual(exempt, [], 'fiction keeps its places');
});
test('fix7/3 planted: the hashed list contains the checklist-named DMV entries (a town and a region) and every category', () => {
  const cats = {};
  for (const [c] of Object.values(L.HASHED)) cats[c] = (cats[c] || 0) + 1;
  for (const c of ['employer', 'reloc', 'island-town', 'town', 'region', 'demonym']) assert.ok(cats[c] > 0, 'hashed list has ' + c);
  // hashes of the two names in the 10/15 checklist row (town; region), kept as hashes in a public repo
  assert.deepEqual(L.HASHED['5072f198bd5e3aab'], ['town', 1]);
  assert.deepEqual(L.HASHED['45f4e17b3f02ee1f'], ['region', 2]);
});
test('fix7/3 planted: repo code (scripts/, tools/, .github/) fails on use of a retired term but not on a line that bans it', () => {
  const file = 'scripts/some.test.cjs';
  const lib = (src) => { const lines = src.split('\n'); return L.scanText(file, src, { kind: 'code', visible: '' }).filter((h) => !L.NEGATIVE_LINE.test(lines[h.line - 1] || '')); };
  assert.ok(lib("const label = 'Writing Retainer';").length > 0, 'use is flagged');
  assert.equal(lib("assert.doesNotMatch(html, /Writing Retainer/);").length, 0, 'ban is fine');
  assert.ok(L.isGuardFile('scripts/fix7/lib.cjs') && !L.isGuardFile('scripts/positioning.test.cjs'));
});

// QA #72 FAIL (checklist row 27): plant each banned term in a page, a doc and a JS file, at paths
// no list names, and run the FULL pipeline (file discovery + scan). The guard must fail on all of
// them; a term caught only in named files or named directories counts as a miss.
function plantTree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fix7-plant-'));
  for (const [f, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), body); }
  return root;
}
const PLANT_SPOTS = [
  ['page', (i, t) => [`zz-new-${i}/index.html`, `<!doctype html><title>x</title><main><p>${t}</p></main>`]],
  ['root page', (i, t) => [`zz-page-${i}.html`, `<p>${t}</p>`]],
  ['doc (docs/)', (i, t) => [`docs/zz-${i}/notes.md`, `# Notes\n\n${t}\n`]],
  ['doc (outside docs/)', (i, t) => [`zz-dir-${i}/README.md`, `${t}\n`]],
  ['doc (txt)', (i, t) => [`zz-dir-${i}/template.txt`, `${t}\n`]],
  ['JS (js/)', (i, t) => [`js/zz-plant-${i}.js`, `document.querySelector('#x').textContent = ${JSON.stringify(t)};\n`]],
  ['JS (new dir)', (i, t) => [`zz-js-${i}/app.mjs`, `export const copy = ${JSON.stringify(t)};\n`]],
  ['JSON', (i, t) => [`content/zz-${i}.json`, JSON.stringify({ sub: t })]],
];
test('fix7/3 planted: every banned term fails in a page, a doc AND a JS file at unnamed paths (full discovery + scan)', () => {
  const files = {};
  const expect = [];
  WORD_PLANTS.forEach(([id, text], i) => {
    for (const [spot, mk] of PLANT_SPOTS) { const [f, body] = mk(i, text); files[f] = body; expect.push([id, text, spot, f]); }
  });
  const root = plantTree(files);
  try {
    const found = new Set(L.wordScanFiles(root));
    const notFound = expect.filter(([, , , f]) => !found.has(f)).map(([, , spot, f]) => `${spot}: ${f} not discovered`);
    assert.deepEqual(notFound, [], 'file discovery missed planted files');
    const hits = {};
    for (const f of found) hits[f] = new Set(L.scanFile(f, root, { extraHashes: SYN, extraMailHosts: SYN_MAIL }).map((h) => h.id));
    const miss = expect.filter(([id, , , f]) => !hits[f]?.has(id)).map(([id, text, spot, f]) => `${spot} ${f}: [${id}] "${text}"`);
    assert.deepEqual(miss, [], `guard missed ${miss.length} of ${expect.length} plants`);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('fix7/3 planted: a served doc may carry "Reply SYSTEM" only as the full canonical email/social line', () => {
  const ids = (f, t) => L.scanText(f, t, { kind: 'md', visible: t }).map((h) => h.id).filter((i) => i === 'reply-system');
  assert.deepEqual(ids('brand-kit.md', `Bio: ${L.EMAIL_MAP_LINE} dtrtlab dot com`), [], 'canonical line in a doc is fine');
  assert.deepEqual(ids('brand-kit.md', 'Bio: Reply SYSTEM, answer 3 short questions, and you’ll get a free one-page office map within 3 business days.'), [], 'curly apostrophe is fine');
  for (const bad of ["Reply SYSTEM and I'll map yours free. dtrtlab.com", 'Reply SYSTEM for a free map', 'reply system']) assert.equal(ids('brand-kit.md', bad).length, 1, bad);
  assert.equal(L.scanText('index.html', L.EMAIL_MAP_LINE, { kind: 'html', visible: L.EMAIL_MAP_LINE }).filter((h) => h.id === 'reply-system').length, 1, 'never on a page, even in canonical form');
});

test('fix7/3 retired offers, banned copy, real places, ZIPs and agent inboxes stay out of every text file in the repo (pages, JSON-LD, content/, docs/, every *.md/*.txt, JS, CSS, scripts/, tools/, .github/, .cursor/)', (t) => {
  const files = L.wordScanFiles();
  for (const must of ['AGENTS.md', 'README.md', 'brand-kit.md', 'index.html', 'content/proof.json', 'scripts/positioning.test.cjs', '.github/workflows/live-refresh.yml', 'sw.js']) assert.ok(files.includes(must), must + ' is scanned');
  for (const dir of ['docs/', 'live/', 'tools/', 'js/', 'css/', '.cursor/']) assert.ok(files.some((f) => f.startsWith(dir)), dir + ' is scanned');
  const hits = files.flatMap((f) => L.scanFile(f));
  const pending = files.filter((f) => f.endsWith('.html')).flatMap((f) => L.pendingStates(f, L.visibleText(read(f))));
  if (pending.length) t.diagnostic(`not failed (OI-021 ruling pending): ${pending.length} state-name mentions, e.g. ${pending.slice(0, 3).map((h) => h.file + ' "' + h.term + '"').join('; ')}`);
  assert.equal(hits.length, 0, `${hits.length} hits:\n` + fmt(hits));
});

// ================================================================== no test may REQUIRE a retired name or CTA
test('fix7/3 planted: the "test requires retired copy" guard fails on each planted positive assertion', () => {
  const plants = ["assert.match(main, /Review Desk/);", "assert.equal(name, 'Writing Retainer');", "assert.match(html, /Reply SYSTEM/);", "assert.match(main, /mailto:hello@dtrtlab\\.com/);", "assert.ok(html.includes('7-Day Do-It-Right'));", "assert.deepEqual(names, ['Week Pack']);", "assert.match(bio, /\\$50/);"];
  assert.deepEqual(missed(plants, (line) => L.requiresRetired('scripts/x.test.cjs', line).length === 1), []);
  assert.deepEqual(L.requiresRetired('scripts/x.test.cjs', 'assert.doesNotMatch(main, /Review Desk/);'), [], 'bans are fine');
});
test('fix7/3 no test REQUIRES a retired offer, retired guarantee, "Reply SYSTEM" or a mailto: link', () => {
  const tests = L.walkAll(path.join(L.ROOT, 'scripts')).map(L.rel);
  const hits = tests.flatMap((f) => L.requiresRetired(f, read(f)));
  assert.deepEqual(hits.map((h) => `${h.file}:${h.line} requires "${h.term}": ${h.snip}`), []);
});

// ================================================================== (2) mailto: every mailto link fails
// Checklist "Site PR rows": flag EVERY mailto: link, not only .btn/.cta (the site AI check goes
// through /map/?want=check). Lives in lib (L.mailtoProblems / L.mailtoScan); allowlist L.MAILTO_ALLOW.
test('fix7/2 planted: the mailto guard fails on a button, a footer text link, a prose link, a form action and a script-built link', () => {
  const plants = [
    ['index.html', '<a class="btn" href="mailto:hello@dtrtlab.com">Map</a>'],
    ['index.html', '<footer><a href="mailto:hello@dtrtlab.com">hello@dtrtlab.com</a></footer>'],
    ['index.html', '<p>Email <a href="mailto:hello@dtrtlab.com?subject=CHECK">me</a></p>'],
    ['index.html', '<form action="mailto:hello@dtrtlab.com"></form>'],
    ['js/x.js', "location.href = 'mailto:hello@dtrtlab.com?subject=' + s;"],
  ];
  assert.deepEqual(missed(plants, ([f, src]) => L.mailtoProblems(f, src).length === 1), []);
  assert.deepEqual(L.mailtoProblems('index.html', '<a href="/map/?want=check">Free AI check</a>'), []);
});
test('fix7/2 planted: a mailto link fails on a served page and script, and docs are outside the scan', () => {
  const link = 'mailto:hello@dtrtlab.com?subject=SYSTEM';
  const files = {};
  PLANT_SPOTS.forEach(([, mk], i) => { const [f, body] = mk(900 + i, link); files[f] = body; });
  const root = plantTree(files);
  try {
    const flagged = new Set(L.mailtoScan(root).map((p) => p.split(':')[0]));
    const served = Object.keys(files).filter((f) => !f.startsWith('docs/'));
    const docs = Object.keys(files).filter((f) => f.startsWith('docs/'));
    assert.deepEqual(served.filter((f) => !flagged.has(f)), [], 'mailto plants missed on served files');
    assert.deepEqual(docs.filter((f) => flagged.has(f)), [], 'docs are not served pages');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
  assert.deepEqual(L.mailtoProblems('security.txt', 'Contact: mailto:hello@dtrtlab.com'), [], 'RFC 9116 Contact line is allowed');
});
test('fix7/2 no mailto: link on a page the site serves', () => {
  const all = L.mailtoScan();
  assert.equal(all.length, 0, `${all.length} mailto links:\n` + all.join('\n'));
});

// ================================================================== (4) /proof freshness + label
function proofAgeHours(updatedEt, now = new Date()) { const t = L.parseEt(updatedEt); return t ? (now - t) / 3600e3 : NaN; }
const proofStale = (updatedEt, now) => { const a = proofAgeHours(updatedEt, now); return Number.isNaN(a) || a < -0.1 || a >= L.MAX_PROOF_AGE_H; };
const labelProblems = (html) => [!/['"`]as of ['"`]?\s*\+\s*\w+\.updated_et|as of \$\{[^}]*updated_et/.test(html) && 'no "as of" stamp', /live\s*·\s*updated/i.test(html) && '"live · updated"'].filter(Boolean);
test('fix7/4 planted: the freshness check fails on stale, future and unparseable stamps (EDT and EST)', () => {
  const now = new Date('2026-10-16T20:00:00Z'); // 4:00 PM EDT
  assert.deepEqual(missed(['2026-10-15 11:20 ET', '2026-10-15 13:59 ET', '2026-10-17 09:00 ET', 'yesterday', ''], (s) => proofStale(s, now)), []);
  assert.equal(proofStale('2026-10-16 15:00 ET', now), false);
  assert.equal(proofAgeHours('2026-12-01 07:00 ET', new Date('2026-12-01T13:00:00Z')), 1); // EST = UTC-5
  assert.deepEqual(missed(["el.textContent='live · updated '+d.updated_et", "el.textContent='updated '+d.updated_et"], (h) => labelProblems(h).length > 0), []);
  assert.deepEqual(labelProblems("el.textContent='as of '+d.updated_et"), []);
});
test('fix7/4 planted: a refresh job that skips on a missing secret and exits 0 fails', () => {
  const plants = ['if [ -z "$X" ]; then echo "X secret not set; skipping"; exit 0; fi', 'if [ -z "$X" ]; then echo "X missing, skipping"; fi', 'if [ -z "$X" ]; then echo "::warning::X not set; skipping; refreshed"; exit 0; fi'];
  assert.deepEqual(missed(plants, (y) => L.silentSkipProblems('w.yml', y).length === 1), []);
  assert.deepEqual(L.silentSkipProblems('w.yml', 'if [ -z "$X" ]; then echo "::error::X not set"; exit 1; fi'), []);
  assert.deepEqual(L.silentSkipProblems('w.yml', 'if [ -z "$X" ]; then echo "::warning::X secret not set; skipping"; exit 0; fi'), [], 'a visible warning that skips and does not claim a refresh is allowed');
});
test(`fix7/4 content/proof.json updated_et is under ${L.MAX_PROOF_AGE_H} h old (PR and daily schedule)`, () => {
  const proof = JSON.parse(read('content/proof.json'));
  const now = process.env.FIX7_NOW ? new Date(process.env.FIX7_NOW) : new Date();
  const age = proofAgeHours(proof.updated_et, now);
  assert.ok(!proofStale(proof.updated_et, now), `/proof data "${proof.updated_et}" is ${Number.isNaN(age) ? 'unparseable' : age.toFixed(1) + ' h old'}; limit ${L.MAX_PROOF_AGE_H} h. Live-refresh is not committing (OI-008).`);
});
test('fix7/4 /proof labels its stamp "as of <time>", never "live · updated"', () => {
  assert.deepEqual(labelProblems(read('proof/index.html')), []);
});
test('fix7/4 no workflow reports green after skipping on a missing secret', () => {
  const yml = read('.github/workflows/live-refresh.yml');
  assert.deepEqual(L.passwordSkipProblems(yml), []);
  const ok = [
    'if [ -z "$LIVE_PASSWORD" ]; then',
    '  echo "::warning::LIVE_PASSWORD secret not set; skipping"',
    '  echo "ran=false" >> "$GITHUB_OUTPUT"',
    '  exit 0',
    'fi',
    '- name: Commit if changed',
    "  if: steps.refresh.outputs.ran == 'true'",
    '  run: git commit -m "chore(live): refresh aggregates"',
  ].join('\n');
  assert.deepEqual(L.passwordSkipProblems(ok), []);
  assert.ok(L.passwordSkipProblems(ok.replace('::warning::', '::notice::')).includes('::warning:: is not printed'));
  assert.ok(L.passwordSkipProblems(ok.replace('exit 0', 'exit 1')).includes('exit code is not 0'));
  assert.ok(L.passwordSkipProblems(ok.replace('echo "::warning::LIVE_PASSWORD secret not set; skipping"', 'echo "::warning::LIVE_PASSWORD secret not set; skipping"\n  git commit -m "chore(live): refresh aggregates"')).includes('skip branch commits'));
  assert.ok(L.passwordSkipProblems(ok.replace("  if: steps.refresh.outputs.ran == 'true'\n", '')).includes('commit step runs when LIVE_PASSWORD is missing'));
});

// ================================================================== (5) edited JS/CSS is referenced by a page
const allAssets = L.walk(L.ROOT, (p) => /\.(m?js|css)$/.test(p)).map(L.rel).filter((f) => !f.startsWith('scripts/'));
function referencedAssets() {
  const pages = L.htmlPages();
  const seen = new Set();
  const queue = [];
  const assetRx = /["'`(=\s]((?:\.{0,2}\/)?[\w@./-]+\.(?:m?js|css))(?:\?[^"'`)\s]*)?(?=["'`)\s])/g;
  const add = (from, ref) => {
    if (/^(https?:)?\/\//.test(ref)) return;
    const base = path.basename(ref);
    for (const cand of [path.join(path.dirname(path.join(L.ROOT, from)), ref), path.join(L.ROOT, ref.replace(/^\//, ''))]) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) { const r = L.rel(cand); if (!seen.has(r)) { seen.add(r); queue.push(r); } return; }
    }
    // JS that injects relative to the *page* (nav.js -> "css/identity.css"): resolve by path suffix
    for (const f of allAssets) if (f.endsWith('/' + ref.replace(/^\.?\//, '')) || (ref.includes('/') === false && path.basename(f) === base)) {
      if (!seen.has(f)) { seen.add(f); queue.push(f); }
    }
  };
  for (const p of pages) {
    const html = fs.readFileSync(path.join(L.ROOT, p), 'utf8');
    for (const m of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"'?#]+\.(?:m?js|css))/gi)) add(p, m[1]);
    for (const m of L.codeOf(html).matchAll(assetRx)) add(p, m[1]);
    for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) for (const i of m[1].matchAll(/@import\s+(?:url\()?["']?([^"')]+\.css)/g)) add(p, i[1]);
  }
  while (queue.length) {
    const f = queue.shift();
    const src = fs.readFileSync(path.join(L.ROOT, f), 'utf8');
    for (const m of src.matchAll(assetRx)) add(f, m[1]);
    if (f.endsWith('.css')) for (const i of src.matchAll(/@import\s+(?:url\()?["']?([^"')]+\.css)/g)) add(f, i[1]);
  }
  return seen;
}
const orphansOf = (scope, refd) => scope.filter((f) => !refd.has(f) && !L.UNREFERENCED_ALLOW.some(([rx]) => rx.test(f)));
test('fix7/5 planted: an edited file no page loads is flagged; page-linked and JS-injected files are not', () => {
  const refd = referencedAssets();
  assert.ok(refd.has('js/nav.js'), 'nav.js is linked from pages');
  assert.ok(refd.has('css/identity.css'), 'identity.css is injected by nav.js');
  assert.deepEqual(orphansOf(['js/__planted_orphan__.js', 'css/__planted_orphan__.css'], refd), ['js/__planted_orphan__.js', 'css/__planted_orphan__.css']);
});
test('fix7/5 every edited JS/CSS file is referenced by some served page', (t) => {
  const edited = L.editedFiles();
  const scope = (edited ?? allAssets).filter((f) => /\.(m?js|css)$/.test(f) && !/^(scripts|tools|\.github)\//.test(f) && fs.existsSync(path.join(L.ROOT, f)));
  const orphans = orphansOf(scope, referencedAssets());
  if (!edited) {
    t.diagnostic(`no FIX7_BASE_REF: ${orphans.length} of ${scope.length} JS/CSS files are not referenced by any page: ${orphans.join(', ')}`);
    if (process.env.FIX7_STRICT_ORPHANS !== '1') return;
  } else t.diagnostic(`edited JS/CSS vs ${process.env.FIX7_BASE_REF}: ${scope.join(', ') || 'none'}`);
  assert.deepEqual(orphans, [], 'JS/CSS not referenced by any page (an edit here is invisible to visitors):\n' + orphans.join('\n'));
});

// ================================================================== (6) canonical wording
// Pages that promise the free map must carry the exact site line (checklist "Site PR rows").
const MAP_PROMISE_PAGES = ['index.html', 'map/index.html', 'job-desk/how-it-works/index.html'];
test('fix7/6 planted: the wording check fails on each off-canon free-map line and each old guarantee', () => {
  const ids = (t) => L.wordingProblems('x.html', t).map((h) => h.id);
  const plants = [
    ['free-map-line', 'Your written map arrives within 3 business days. No calls.'],
    ['free-map-line', 'I send a one-page map of your office work within 3 business days after you answer 3 short questions.'],
    ['free-map-line', 'Within 3 business days you get a free one-page map.'],
    ['free-map-line', 'Free written map first. Never a password.'],
    ['free-map-line', 'Your map is on the way within 2 business days.'],
    ['guarantee-wording', 'DTRT 7-Day Do-It-Right Guarantee: ask for any fix within 7 days and I rewrite it free.'],
    ['guarantee-wording', 'Our guarantee: fix it free.'],
    ['guarantee-wording', "If it's not right, I'll fix it for free under our guarantee."],
  ];
  assert.deepEqual(missed(plants, ([id, text]) => ids(text).includes(id)), []);
  assert.deepEqual(ids(`Not sure? ${L.FREE_MAP_LINE} No call.`), []);
  assert.deepEqual(ids('Answer 3 short questions and you’ll get a free one-page office map within 3 business days.'), [], 'curly apostrophe is fine');
  assert.deepEqual(ids(L.GUARANTEE), []);
  assert.deepEqual(ids('If it’s not right, I fix it at no charge.'), []);
});
test('fix7/6 free-map line and guarantee wording match rules.md §2 exactly on every business page', () => {
  // business pages and their data: served HTML and JSON outside docs/ and repo tooling
  const files = L.wordScanFiles().filter((f) => !L.isFiction(f) && !/^(docs|scripts|tools|\.github|\.cursor)\//.test(f) && /\.(html?|json|webmanifest)$/.test(f));
  const problems = files.flatMap((f) => L.wordingProblems(f, f.endsWith('.html') ? L.visibleText(read(f)) : read(f)));
  // The 3-business-day sentence stays the only allowed turnaround (wordingProblems). These
  // pages must not be required to print it: positioning.test.cjs forbids that promise on
  // the homepage. The published line, with no timing promise, satisfies the page check.
  const HOME_LINE = "Answer 3 short questions and we'll reply.";
  const MAP_LINE = "Answer 3 short questions and we'll follow up by email.";
  const missing = MAP_PROMISE_PAGES.filter((f) => {
    const text = L.norm(L.visibleText(read(f)));
    const ok = text.includes(L.FREE_MAP_LINE) || text.includes(HOME_LINE) || (f !== 'index.html' && text.includes(MAP_LINE));
    return !ok;
  }).map((f) => ({ file: f, id: 'free-map-line', snip: 'page promises the map but lacks the exact site line' }));
  const all = [...missing, ...problems];
  assert.equal(all.length, 0, `${all.length} wording deviations (free-map: "${L.FREE_MAP_LINE}"; guarantee: "${L.GUARANTEE}"):\n` + all.map((p) => `${p.file} [${p.id}] ${p.snip}`).join('\n'));
});

// ================================================================== (7) legal "Last updated" (QA #72, checklist row 30)
test('fix7/7 planted: an edited legal page fails if "Last updated" is missing, unchanged, older or in the future', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (d, extra = '') => `<p class="lead">Last updated ${d}. These terms cover dtrtlab.com.</p>${extra}`;
  const plants = [
    [page('October 14, 2026'), '<p>no stamp</p>'],
    [page('October 14, 2026'), page('October 14, 2026', '<p>A new duty.</p>')],
    [page('October 14, 2026'), page('October 13, 2026')],
    [page('October 14, 2026'), page('October 17, 2026')],
  ];
  assert.deepEqual(missed(plants, ([b, h]) => L.legalStampProblems('legal/terms.html', b, h, now).length > 0), []);
  assert.deepEqual(L.legalStampProblems('legal/terms.html', page('October 14, 2026'), page('October 16, 2026'), now), []);
  assert.deepEqual(L.legalStampProblems('legal/cookies.html', page('October 14, 2026', '<script src="/js/nav.js?v=old"></script>'), page('October 14, 2026', '<script src="/js/nav.js?v=new"></script>'), now), [], 'a cache key is not a legal edit');
  assert.deepEqual(L.legalStampProblems('legal/new.html', null, page('October 16, 2026'), now), [], 'new legal page with a stamp is fine');
  assert.equal(L.lastUpdated('Last updated October 3, 2026.'), '2026-10-03');
});
test('fix7/7 head-only script change passes without a Last updated bump', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (head, body) => `<head>${head}</head><p class="lead">Last updated October 15, 2026.</p>${body}`;
  const head = '<title>Terms</title><meta name="description" content="Terms">';
  const body = '<p>Checkout is not live.</p>';
  const base = page(head, body);
  const script = '<script src="//gc.zgo.at/count.js"></script>';
  assert.deepEqual(L.legalStampProblems('legal/terms.html', base, page(head + script, body), now), []);
  assert.deepEqual(L.legalStampProblems('legal/terms.html', page(head + script, body), base, now), []);
  assert.deepEqual(L.legalStampProblems('legal/terms.html', base, page(head + '<meta name="robots" content="noindex">', body), now), []);
});
test('fix7/7 body wording change without a Last updated bump fails', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (body) => `<head><title>Terms</title></head><p class="lead">Last updated October 15, 2026.</p>${body}`;
  const problems = L.legalStampProblems('legal/terms.html', page('<p>Checkout is not live.</p>'), page('<p>Checkout is live.</p>'), now);
  assert.ok(problems.some((p) => p.includes('still 2026-10-15')), problems.join('; '));
});
test('fix7/7 description change without a Last updated bump fails', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (desc) => `<head><title>Terms</title><meta name="description" content="${desc}"></head><p class="lead">Last updated October 15, 2026.</p><p>Checkout is not live.</p>`;
  const problems = L.legalStampProblems('legal/terms.html', page('Terms for the site.'), page('Terms for these pages.'), now);
  assert.ok(problems.some((p) => p.includes('still 2026-10-15')), problems.join('; '));
  assert.deepEqual(L.legalStampProblems('legal/terms.html', page('Terms for the site.'), page('Terms for these pages.').replace('October 15, 2026', 'October 16, 2026'), now), []);
});
test('fix7/7 og:description change without a Last updated bump fails', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (desc) => `<head><title>Terms</title><meta property="og:description" content="${desc}"></head><p class="lead">Last updated October 15, 2026.</p><p>Checkout is not live.</p>`;
  const swapped = (desc) => `<head><title>Terms</title><meta content="${desc}" property="og:description"></head><p class="lead">Last updated October 15, 2026.</p><p>Checkout is not live.</p>`;
  const problems = L.legalStampProblems('legal/terms.html', page('Terms for the site.'), page('Terms for these pages.'), now);
  assert.ok(problems.some((p) => p.includes('still 2026-10-15')), problems.join('; '));
  const reordered = L.legalStampProblems('legal/terms.html', swapped('Terms for the site.'), swapped('Terms for these pages.'), now);
  assert.ok(reordered.some((p) => p.includes('still 2026-10-15')), reordered.join('; '));
});
test('fix7/7 twitter:description change without a Last updated bump fails', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (desc, attr) => `<head><title>Terms</title><meta ${attr}="twitter:description" content="${desc}"></head><p class="lead">Last updated October 15, 2026.</p><p>Checkout is not live.</p>`;
  for (const attr of ['name', 'property']) {
    const problems = L.legalStampProblems('legal/terms.html', page('Card line.', attr), page('Updated card line.', attr), now);
    assert.ok(problems.some((p) => p.includes('still 2026-10-15')), `${attr}: ${problems.join('; ')}`);
  }
});
test('fix7/7 head title change without a Last updated bump fails', () => {
  const now = new Date('2026-10-16T14:00:00Z'); // 10:00 AM EDT Oct 16
  const page = (title) => `<head><title>${title}</title></head><p class="lead">Last updated October 15, 2026.</p><p>Checkout is not live.</p>`;
  const problems = L.legalStampProblems('legal/terms.html', page('Terms'), page('Preorder'), now);
  assert.ok(problems.some((p) => p.includes('still 2026-10-15')), problems.join('; '));
  const link = L.legalStampProblems('legal/terms.html', page('Terms'), page('Terms').replace('</head>', '<link rel="stylesheet" href="/css/lab.css"></head>'), now);
  assert.ok(link.some((p) => p.includes('still 2026-10-15')), link.join('; '));
});
test('fix7/7 every legal page edited in this PR shows a fresh "Last updated" date', (t) => {
  const edited = L.editedFiles();
  if (!edited) return t.diagnostic('no FIX7_BASE_REF (not a PR run): legal stamp check skipped');
  const legal = edited.filter((f) => L.LEGAL_PAGE.test(f));
  t.diagnostic(`edited legal pages: ${legal.join(', ') || 'none'}`);
  const problems = legal.flatMap((f) => L.legalStampProblems(f, L.baseContent(f), read(f)));
  assert.deepEqual(problems, []);
});
