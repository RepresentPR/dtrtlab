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
