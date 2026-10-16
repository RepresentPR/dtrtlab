// js/contact.js and js/journey-language.js were removed after no public page loaded them.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['.git', 'node_modules']);

function htmlFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

test('no page loads the removed contact or journey-language scripts', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'js/contact.js')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'js/journey-language.js')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'css/journey-language.css')));
  const hits = [];
  for (const file of htmlFiles(ROOT)) {
    const text = fs.readFileSync(file, 'utf8');
    if (/contact\.js|journey-language\.js|journey-language\.css/.test(text)) hits.push(path.relative(ROOT, file));
  }
  assert.deepEqual(hits, []);
});
