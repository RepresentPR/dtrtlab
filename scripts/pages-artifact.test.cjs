// The published site is the staged tree, not the git repo. docs/ and anything
// matching grokbot must never be in that tree. brand-kit.md stays: brand.html
// links to it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('node:child_process');
const { stage, loadExclude, parseList, ROOT } = require('./stage-site.cjs');

const BANNED = /grokbot|mail\.grokbot\.com/i;

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test.describe('pages artifact', () => {
let staged;
let rels;
test.before(() => {
  staged = fs.mkdtempSync(path.join(os.tmpdir(), 'dtrt-site-'));
  stage(staged);
  rels = walk(staged).map((f) => path.relative(staged, f).split(path.sep).join('/'));
  assert.ok(rels.includes('index.html'));
  assert.ok(rels.includes('brand-kit.md'));
  assert.ok(rels.includes('.well-known/security.txt'));
  assert.ok(rels.includes('CNAME'));
  assert.ok(rels.includes('live/index.html'));
});

test('deploy artifact contains no docs/ and no grokbot material', () => {
  assert.equal(fs.existsSync(path.join(staged, 'docs')), false);
  assert.ok(!rels.some((r) => r === 'docs' || r.startsWith('docs/')));
  const hits = [];
  for (const rel of rels) {
    if (BANNED.test(rel)) hits.push(rel);
    const buf = fs.readFileSync(path.join(staged, rel));
    if (BANNED.test(buf.toString('latin1'))) hits.push(rel + ' (content)');
  }
  assert.deepEqual(hits, []);
});

test('internal notes and non-site files stay out of the artifact', () => {
  for (const rel of ['AGENTS.md', 'README.md', '.env.example', '.gitignore', 'live/README.md', 'media/intake/README.md', '_config.yml', 'scripts/stage-site.cjs']) {
    assert.equal(rels.includes(rel), false, rel);
  }
  const trackedMd = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.md'));
  const leaked = trackedMd.filter((f) => f !== 'brand-kit.md' && rels.includes(f));
  assert.deepEqual(leaked, []);
});

test('served html does not link under /docs/', () => {
  const problems = [];
  for (const rel of rels.filter((r) => r.endsWith('.html') || r.endsWith('.js') || r.endsWith('.json'))) {
    const text = fs.readFileSync(path.join(staged, rel), 'utf8');
    if (/(?:href|src|action)\s*=\s*["'][^"']*docs\//i.test(text) || /docs\/[A-Za-z0-9_./-]+\.md/.test(text)) problems.push(rel);
  }
  assert.deepEqual(problems, []);
});

test('branch publish config excludes docs and still ships .well-known', () => {
  assert.equal(fs.existsSync(path.join(ROOT, '.nojekyll')), false, '.nojekyll would make Pages serve the whole repo');
  const yml = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8');
  const exclude = loadExclude();
  for (const item of ['docs', 'scripts', 'tools', '.github', '.cursor', 'AGENTS.md', 'README.md', '.env.example', 'live/README.md', 'media/intake/README.md']) {
    assert.ok(exclude.includes(item), item);
  }
  const include = parseList(yml, 'include');
  assert.ok(include.includes('.well-known'));
  assert.ok(include.includes('CNAME'));
});
});

test('pages jekyll build has no brand-kit.html and no assets/css/style.css', () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'dtrt-jekyll-'));
  const ruby = `
require 'jekyll'
require 'jekyll-optional-front-matter'
require 'jekyll-default-layout'
raw = Jekyll::Configuration.new.read_config_file('_config.yml')
pages_defaults = {
  'theme' => 'jekyll-theme-primer',
  'plugins' => ['jekyll-optional-front-matter', 'jekyll-default-layout']
}
config = Jekyll::Utils.deep_merge_hashes(pages_defaults, raw)
config['theme'] = raw['theme'] if raw.key?('theme')
full = Jekyll::Configuration.from(config)
full['theme'] = config['theme'] if raw.key?('theme')
full['source'] = Dir.pwd
full['destination'] = ${JSON.stringify(dest)}
full['quiet'] = true
full['sass'] = { 'cache' => false }
Jekyll::Site.new(full).process
`;
  execFileSync('ruby', ['-e', ruby], { cwd: ROOT, stdio: 'pipe' });
  assert.equal(fs.existsSync(path.join(dest, 'brand-kit.html')), false);
  assert.equal(fs.existsSync(path.join(dest, 'assets', 'css', 'style.css')), false);
});
