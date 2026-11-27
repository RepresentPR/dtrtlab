// Cloudflare Pages deploy pipeline: bundle guard, smoke/prod probes, workflow wiring.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { check, bundle } = require('./cf-pages-bundle.cjs');
const probe = require('./site-probe.cjs');

const ROOT = path.resolve(__dirname, '..');
const wf = (name) => fs.readFileSync(path.join(ROOT, '.github', 'workflows', name), 'utf8');
const WORKER = `const GONE = 1; export default { async fetch(request, env) {
  const lower = new URL(request.url).pathname.toLowerCase();
  if (lower === '/private' || lower.startsWith('/private/')) return new Response('Not found', { status: 404 });
  if (lower === '/bid') return env.BIDS ? new Response('{}') : new Response('', { status: 503 });
  if (lower === '/auction') return new Response('auction');
  return env.ASSETS.fetch(request);
} };`;

function fixture({ worker = WORKER, gate = ['auction-ui.js', 'figtree.woff2'], site = ['index.html', '404.html'], extra = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-root-'));
  const siteDir = path.join(root, '_site');
  fs.mkdirSync(path.join(root, 'cloudflare', '__gate'), { recursive: true });
  fs.mkdirSync(siteDir);
  if (worker !== null) fs.writeFileSync(path.join(root, 'cloudflare', '_worker.js'), worker);
  for (const g of gate) fs.writeFileSync(path.join(root, 'cloudflare', '__gate', g), 'x');
  for (const s of site) fs.writeFileSync(path.join(siteDir, s), '<html></html>');
  for (const e of extra) fs.writeFileSync(path.join(root, e), 'x');
  return { root, siteDir };
}

test('bundle copies the worker and __gate files when everything is present', () => {
  const { root, siteDir } = fixture();
  assert.deepEqual(bundle(siteDir, root), []);
  assert.ok(fs.existsSync(path.join(siteDir, '_worker.js')));
  assert.ok(fs.existsSync(path.join(siteDir, '__gate', 'figtree.woff2')));
});

test('bundle refuses a deploy that would drop the auction or the /private 404', () => {
  const cases = [
    [{ worker: null }, /_worker\.js is missing/],
    [{ worker: WORKER.replace("'/auction'", "'/x'") }, /no \/auction route/],
    [{ worker: WORKER.replace("'/bid'", "'/y'") }, /no \/bid route/],
    [{ worker: WORKER.replace("'/private'", "'/z'") }, /\/private 404/],
    [{ gate: ['figtree.woff2'] }, /auction-ui\.js is missing/],
    [{ site: ['index.html'] }, /404\.html missing/],
    [{ site: ['index.html', '404.html', 'private.html'] }, /\/private stays 404/],
    [{ extra: ['wrangler.toml'] }, /replace the dashboard bindings/],
  ];
  for (const [opts, rx] of cases) {
    const { root, siteDir } = fixture(opts);
    const errs = bundle(siteDir, root);
    assert.ok(errs.some((e) => rx.test(e)), `${rx} not in ${JSON.stringify(errs)}`);
    assert.equal(fs.existsSync(path.join(siteDir, '_worker.js')), false, 'nothing copied on refusal');
  }
});

test('the go-live worker on the box passes the guard (skipped when not on the box)', (t) => {
  const golive = '/home/box/dtrt-work/golive/bundle/worker/_worker.js';
  if (!fs.existsSync(golive)) return t.skip('go-live worker not on this machine');
  const { root, siteDir } = fixture({ worker: fs.readFileSync(golive, 'utf8') });
  assert.deepEqual(check(siteDir, root), []);
});

test('repo has no wrangler config and does not publish cloudflare/', () => {
  for (const n of ['wrangler.toml', 'wrangler.json', 'wrangler.jsonc']) assert.equal(fs.existsSync(path.join(ROOT, n)), false, n);
  assert.match(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'), /^\s+- cloudflare$/m);
});

function server(routes) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const r = routes[req.url] || [404, 'nope'];
      res.writeHead(r[0], { 'Content-Type': 'text/html' });
      res.end(r[1]);
    }).listen(0, '127.0.0.1', () => resolve(s));
  });
}
const KEY = '<form method="post" action="/__key" autocomplete="off">';
const opts = { tries: 1, waitMs: 0 };

