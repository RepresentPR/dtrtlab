// Every file in this repo is public (GitHub + GitHub Pages serves the whole tree).
// This guard fails if private founder terms (moving plans, money planning, day-job
// and job-search details) reappear in any tracked text file. Terms are stored as
// truncated SHA-256 hashes so the guard itself does not publish them; the plain
// list is kept in the founder's private notes.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const h = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const SINGLE = new Set(['cf6f0c3063e089ac', '5571bf8f246a2931', 'e424dce6bf0bec35', '0ab3f317e98a3b62', '05ef130c628dac68', 'fe01ce351aec9c1e', 'adaadd3c60c44e4a', '2f07555d3e64c04d', 'cc72610c2a2a7312', '5fb2fdb1225d36a6', '5bcc90c3fbdf6f53', 'b95650ceb482a474', 'e602c1e0fd248939', '1ffc0406b9891fcd', 'c06dc8cc17251ea4']);
const PAIRS = new Set(['4140ea46ab618ff1', '2c15efaff108ba54', 'f980fb0d42a0e7b3']);
// AFTERLIGHT is fiction; its story files may name its real-world setting and
// in-story moves. Nothing else may.
const FICTION_OK = new Set(['cf6f0c3063e089ac', '2f07555d3e64c04d', 'cc72610c2a2a7312', '5fb2fdb1225d36a6', '5bcc90c3fbdf6f53', 'b95650ceb482a474', 'e602c1e0fd248939']);
const FICTION_FILES = [/^afterlight\.html$/, /^story\.html$/, /^game\.html$/, /^worlds\.html$/, /^stories\/afterlight\//, /^content\/afterlight\.json$/, /^content\/product\.json$/, /^tools\/build_afterlight\.py$/];
const ALLOWED_NEXT = { '1ffc0406b9891fcd': 'deductible' }; // donation disclaimer in js/journey-language.js
const TEXT = /\.(html?|js|mjs|cjs|json|md|txt|css|xml|yml|yaml|toml|webmanifest|py|sh|ps1|svg)$|^(_headers|CNAME|robots\.txt|security\.txt)$/i;
const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TEXT.test(e.name) && fs.statSync(p).size < 5e6) out.push(p.split(path.sep).join('/'));
  }
  return out;
}

test('no private founder terms in any public file', () => {
  const hits = [];
  for (const file of walk('.').map((f) => f.replace(/^\.\//, ''))) {
    const fiction = FICTION_FILES.some((rx) => rx.test(file));
    const toks = fs.readFileSync(file, 'utf8').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      const s = h(toks[i]);
      if (SINGLE.has(s) && !(fiction && FICTION_OK.has(s)) && !(ALLOWED_NEXT[s] && ALLOWED_NEXT[s] === toks[i + 1])) hits.push(`${file}: term#${s}`);
      if (i + 1 < toks.length && PAIRS.has(h(toks[i] + ' ' + toks[i + 1]))) hits.push(`${file}: pair#${h(toks[i] + ' ' + toks[i + 1])}`);
    }
  }
  assert.deepStrictEqual(hits, [], 'private terms found:\n' + hits.join('\n'));
});

test('job application letters are not in the repo', () => {
  assert.ok(!fs.existsSync('docs/applications'), 'docs/applications must stay out of the public repo');
});
