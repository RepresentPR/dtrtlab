const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const campaign = require('../js/campaign-home.js');
const root = path.join(__dirname, '..');

test('hobby archive renders on lab.html and the homepage stays the writing business', async () => {
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
  assert.doesNotMatch(home, /Ian Ferraro/i);
  assert.match(home, /DTRT Lab writes a free plan for a business or an idea\. DTRTC is the stream\. AFTERLIGHT is a game in development, and it is not for sale\. Send one link and one goal\./);
  assert.match(home, /https:\/\/whop\.com\/checkout\/plan_HAGSLXXUeGkcz/);
  assert.match(home, /https:\/\/whop\.com\/checkout\/plan_RVDjSToI7vKOM/);
  assert.match(home, /https:\/\/whop\.com\/checkout\/plan_kZqq0jgr6VrGG/);
  assert.doesNotMatch(home, /IanAnthonyFC@gmail\.com|PayPal/);
  const main = home.match(/<main[\s\S]*?<\/main>/)?.[0] || '';
  assert.doesNotMatch(main, /twitch\.tv|\/cs2\.html|\/afterlight\.html|\/clips\//i);
  assert.match(home, /href="\/lab\.html"/);
  assert.ok(home.includes('id="company-work"'));
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'watch/index.html'), 'utf8').match(/<footer[\s\S]*?<\/footer>/)?.[0] || '', /Ian Ferraro/i);
  for (const src of ['/img/company/company-showcase-poster.jpg', '/img/company/make-your-work-clear-poster.jpg']) {
    assert.ok(home.includes(src));
    assert.equal(fs.readFileSync(path.join(root, src.slice(1))).subarray(0, 2).toString('hex'), 'ffd8');
  }
});

test('free-plan intake uses existing public profiles without collecting or claiming submitted details', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const offer = html.match(/<section[^>]*id="free-plan"[\s\S]*?<\/section>/)?.[0];
  assert.ok(offer, 'the prominent CTA has a real target');
  assert.doesNotMatch(offer, /<form\b|mailto:|messages\/compose|method=|action=/i, 'wizard never posts or opens mail itself');
  assert.match(offer, /<textarea\b[^>]*id="plan-project"/, 'guided tool collects the two details locally');
  assert.match(offer, /<textarea\b[^>]*id="plan-goal"/);
  assert.match(offer, /lang="es"/);
  assert.match(offer, /No purchase required/);
  assert.match(offer, /business is big or small/);
  assert.match(offer, /public link, or a brief description of your idea/);
  assert.match(offer, /One goal you want to work toward/);
  assert.match(offer, /ask whether the work meets your expectations/);
  assert.doesNotMatch(offer, /100%|satisfaction.{0,20}(?:score|rating)|guaranteed results/i);
  assert.match(offer, /implementation is scoped separately/);
  assert.match(offer, /Opening a profile does not send a request/);
  assert.match(offer, /id="plan-tool"/, 'interactive free-plan tool is on the homepage');
  assert.match(offer, /data-plan-type="business"/);
  assert.match(offer, /data-plan-type="idea"/);
  assert.match(offer, /lang="es"[^>]*href="\/contact\.html\?intent=free-plan&amp;lang=es"/);
  assert.match(offer, /https:\/\/x\.com\/DTRTLab/);
  assert.match(offer, /https:\/\/www\.instagram\.com\/officiallydtrt\//);
  assert.match(html, /class="nav-primary"[^>]*href="#plan-tool"/, 'header Free plan jumps to the interactive tool');
  assert.match(html, /class="[^"]*\baction-dock\b/, 'sticky quick-action dock stays visible');
  assert.match(html, /class="app-tabs"/, 'mobile app tab bar is present');
  assert.match(html, /\/js\/plan-tool\.js/, 'plan tool script is loaded');
  const profileUrls = [...offer.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.ok(profileUrls.includes('/sample-plan.html'));
  assert.ok(profileUrls.includes('#plan-tool') || profileUrls.includes('/contact.html?intent=free-plan'));
  assert.ok(profileUrls.includes('/contact.html?intent=free-plan&amp;lang=es'));
  assert.ok(profileUrls.includes('https://x.com/DTRTLab'));
  assert.ok(profileUrls.includes('https://www.instagram.com/officiallydtrt/'));
  assert.match(html, /class="hero hero-bleed"/, 'company face uses full-bleed Studio Identity hero');
  assert.match(html, /data-journey-i18n="heroBrand"/, 'brand is hero-level, not only nav text');
  assert.match(html, /company-showcase-poster\.jpg/, 'hero uses real workshop still');
  assert.match(fs.readFileSync(path.join(root, 'css/growth-home.css'), 'utf8'), /--accent:#fafafa/, 'homepage accent is white, not orange heat');
  assert.ok(fs.existsSync(path.join(root, 'css/mobile-app.css')), 'mobile app shell stylesheet exists');
  const existingProfiles = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  for (const url of profileUrls.filter(url => url.startsWith('https:'))) {
    assert.ok(existingProfiles.includes(url), 'intake uses a previously public business identity');
  }
  assert.ok(fs.existsSync(path.join(root, 'sample-plan.html')), 'sample plan page exists for the free-plan preview link');
  assert.ok(html.indexOf('id="free-plan"') < html.indexOf('id="company-work"'));
});
