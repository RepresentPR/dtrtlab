// The chat page has to call the one classifier. An import that is never called does not count.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('chat-app and replyFor call classifyCrisis before a page search', () => {
  const root = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'ask/chat-app.js'), 'utf8');
  const safety = fs.readFileSync(path.join(root, 'ask/safety.mjs'), 'utf8');
  const core = fs.readFileSync(path.join(root, 'js/safety-core.mjs'), 'utf8');
  assert.match(core, /export function classifyCrisis/);
  assert.match(app, /classifyCrisis\s*\(/);
  assert.match(safety, /classifyCrisis\s*\(/);
  const appCall = app.indexOf('classifyCrisis(');
  const appSearch = app.indexOf('DTRTAsk.search');
  assert.ok(appCall > -1 && appSearch > appCall, 'the classifier runs before the page search');
  const reply = safety.slice(safety.indexOf('export async function replyFor'));
  const tierAt = reply.indexOf('classifyCrisis(');
  const searchAt = reply.indexOf('opts.search');
  assert.ok(tierAt > -1 && searchAt > tierAt, 'replyFor classifies before search');
});