test('probes: public site passes; 401, key page and a reachable /private fail', async () => {
  const good = await server({ '/': [200, '<h1>hi</h1>'], '/private': [404, ''], '/private/': [404, ''], '/auction': [200, 'a'], '/bid': [405, ''], '/ask/': [200, 'ask'] });
  const locked = await server({ '/': [401, KEY], '/ask/': [200, KEY], '/private': [200, 'oops'], '/private/': [404, ''], '/auction': [200, 'a'], '/bid': [404, ''] });
  try {
    const g = `http://127.0.0.1:${good.address().port}`;
    const l = `http://127.0.0.1:${locked.address().port}`;
    assert.deepEqual(await probe.run([g], probe.SMOKE, opts), []);
    assert.deepEqual(await probe.run([g], probe.PROD, opts), []);
    const errs = await probe.run([l], [...probe.SMOKE, ...probe.PROD], opts);
    assert.ok(errs.some((e) => /\/ returned 401/.test(e)), errs.join('\n'));
    assert.ok(errs.some((e) => /\/ask\/ returned the key page/.test(e)), errs.join('\n'));
    assert.ok(errs.some((e) => /\/private returned 200/.test(e)), errs.join('\n'));
    assert.ok(errs.some((e) => /\/bid returned 404/.test(e)), errs.join('\n'));
  } finally { good.close(); locked.close(); }
});

test('prod probe targets dtrtlab.com and www', () => {
  assert.deepEqual(probe.PROD_BASES, ['https://dtrtlab.com', 'https://www.dtrtlab.com']);
});

test('deploy workflow only deploys after tests, site-gate and gates, behind a flag', () => {
  const y = wf('deploy-cloudflare.yml');
  assert.match(y, /needs: \[tests, site-gate, gates\]/);
  assert.match(y, /uses: \.\/\.github\/workflows\/tests\.yml/);
  assert.match(y, /uses: \.\/\.github\/workflows\/site-gate\.yml/);
  assert.match(y, /uses: \.\/\.github\/workflows\/gates\.yml/);
  assert.match(y, /vars\.CF_DEPLOY_ENABLED == 'true'/);
  assert.match(y, /cloudflare\/wrangler-action@[0-9a-f]{40} /);
  assert.match(y, /--project-name=dtrtlab --branch=main/);
  assert.match(y, /node scripts\/cf-pages-bundle\.cjs _site/);
  assert.match(y, /node scripts\/site-probe\.cjs smoke/);
  assert.match(y, /apiToken: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  assert.match(y, /accountId: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.doesNotMatch(y, /continue-on-error/);
  assert.ok(y.indexOf('cf-pages-bundle') < y.indexOf('wrangler-action'), 'guard runs before deploy');
});

test('called workflows are callable and keep proof-freshness unskippable', () => {
  for (const name of ['tests.yml', 'site-gate.yml', 'gates.yml']) assert.match(wf(name), /^  workflow_call:/m, name);
  for (const name of ['tests.yml', 'site-gate.yml']) {
    assert.doesNotMatch(wf(name), /proof-freshness:\n    if:/, name);
  }
  assert.doesNotMatch(wf('deploy-cloudflare.yml'), /include_freshness/);
});

test('prod-check is off until PROD_CHECK_ENABLED is true', () => {
  const y = wf('prod-check.yml');
  assert.match(y, /if: \$\{\{ vars\.PROD_CHECK_ENABLED == 'true'/);
  assert.match(y, /node scripts\/site-probe\.cjs prod/);
  assert.doesNotMatch(y, /continue-on-error/);
});
