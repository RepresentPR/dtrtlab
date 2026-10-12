const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const campaign = require('../js/campaign-home.js');
const root = path.join(__dirname, '..');

test('real homepage refresh keeps company introductions separate from the dated archive and results', async () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
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
  const company = nodes.get('company-work');
  const staticVideos = ['showcase', 'introduction'];
  company.children = [...staticVideos];
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
  assert.deepEqual(company.children, staticVideos, 'campaign refresh does not replace company work');
  assert.ok(html.indexOf('id="company-work"') < html.indexOf('id="results"'));
  assert.match(html, /id="gaming-archive"[^>]*><details>/, 'gaming archive is collapsed by default');
  assert.doesNotMatch(html, /Ian Ferraro/i);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'watch/index.html'), 'utf8').match(/<footer[\s\S]*?<\/footer>/)?.[0] || '', /Ian Ferraro/i);
  for (const src of ['/img/company/company-showcase-poster.jpg', '/img/company/make-your-work-clear-poster.jpg']) {
    assert.ok(html.includes(src));
    assert.equal(fs.readFileSync(path.join(root, src.slice(1))).subarray(0, 2).toString('hex'), 'ffd8');
  }
});

test('free-plan intake uses existing public profiles without collecting or claiming submitted details', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const offer = html.match(/<section[^>]*id="free-plan"[\s\S]*?<\/section>/)?.[0];
  assert.ok(offer, 'the prominent CTA has a real target');
  assert.doesNotMatch(offer, /<form|<input|<textarea|mailto:|messages\/compose/i);
  assert.match(offer, /lang="es"/);
  assert.match(offer, /No purchase required/);
  assert.match(offer, /business is big or small/);
  assert.match(offer, /public link, or a brief description of your idea/);
  assert.match(offer, /One goal you want to work toward/);
  assert.match(offer, /ask whether the work meets your expectations/);
  assert.doesNotMatch(offer, /100%|satisfaction.{0,20}(?:score|rating)|guaranteed results/i);
  assert.match(offer, /implementation is scoped separately/);
  assert.match(offer, /Opening a profile does not send a request/);
  const profileUrls = [...offer.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(profileUrls, ['https://x.com/DTRTLab', 'https://www.instagram.com/officiallydtrt/', '/contact.html']);
  const existingProfiles = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  for (const url of profileUrls.filter(url => url.startsWith('https:'))) assert.ok(existingProfiles.includes(url), 'intake uses a previously public business identity');
  assert.ok(html.indexOf('id="free-plan"') < html.indexOf('id="company-work"'));
});
