// Guard: retired offers, old guarantees, and day-job place names must not
// come back on the served site. Netlify publishes the whole repo
// ("publish = ."), so every tracked HTML, JS, JSON and webmanifest file is
// public, including versions/ and live/. scripts/ holds the tests that name
// these phrases on purpose. docs/*.md stays out of this scan.
// brand-kit.md is linked from /brand.html, so it is checked too.
// Retired 2026-10-15 (Co-Founder): free first-line rewrite, "Stay on the chair /
// We write your posts", data-method pitch, writing plans, day-30 numbers,
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
  /Writing plans/i,
  /30-day numbers/i,
  /day-30 numbers/i,
  /Start at \$50/i,
  /plan_HAGSLXXUeGkcz/,
  /plan_RVDjSToI7vKOM/,
  /Mini Social Pack/i,
  /Week Pack/i,
  /Writing Retainer/i,
  /plan_kZqq0jgr6VrGG/,
  /\bClinton\b/i,
  /Southern Maryland/i,
  /\bSoMD\b/i,
  /\bBowie\b/i,
  /\bLanham\b/i,
  /\bLargo\b/i,
  /\bWaldorf\b/i,
  /Silver Spring/i,
  /\bBaltimore\b/i,
  /\bArlington\b/i,
  /\bAnnapolis\b/i,
  /Review Desk/i,
  /7-Day Do-It-Right Guarantee/i,
  /I rewrite it free/i,
  /7-DAY/,
  /DO-IT-RIGHT/,
];
const SERVED = /\.(html?|js|mjs|json|webmanifest)$/i;
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', 'docs']);

// A hit is skipped only when the file and the phrase both match a row.
// Legal pages are not skipped as a group. A past-plan refund sentence may
// name a retired guarantee. Fiction and hobby pages may name a place that
// belongs to the story or the stream archive. Offer names stay banned there.
const ALLOWLIST = [
  {
    file: /^legal\/(?:refunds|terms)\.html$/,
    line: /past plans follow Whop/i,
    phrase: /7-Day Do-It-Right Guarantee|I rewrite it free|7-DAY|DO-IT-RIGHT|Review Desk/i
  },
  {
    file: /^(?:afterlight|cs2|game|story|worlds|lab)\.html$|^(?:stories\/afterlight|watch|clips)\//,
    line: /.*/,
    phrase: /\b(?:Clinton|SoMD|Bowie|Lanham|Largo|Waldorf|Baltimore|Arlington|Annapolis)\b|Southern Maryland|Silver Spring/i
  }
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (SERVED.test(e.name) && fs.statSync(p).size < 5e6) out.push(p);
  }
  return out;
}

function allowed(rel, text, rx) {
  return text.split(/\n/).some((line) => (
    ALLOWLIST.some((row) => row.file.test(rel) && row.line.test(line) && row.phrase.test(line) && rx.test(line))
  ));
}

test('retired copy stays off every served HTML, JS and JSON file', () => {
  const files = walk(ROOT).concat(path.join(ROOT, 'brand-kit.md'));
  assert.ok(files.some(f => f.endsWith(path.join('versions', 'index.html'))), 'versions/ is served and checked');
  assert.ok(files.some(f => f.endsWith(path.join('live', 'dashboard.js'))), 'live/dashboard.js is served and checked');
  assert.ok(files.some(f => f.endsWith(path.join('legal', 'terms.html'))), 'legal pages are checked, not skipped');
  const hits = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    for (const rx of PHRASES) {
      if (!rx.test(text)) continue;
      if (allowed(rel, text, rx)) continue;
      const m = text.match(rx);
      hits.push(`${rel}: "${m[0]}"`);
    }
  }
  assert.deepEqual(hits, [], 'retired copy found:\n' + hits.join('\n'));
});

test('the why-dont-you clip stays removed', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'img/thumbs/why-dont-you.jpg')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'watch/media/why-dont-you.mp4')), false);
  const hits = [];
  for (const file of walk(ROOT)) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('why-dont-you')) hits.push(path.relative(ROOT, file));
  }
  assert.deepEqual(hits, []);
});
