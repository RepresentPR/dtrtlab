// The Inside the Lab stamp must match the page's last real content edit.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, PAGE, contentCommit, formatStamp } = require('./lab-updated.cjs');

function stampProblems(html, expected) {
  const found = String(html).match(/id="lab-updated">Updated ([^<]+)</);
  if (!found) return ['missing stamp'];
  return found[1] === expected ? [] : [`stamp says ${found[1]}`];
}

test('inside the lab updated stamp is the last content change in America/New_York', () => {
  const html = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
  const commit = contentCommit();
  const expected = formatStamp(commit.iso);
  assert.deepEqual(stampProblems(html, expected), [], commit.sha);
  const planted = html.replace(`Updated ${expected}`, 'Updated October 25, 2026');
  const plantedExpected = expected === 'October 25, 2026' ? 'October 30, 2026' : expected;
  const plantedHtml = expected === 'October 25, 2026'
    ? html.replace(`Updated ${expected}`, 'Updated January 2, 2020')
    : planted;
  assert.ok(stampProblems(plantedHtml, plantedExpected).length > 0, 'planted stale stamp was not caught');
  assert.ok(stampProblems('<div><span id="lab-updated">Updated October 25, 2026</span></div>', 'October 30, 2026').length > 0);
});
