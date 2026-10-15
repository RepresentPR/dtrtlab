// /demo is the Job Desk sample: a static page on a fictional company that must say so on every view.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
test('/demo exists and shows the "Demo, fictional data" banner outside the JS-rendered views', () => {
  const s = read('demo/index.html');
  const ribbon = (s.match(/<div class="ribbon"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
  assert.match(ribbon, /Demo, fictional data/);
  assert.ok(s.indexOf('class="ribbon"') < s.indexOf('id="main"'), 'banner sits above every view');
  assert.match(s, /<title>[^<]*demo[^<]*<\/title>/i);
});
test('/demo ships its own assets and the sample map, and the homepage links to it', () => {
  for (const f of ['demo/app.css', 'demo/demo.js']) assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} missing`);
  assert.strictEqual(fs.readFileSync(path.join(ROOT, 'demo/sample-map.pdf')).subarray(0, 5).toString(), '%PDF-');
  assert.match(read('demo/index.html'), /href="sample-map\.pdf"/);
  assert.match(read('index.html'), /href="\/demo\/"[^>]*>See a sample</);
});
test('/demo data stays fictional: labeled company, 555 numbers, example.com emails', () => {
  const js = read('demo/demo.js');
  assert.match(js, /Sample Heating & Air Co\. \(demo\)/);
  for (const m of js.matchAll(/\b\d{3}-\d{4}\b/g)) assert.match(m[0], /^555-01\d\d$/, `non-fictional number ${m[0]}`);
  for (const m of js.matchAll(/[\w.+-]+@([\w-]+\.[\w.]+)/g)) assert.strictEqual(m[1], 'example.com', `non-fictional email ${m[0]}`);
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
  // Real DMV-area towns and cities. The demo is a made-up company, so its jobs must not point at real places.
  // (Some place names are already blocked repo-wide by private-terms.test.cjs and are left out here.)
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
