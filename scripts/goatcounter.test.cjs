// GoatCounter (free, cookieless) loads once on every indexable public page,
// and never on the private owner dashboard (/live, /hq) or noindex pages.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SNIP = '<script data-goatcounter="https://dtrtlab.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>';
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || e.name === 'node_modules') return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
const pages = walk(ROOT).map(p => [path.relative(ROOT, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]);
const isPrivate = (rel, s) => /^(live|hq)\//.test(rel) || /<meta name="robots" content="[^"]*noindex/i.test(s);
test('every indexable public page loads GoatCounter exactly once', () => {
  for (const [rel, s] of pages) {
    if (isPrivate(rel, s) || !s.includes('</head>')) continue;
    assert.equal(s.split('data-goatcounter=').length - 1, 1, `${rel}: GoatCounter must appear once`);
    assert.ok(s.includes(SNIP), `${rel}: use the standard GoatCounter snippet`);
    const csp = (s.match(/Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
    const directive = (name) => ((csp.match(new RegExp('(?:^|;)\\s*' + name + '\\s+([^;]+)')) || [])[1] || '').trim();
    const allows = (policy, host) => policy.includes(host) && !policy.includes("'none'");
    const scriptPolicy = directive('script-src') || directive('default-src');
    if (scriptPolicy) assert.ok(allows(scriptPolicy, 'https://gc.zgo.at'), `${rel}: CSP script-src, or default-src when script-src is absent, must allow https://gc.zgo.at`);
    const connectPolicy = directive('connect-src') || directive('default-src');
    if (connectPolicy) assert.ok(allows(connectPolicy, 'https://dtrtlab.goatcounter.com'), `${rel}: CSP connect-src, or default-src when connect-src is absent, must allow https://dtrtlab.goatcounter.com`);
  }
});
test('private owner dashboard and noindex pages never load GoatCounter', () => {
  for (const [rel, s] of pages) {
    // Named in the presence test below. Every other noindex page still must not load it.
    if (rel === 'legal/preorder-terms.html') continue;
    if (isPrivate(rel, s)) assert.ok(!s.includes('goatcounter'), `${rel}: must not load GoatCounter`);
  }
});
function sitemapHtmlRels() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].flatMap((m) => {
    const urlPath = m[1].replace(/^https:\/\/dtrtlab\.com/i, '') || '/';
    let file = path.join(ROOT, urlPath.replace(/^\//, ''));
    if (urlPath.endsWith('/') || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file = path.join(file, 'index.html');
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    return rel.endsWith('.html') ? [rel] : [];
  });
}
function assertCspAllows(rel, s) {
  const csp = (s.match(/Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
  const directive = (name) => ((csp.match(new RegExp('(?:^|;)\\s*' + name + '\\s+([^;]+)')) || [])[1] || '').trim();
  const allows = (policy, host) => policy.includes(host) && !policy.includes("'none'");
  const scriptPolicy = directive('script-src') || directive('default-src');
  if (scriptPolicy) assert.ok(allows(scriptPolicy, 'https://gc.zgo.at'), `${rel}: CSP script-src, or default-src when script-src is absent, must allow https://gc.zgo.at`);
  const connectPolicy = directive('connect-src') || directive('default-src');
  if (connectPolicy) assert.ok(allows(connectPolicy, 'https://dtrtlab.goatcounter.com'), `${rel}: CSP connect-src, or default-src when connect-src is absent, must allow https://dtrtlab.goatcounter.com`);
}
test('sitemap HTML pages and preorder terms carry GoatCounter; 404 and /private do not', () => {
  const byRel = new Map(pages);
  for (const rel of sitemapHtmlRels()) {
    assert.equal(rel === 'private.html' || rel.startsWith('private/'), false, `${rel}: /private must not be in the sitemap`);
    const s = byRel.get(rel);
    assert.ok(s, `${rel}: sitemap HTML page is missing`);
    assert.equal(s.split(SNIP).length - 1, 1, `${rel}: sitemap HTML page must carry the GoatCounter tag once`);
    assertCspAllows(rel, s);
  }
  const preorder = byRel.get('legal/preorder-terms.html');
  assert.ok(preorder, 'legal/preorder-terms.html is missing');
  assert.equal(preorder.split(SNIP).length - 1, 1, 'legal/preorder-terms.html must carry the GoatCounter tag once');
  assertCspAllows('legal/preorder-terms.html', preorder);
  assert.equal(byRel.get('404.html').includes('goatcounter'), false, '404.html must not load GoatCounter');
  for (const [rel, s] of pages) {
    if (rel !== 'private.html' && !rel.startsWith('private/')) continue;
    assert.equal(s.includes('goatcounter'), false, `${rel}: /private must not load GoatCounter`);
  }
});
