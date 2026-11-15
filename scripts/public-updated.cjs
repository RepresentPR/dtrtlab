/* Homepage Updated stamp follows the newest commit that changed public
   site content. docs/, scripts/, tests, .github/, and proof.json-only
   refreshes do not move the date. A commit that only rewrites the stamp
   does not count. Dates are America/New_York calendar days.
   Usage: node scripts/public-updated.cjs --apply
*/
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

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
  if (!p || p.startsWith('docs/') || p.startsWith('scripts/') || p.startsWith('.github/') || p.startsWith('tools/')) return false;
  if (p.endsWith('.md')) return false;
  if (/\.test\.(cjs|mjs|js|py)$/.test(p) || /(^|\/)test_/.test(p)) return false;
  if (p === 'content/proof.json') return false;
  return true;
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

function dateOnlyCommit(hash) {
  const pub = commitFiles(hash).filter(isPublicPath);
  if (!pub.length) return true;
  if (pub.some((file) => file !== 'index.html' && file !== 'sitemap.xml')) return false;
  let diff = '';
  try {
    diff = git(['show', '--format=', hash, '--', 'index.html', 'sitemap.xml']);
  } catch (err) {
    return false;
  }
  const changed = diff.split('\n').filter((line) => /^[+-]/.test(line) && !line.startsWith('+++') && !line.startsWith('---'));
  return changed.every((line) => /notebook-updated|dtrtlab\.com\/<\/loc><lastmod>/.test(line));
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

function applyHome() {
  const found = newestPublicCommit();
  if (!found) throw new Error('no public content commit');
  const homePath = path.join(ROOT, HOME);
  const html = fs.readFileSync(homePath, 'utf8');
  fs.writeFileSync(homePath, applyStamp(html, found.date));
  return found;
}

if (require.main === module && process.argv.includes('--apply')) {
  const found = applyHome();
  process.stdout.write('public stamp ' + found.date + ' from ' + found.hash.slice(0, 7) + '\n');
}

module.exports = {
  isPublicPath, etDate, todayEt, formatContentDate, newestPublicCommit, readStamp,
  applyStamp, baseRef, publicDiff, requiredImprovementDate, loadImprovements, dateOnlyCommit
};
