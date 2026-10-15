// GitHub Pages cannot send security headers, so each public page carries a meta CSP.
// These checks keep that floor in place and keep the /live script hashes in sync.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['docs', 'scripts', 'tools', 'node_modules', 'brand-assets']);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.name.startsWith('.') || SKIP.has(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);
const csp = (s) => (s.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i) || [])[1];
function inlineHashes(s) {
  return [...s.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((m) => !/application\/(ld\+)?json/.test(m[1]))
    .map((m) => `'sha256-${crypto.createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
}
test('every public page sets a meta CSP that blocks plugins and <base> hijacking', () => {
  for (const f of walk(ROOT)) {
    const s = fs.readFileSync(f, 'utf8');
    const p = csp(s);
    const rel = path.relative(ROOT, f);
    assert.ok(p, `${rel}: missing meta CSP`);
    assert.ok(/object-src 'none'|default-src 'none'/.test(p), `${rel}: CSP must block object-src`);
    assert.ok(/base-uri '(self|none)'/.test(p), `${rel}: CSP must restrict base-uri`);
    assert.ok(s.indexOf('Content-Security-Policy') < s.search(/<script|<link rel="stylesheet"/i) || s.search(/<script|<link rel="stylesheet"/i) < 0, `${rel}: CSP meta must come before scripts/styles`);
  }
});
test('/live owner dashboard runs only first-party scripts, with inline script hashes in sync', () => {
  const s = fs.readFileSync(path.join(ROOT, 'live/index.html'), 'utf8');
  const p = csp(s);
  const scriptSrc = (p.match(/script-src ([^;]+)/) || [])[1] || '';
  assert.ok(!/unsafe-inline|unsafe-eval|https?:|\*/.test(scriptSrc), 'script-src on /live must stay first-party only');
  assert.match(p, /connect-src 'self'/);
  assert.match(p, /form-action 'none'/);
  for (const h of inlineHashes(s)) assert.ok(scriptSrc.includes(h), `inline script hash ${h} missing from /live CSP`);
  assert.match(s, /<meta name="referrer" content="no-referrer">/);
  assert.match(s, /<meta name="robots" content="noindex,nofollow">/);
});
test('/proof inline script hashes stay in sync with its CSP', () => {
  const s = fs.readFileSync(path.join(ROOT, 'proof/index.html'), 'utf8');
  const scriptSrc = (csp(s).match(/script-src ([^;]+)/) || [])[1] || '';
  assert.ok(!/unsafe-inline|unsafe-eval/.test(scriptSrc));
  for (const h of inlineHashes(s)) assert.ok(scriptSrc.includes(h), `inline script hash ${h} missing from /proof CSP`);
});
test('workflows pin third-party actions to full commit SHAs and declare permissions', () => {
  const dir = path.join(ROOT, '.github/workflows');
  for (const f of fs.readdirSync(dir).filter((x) => /\.ya?ml$/.test(x))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.match(s, /^permissions:/m, `${f}: top-level permissions missing`);
    assert.ok(!/pull_request_target/.test(s), `${f}: pull_request_target is not allowed`);
    for (const m of s.matchAll(/uses:\s*([^\s#]+)/g)) {
      if (m[1].startsWith('./')) continue;
      assert.match(m[1], /@[0-9a-f]{40}$/, `${f}: ${m[1]} must be pinned to a commit SHA`);
    }
  }
});
test('/live never saves the password unless the owner ticks "remember"', () => {
  const html = fs.readFileSync(path.join(ROOT, 'live/index.html'), 'utf8');
  const box = (html.match(/<input id="rem"[^>]*>/) || [''])[0];
  assert.ok(box, 'remember checkbox present');
  assert.ok(!/\schecked/.test(box), 'remember must be off by default');
  const js = fs.readFileSync(path.join(ROOT, 'live/dashboard.js'), 'utf8');
  for (const m of js.matchAll(/localStorage\.setItem\(/g)) {
    assert.match(js.slice(Math.max(0, m.index - 12), m.index), /if\(save\)\s*$/, 'localStorage.setItem must be guarded by the remember choice');
  }
  assert.ok(!/sessionStorage\.setItem\([^)]*pw/.test(js), 'raw password must not go to sessionStorage');
});
