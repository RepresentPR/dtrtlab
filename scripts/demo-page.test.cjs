// /demo is the Job Desk sample: a static page on a fictional company that must say so on every view.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { isExcluded, loadExclude } = require('./stage-site.cjs');
const { containsRetiredDemoName, foldBanned } = require('./served-fold.cjs');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const RETIRED_DEMO_NAME = 'Sample' + ' Heating';
// Same served-file set as scripts/retired-copy.test.cjs. The name check
// reuses loosen() via containsRetiredDemoName().
const SERVED = /\.(html?|js|mjs|json|md|css|txt|webmanifest|svg|xml|toml)$|^(_headers|netlify\.toml|sitemap\.xml)$/i;
const SERVED_TYPES = ['html', 'js', 'json', 'md', 'css', 'txt', 'webmanifest', 'svg', 'xml', 'toml'];
const RASTER_DATA = /data:image\//i;
const RASTER_HREF = /\.(?:jpe?g|png|webp|gif)(?:[?#][^"']*)?$/i;
// Real photo and the jobs demo screenshot. Autopilot's screenshot showed
// auto-sending, so it was removed and is not listed.
const RASTER_SVG_ALLOW = [
  'img/company/ian-headshot.svg',
  'job-desk/how-it-works/img/job.svg',
];

function isServedFile(name) {
  return SERVED.test(name) || path.extname(name) === '';
}

function retiredNameHits(text) {
  return containsRetiredDemoName(text);
}

function svgLinksRaster(text) {
  if (RASTER_DATA.test(text)) return true;
  const tags = text.match(/<image\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs = tag.matchAll(/\b(?:xlink:href|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi);
    for (const m of attrs) {
      const val = (m[1] ?? m[2] ?? m[3] ?? '').trim();
      if (RASTER_DATA.test(val) || RASTER_HREF.test(val)) return true;
    }
  }
  return false;
}
test('/demo exists and shows the "Demo, fictional data" banner outside the JS-rendered views', () => {
  const s = read('demo/index.html');
  const ribbon = (s.match(/<div class="ribbon"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
  assert.match(ribbon, /Demo, fictional data/);
  assert.ok(s.indexOf('class="ribbon"') < s.indexOf('id="main"'), 'banner sits above every view');
  assert.match(s, /<title>[^<]*demo[^<]*<\/title>/i);
});
test('/demo ships its own assets, and the homepage links to it', () => {
  for (const f of ['demo/app.css', 'demo/demo.js']) assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} missing`);
  assert.equal(fs.existsSync(path.join(ROOT, 'demo/sample-map.pdf')), false);
  assert.doesNotMatch(read('demo/index.html'), /sample-map\.pdf/);
  assert.doesNotMatch(read('demo/demo.js'), /sample-map\.pdf/);
  assert.match(read('index.html'), /href="\/demo\/"[^>]*>See a sample</);
});
test('/demo data stays fictional: labeled company, 555 numbers, example.com emails', () => {
  const js = read('demo/demo.js');
  assert.match(js, /Pretendwell Heating & Air Co\. \(demo\)/);
  assert.equal(js.includes(RETIRED_DEMO_NAME), false);
  for (const m of js.matchAll(/\b\d{3}-\d{4}\b/g)) assert.match(m[0], /^555-01\d\d$/, `non-fictional number ${m[0]}`);
  for (const m of js.matchAll(/[\w.+-]+@([\w-]+\.[\w.]+)/g)) assert.strictEqual(m[1], 'example.com', `non-fictional email ${m[0]}`);
});
test('the retired demo business name stays off every served file', () => {
  const exclude = loadExclude();
  const hits = [];
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (isExcluded(rel, exclude)) continue;
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) {
        if (retiredNameHits(rel)) hits.push(rel + ' (filename)');
        if (isServedFile(e.name) && fs.statSync(p).size < 5e6 && retiredNameHits(fs.readFileSync(p, 'utf8'))) hits.push(rel);
      }
    }
  }
  walk(ROOT);
  assert.deepEqual(hits, [], 'retired demo name found:\n' + hits.join('\n'));
});

const NAME_PLANTS = [
  ['lowercase', 'sample heating'],
  ['uppercase', 'SAMPLE HEATING'],
  ['mixed-case', 'sAmPlE hEaTiNg'],
  ['entity-amp', 'Sample&amp;Heating'],
  ['entity-double-amp', 'Sample&amp;amp;Heating'],
  ['entity-nbsp', 'Sample&nbsp;Heating'],
  ['line-break', 'Sample\nHeating'],
  ['spaced-break', 'Sample \n Heating'],
  ['tag-br', 'Sample<br>Heating'],
  ['tag-span', 'Sample<span class="x">Heating</span>'],
  ['js-join', "'Sample' + ' Heating'"],
  ['js-join-mixed-quotes', '"Sample" + \' Heating\''],
  ['slug', 'sample-heating'],
  ['underscore', 'sample_heating'],
  ['og-title', '<meta property="og:title" content="Sample Heating &amp; Air Co.">'],
  ['alt', '<img alt="Sample Heating" src="/logo.svg">'],
  ['href', '<a href="/sample-heating">Read</a>'],
  ['js-unicode-space', 'Sample\\u0020Heating'],
  ['hex-space', 'Sample\\x20Heating'],
  ['percent-20', 'Sample%20Heating'],
  ['dotted-file', 'Sample.Heating.jpg'],
  ['joined-file', 'sampleheating.jpg'],
];

for (const [id, text] of NAME_PLANTS) {
  test('planted retired demo name (' + id + ') fails in every served file type', () => {
    for (const ext of SERVED_TYPES) {
      assert.equal(retiredNameHits(text), true, id + ' was allowed in .' + ext);
    }
  });
}

test('planted retired demo name fails in a slug or file name', () => {
  for (const rel of ['img/sample-heating.svg', 'img/sample_heating.png', 'sample-heating.html', 'Sample_Heating.js']) {
    assert.equal(retiredNameHits(rel), true, rel);
  }
});

test('a served SVG may embed or link a raster only when it is on the allowlist', () => {
  const exclude = loadExclude();
  const allow = new Set(RASTER_SVG_ALLOW);
  const embedded = [];
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (isExcluded(rel, exclude)) continue;
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.svg') && svgLinksRaster(fs.readFileSync(p, 'utf8'))) embedded.push(rel);
    }
  }
  walk(ROOT);
  for (const rel of RASTER_SVG_ALLOW) {
    assert.equal(svgLinksRaster(read(rel)), true, rel + ' is allowlisted but does not embed or link a raster');
  }
  assert.deepEqual(embedded.filter((rel) => !allow.has(rel)), [], 'served SVG embeds or links a raster outside the allowlist:\n' + embedded.join('\n'));
  assert.deepEqual(RASTER_SVG_ALLOW.filter((rel) => !embedded.includes(rel)), [], 'allowlist entry is not a served raster SVG');
  for (const name of ['tonight.svg', 'needs.svg', 'edit.svg', 'autopilot.svg']) {
    const rel = 'job-desk/how-it-works/img/' + name;
    assert.equal(fs.existsSync(path.join(ROOT, rel)), false, rel);
    assert.equal(embedded.includes(rel), false, rel);
  }
  assert.doesNotMatch(read('job-desk/how-it-works/index.html'), /tonight\.svg|needs\.svg|edit\.svg|autopilot\.svg/);
});

test('svg raster plants cover data images and path-based image hrefs', () => {
  assert.equal(svgLinksRaster('<svg><image href="data:image/webp;base64,abc"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><image href="data:image/jpg;base64,abc"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><image href="data:image/gif;base64,abc"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><image href="data:image/png;base64,abc"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><image href="data:image/svg+xml;base64,abc"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><image xlink:href="photos/shot.png"/></svg>'), true);
  assert.equal(svgLinksRaster("<svg><image href='a.jpeg'/></svg>"), true);
  assert.equal(svgLinksRaster('<svg><image href="a.webp"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><image href="img/a.gif?v=1"/></svg>'), true);
  assert.equal(svgLinksRaster('<svg><rect href="a.png"/></svg>'), false);
  assert.equal(svgLinksRaster('<svg><image href="icon.svg"/></svg>'), false);
});
test('/demo v2 has the 4 screens: Tonight, Needs you, Jobs, Autopilot', () => {
  const js = read('demo/demo.js');
  for (const r of ['tonight', 'needs', 'jobs', 'autopilot']) assert.match(js, new RegExp(`["']${r}["']`), `route ${r} missing`);
  for (const t of ['Tonight', 'Needs you', 'Jobs', 'Autopilot']) assert.ok(js.includes(t), `screen label ${t} missing`);
});
test('/demo Report Card leads with All clear or N need you, with no letter grade (D2)', () => {
  const js = read('demo/demo.js');
  assert.ok(js.includes('All clear') && js.includes('need you'), 'status line missing');
  assert.ok(js.includes('Report Card'), 'keeps the name Report Card');
  assert.doesNotMatch(js, /\bgrade\b/i, 'no letter grade on the Report Card');
});
test('/demo is approve-only: no autonomy levels, quote nudges labeled as marketing, STOP honored', () => {
  const js = read('demo/demo.js');
  assert.doesNotMatch(js, /\blevel: "L\d"/, 'no autonomy level on any message type: approve-only is the only mode shown');
  assert.doesNotMatch(js, /\blevels: \{/, 'no autonomy ladder in the data');
  assert.doesNotMatch(js, /Autopilot did/, 'no "Autopilot did N things" line');
  assert.ok(js.includes('Marketing: consent on file'), 'quote nudges carry the marketing label (D5)');
  assert.match(js, /Reply STOP to opt out/, 'texts honor STOP');
  assert.doesNotMatch(js, /Automated (update|reminder)/, 'no "automated" message footers');
});
test('/demo: every customer message in the full log was approved by the owner, and Autopilot is an opt-in shown OFF', () => {
  const js = read('demo/demo.js');
  const ctx = { window: {} };
  require('vm').runInNewContext(js.slice(0, js.indexOf('\n};') + 3), ctx);
  const D = ctx.window.DEMO;
  const SENDS = ['status', 'reviewask', 'nudge', 'reply'];
  for (const l of D.log) if (SENDS.includes(l.auto)) assert.strictEqual(l.approvedBy, 'owner', `log entry not owner-approved: ${l.t} ${l.text}`);
  for (const l of D.log) if (!SENDS.includes(l.auto) && l.undo === 'sent') assert.fail(`unexpected send in log: ${l.text}`);
  for (const j of D.jobs) for (const e of j.events) if (/\bsent\b/i.test(e[2]) && !/quote sent|nothing sent|no advice sent/i.test(e[2])) assert.match(e[2], /^Approved by owner · /, `job ${j.id} event sent without owner approval: ${e[2]}`);
  assert.strictEqual(D.autopilotOptIn, false, 'Autopilot opt-in setting is OFF');
  assert.match(js, /Autopilot \(opt-in setting\)/, 'Autopilot shown only as a labeled opt-in setting');
  assert.match(js, /aria-checked="false" aria-label="Autopilot, opt-in, currently off"/, 'opt-in switch rendered OFF');
});
test('/demo puts a lead waiting over 15 min first in the queue', () => {
  assert.match(read('demo/demo.js'), /lead waiting over 15 min/i, 'queue rule: a lead waiting over 15 min counts as urgent');
});
test('/demo job cards use made-up street addresses and never name a real town', () => {
  const towns = ['Bowie', 'Lanham', 'Clinton', 'Largo', 'Greenbelt', 'Laurel', 'College Park',
    'Silver Spring', 'Waldorf', 'Hyattsville', 'Beltsville', 'Crofton', 'Glenn Dale', 'Mitchellville', 'Cheverly',
    'Glenarden', 'Landover', 'Capitol Heights', 'District Heights', 'Suitland', 'Temple Hills', 'Oxon Hill',
    'Fort Washington', 'Bethesda', 'Rockville', 'Gaithersburg', 'Germantown', 'Wheaton', 'Takoma Park', 'Riverdale',
    'Annapolis', 'Baltimore', 'Columbia', 'Odenton', 'Bladensburg', 'Brandywine', 'Accokeek', 'Alexandria',
    'Arlington', 'Fairfax', 'Woodbridge', 'Washington'];
  const re = new RegExp(`\\b(${towns.join('|')})\\b`, 'i');
  for (const f of ['demo/demo.js', 'demo/index.html', 'job-desk/how-it-works/index.html']) {
    const hit = read(f).match(re);
    assert.strictEqual(hit, null, `${f} names a real town: ${hit && hit[0]}`);
  }
  const js = read('demo/demo.js');
  assert.doesNotMatch(js, /\btown:/, 'job cards carry a street, not a town');
  const jobsBlock = js.slice(js.indexOf('jobs: ['), js.indexOf('closed: ['));
  const jobs = [...jobsBlock.matchAll(/\{ id: "J-\d+", customer: "[^"]+", ([a-z]+): "([^"]+)"/g)];
  assert.ok(jobs.length >= 18, 'all demo jobs found');
  for (const [, key, val] of jobs) {
    assert.strictEqual(key, 'street', `job field is ${key}`);
    assert.match(val, /^\d+ [A-Z][a-z]+ (Ct|Ln|Way|Dr|Pl|Rd|Ter|Ave|St|Cir)$/, `not a short made-up street: ${val}`);
  }
});
// Runs demo/demo.js in a VM with a minimal DOM stub and returns the HTML of one view.
function renderDemoView(view) {
  const js = read('demo/demo.js');
  const els = {};
  const el = (k) => (els[k] = els[k] || { innerHTML: '', textContent: '', hidden: true, classList: { add() {}, remove() {} }, querySelector: () => null, focus() {}, appendChild() {} });
  const ctx = {
    window: {}, location: { hash: '#' + view, search: '' }, URLSearchParams,
    document: { querySelector: (s) => el(s), getElementById: (s) => el('#' + s), addEventListener() {}, createElement: () => el(Math.random()), body: el('body') },
    setTimeout, clearTimeout, console,
  };
  ctx.window.addEventListener = () => {};
  ctx.window.scrollTo = () => {};
  require('vm').runInNewContext(js, ctx);
  return { html: els['#main'].innerHTML, DEMO: ctx.window.DEMO };
}
function clock(min) { const h = Math.floor(min / 60), m = min % 60; return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM'); }
test('/demo reply chips come from an explicit repliedBy on every lead with a reply time', () => {
  const { html, DEMO } = renderDemoView('jobs');
  const BY = ['owner-approved', 'owner-manual'];
  for (const j of DEMO.jobs) {
    if (j.replyMin == null) { assert.equal(j.repliedBy, undefined, `${j.id} has repliedBy but no reply time`); continue; }
    assert.ok(BY.includes(j.repliedBy), `${j.id} has a reply time but repliedBy is ${JSON.stringify(j.repliedBy)}`);
    if (j.repliedBy === 'owner-approved') assert.ok(DEMO.log.some((l) => l.auto === 'reply' && l.job === j.id && l.approvedBy === 'owner'), `${j.id}: no owner-approved reply in the log`);
    else assert.ok(j.events.some((e) => e[1] === 'You' && e[0] === clock(j.inMin + j.replyMin)), `${j.id}: no owner event at ${clock(j.inMin + j.replyMin)}`);
  }
  // rendered board: every "... in N min" reply chip is one of the two owner labels
  const text = html.replace(/<[^>]+>/g, ' ');
  const any = [...text.matchAll(/\b(?:replied|sent|answered|responded)(?:\s+\w+)?\s+in\s+\d+\s*min/gi)].length;
  const ok = [...text.matchAll(/(?:Approved and sent|You replied yourself) in \d+ min/g)].length;
  assert.ok(ok >= 3, 'reply chips rendered');
  assert.equal(any, ok, 'a reply chip is not labeled "Approved and sent" or "You replied yourself"');
  // source, with JS string joins folded: no other "replied/sent in" wording
  const src = foldBanned(read('demo/demo.js')).replace(/approved and sent in|you replied yourself in/gi, '');
  assert.doesNotMatch(src, /\b(?:replied|sent)\s+in\b/i, 'other "Replied in" / "Sent in" wording in demo.js');
});
test('how-it-works is approve-only: no levels table, no level chips, no autonomy lines, nudges approved before they send', () => {
  const s = read('job-desk/how-it-works/index.html');
  const folded = foldBanned(s);
  assert.doesNotMatch(s, /<table\b[^>]*\bclass\s*=\s*["'][^"']*\blevels\b/i, 'levels table removed (any attribute order)');
  assert.doesNotMatch(folded, /\bL[0-4]\s*(?:·|&middot;|:|-|–|—|\|)\s*\w/i, 'no L0-L4 level chip');
  for (const re of [/runs? on its own/i, /Autopilot did/i, /Auto\s*\+\s*undo/i, /auto[- ]?send/i, /Autopilot levels/i, /levels and undo/i, /shown in the log only/i])
    assert.doesNotMatch(folded, re, `autonomy wording: ${re}`);
  for (const f of s.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)) {
    const alts = [...f[0].matchAll(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)].map((m) => m[1] ?? m[2] ?? m[3]);
    const caps = [...f[0].matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi)].map((m) => m[1].replace(/<[^>]+>/g, ' '));
    for (const t of [...alts, ...caps]) assert.doesNotMatch(t, /\blevels?\b|\bL[0-4]\b|auto[- ]?(?:send|undo)|promoted|autopilot/i, `figure text: ${t}`);
  }
  assert.match(s, /up to 3 drafted nudges[^<]*each one goes out only when you approve it/);
  for (const m of s.matchAll(/<meta\b[^>]*\b(?:name|property)\s*=\s*["'](?:og:|twitter:)?description["'][^>]*>/gi))
    assert.doesNotMatch(m[0], /Autopilot|undo/i, `description: ${m[0]}`);
});
test('served code comments say what the code does, with no internal agent or ruling notes', () => {
  const { isExcluded: excl, loadExclude: load } = require('./stage-site.cjs');
  const exclude = load();
  const BAD = /co[\s_-]*founder|\bbrain\b|\bQA\b|\brulings?\b|sand-subagent|\bsubagent\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (excl(rel, exclude)) continue;
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(m?js|html?|css|svg|xml)$/i.test(e.name) || fs.statSync(p).size > 5e6) continue;
      const text = fs.readFileSync(p, 'utf8');
      const comments = [...text.matchAll(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g)].map((m) => m[0]);
      if (/\.(m?js|html?)$/i.test(e.name)) for (const m of text.matchAll(/(?:^|[\s;{}(),])(\/\/[^\n]*)/g)) comments.push(m[1]);
      for (const c of comments) if (BAD.test(c)) hits.push(rel + ': ' + c.slice(0, 80));
    }
  })(ROOT);
  assert.deepEqual(hits, [], 'internal notes in served comments:\n' + hits.join('\n'));
});
test('homepage describes the Job Desk as approve-only', () => {
  const home = read('index.html');
  assert.match(home, /Job Desk drafts the office work for you to approve\./);
  assert.match(home, /the Job Desk demo for a fictional HVAC company\./);
  assert.doesNotMatch(home, /Job Desk handles|Job Desk running on/i);
  assert.match(home, /Job-status messages drafted for you to approve/);
  assert.match(home, /follow-up drafted on time, and it goes out when you approve it/);
});
test('no served page claims the Job Desk acts without the owner', () => {
  const { isExcluded: excl, loadExclude: load } = require('./stage-site.cjs');
  const exclude = load();
  const BAD = /job desk (handles|runs|does it)|runs? (it )?on its own|does it for you|autopilot did|automatically sends?|sends? automatically|auto[- ]?sends?\b|auto \+ undo/i;
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (excl(rel, exclude)) continue;
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(m?js|html?|json|md|txt|svg|xml)$/i.test(e.name) || fs.statSync(p).size > 5e6) continue;
      const m = foldBanned(fs.readFileSync(p, 'utf8')).match(BAD);
      if (m) hits.push(rel + ': ' + m[0]);
    }
  })(ROOT);
  assert.deepEqual(hits, [], 'autonomy wording on served pages:\n' + hits.join('\n'));
});
test('undo never reads as unsending a message: descriptions and demo copy', () => {
  const { isExcluded: excl, loadExclude: load } = require('./stage-site.cjs');
  const exclude = load();
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      if (excl(rel, exclude)) continue;
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.html?$/i.test(e.name)) continue;
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/<meta\b[^>]*\b(?:name|property)\s*=\s*["'](?:og:|twitter:)?(?:description|title)["'][^>]*>/gi))
        if (/\bundo/i.test(m[0])) hits.push(rel + ': ' + m[0].slice(0, 90));
    }
  })(ROOT);
  assert.deepEqual(hits, [], 'undo in a page description:\n' + hits.join('\n'));
  const js = foldBanned(read('demo/demo.js'));
  assert.doesNotMatch(js, /(?:sent|message|log)[^."]{0,40}with undo|undo where it (?:still )?can/i, 'demo copy implies a sent message can be undone');
  const hiw = read('job-desk/how-it-works/index.html');
  assert.match(hiw, /Texts and emails can't be unsent/);
});
