// Site-gate notebook check. A homepage stamp more than 48 hours behind the
// newest notebook entry fails. A notebook entry more than 72 hours old warns
// and does not fail, so an old log does not block an unrelated fix.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  ROOT, LOG, PAGE, HOME, SITEMAP, HOUR,
  parseLog, loadEntries, newestIso, orderedEntries, renderPage, patchHome, patchSitemap,
  readHomeIso, entryDates, freshness, etMidnightMs,
} = require('./notebook.cjs');

const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

const noonEt = (iso) => new Date(`${iso}T12:00:00-05:00`);

test('a notebook line needs a real date, a title, and its own note', () => {
  const today = noonEt('2026-11-12');
  assert.throws(() => parseLog('2026-11-12 | Find the need\n', today), /one-line note/);
  assert.throws(() => parseLog('2026-02-31 | Missing day | A note.\n', today), /YYYY-MM-DD/);
  assert.deepEqual(parseLog("2026-11-12 | Find the need | Today's card: start with what people actually need.\n", today), [
    { date: '2026-11-12', title: 'Find the need', note: "Today's card: start with what people actually need." },
  ]);
  assert.match(
    renderPage([{ date: '2026-11-12', title: 'A & B', note: 'A <note>.' }]),
    /<h3>A &amp; B<\/h3>\n<p>A &lt;note&gt;.<\/p>/,
  );
});

test('a 2026-11-20 entry fails when today is 2026-11-12 in America/New_York', () => {
  const today = noonEt('2026-11-12');
  assert.throws(() => parseLog('2026-11-20 | Later | A note for later.\n', today), /2026-11-20 is after today in America\/New_York \(2026-11-12\)/);
  assert.throws(() => parseLog('2026-11-13 | Tomorrow | A note.\n', today), /after today in America\/New_York/);
  const stillNov12 = new Date('2026-11-13T03:30:00Z');
  assert.equal(parseLog('2026-11-12 | Find the need | A note for today.\n', stillNov12)[0].date, '2026-11-12');
  assert.throws(() => parseLog('2026-11-13 | Tomorrow | A note.\n', stillNov12), /after today/);
  const gate = freshness({ homeIso: '2026-11-20', newestIso: '2026-11-20', dates: ['2026-11-20'], now: today });
  assert.match(gate.fail.join('\n'), /2026-11-20 is after today in America\/New_York \(2026-11-12\)/);
});

test('newer dates render first and the same day keeps file order', () => {
  const html = renderPage([
    { date: '2026-11-10', title: 'Older line', note: 'An earlier note.' },
    { date: '2026-11-12', title: 'Find the need', note: 'First line today.' },
    { date: '2026-11-12', title: 'Reply where they asked', note: 'Second line today.' },
  ]);
  const need = html.indexOf('Find the need');
  const reply = html.indexOf('Reply where they asked');
  const older = html.indexOf('Older line');
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

test('2026-11-12 keeps the two notes and does not claim a platform post', () => {
  const entries = loadEntries();
  const day = entries.filter((entry) => entry.date === '2026-11-12');
  assert.deepEqual(day, [
    { date: '2026-11-12', title: 'Find the need', note: "Today's card: start with what people actually need." },
    { date: '2026-11-12', title: 'Reply where they asked', note: "Today's card: answer people in the place they reached out." },
  ]);
  const page = read(PAGE);
  const blocks = [...page.matchAll(/<article\b[\s\S]*?<\/article>/g)].map((match) => match[0]);
  const shown = orderedEntries(entries);
  assert.equal(blocks.length, shown.length);
  shown.forEach((entry, index) => {
    assert.match(blocks[index], new RegExp(`data-content-date="${entry.date}"`));
    assert.match(blocks[index], new RegExp(`<h3>${entry.title}</h3>`));
    assert.match(blocks[index], new RegExp(`<p>${entry.note.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>`));
    assert.equal((blocks[index].match(/<p>/g) || []).length, 1);
  });
  const contributing = read('CONTRIBUTING.md');
  for (const text of [page, read(LOG), contributing]) {
    assert.doesNotMatch(text, /Daily card posted/);
    assert.doesNotMatch(text, /Instagram/);
  }
  assert.match(contributing, /posted on <platform>/);
  assert.match(contributing, /logged out/);
  assert.doesNotMatch(page, /daily public cards/i);
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
  const fallback = freshness({ homeIso: '2026-10-31', newestIso: '2026-11-02', now: new Date('2026-11-02T18:00:00-05:00') });
  assert.ok(etMidnightMs('2026-11-02') - etMidnightMs('2026-10-31') > 48 * HOUR, 'fall-back makes two calendar days 49 Eastern hours');
  assert.deepEqual(fallback.fail.filter((line) => /48 hours/.test(line)), []);
});

test('an entry more than 72 hours after ET midnight warns and does not fail the gate', () => {
  const start = etMidnightMs('2026-11-12');
  assert.equal(start, Date.parse('2026-11-12T05:00:00.000Z'), 'November 12 2026 midnight ET is 05:00 UTC');
  const exact = freshness({
    homeIso: '2026-11-12',
    newestIso: '2026-11-12',
    now: new Date(start + 72 * HOUR),
  });
  assert.deepEqual(exact.fail, []);
  assert.equal(exact.warn, null, 'exactly 72 hours after ET midnight is not more than 72 hours');
  const utcMidnight = freshness({
    homeIso: '2026-11-12',
    newestIso: '2026-11-12',
    now: new Date(Date.UTC(2026, 10, 15, 0, 0, 0, 0)),
  });
  assert.equal(utcMidnight.warn, null, '72 hours after UTC midnight is still inside 72 hours from ET midnight');
  const old = freshness({
    homeIso: '2026-11-12',
    newestIso: '2026-11-12',
    now: new Date(start + 72 * HOUR + 1),
  });
  assert.deepEqual(old.fail, []);
  assert.match(old.warn, /more than 72 hours old/);
});

test('site-gate: homepage content date is within 48 hours of the newest notebook entry', () => {
  const homeIso = readHomeIso(read(HOME));
  const dates = entryDates(read(PAGE));
  const newest = newestIso(dates);
  const result = freshness({ homeIso, newestIso: newest, dates, now: new Date() });
  if (result.warn) console.warn(`::warning::${result.warn}`);
  assert.deepEqual(result.fail, []);
});
