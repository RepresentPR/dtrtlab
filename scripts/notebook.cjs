// Public notebook: one line in content/notebook.txt is one day.
// The build writes notebook/index.html and the homepage Updated stamp
// from the newest date in that file.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, HOME, SITEMAP, formatContentDate } = require('./lab-updated.cjs');

const LOG = 'content/notebook.txt';
const PAGE = 'notebook/index.html';
const POSTED = 'Daily card posted on X and Instagram.';
const CSS_V = '20261112-notebook1';
const HOUR = 3600 * 1000;
const HOME_STALE_MS = 48 * HOUR;
const ENTRY_OLD_MS = 72 * HOUR;

function validDay(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const back = new Date(utc);
  return back.getUTCFullYear() === year && back.getUTCMonth() === month - 1 && back.getUTCDate() === day;
}

function dayMs(iso) {
  return validDay(iso) ? Date.parse(`${iso}T00:00:00.000Z`) : null;
}

function parseLog(text) {
  const entries = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line.split('|').map((part) => part.trim());
    const date = parts.shift();
    const titles = parts.filter((part) => part.length > 0);
    const where = `${LOG}:${index + 1}`;
    if (!validDay(date)) throw new Error(`${where}: date must be a real YYYY-MM-DD`);
    if (!titles.length) throw new Error(`${where}: add at least one card title`);
    for (const title of titles) entries.push({ date, title });
  });
  if (!entries.length) throw new Error(`${LOG}: no entries`);
  return entries;
}

function loadEntries() {
  return parseLog(fs.readFileSync(path.join(ROOT, LOG), 'utf8'));
}

function newestIso(dates) {
  const list = [...dates];
  if (!list.length) return null;
  return list.reduce((max, iso) => (iso > max ? iso : max));
}

function orderedEntries(entries) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.date < b.entry.date ? 1 : a.entry.date > b.entry.date ? -1 : a.index - b.index))
    .map((row) => row.entry);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage(entries) {
  if (!entries.length) throw new Error(`${LOG}: no entries`);
  const newest = newestIso(entries.map((entry) => entry.date));
  const stamp = formatContentDate(newest);
  const articles = orderedEntries(entries).map((entry) => [
    `<article data-content-date="${entry.date}">`,
    `<div class="entry-meta">${escapeHtml(formatContentDate(entry.date))}</div>`,
    `<h3>${escapeHtml(entry.title)}</h3>`,
    `<p>${escapeHtml(POSTED)}</p>`,
    '</article>',
  ].join('\n')).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' https://gc.zgo.at; style-src 'self'; font-src 'self'; img-src 'self' data: https://dtrtlab.goatcounter.com; media-src 'self'; manifest-src 'self'; connect-src https://dtrtlab.goatcounter.com; form-action 'none'; base-uri 'none'; object-src 'none'; upgrade-insecure-requests">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Notebook — DTRT Lab</title>
<meta name="description" content="Dated log of DTRT Lab's daily public cards, newest first.">
<link rel="canonical" href="https://dtrtlab.com/notebook/">
<meta property="og:site_name" content="DTRT Lab">
<meta property="og:title" content="Notebook — DTRT Lab">
<meta property="og:description" content="Dated log of daily public cards, newest first.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://dtrtlab.com/notebook/">
<meta property="og:image" content="https://dtrtlab.com/img/brand/avatar-a.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:image:alt" content="DTRT Lab brand mark">
<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@DTRTLab">
<meta name="twitter:image" content="https://dtrtlab.com/img/brand/avatar-a.png">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/img/brand/mark.svg?v=la20261015" type="image/svg+xml">
<link rel="icon" href="/img/brand/favicon-32.png?v=la20261015" type="image/png" sizes="32x32">
<link rel="icon" href="/img/brand/favicon-16.png?v=la20261015" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=la20261015" sizes="180x180">
<link rel="manifest" href="/site.webmanifest?v=la20261015">
<meta name="theme-color" content="#0B2545">
<link rel="stylesheet" href="/css/knowledge-home.css?v=${CSS_V}">
<script data-goatcounter="https://dtrtlab.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</head>
<body class="notebook">
<a class="skip" href="#main">Skip to content</a>
<div class="preview-bar">NOTEBOOK <span id="notebook-updated" data-content-date="${newest}">Updated ${stamp}</span></div>
<header class="header">
<a class="wordmark" href="/"><img class="brand-mark" src="/img/brand/mark.svg?v=la20261015" alt="" width="34" height="34">DTRT <strong>LAB</strong></a>
<nav aria-label="Main navigation"><a href="/notebook/" aria-current="page">Notebook</a><a href="/#knowledge">The knowledge hub</a><a href="/#work">Our work</a><a href="/#campaign">Ended week</a><a class="nav-button" href="/map/">Get a free office map ↗</a></nav>
</header>
<main id="main">
<section class="hero">
<div class="hero-copy">
<p class="eyebrow"><span class="square"></span> DAILY PUBLIC CARDS</p>
<h1>The <em>notebook.</em></h1>
<p class="hero-lead">Newest first.</p>
</div>
</section>
<section class="knowledge-section" id="log">
<aside><p class="eyebrow">THE LOG</p><h2>Newest first.</h2></aside>
<div class="entries">
${articles}
</div>
</section>
</main>
<footer><a class="wordmark" href="/">DTRT <strong>LAB</strong></a><p>Do the right thing. Make useful things. Keep a truthful record.</p><nav aria-label="Footer"><a href="/notebook/" aria-current="page">Notebook</a><a href="/inside-the-lab/">Inside the Lab</a><a href="/contact.html">Contact</a><a href="/legal/privacy.html">Privacy</a><a href="/legal/terms.html">Terms</a><a href="/legal/refunds.html">Refunds</a></nav></footer>
</body>
</html>
`;
}

function patchHome(html, iso) {
  const stamp = `<span id="notebook-updated" data-content-date="${iso}">Updated ${formatContentDate(iso)}</span>`;
  const pattern = /<span id="notebook-updated" data-content-date="\d{4}-\d{2}-\d{2}">Updated [^<]*<\/span>/;
  if (!pattern.test(html)) throw new Error('homepage notebook stamp is missing');
  return html.replace(pattern, stamp);
}

function patchSitemap(xml, iso) {
  const homePattern = /(<loc>https:\/\/dtrtlab\.com\/<\/loc><lastmod>)\d{4}-\d{2}-\d{2}(<\/lastmod>)/;
  if (!homePattern.test(xml)) throw new Error('sitemap is missing the homepage lastmod');
  let next = xml.replace(homePattern, `$1${iso}$2`);
  const notePattern = /(<loc>https:\/\/dtrtlab\.com\/notebook\/<\/loc><lastmod>)\d{4}-\d{2}-\d{2}(<\/lastmod>)/;
  if (notePattern.test(next)) return next.replace(notePattern, `$1${iso}$2`);
  const homeLine = `  <url><loc>https://dtrtlab.com/</loc><lastmod>${iso}</lastmod><priority>1.0</priority></url>\n`;
  const noteLine = `  <url><loc>https://dtrtlab.com/notebook/</loc><lastmod>${iso}</lastmod><priority>0.6</priority></url>\n`;
  if (!next.includes(homeLine)) throw new Error('sitemap homepage line changed shape');
  return next.replace(homeLine, homeLine + noteLine);
}

