// Guard: retired offers, old guarantees, and day-job place names must not
// come back on the served site. Pages publishes the staged tree
// (scripts/stage-site.cjs), not the whole repo. This guard scans the HTML, JS,
// JSON, and webmanifest files that tree includes, plus versions/ and
// brand-kit.md (linked from /brand.html). scripts/ and docs/ are not published.
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

// A hit is skipped only when the file and the phrase both match one sentence.
// Legal pages are not skipped as a group. The old guarantee name is allowed
// only inside a sentence that is a historical refund for a past plan: it
// contains "past plan", "previous plan", or a dated phrase. Review Desk has
// no legal exception unless that same kind of sentence contains it. Day-job
// place names are banned on every served file, including hobby and fiction
// pages. Flag images (img/flag.*) are the only hobby/fiction files outside
// this text scan.
const HISTORICAL_REFUND = /past plan|previous plan|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i;
const ALLOWLIST = [
  {
    file: /^legal\/[^/]+\.html$/,
    line: HISTORICAL_REFUND,
    phrase: /7-Day Do-It-Right Guarantee|I rewrite it free|7-DAY|DO-IT-RIGHT/i
  },
  {
    file: /^legal\/[^/]+\.html$/,
    line: HISTORICAL_REFUND,
    phrase: /Review Desk/i
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
  const sentences = text.split(/\n/).flatMap((line) => line.split(/(?<=[.!?])\s+/));
  return sentences.some((sentence) => (
    ALLOWLIST.some((row) => row.file.test(rel) && row.line.test(sentence) && row.phrase.test(sentence) && rx.test(sentence))
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

test('the removed clips stay off the served site', () => {
  for (const name of ['why-dont-you', 'move-it']) {
    assert.equal(fs.existsSync(path.join(ROOT, 'img/thumbs/' + name + '.jpg')), false, name);
    assert.equal(fs.existsSync(path.join(ROOT, 'watch/media/' + name + '.mp4')), false, name);
  }
  const clips = fs.readFileSync(path.join(ROOT, 'clips/index.html'), 'utf8');
  assert.doesNotMatch(clips, /why-dont-you|move-it/);
  const hits = [];
  for (const file of walk(ROOT)) {
    const text = fs.readFileSync(file, 'utf8');
    if (/why-dont-you|move-it/.test(text)) hits.push(path.relative(ROOT, file));
  }
  assert.deepEqual(hits, []);
});
