// GoatCounter (free, cookieless) loads once on every indexable public page
// and on every sitemap HTML page. The preorder-terms placeholder stays noindex
// and still carries the tag because it is listed in the sitemap.
// It never loads on the private owner dashboard (/live, /hq), other noindex pages,
// 404.html, or /private.
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
const isPrivatePath = (rel) => rel === 'private.html' || rel.startsWith('private/');
function sitemapHtmlRels() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  return locs.flatMap((loc) => {
    const urlPath = loc.replace(/^https:\/\/dtrtlab\.com/i, '') || '/';
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
test('every indexable public page loads GoatCounter exactly once', () => {
  for (const [rel, s] of pages) {
    if (isPrivate(rel, s) || isPrivatePath(rel) || rel === '404.html' || !s.includes('</head>')) continue;
    assert.equal(s.split('data-goatcounter=').length - 1, 1, `${rel}: GoatCounter must appear once`);
    assert.ok(s.includes(SNIP), `${rel}: use the standard GoatCounter snippet`);
    assertCspAllows(rel, s);
  }
});
test('every sitemap HTML page carries GoatCounter; 404 and /private do not', () => {
  const listed = sitemapHtmlRels();
  assert.ok(listed.includes('legal/preorder-terms.html'));
  for (const rel of listed) {
    assert.equal(isPrivatePath(rel), false, `${rel}: /private must not be in the sitemap`);
    const s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.equal(s.split(SNIP).length - 1, 1, `${rel}: sitemap HTML page must carry the GoatCounter tag once`);
    assertCspAllows(rel, s);
  }
  const notFound = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  assert.equal(notFound.includes('goatcounter'), false, '404.html must not load GoatCounter');
  for (const [rel, s] of pages) {
    if (!isPrivatePath(rel)) continue;
    assert.equal(s.includes('goatcounter'), false, `${rel}: /private must not load GoatCounter`);
  }
});
test('private owner dashboard and noindex pages never load GoatCounter', () => {
  const listed = new Set(sitemapHtmlRels());
  for (const [rel, s] of pages) {
    if (!isPrivate(rel, s) || listed.has(rel)) continue;
    assert.ok(!s.includes('goatcounter'), `${rel}: must not load GoatCounter`);
  }
});
