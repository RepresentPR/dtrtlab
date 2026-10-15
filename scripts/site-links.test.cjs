// Offline link check: every same-site href/src/srcset/action in public HTML must resolve
// to a file in this repo, and every same-site #anchor must exist on its target page.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['docs', 'scripts', 'tools', 'node_modules', 'brand-assets']);
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}
const pages = walk(ROOT);
const idCache = new Map();
function ids(file) {
  if (!idCache.has(file)) {
    const s = fs.readFileSync(file, 'utf8');
    const set = new Set();
    for (const m of s.matchAll(/\s(?:id|name)\s*=\s*["']([^"']+)["']/g)) set.add(m[1]);
    idCache.set(file, set);
  }
  return idCache.get(file);
}
function resolveTarget(fromFile, urlPath) {
  let p = urlPath.startsWith('/') ? path.join(ROOT, urlPath) : path.join(path.dirname(fromFile), urlPath);
  p = decodeURIComponent(p);
  if (urlPath === '' ) return fromFile;
  if (p.endsWith(path.sep) || urlPath.endsWith('/')) p = path.join(p, 'index.html');
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  return p;
}
function refs(s) {
  const out = [];
  const strip = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => m.replace(/>[\s\S]*<\/script>/i, '></script>'))
    .replace(/<!--[\s\S]*?-->/g, '');
  for (const m of strip.matchAll(/<(a|link|script|img|source|video|audio|iframe|form)\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = (tag.match(/\srel\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    if (/preconnect|dns-prefetch/.test(rel)) continue;
    for (const a of tag.matchAll(/\s(href|src|action|poster)\s*=\s*["']([^"']*)["']/gi)) out.push(a[2]);
    const ss = tag.match(/\ssrcset\s*=\s*["']([^"']*)["']/i);
    if (ss) for (const part of ss[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u) out.push(u); }
  }
  return out;
}
test('every same-site link, asset and anchor in public HTML resolves', () => {
  const problems = [];
  for (const file of pages) {
    const s = fs.readFileSync(file, 'utf8');
    for (let raw of refs(s)) {
      raw = raw.trim();
      if (!raw || /^(mailto:|tel:|sms:|javascript:|data:|blob:|\{|\$\{)/i.test(raw) || raw.includes('${')) continue;
      let u;
      if (/^https?:\/\/(www\.)?dtrtlab\.com(\/|$)/i.test(raw)) u = raw.replace(/^https?:\/\/(www\.)?dtrtlab\.com/i, '') || '/';
      else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(raw)) continue; // external
      else u = raw;
      const [pathPart, frag] = u.split('#');
      const clean = pathPart.split('?')[0];
      const target = resolveTarget(file, clean);
      const rel = path.relative(ROOT, file);
      if (!fs.existsSync(target)) { problems.push(`${rel}: missing ${raw}`); continue; }
      if (frag && target.endsWith('.html') && !ids(target).has(decodeURIComponent(frag)))
        problems.push(`${rel}: anchor #${frag} not found in ${path.relative(ROOT, target)}`);
    }
  }
  assert.deepStrictEqual(problems, []);
});
test('sitemap.xml lists only same-site URLs that exist', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0);
  for (const loc of locs) {
    assert.match(loc, /^https:\/\/dtrtlab\.com\//);
    const p = resolveTarget(path.join(ROOT, 'index.html'), loc.replace('https://dtrtlab.com', ''));
    assert.ok(fs.existsSync(p), `sitemap entry has no file: ${loc}`);
    assert.ok(!/^https:\/\/dtrtlab\.com\/(live|hq)\//.test(loc), `private page in sitemap: ${loc}`);
  }
});
test('manifest icons exist', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.webmanifest'), 'utf8'));
  for (const i of m.icons || []) assert.ok(fs.existsSync(path.join(ROOT, i.src.split('?')[0])), `manifest icon missing: ${i.src}`);
});
