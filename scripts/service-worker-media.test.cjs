const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const origin = 'https://dtrtlab.com';

function requestFor(url, options = {}) {
  const { destination = '', mode = 'cors', ...init } = options;
  const request = new Request(new URL(url, origin), init);
  Object.defineProperties(request, {
    destination: { value: destination },
    mode: { value: mode }
  });
  return request;
}

function basicResponse(body) {
  const response = new Response(body);
  Object.defineProperty(response, 'type', { value: 'basic' });
  return response;
}

// Run the actual worker; only browser storage and network boundaries are replaced.
function worker({ cached = new Map(), offline = false } = {}) {
  const handlers = {};
  const calls = { cache: [], network: [], precache: [] };
  const key = request => typeof request === 'string' ? new URL(request, origin).href : request.url;
  const cache = {
    async match(request) {
      calls.cache.push(['match', key(request)]);
      return cached.get(key(request))?.clone();
    },
    async put(request, response) {
      calls.cache.push(['put', key(request)]);
      cached.set(key(request), response);
    },
    async addAll(urls) { calls.precache.push(...urls); }
  };
  const context = vm.createContext({
    URL,
    self: {
      location: { origin },
      addEventListener(type, handler) { handlers[type] = handler; },
      async skipWaiting() {},
      clients: { async claim() {} }
    },
    caches: {
      async open(name) { calls.cache.push(['open', name]); return cache; },
      match: cache.match
    },
    async fetch(request) {
      calls.network.push(request);
      if (offline) throw new Error('offline');
      return basicResponse('network: ' + new URL(request.url).pathname);
    }
  });
  vm.runInContext(source, context, { filename: 'sw.js' });
  return {
    calls,
    cached,
    async dispatch(request) {
      let responsePromise;
      handlers.fetch({ request, respondWith(value) { responsePromise = value; } });
      const intercepted = responsePromise !== undefined;
      const response = await responsePromise;
      await new Promise(setImmediate);
      return { intercepted, response };
    },
    async install() {
      let work;
      handlers.install({ waitUntil(value) { work = value; } });
      await work;
    }
  };
}

// A media request must fall through to the browser even if a full response is cached.
const mediaRequests = [
  ['extensionless video', '/stream/123', { destination: 'video' }],
  ['extensionless audio', '/stream/456', { destination: 'audio' }],
  ['byte range with blank destination', '/download/789', { headers: { Range: 'bytes=128-' } }],
  ['range on a navigation', '/download/', { mode: 'navigate', headers: { range: 'bytes=0-10' } }],
  ['direct MP4 download', '/media/build.mp4?download=1', {}],
  ['case-insensitive WebM download', '/media/build.WEBM?v=2', {}],
  ['MP4 navigation', '/media/build.mp4', { mode: 'navigate', destination: 'document' }]
];
for (const extension of ['ogv', 'mov', 'm4v', 'avi', 'mpeg', 'mpg', '3gp', '3g2', 'mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac']) {
  mediaRequests.push([extension + ' direct download', '/media/example.' + extension, {}]);
}
for (const [name, url, options] of mediaRequests) {
  test('worker bypasses ' + name, async () => {
    const request = requestFor(url, options);
    const instance = worker({ cached: new Map([[request.url, new Response('old full media')]]) });
    const result = await instance.dispatch(request);
    assert.equal(result.intercepted, false, 'browser must own media and range handling');
    assert.deepEqual(instance.calls.cache, [], 'do not read or write the worker cache');
    assert.deepEqual(instance.calls.network, [], 'do not fetch a second copy through the worker');
  });
}

test('HTML remains network-first and updates its cached copy', async () => {
  const request = requestFor('/index.html', { destination: 'document' });
  const instance = worker({ cached: new Map([[request.url, new Response('old document')]]) });
  const result = await instance.dispatch(request);
  assert.equal(result.intercepted, true);
  assert.equal(await result.response.text(), 'network: /index.html');
  assert.equal(await instance.cached.get(request.url).text(), 'network: /index.html');
});

test('offline navigation retains the cached document and homepage fallback', async () => {
  const instance = worker({ offline: true, cached: new Map([
    [origin + '/index.html', new Response('cached homepage')],
    [origin + '/about.html', new Response('cached about')]
  ]) });
  const about = await instance.dispatch(requestFor('/about.html', { mode: 'navigate' }));
  assert.equal(await about.response.text(), 'cached about');
  const missing = await instance.dispatch(requestFor('/missing/', { mode: 'navigate' }));
  assert.equal(await missing.response.text(), 'cached homepage');
});

for (const url of ['/css/lab.css?v=1', '/assets/clips/poster.webp', '/js/demo.mp4.js', '/media.html?file=build.mp4']) {
  test('ordinary resource still uses its existing cache strategy: ' + url, async () => {
    const request = requestFor(url);
    const instance = worker({ cached: new Map([[request.url, new Response('cached resource')]]) });
    const result = await instance.dispatch(request);
    assert.equal(result.intercepted, true);
    const expected = url.startsWith('/media.html') ? 'network: /media.html' : 'cached resource';
    assert.equal(await result.response.text(), expected);
    assert.equal(instance.calls.network.length, 1);
    assert.equal(await instance.cached.get(request.url).text(), 'network: ' + new URL(request.url).pathname);
  });
}

test('install precaches the shell and posters without audio or video files', async () => {
  const instance = worker();
  await instance.install();
  assert.ok(instance.calls.precache.includes('/index.html'));
  assert.ok(instance.calls.precache.some(url => new URL(url, origin).pathname.endsWith('.css')));
  assert.ok(instance.calls.precache.some(url => new URL(url, origin).pathname.endsWith('.webp')));
  const media = instance.calls.precache.filter(url => /\.(mp4|webm|ogv|mov|m4v|avi|mpeg|mpg|3gp|3g2|mp3|m4a|aac|wav|ogg|oga|opus|flac)$/i.test(new URL(url, origin).pathname));
  assert.deepEqual(media, []);
});

test('non-GET, third-party and content JSON requests still bypass the worker', async () => {
  const instance = worker();
  for (const request of [
    requestFor('/contact', { method: 'POST' }),
    requestFor('https://example.com/script.js'),
    requestFor('/content/campaign.json')
  ]) {
    assert.equal((await instance.dispatch(request)).intercepted, false);
  }
  assert.deepEqual(instance.calls.cache, []);
  assert.deepEqual(instance.calls.network, []);
});
