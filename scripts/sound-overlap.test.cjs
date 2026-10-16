// Loads every HTML page at 390x844 and 1440x900 and fails if the Sound off
// button intersects any other link or button. Uses headless Chrome on this machine.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');
const { once } = require('events');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['.git', 'node_modules']);
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

function htmlFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function chromeBin() {
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const found = require('child_process').spawnSync('which', [name], { encoding: 'utf8' });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }
  return '';
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function staticServer(port) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('missing'); return;
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

function connect(url) {
  const rest = url.slice('ws://'.length);
  const slash = rest.indexOf('/');
  const hostport = rest.slice(0, slash);
  const [host, port] = hostport.split(':');
  const sock = net.connect(+port, host);
  const key = Buffer.from(require('crypto').randomBytes(16)).toString('base64');
  return new Promise((resolve, reject) => {
    sock.once('error', reject);
    sock.once('connect', () => {
      sock.write(`GET /${rest.slice(slash + 1)} HTTP/1.1\r\nHost: ${hostport}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
    });
    let buf = Buffer.alloc(0);
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.includes('\r\n\r\n')) {
        sock.off('data', onData);
        resolve({ sock, rest: buf.slice(buf.indexOf('\r\n\r\n') + 4) });
      }
    };
    sock.on('data', onData);
  });
}

function frame(data) {
  const payload = Buffer.from(JSON.stringify(data));
  const mask = require('crypto').randomBytes(4);
  const head = [0x81];
  if (payload.length < 126) head.push(0x80 | payload.length);
  else if (payload.length < 65536) head.push(0x80 | 126, payload.length >> 8, payload.length & 255);
  else throw new Error('frame too large');
  const masked = Buffer.from(payload.map((b, i) => b ^ mask[i % 4]));
  return Buffer.concat([Buffer.from(head), mask, masked]);
}

function Cdp(sock, leftover) {
  this.sock = sock;
  this.buf = leftover || Buffer.alloc(0);
  this.id = 0;
  this.pending = new Map();
  this.waiters = [];
  sock.on('data', (chunk) => { this.buf = Buffer.concat([this.buf, chunk]); this._drain(); });
  this._drain();
}
Cdp.prototype._drain = function () {
  while (this.buf.length >= 2) {
    const b0 = this.buf[0], b1 = this.buf[1];
    let len = b1 & 127, off = 2;
    if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
    else if (len === 127) return;
    const maskBit = b1 & 128;
    const maskLen = maskBit ? 4 : 0;
    if (this.buf.length < off + maskLen + len) return;
    let data = this.buf.slice(off + maskLen, off + maskLen + len);
    if (maskBit) { const mask = this.buf.slice(off, off + 4); data = Buffer.from(data.map((b, i) => b ^ mask[i % 4])); }
    this.buf = this.buf.slice(off + maskLen + len);
    const opcode = b0 & 15;
    if (opcode === 8) return;
    if (opcode === 9) { this.sock.write(frame({})); continue; }
    if (opcode !== 1) continue;
    const msg = JSON.parse(data.toString());
    if (msg.id && this.pending.has(msg.id)) {
      const p = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else p.resolve(msg.result || {});
    }
    for (const w of this.waiters) w(msg);
  }
};
Cdp.prototype.send = function (method, params) {
  const id = ++this.id;
  this.sock.write(frame({ id, method, params }));
  return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
};

const MEASURE = `(() => {
  const sound = document.querySelector('.sound-toggle');
  const url = location.pathname;
  if (!sound) return { sound: false, ready: document.readyState !== 'loading', url };
  const bar = sound.closest('.experience-controls');
  const cs = getComputedStyle(bar);
  const r = sound.getBoundingClientRect();
  const sb = { t: r.top, l: r.left, b: r.bottom, r: r.right };
  const hits = [];
  for (const el of document.querySelectorAll('a, button, [role="button"]')) {
    if (el === sound || bar.contains(el)) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) continue;
    if (sb.l < b.right && sb.r > b.left && sb.t < b.bottom && sb.b > b.top) {
      hits.push((el.innerText || el.getAttribute('aria-label') || el.tagName).trim().replace(/\\s+/g, ' ').slice(0, 40));
    }
  }
  return { sound: true, top: cs.top, hits, url };
})()`;

test('Sound off does not cover a link or button at 390x844 or 1440x900', { timeout: 240000 }, async () => {
  const bin = chromeBin();
  assert.ok(bin, 'headless Chrome is required for the Sound off overlap check');
  const pages = htmlFiles(ROOT).map((file) => '/' + path.relative(ROOT, file).split(path.sep).join('/'));
  assert.ok(pages.length > 20, 'expected the public HTML pages');
  const port = await freePort();
  const debug = await freePort();
  const server = await staticServer(port);
  const profile = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sound-overlap-'));
  const chrome = spawn(bin, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*',
    `--user-data-dir=${profile}`, `--remote-debugging-port=${debug}`, '--disable-extensions', 'about:blank'
  ], { stdio: 'ignore' });
  const hits = [];
  let checked = 0;
  let withSound = 0;
  try {
    let list;
    for (let i = 0; i < 40; i++) {
      try {
        list = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${debug}/json`, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => resolve(JSON.parse(body)));
          }).on('error', reject);
        });
        if (list.some((t) => t.type === 'page')) break;
      } catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    const page = list.find((t) => t.type === 'page');
    assert.ok(page, 'Chrome did not open a page target');
    const { sock, rest } = await connect(page.webSocketDebuggerUrl);
    const cdp = new Cdp(sock, rest);
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    for (const vp of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.width < 500
      });
      for (const href of pages) {
        await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}${href}` });
        let measured = null;
        let lastUrl = '';
        let stable = 0;
        for (let i = 0; i < 50; i++) {
          await new Promise((r) => setTimeout(r, 100));
          const ev = await cdp.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
          const next = ev.result && ev.result.value;
          if (!next || !next.url) continue;
          if (next.url === lastUrl) stable++;
          else { lastUrl = next.url; stable = 0; continue; }
          if (stable < 2) continue;
          if (!next.ready && !(next.sound && next.top === '0px')) continue;
          measured = next;
          if (!next.sound || next.top === '0px') break;
        }
        checked++;
        if (!measured) {
          hits.push(`${vp.width}x${vp.height} ${href}: page did not finish loading`);
          continue;
        }
        if (measured.sound) withSound++;
        if (measured.sound && measured.top !== '0px') {
          hits.push(`${vp.width}x${vp.height} ${href}: sound bar top is ${measured.top}`);
        } else if (measured.sound && measured.hits && measured.hits.length) {
          hits.push(`${vp.width}x${vp.height} ${href}: ${measured.hits.join(' | ')}`);
        }
      }
    }
    sock.end();
  } finally {
    chrome.kill('SIGKILL');
    await once(chrome, 'exit').catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(profile, { recursive: true, force: true });
  }
  const expectSound = pages.filter((href) => fs.readFileSync(path.join(ROOT, href.slice(1)), 'utf8').includes('experience.js')).length * VIEWPORTS.length;
  console.log(`overlap check: ${pages.length} pages x ${VIEWPORTS.length} viewports, ${withSound} with Sound off, ${hits.length} overlaps`);
  assert.ok(withSound >= expectSound, `Sound off rendered ${withSound} times, expected at least ${expectSound}`);
  assert.equal(checked, pages.length * VIEWPORTS.length, 'every page was measured at both sizes');
  assert.deepEqual(hits, [], 'Sound off overlaps:\n' + hits.join('\n'));
});