function readHomeIso(html) {
  const tag = String(html).match(/<span\b[^>]*\bid="notebook-updated"[^>]*>/);
  if (!tag) return null;
  return (tag[0].match(/\bdata-content-date="(\d{4}-\d{2}-\d{2})"/) || [])[1] || null;
}

function entryDates(html) {
  return [...String(html).matchAll(/<article\b[^>]*\bdata-content-date="(\d{4}-\d{2}-\d{2})"/g)].map((match) => match[1]);
}

function freshness({ homeIso, newestIso: newest, now }) {
  const fail = [];
  let warn = null;
  const homeMs = dayMs(homeIso);
  const newestMs = dayMs(newest);
  if (homeMs == null || newestMs == null) fail.push('homepage or notebook content date is missing');
  else if (newestMs - homeMs > HOME_STALE_MS) {
    fail.push(`homepage content date ${homeIso} is more than 48 hours older than the newest notebook entry ${newest}`);
  }
  if (newestMs != null && now instanceof Date && !Number.isNaN(now.getTime())) {
    const age = now.getTime() - newestMs;
    if (age > ENTRY_OLD_MS) warn = `newest notebook entry ${newest} is more than 72 hours old (${(age / HOUR).toFixed(1)} h)`;
  }
  return { fail, warn };
}

function writeSite() {
  const entries = loadEntries();
  const iso = newestIso(entries.map((entry) => entry.date));
  const pagePath = path.join(ROOT, PAGE);
  fs.mkdirSync(path.dirname(pagePath), { recursive: true });
  fs.writeFileSync(pagePath, renderPage(entries));
  const homePath = path.join(ROOT, HOME);
  fs.writeFileSync(homePath, patchHome(fs.readFileSync(homePath, 'utf8'), iso));
  const sitemapPath = path.join(ROOT, SITEMAP);
  fs.writeFileSync(sitemapPath, patchSitemap(fs.readFileSync(sitemapPath, 'utf8'), iso));
  return { iso, cards: entries.length };
}

module.exports = {
  ROOT, LOG, PAGE, HOME, SITEMAP, POSTED, CSS_V, HOUR, HOME_STALE_MS, ENTRY_OLD_MS,
  validDay, dayMs, parseLog, loadEntries, newestIso, orderedEntries, escapeHtml,
  renderPage, patchHome, patchSitemap, readHomeIso, entryDates, freshness, writeSite,
};
