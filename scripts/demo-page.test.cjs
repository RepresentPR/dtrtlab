// /demo is the Job Desk sample: a static page on a fictional company that must say so on every view.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { isExcluded, loadExclude } = require('./stage-site.cjs');
const { containsRetiredDemoName } = require('./served-fold.cjs');
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
test('/demo labels every automation level (L0-L4) and quote nudges as marketing', () => {
  const js = read('demo/demo.js');
  for (const l of ['L0', 'L1', 'L2', 'L3', 'L4']) assert.ok(js.includes(l), `level ${l} missing`);
  assert.ok(js.includes('Marketing: consent on file'), 'quote nudges carry the marketing label (D5)');
  assert.match(js, /Reply STOP to opt out/, 'automated texts honor STOP');
});
test('/demo keeps email -> job card at L2 (owner approves) until it proves 95%, and puts a waiting lead first', () => {
  const js = read('demo/demo.js');
  const email = (js.match(/\{ id: "email",[^\n]*/) || [''])[0];
  assert.match(email, /level: "L2"/, 'email -> job card is L2');
  assert.ok(email.includes('L3 after it proves 95% on your mail'), 'L3 label shown as the next step');
  assert.match(js, /lead waiting over 15 min/i, 'queue rule: a lead waiting over 15 min counts as urgent');
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
