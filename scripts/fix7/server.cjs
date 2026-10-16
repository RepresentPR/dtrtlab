// Tiny static server that serves the repo the way Netlify does for this site
// (netlify.toml: publish = ".", /donate -> /donate.html 302, 404.html for misses,
// "/dir/" -> dir/index.html, "/page" -> page.html). No network, no dependencies.
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./lib.cjs');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.txt': 'text/plain', '.xml': 'application/xml', '.md': 'text/markdown' };
const REDIRECTS = { '/donate': '/donate.html' };

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p.includes('\0')) return null;
  const abs = path.join(ROOT, path.normalize(p));
  if (!abs.startsWith(ROOT) || /(^|\/)\.git(\/|$)/.test(p)) return null;
  const tries = [abs];
  if (p.endsWith('/')) tries.unshift(path.join(abs, 'index.html'));
  else tries.push(path.join(abs, 'index.html'), abs + '.html');
  for (const t of tries) if (fs.existsSync(t) && fs.statSync(t).isFile()) return t;
  return null;
}

function start() {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (REDIRECTS[u.pathname]) { res.writeHead(302, { location: REDIRECTS[u.pathname] }); return res.end(); }
    let file = resolve(u.pathname);
    // "/dir" without slash -> redirect like Netlify so relative links resolve
    if (file && file.endsWith(path.sep + 'index.html') && !u.pathname.endsWith('/') && !u.pathname.endsWith('.html')) {
      res.writeHead(301, { location: u.pathname + '/' + u.search }); return res.end();
    }
    let status = 200;
    if (!file) { status = 404; file = path.join(ROOT, '404.html'); }
    res.writeHead(status, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}
module.exports = { start, resolve };
