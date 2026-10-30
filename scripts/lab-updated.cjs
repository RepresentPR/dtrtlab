// Visible "Updated …" stamp for /inside-the-lab, taken from git.
// The date is the Eastern calendar day of the newest commit that edited the page.
'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'inside-the-lab/index.html';

function contentCommit(file = PAGE) {
  const log = execFileSync('git', ['log', '--format=%H%x09%cI', '--', file], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  if (!log) throw new Error('no git history for ' + file);
  const [sha, iso] = log.split('\n')[0].split('\t');
  return { sha, iso };
}

function formatStamp(iso) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

module.exports = { ROOT, PAGE, contentCommit, formatStamp };
