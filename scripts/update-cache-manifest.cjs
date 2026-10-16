// Rewrite scripts/cache-manifest.json from the served JS and CSS on disk.
// Usage: node scripts/update-cache-manifest.cjs
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { isExcluded, loadExclude } = require('./stage-site.cjs');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(__dirname, 'cache-manifest.json');

function walk(root, dir, exclude, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (isExcluded(rel, exclude)) continue;
    if (entry.isDirectory()) walk(root, full, exclude, out);
    else out.push(rel);
  }
  return out;
}

function sha256(root, rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  return crypto.createHash('sha256').update(buf).digest('hex');
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

function stringConstants(text) {
  const map = new Map();
  const re = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*["']([^"']*)["']/g;
  for (const match of String(text).matchAll(re)) map.set(match[1], match[2]);
  return map;
}

function referencesIn(rel, text) {
  const source = String(text);
  const constants = stringConstants(source);
  const found = [];
  const re = /["']([^"']+\.(?:mjs|js|css)(?:\?[^"']*)?)["']/gi;
  for (const match of source.matchAll(re)) {
    let raw = match[1];
    const after = source.slice(match.index + match[0].length);
    const plus = after.match(/^\s*\+\s*([A-Za-z_$][\w$]*)/);
    if (plus && constants.has(plus[1])) raw += constants.get(plus[1]);
    const parts = splitUrl(raw);
    const fromRoot = /\+\s*$/.test(source.slice(Math.max(0, match.index - 12), match.index));
    const asset = normalize(rel, fromRoot ? '/' + parts.pathname : parts.pathname);
    if (!asset || !/\.(?:mjs|js|css)$/i.test(asset)) continue;
    found.push({ from: rel, asset, key: parts.key });
  }
  return found;
}

function isAsset(rel) {
  return /\.(?:mjs|js|css)$/i.test(rel);
}

function isReferenceSource(rel) {
  return isAsset(rel) || /\.html?$/i.test(rel);
}

function keyList(key) {
  return Array.isArray(key) ? key.slice() : [key];
}

function sameKeys(a, b) {
  const left = keyList(a).map((item) => String(item)).sort();
  const right = keyList(b).map((item) => String(item)).sort();
  return left.length === right.length && left.every((item, i) => item === right[i]);
}

function storedKey(keys) {
  if (keys.length === 1) return keys[0];
  return keys.slice().sort((a, b) => String(a).localeCompare(String(b)));
}

function collect(root) {
  const base = root || ROOT;
  const exclude = loadExclude(base);
  const served = walk(base, base, exclude);
  const assets = served.filter(isAsset).sort();
  const byAsset = new Map(assets.map((rel) => [rel, []]));
  for (const rel of served.filter(isReferenceSource)) {
    const text = fs.readFileSync(path.join(base, rel), 'utf8');
    for (const ref of referencesIn(rel, text)) {
      if (byAsset.has(ref.asset)) byAsset.get(ref.asset).push(ref);
    }
  }
  const manifest = {};
  const refs = {};
  for (const rel of assets) {
    const found = byAsset.get(rel);
    const keys = [];
    for (const ref of found) {
      if (!keys.some((item) => item === ref.key)) keys.push(ref.key);
    }
    refs[rel] = found;
    manifest[rel] = {
      hash: sha256(base, rel),
      key: keys.length ? storedKey(keys) : null
    };
  }
  return { manifest, refs };
}

function staleKeyProblems(previous, current, refs) {
  const problems = [];
  for (const rel of Object.keys(current)) {
    if (!Object.prototype.hasOwnProperty.call(previous, rel)) continue;
    if (previous[rel].hash === current[rel].hash) continue;
    const oldKeys = keyList(previous[rel].key);
    for (const ref of refs[rel] || []) {
      if (oldKeys.includes(ref.key)) {
        problems.push(ref.from + ' still loads ' + rel + ' with ?v=' + ref.key);
      }
    }
  }
  return problems;
}

function writeManifest() {
  const { manifest, refs } = collect(ROOT);
  const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const problems = staleKeyProblems(previous, manifest, refs);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log('wrote ' + path.relative(ROOT, MANIFEST) + ' (' + Object.keys(manifest).length + ' files)');
}

module.exports = { MANIFEST, collect, keyList, sameKeys };

if (require.main === module) writeManifest();
