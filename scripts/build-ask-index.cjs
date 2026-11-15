/* Build the public-page passage index used by /ask/.
   Skips drafts, noindex pages, /private, /live, and /hq.
   Usage: node scripts/build-ask-index.cjs
*/
const fs = require('node:fs');
const path = require('node:path');
const { isFiction } = require('./fix7/lib.cjs');

const ROOT = path.join(__dirname, '..');
const SKIP_DIR = new Set(['live', 'hq', 'scripts', 'docs', 'node_modules', '.git']);
const GAME_STATUS = new Set([
  'media.html',
  'news.html',
  'training.html',
  'catalog.html',
  'radio.html',
  'preorder.html'
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIR.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function decode(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function visible(html) {
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const text = decode(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return { title, text };
}

function publicUrl(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

function passagesFor(rel, title, text) {
  const chunks = [];
  let rest = text;
  while (rest.length > 80 && chunks.length < 6) {
    let end = Math.min(rest.length, 520);
    if (end < rest.length) {
      const breakAt = rest.lastIndexOf('. ', end);
      if (breakAt > 160) end = breakAt + 1;
    }
    const piece = rest.slice(0, end).trim();
    rest = rest.slice(end).trim();
    if (piece.length >= 80) {
      chunks.push({
        id: rel + '#' + chunks.length,
        url: publicUrl(rel),
        title: title || publicUrl(rel),
        text: piece
      });
    }
  }
  return chunks;
}

function build() {
  const passages = [];
  for (const file of walk(ROOT).sort()) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel.includes('private') || /live\/(extras|upnext)\.html$/.test(rel) || isFiction(rel) || GAME_STATUS.has(rel)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)) continue;
    if (/\bdata-draft=/.test(html)) continue;
    const page = visible(html);
    page.text = page.text
      .replace(/\s*\(Atlantic time\)/g, '')
      .replace(/Atlantic timestamps/g, 'timestamps');
    page.title = page.title.replace(/Atlantic timestamps/g, 'timestamps');
    passages.push(...passagesFor(rel, page.title, page.text));
  }
  return {
    generated: '2026-11-15',
    provider: 'local-bm25',
    note: 'Public HTML only. Drafts, noindex pages, /private, /live, /hq, and AFTERLIGHT game pages are omitted.',
    passages
  };
}

function write(corpus) {
  const json = JSON.stringify(corpus).replace(/\//g, '\\u002f').replace(/</g, '\\u003c');
  const js = 'window.DTRT_ASK_CORPUS = ' + json + ';\n';
  fs.mkdirSync(path.join(ROOT, 'ask'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'ask', 'passages.js'), js);
  fs.writeFileSync(path.join(ROOT, 'ask', 'passages.json'), JSON.stringify(corpus, null, 2) + '\n');
  return corpus.passages.length;
}

if (require.main === module) {
  const count = write(build());
  process.stdout.write('ask passages: ' + count + '\n');
}

module.exports = { build, write, publicUrl, visible };
