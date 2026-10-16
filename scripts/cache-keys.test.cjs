// A served JS or CSS file that differs from origin/main (or the merge base)
// must be loaded with a ?v= key that is not the key it had on main.
// Pages and sw.js are the references. If git history is missing, skip.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { isExcluded, loadExclude } = require('./stage-site.cjs');

const root = path.join(__dirname, '..');
const exclude = loadExclude();

function git(args) {
  const result = spawnSync('git', ['--no-pager', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_PAGER: 'cat', PAGER: 'cat' }
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

function findBase() {
  if (git(['rev-parse', '--is-inside-work-tree']) == null) return null;
  if (git(['rev-parse', '--verify', '--quiet', 'origin/main']) != null) {
    const merged = git(['merge-base', 'HEAD', 'origin/main']);
    return (merged && merged.trim()) || 'origin/main';
  }
  if (git(['rev-parse', '--verify', '--quiet', 'main']) != null) {
    const merged = git(['merge-base', 'HEAD', 'main']);
    return (merged && merged.trim()) || 'main';
  }
  return null;
}

function walkRefs(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (isExcluded(rel, exclude)) continue;
    if (entry.isDirectory()) walkRefs(full, out);
    else if (entry.name === 'sw.js' || /\.html?$/i.test(entry.name)) out.push(rel);
  }
  return out;
}

function splitUrl(raw) {
  const noHash = String(raw).split('#')[0];
  const q = noHash.indexOf('?');
  const pathname = q === -1 ? noHash : noHash.slice(0, q);
  const query = q === -1 ? '' : noHash.slice(q + 1);
  let key = null;
  for (const part of query.split('&')) {
    if (!part.startsWith('v=')) continue;
    try { key = decodeURIComponent(part.slice(2)); }
    catch (err) { key = part.slice(2); }
  }
  return { pathname, key };
}

function normalize(fromRel, pathname) {
  let asset = String(pathname).trim();
  if (!asset || /^[a-z][a-z0-9+.-]*:/i.test(asset) || asset.startsWith('//')) return null;
  if (asset.startsWith('/')) asset = asset.slice(1);
  else {
    const dir = path.posix.dirname(fromRel);
    asset = path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, asset));
  }
  if (!asset || asset === '.' || asset.startsWith('../')) return null;
  return asset;
}

function references(rel, text) {
  const found = [];
  const re = /["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi;
  for (const match of String(text).matchAll(re)) {
    const parts = splitUrl(match[1]);
    const asset = normalize(rel, parts.pathname);
    if (!asset || !/\.(js|css)$/i.test(asset)) continue;
    found.push({ asset, key: parts.key });
  }
  return found;
}

test('changed served JS and CSS use a cache key different from main', (t) => {
  const base = findBase();
  if (!base) {
    t.skip('git history is not available');
    return;
  }
  const diff = git(['diff', '--name-only', '--diff-filter=ACMR', base]);
  if (diff == null) {
    t.skip('git history is not available');
    return;
  }
  const changed = new Set(
    diff.split('\n').map((line) => line.trim()).filter((rel) => {
      if (!/\.(js|css)$/i.test(rel)) return false;
      return !isExcluded(rel, exclude);
    })
  );
  const problems = [];
  for (const rel of walkRefs(root)) {
    const current = fs.readFileSync(path.join(root, rel), 'utf8');
    const hits = references(rel, current).filter((ref) => changed.has(ref.asset));
    if (!hits.length) continue;
    const priorText = git(['show', base + ':' + rel]);
    const prior = priorText == null ? [] : references(rel, priorText);
    for (const ref of hits) {
      const oldKeys = prior.filter((item) => item.asset === ref.asset).map((item) => item.key);
      if (ref.key == null) {
        problems.push(rel + ' references ' + ref.asset + ' with no ?v= key');
      } else if (oldKeys.includes(ref.key)) {
        problems.push(rel + ' references ' + ref.asset + ' with ?v=' + ref.key + ', same as main');
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});
