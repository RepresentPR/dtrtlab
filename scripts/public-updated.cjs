/* Homepage Updated stamp follows the newest commit that changed a file
   GitHub Pages would publish. The exclude list is _config.yml. Encrypted
   owner data, proof.json, and live-refresh bot commits do not count.
   Whitespace-only edits and stamp-only edits, including a stamp line plus
   a blank line, do not count. Dates are America/New_York calendar days.
   Usage: node scripts/public-updated.cjs --apply-if-changed
*/
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { loadExclude, isExcluded } = require('./stage-site.cjs');

const ROOT = path.resolve(__dirname, '..');
const HOME = 'index.html';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function git(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts
  }).trim();
}

function isPublicPath(rel) {
  const p = String(rel || '').split('\\').join('/');
  if (!p || p === '_config.yml') return false;
  if (isExcluded(p, loadExclude())) return false;
  if (p === 'live/owner.enc.json' || p === 'hq/owner.enc.json') return false;
  if (p === 'content/proof.json' || p.endsWith('/proof.json')) return false;
  return true;
}

function isLiveRefreshAuthor(author) {
  const name = String(author && author.name || '');
  const email = String(author && author.email || '').toLowerCase();
  return name === 'dtrt-live-bot' || email === 'live-bot@users.noreply.github.com';
}

function isStampLine(text) {
  const line = String(text);
  if (/notebook-updated/.test(line)) return true;
  if (/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(line)) return true;
  return false;
}

function countsAsPublicChange(diffText) {
  const changed = String(diffText).split('\n').filter((line) => /^[+-]/.test(line) && !line.startsWith('+++') && !line.startsWith('---'));
  const kept = changed.filter((line) => line.slice(1).trim() !== '');
  if (!kept.length) return false;
  return kept.some((line) => !isStampLine(line.slice(1)));
}

