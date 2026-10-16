// Build the directory GitHub Pages should publish.
// The exclude list lives in _config.yml so the legacy branch build (Jekyll)
// and this stager (Actions / Netlify / Vercel) drop the same paths.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BANNED = /grokbot/i;

function parseList(yml, key) {
  const items = [];
  let on = false;
  for (const line of yml.split(/\r?\n/)) {
    if (/^[A-Za-z0-9_]+:\s*(?:#.*)?$/.test(line)) {
      on = line.startsWith(key + ':');
      continue;
    }
    if (!on) continue;
    if (/^\S/.test(line)) break;
    const m = line.match(/^\s+-\s+(\S+)/);
    if (m) items.push(m[1]);
  }
  return items;
}

function loadExclude(root = ROOT) {
  const yml = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
  return parseList(yml, 'exclude');
}

function isExcluded(rel, entries) {
  const norm = rel.split(path.sep).join('/');
  if (norm === 'docs' || norm.startsWith('docs/')) return true;
  if (norm.endsWith('/.gitkeep') || norm === '.gitkeep') return true;
  if (norm === '_config.yml' || norm === '_site' || norm.startsWith('_site/')) return true;
  if (norm === '.git' || norm.startsWith('.git/')) return true;
  for (const raw of entries) {
    const e = String(raw).replace(/\/$/, '');
    if (norm === e || norm.startsWith(e + '/')) return true;
  }
  return false;
}

function assertPublishable(rel, buf) {
  if (BANNED.test(rel) || buf.toString('latin1').toLowerCase().includes('grokbot')) {
    throw new Error('refusing to publish ' + rel);
  }
}

function stage(dest, root = ROOT) {
  const entries = loadExclude(root);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  copyDir(root, dest, '', entries);
  fs.writeFileSync(path.join(dest, '.nojekyll'), '');
  return dest;
}

function copyDir(src, destRoot, rel, entries) {
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === '.git') continue;
    const child = rel ? rel + '/' + ent.name : ent.name;
    if (isExcluded(child, entries)) continue;
    const from = path.join(src, ent.name);
    const to = path.join(destRoot, child);
    if (ent.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyDir(from, destRoot, child, entries);
      if (fs.readdirSync(to).length === 0) fs.rmdirSync(to);
    } else if (ent.isFile()) {
      const buf = fs.readFileSync(from);
      assertPublishable(child, buf);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.writeFileSync(to, buf);
    }
  }
}

module.exports = { stage, loadExclude, isExcluded, parseList, ROOT };

if (require.main === module) {
  const dest = path.resolve(process.argv[2] || path.join(ROOT, '_site'));
  stage(dest);
  process.stdout.write('staged ' + dest + '\n');
}
