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
