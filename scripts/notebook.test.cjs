// Site-gate notebook check. A homepage stamp more than 48 hours behind the
// newest notebook entry fails. A notebook entry more than 72 hours old warns
// and does not fail, so an old log does not block an unrelated fix.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  ROOT, LOG, PAGE, HOME, SITEMAP, POSTED,
  parseLog, loadEntries, newestIso, orderedEntries, renderPage, patchHome, patchSitemap,
  readHomeIso, entryDates, freshness,
} = require('./notebook.cjs');

const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

test('a notebook line needs a real date and at least one card title', () => {
  assert.throws(() => parseLog('2026-11-12\n'), /card title/);
  assert.throws(() => parseLog('2026-02-31 | Missing day\n'), /YYYY-MM-DD/);
  assert.deepEqual(
    parseLog('2026-11-12 | Find the need | Reply in the form\n').map((entry) => entry.title),
    ['Find the need', 'Reply in the form'],
  );
  assert.match(renderPage([{ date: '2026-11-12', title: 'A & B' }]), /<h3>A &amp; B<\/h3>/);
});

test('newer dates render first and the same day keeps file order', () => {
  const html = renderPage([
    { date: '2026-11-10', title: 'Older card' },
    { date: '2026-11-12', title: 'Find the need' },
    { date: '2026-11-12', title: 'Reply in the form' },
  ]);
  const need = html.indexOf('Find the need');
  const reply = html.indexOf('Reply in the form');
  const older = html.indexOf('Older card');
  assert.ok(need !== -1 && need < reply && reply < older);
  assert.deepEqual(entryDates(html), ['2026-11-12', '2026-11-12', '2026-11-10']);
});

test('published notebook, homepage stamp, and sitemap match the log', () => {
  const entries = loadEntries();
  const newest = newestIso(entries.map((entry) => entry.date));
  const page = renderPage(entries);
  assert.equal(read(PAGE), page);
  assert.equal(patchHome(read(HOME), newest), read(HOME));
  assert.equal(patchSitemap(read(SITEMAP), newest), read(SITEMAP));
  assert.deepEqual(entryDates(page), orderedEntries(entries).map((entry) => entry.date));
  assert.equal(readHomeIso(read(HOME)), newest);
  assert.equal(newestIso(entryDates(page)), newest);
});

test('2026-11-12 lists the two daily cards and each entry is only the posted line', () => {
  const entries = loadEntries();
  const day = entries.filter((entry) => entry.date === '2026-11-12');
  assert.deepEqual(day.map((entry) => entry.title), ['Find the need', 'Reply in the form']);
  const page = read(PAGE);
  const blocks = [...page.matchAll(/<article\b[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(blocks.length, entries.length);
  for (const block of blocks) {
    assert.match(block, /\bdata-content-date="\d{4}-\d{2}-\d{2}"/);
    assert.match(block, new RegExp(`<p>${POSTED.replace(/\./g, '\\.')}</p>`));
    assert.equal((block.match(/<p>/g) || []).length, 1);
  }
  assert.doesNotMatch(page, /\bIan\b/);
  assert.doesNotMatch(page, /\/private\b/);
  assert.doesNotMatch(page, /\b\d[\d,]*\s*(views|likes|followers|comments)\b/i);
});

test('notebook is registered in the nav, footer, and sitemap', () => {
  const home = read(HOME);
  const nav = home.match(/<nav\b[^>]*aria-label="Main navigation"[^>]*>[\s\S]*?<\/nav>/)[0];
  const foot = home.match(/<footer\b[\s\S]*?<\/footer>|<footer>[\s\S]*?<\/footer>/)[0];
  assert.match(nav, /href="\/notebook\/"/);
  assert.match(foot, /href="\/notebook\/"/);
  assert.match(read('inside-the-lab/index.html'), /<footer[\s\S]*href="\/notebook\/"/);
  const newest = newestIso(entryDates(read(PAGE)));
  const sitemap = read(SITEMAP);
  assert.match(sitemap, new RegExp(`<loc>https://dtrtlab\\.com/notebook/</loc><lastmod>${newest}</lastmod>`));
  assert.match(sitemap, new RegExp(`<loc>https://dtrtlab\\.com/</loc><lastmod>${newest}</lastmod>`));
});

test('exactly 48 hours does not fail, and more than 48 hours does', () => {
  const now = new Date(Date.UTC(2026, 10, 12, 18));
  assert.deepEqual(freshness({ homeIso: '2026-11-12', newestIso: '2026-11-12', now }).fail, []);
  assert.deepEqual(
    freshness({ homeIso: '2026-11-10', newestIso: '2026-11-12', now }).fail,
    [],
    'exactly 48 hours is not more than 48 hours',
  );
  const late = freshness({ homeIso: '2026-11-09', newestIso: '2026-11-12', now });
  assert.equal(late.fail.length, 1);
  assert.match(late.fail[0], /more than 48 hours older/);
  assert.ok(freshness({ homeIso: null, newestIso: '2026-11-12', now }).fail.length > 0);
});

test('an entry more than 72 hours old warns and does not fail the gate', () => {
  const fresh = freshness({
    homeIso: '2026-11-12',
    newestIso: '2026-11-12',
    now: new Date(Date.UTC(2026, 10, 15, 0, 0, 0, 0)),
  });
  assert.deepEqual(fresh.fail, []);
  assert.equal(fresh.warn, null, 'exactly 72 hours is not more than 72 hours');
  const old = freshness({
    homeIso: '2026-11-12',
    newestIso: '2026-11-12',
    now: new Date(Date.UTC(2026, 10, 15, 0, 0, 0, 1)),
  });
  assert.deepEqual(old.fail, []);
  assert.match(old.warn, /more than 72 hours old/);
});

test('site-gate: homepage content date is within 48 hours of the newest notebook entry', () => {
  const homeIso = readHomeIso(read(HOME));
  const newest = newestIso(entryDates(read(PAGE)));
  const result = freshness({ homeIso, newestIso: newest, now: new Date() });
  if (result.warn) console.warn(`::warning::${result.warn}`);
  assert.deepEqual(result.fail, []);
});
