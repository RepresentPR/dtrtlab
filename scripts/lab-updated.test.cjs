// Inside the Lab keeps its stored content date. The homepage stamp follows
// the newest notebook entry. A later squash merge must not move either date.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  ROOT, PAGE, HOME, SITEMAP, CONTENT_DATE, formatContentDate, readStamp, stampProblems,
} = require('./lab-updated.cjs');
const { loadEntries, newestIso } = require('./notebook.cjs');

const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

function git(dir, args, env) {
  return execFileSync('git', ['-C', dir, '-c', 'user.email=date-test@example.com', '-c', 'user.name=Date Test', ...args], {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

test('Inside the Lab keeps its stored date and the homepage stamp follows the notebook', () => {
  const lab = read(PAGE);
  const home = read(HOME);
  const sitemap = read(SITEMAP);
  const expected = formatContentDate(CONTENT_DATE);
  const notebookDate = newestIso(loadEntries().map((entry) => entry.date));
  const notebookText = formatContentDate(notebookDate);
  assert.deepEqual(stampProblems(lab, 'lab-updated'), []);
  assert.deepEqual(stampProblems(home, 'notebook-updated'), []);
  assert.equal(readStamp(lab, 'lab-updated').iso, CONTENT_DATE);
  assert.equal(readStamp(home, 'notebook-updated').iso, notebookDate);
  assert.equal(readStamp(lab, 'lab-updated').text, expected);
  assert.equal(readStamp(home, 'notebook-updated').text, notebookText);
  assert.match(sitemap, new RegExp(`<loc>https://dtrtlab\\.com/inside-the-lab/</loc><lastmod>${CONTENT_DATE}</lastmod>`));
  assert.match(sitemap, new RegExp(`<loc>https://dtrtlab\\.com/</loc><lastmod>${notebookDate}</lastmod>`));
  const planted = lab.replace(`Updated ${expected}`, 'Updated October 25, 2026');
  assert.ok(stampProblems(planted, 'lab-updated').length > 0, 'planted wrong date was not caught');
});

test('a later squash-merge commit does not move the content date', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-date-'));
  const later = '2026-10-31T16:00:00-04:00';
  const html = `<div class="preview-bar">INSIDE THE LAB <span id="lab-updated" data-content-date="${CONTENT_DATE}">Updated ${formatContentDate(CONTENT_DATE)}</span></div>\n`;
  try {
    git(dir, ['init', '-b', 'main']);
    fs.writeFileSync(path.join(dir, 'page.html'), html);
    git(dir, ['add', 'page.html']);
    git(dir, ['commit', '-m', 'squash: notebook, sitemap, and Inside the Lab date'], {
      GIT_AUTHOR_DATE: later,
      GIT_COMMITTER_DATE: later,
    });
    const committed = fs.readFileSync(path.join(dir, 'page.html'), 'utf8');
    const committedOn = git(dir, ['log', '-1', '--format=%cI']).trim();
    assert.equal(formatContentDate(committedOn.slice(0, 10)), 'October 31, 2026');
    assert.deepEqual(stampProblems(committed, 'lab-updated'), []);
    assert.equal(readStamp(committed, 'lab-updated').text, 'October 30, 2026');
    const planted = committed.replace('Updated October 30, 2026', 'Updated October 31, 2026');
    assert.deepEqual(stampProblems(planted, 'lab-updated'), ['stamp says October 31, 2026']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
