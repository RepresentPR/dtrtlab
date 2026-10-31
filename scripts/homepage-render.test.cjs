const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const campaign = require('../js/campaign-home.js');
const root = path.join(__dirname, '..');
// Day 29 only. Boundaries keep October 290 and ranges such as October 19–25 out.
const OCTOBER_29_BAN = /\bOct(ober)?\.? 29\b/i;

test('hobby archive renders on lab.html and the homepage remains the public company notebook', async () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'lab.html'), 'utf8');
  const nodes = new Map();
  function element() {
    return { textContent: '', children: [], dataset: {}, classList: { toggle() {} },
      append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); },
      replaceChildren(...items) { this.children = items; }, setAttribute() {} };
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) {
    assert.equal(nodes.has(id), false, 'duplicate homepage ID: ' + id);
    nodes.set(id, element());
  }
  assert.equal(nodes.has('company-work'), false, 'company videos stay on the homepage, not the hobby archive');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'content/campaign.json'), 'utf8'));
  const document = { hidden: false, getElementById: id => nodes.get(id) || null, createElement: element, addEventListener() {} };
  const win = { setTimeout: () => 1, clearTimeout() {}, setInterval() {}, fetch: async () => ({ ok: true, json: async () => data }) };
  campaign.start(document, win);
  await new Promise(resolve => setImmediate(resolve));
  assert.notEqual(nodes.get('data-status').dataset.state, 'error', 'the actual HTML supplies every required renderer node');
  assert.match(nodes.get('views-value').textContent, /^[\d,]+$/);
  assert.match(nodes.get('roster-count').textContent, /\/ 17$/);
  assert.ok(nodes.get('highlight-list').children.length, 'archive selections render');
  assert.ok(nodes.get('queue-list').children.length, 'saved queue state renders');
  assert.match(html, /id="gaming-archive"[^>]*><details>/, 'gaming archive is collapsed on the hobby page');
  assert.doesNotMatch(home, /id="gaming-archive"/);
  assert.match(home, /\bIan\b/);
  assert.doesNotMatch(home, /Ian\s+Ferraro/i, 'homepage uses the approved public name, including metadata');
  assert.match(home.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), /An open record\s+of what we\s+build/i);
  assert.doesNotMatch(home, /Clinton|Southern Maryland|SoMD/i);
  assert.doesNotMatch(home, /Stay on the chair/);
  assert.match(home, /<p class="eyebrow">CURRENT CHECK<\/p>/);
  assert.doesNotMatch(home, /AS OF OCT 29|as of October 29/);
  assert.match(home, /<p class="deadline">Review was Sunday, October 25 · 12:00 noon Eastern \(past\)<\/p>/);
  assert.doesNotMatch(home, /Review: Sunday, October 25/);
  assert.match(home, /<b>Review outcome not verified<\/b>/);
  assert.match(home, /href="#campaign">Ended week<\/a>/);
  assert.match(home, /id="notebook-updated"[^>]*>Updated October 30, 2026</);
  // Notebook homepage publish: 86931fb, 2026-10-24 ("feat: publish the DTRT company notebook homepage", #88).
  const campaignSection = home.match(/<section\b[^>]*id="campaign"[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(campaignSection, /<b>Homepage was released October 24 · other work in preparation<\/b>/);
  assert.doesNotMatch(home, OCTOBER_29_BAN);
  assert.match(home, /<meta\b[^>]*property="og:image"[^>]*content="https:\/\/dtrtlab\.com\/img\/[^"?]+(?:\?[^" ]+)?"/);
  assert.doesNotMatch(home, /plan_HAGSLXXUeGkcz|plan_RVDjSToI7vKOM/);
  assert.doesNotMatch(home, /https:\/\/whop\.com\/checkout\/plan_kZqq0jgr6VrGG/);
  assert.doesNotMatch(home, /https:\/\/whop\.com\/checkout\//, 'seller readiness is unverified; homepage routes to inquiry');
  assert.doesNotMatch(home, /plan_Vn0gQGFWQx9CA|id="free-rewrite"/, 'free first-line rewrite is retired');
  assert.doesNotMatch(home, /@gmail\.com|PayPal/);
  const main = home.match(/<main[\s\S]*?<\/main>/)?.[0] || '';
  assert.doesNotMatch(main, /twitch\.tv|\/cs2\.html|\/afterlight\.html|\/clips\//i);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'watch/index.html'), 'utf8').match(/<footer[\s\S]*?<\/footer>/)?.[0] || '', /Ian Ferraro/i);
});

test('October 29 date ban matches that day in any case and not nearby text', () => {
  for (const sample of ['Oct 29', 'oct 29', 'OCT 29', 'Oct. 29', 'oct. 29', 'OCT. 29', 'October 29', 'october 29', 'OCTOBER 29', 'oCtObEr 29']) {
    assert.match(sample, OCTOBER_29_BAN, sample);
  }
  for (const sample of ['October 290', 'October 19–25']) {
    assert.doesNotMatch(sample, OCTOBER_29_BAN, sample);
  }
});
