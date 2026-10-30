// Content date for the public notebook and Inside the Lab.
// The date lives in the page (data-content-date), not in a git commit timestamp,
// so a later squash merge does not move it.
'use strict';
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'inside-the-lab/index.html';
const HOME = 'index.html';
const SITEMAP = 'sitemap.xml';
const CONTENT_DATE = '2026-10-30';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatContentDate(iso) {
  const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('content date must be YYYY-MM-DD');
  return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

function readStamp(html, id) {
  const tag = String(html).match(new RegExp(`<span\\b[^>]*\\bid="${id}"[^>]*>`));
  if (!tag) return null;
  const iso = (tag[0].match(/\bdata-content-date="(\d{4}-\d{2}-\d{2})"/) || [])[1] || null;
  const text = (String(html).match(new RegExp(`id="${id}"[^>]*>Updated ([^<]+)<`)) || [])[1] || null;
  return { iso, text };
}

function stampProblems(html, id) {
  const found = readStamp(html, id);
  if (!found || !found.iso || !found.text) return ['missing stamp'];
  const expected = formatContentDate(found.iso);
  return found.text === expected ? [] : [`stamp says ${found.text}`];
}

module.exports = {
  ROOT, PAGE, HOME, SITEMAP, CONTENT_DATE, formatContentDate, readStamp, stampProblems,
};