function etDate(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((part) => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

function todayEt(now = new Date()) {
  return etDate(now.toISOString());
}

function formatContentDate(iso) {
  const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('content date must be YYYY-MM-DD');
  return MONTHS[Number(match[2]) - 1] + ' ' + Number(match[3]) + ', ' + match[1];
}

function commitFiles(hash) {
  const out = git(['diff-tree', '--no-commit-id', '--name-only', '-r', hash]);
  return out ? out.split('\n').filter(Boolean) : [];
}

function commitAuthor(hash) {
  const out = git(['log', '-1', '--format=%an%x09%ae', hash]);
  const tab = out.indexOf('\t');
  return { name: out.slice(0, tab), email: out.slice(tab + 1) };
}

function publicDiffText(hash) {
  const files = commitFiles(hash).filter(isPublicPath);
  if (!files.length) return '';
  const args = ['diff', '-w', '--ignore-blank-lines', hash + '^', hash, '--', ...files];
  try {
    return git(args);
  } catch (err) {
    return git(['show', '-w', '--ignore-blank-lines', '--format=', hash, '--', ...files]);
  }
}

function dateOnlyCommit(hash) {
  if (isLiveRefreshAuthor(commitAuthor(hash))) return true;
  const pub = commitFiles(hash).filter(isPublicPath);
  if (!pub.length) return true;
  return !countsAsPublicChange(publicDiffText(hash));
}

function newestPublicCommit() {
  const log = git(['log', '--format=%H %cI']);
  for (const line of log.split('\n')) {
    if (!line) continue;
    const hash = line.slice(0, line.indexOf(' '));
    const iso = line.slice(hash.length + 1);
    if (!hash || dateOnlyCommit(hash)) continue;
    if (commitFiles(hash).some(isPublicPath)) return { hash, iso, date: etDate(iso) };
  }
  return null;
}

function readStamp(html) {
  const tag = String(html).match(/<span\b[^>]*\bid="notebook-updated"[^>]*>/);
  if (!tag) return null;
  const iso = (tag[0].match(/\bdata-content-date="(\d{4}-\d{2}-\d{2})"/) || [])[1] || null;
  const text = (String(html).match(/id="notebook-updated"[^>]*>Updated ([^<]+)</) || [])[1] || null;
  return { iso, text };
}

function applyStamp(html, iso) {
  const text = formatContentDate(iso);
  const next = String(html).replace(
    /id="notebook-updated" data-content-date="\d{4}-\d{2}-\d{2}">Updated [^<]+<\/span>/,
    'id="notebook-updated" data-content-date="' + iso + '">Updated ' + text + '</span>'
  );
  if (next === html) throw new Error('homepage stamp was not updated');
  if (!next.includes('href="/improvements/"')) {
    return next.replace(
      '<span id="notebook-updated"',
      '<a href="/improvements/"><span id="notebook-updated"'
    ).replace(
      '</span></div>\n<header class="header">',
      '</span></a></div>\n<header class="header">'
    );
  }
  return next;
}

function baseRef() {
  if (process.env.FIX7_BASE_REF) return process.env.FIX7_BASE_REF;
  try {
    git(['rev-parse', '--verify', 'origin/main']);
    return 'origin/main';
  } catch (err) {
    return null;
  }
}

function diffNames(base) {
  if (!base) return [];
  const out = git(['diff', '--name-only', base]);
  return out ? out.split('\n').filter(Boolean) : [];
}

function publicDiff(base) {
  return diffNames(base).filter(isPublicPath).filter((file) => {
    if (file !== 'index.html' && file !== 'sitemap.xml') return true;
    return true;
  });
}

function requiredImprovementDate(now = new Date()) {
  const base = baseRef();
  if (!base) return null;
  const names = diffNames(base);
  const pub = names.filter(isPublicPath);
  if (!pub.length) return null;
  let log = '';
  try {
    log = git(['log', '--format=%H %cI', base + '..HEAD']);
  } catch (err) {
    log = '';
  }
  for (const line of log.split('\n')) {
    if (!line) continue;
    const hash = line.slice(0, line.indexOf(' '));
    const iso = line.slice(hash.length + 1);
    if (dateOnlyCommit(hash)) continue;
    if (commitFiles(hash).some(isPublicPath)) return etDate(iso);
  }
  const dirty = git(['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean).some(isPublicPath)
    || git(['diff', '--name-only', '--cached', 'HEAD']).split('\n').filter(Boolean).some(isPublicPath);
  if (dirty || pub.length) return todayEt(now);
  return null;
}

function loadImprovements() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/improvements.json'), 'utf8'));
  return Array.isArray(data.entries) ? data.entries : [];
}

function applyIfChanged() {
  const found = newestPublicCommit();
  if (!found) throw new Error('no public content commit');
  const homePath = path.join(ROOT, HOME);
  const html = fs.readFileSync(homePath, 'utf8');
  const stamp = readStamp(html);
  const text = formatContentDate(found.date);
  if (stamp && stamp.iso === found.date && stamp.text === text) {
    return Object.assign({ changed: false }, found);
  }
  fs.writeFileSync(homePath, applyStamp(html, found.date));
  return Object.assign({ changed: true }, found);
}

if (require.main === module && (process.argv.includes('--apply') || process.argv.includes('--apply-if-changed'))) {
  const found = applyIfChanged();
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=' + (found.changed ? 'true' : 'false') + '\n');
  }
  process.stdout.write((found.changed ? 'updated ' : 'unchanged ') + found.date + ' from ' + found.hash.slice(0, 7) + '\n');
}

module.exports = {
  isPublicPath, isLiveRefreshAuthor, isStampLine, countsAsPublicChange,
  etDate, todayEt, formatContentDate, newestPublicCommit, readStamp,
  applyStamp, applyIfChanged, baseRef, publicDiff, requiredImprovementDate,
  loadImprovements, dateOnlyCommit
};
