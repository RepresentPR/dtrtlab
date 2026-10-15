// Guard: retired offers and pitches must not come back on the served site.
// Netlify publishes the whole repo ("publish = ."), so every tracked HTML, JS,
// JSON and webmanifest file is public, including versions/. Only scripts/
// (tests that name these phrases on purpose) and internal docs (docs/*.md,
// AGENTS.md, README.md) are outside this guard; brand-kit.md is linked from
// /brand.html, so it is checked too.
// Retired 2026-10-15 (Co-Founder): free first-line rewrite, "Stay on the chair /
// We write your posts", data-method pitch, writing plan(s), writing partnerships, day-30 numbers,
// Start at $50, Mini Social Pack, Week Pack.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PHRASES = [
  /first-line rewrite/i,
  /Stay on the chair/i,
  /We write your posts/i,
  /\bpublic data\b/i,
  /from public sources/i,
  /\bwriting plans?\b/i, // singular and plural, any case
  /\bwriting partnerships?\b/i,
  /30-day numbers/i,
  /day-30 numbers/i,
  /Start at \$50/i,
  /plan_HAGSLXXUeGkcz/,
  /plan_RVDjSToI7vKOM/,
  /Mini Social Pack/i,
  /Week Pack/i,
];
const SERVED = /\.(html?|js|mjs|json|webmanifest)$/i;
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', 'docs']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (SERVED.test(e.name) && fs.statSync(p).size < 5e6) out.push(p);
  }
  return out;
}

test('retired copy stays off every served HTML, JS and JSON file', () => {
  const files = walk(ROOT).concat(path.join(ROOT, 'brand-kit.md'));
  assert.ok(files.some(f => f.endsWith(path.join('versions', 'index.html'))), 'versions/ is served and checked');
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const rx of PHRASES) {
      const m = text.match(rx);
      if (m) hits.push(`${path.relative(ROOT, file)}: "${m[0]}"`);
    }
  }
  assert.deepEqual(hits, [], 'retired copy found:\n' + hits.join('\n'));
});
