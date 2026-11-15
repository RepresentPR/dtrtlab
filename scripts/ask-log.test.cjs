const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');
const log = require('../ask/log.js');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const LABEL = 'Let Ian keep my questions to improve this page. No name or email needed.';
const FORM = 'https://docs.google.com/forms/d/e/test-form/formResponse';

function memory() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    data
  };
}

function config(endpoint, fields) {
  return { ask_log: { endpoint: endpoint, fields: fields || {} } };
}

const FIELDS = { question: '11', urls: '22', count: '33', page: '44', timestamp: '55', session: '66' };

test('the checkbox is hidden and unchecked on the home page and /ask/', () => {
  for (const page of ['index.html', 'ask/index.html']) {
    const html = read(page);
    const box = html.match(/<p class="ask-note" id="ask-keep-wrap"[\s\S]*?<\/p>/);
    assert.ok(box, page);
    assert.match(box[0], /\shidden[\s>]/);
    assert.match(box[0], /<input id="ask-keep" type="checkbox">/);
    assert.doesNotMatch(box[0], /\schecked[\s=]/);
    assert.ok(box[0].includes(LABEL), page);
    assert.match(html, /ask\/log\.js\?v=/);
  }
});

test('the log address ships empty and the sender has no keys', () => {
  const site = JSON.parse(read('content/site.json'));
  assert.equal(site.ask_log.endpoint, '');
  for (const name of ['question', 'urls', 'count', 'page', 'timestamp', 'session']) {
    assert.equal(site.ask_log.fields[name], '');
  }
  const source = read('ask/log.js') + read('ask/ui.js') + read('ask/ask.js') + read('content/site.json');
  assert.doesNotMatch(source, /api[_-]?key|AIza|\bsk-[A-Za-z0-9]|Bearer |authorization/i);
  assert.doesNotMatch(source, /openai|anthropic|generativelanguage|stripe/i);
  assert.doesNotMatch(read('ask/ui.js') + read('ask/ask.js'), /fetch\(/);
});

test('scrub removes an email, a phone, a card, and a long number, then caps at 500', () => {
  const dirty = 'Write ada@example.com or 202-555-0100 card 4242 4242 4242 4242 code 12345678';
  const clean = log.scrub(dirty);
  assert.equal(clean, 'Write [removed] or [removed] card [removed] code [removed]');
  assert.equal(log.scrub('The year 2026 and the day 2026-11-15 stay.'), 'The year 2026 and the day 2026-11-15 stay.');
  assert.equal(log.scrub('SSN 123-45-6789 and local 555-1234'), 'SSN [removed] and local [removed]');
  assert.equal(log.scrub('Write name at gmail dot com or name [at] domain [dot] com'), 'Write [removed] or [removed]');
  assert.equal(log.scrub('Meet at the office map.'), 'Meet at the office map.');
  assert.equal(log.scrub('x'.repeat(600)).length, 500);
});

test('nothing is sent when the box is unchecked or the endpoint is empty', async () => {
  const calls = [];
  const fetch = (url, opts) => { calls.push({ url, opts }); return Promise.resolve(); };
  const question = 'How do I start with $0?';
  const off = await log.deliver({
    keep: false,
    config: config(FORM, FIELDS),
    question: question,
    urls: ['/map/'],
    count: 1,
    page: '/',
    now: '2026-11-15T17:57:00.000Z',
    sessionId: '11111111-1111-4111-8111-111111111111',
    fetch: fetch
  });
  const empty = await log.deliver({
    keep: true,
    config: config('', FIELDS),
    question: question,
    urls: ['/map/'],
    count: 1,
    page: '/',
    now: '2026-11-15T17:57:00.000Z',
    sessionId: '11111111-1111-4111-8111-111111111111',
    fetch: fetch
  });
  const noIds = await log.deliver({
    keep: true,
    config: config(FORM, {}),
    question: question,
    urls: ['/map/'],
    count: 1,
    page: '/',
    fetch: fetch
  });
  assert.equal(off.sent, false);
  assert.equal(empty.sent, false);
  assert.equal(noIds.sent, false);
  assert.deepEqual(calls, []);
  assert.equal(log.endpointOf(config('', FIELDS)), '');
  assert.equal(log.endpointOf(config('http://docs.google.com/forms/d/e/x/formResponse', FIELDS)), '');
  assert.equal(log.endpointOf(config('https://example.com/formResponse', FIELDS)), '');
});

test('a checked box posts only the scrubbed form fields', async () => {
  let seen = null;
  const sent = await log.deliver({
    keep: true,
    config: config(FORM, FIELDS),
    question: 'Email ada@example.com about 202-555-0100',
    urls: ['/map/', '/ask/'],
    count: 2,
    page: '/ask/',
    now: '2026-11-15T17:57:00.000Z',
    sessionId: '11111111-1111-4111-8111-111111111111',
    fetch: (url, opts) => { seen = { url, opts }; return Promise.resolve(); }
  });
  assert.equal(sent.sent, true);
  assert.equal(seen.url, FORM);
  assert.equal(seen.opts.method, 'POST');
  assert.equal(seen.opts.mode, 'no-cors');
  assert.equal(seen.opts.credentials, 'omit');
  assert.equal(seen.opts.referrerPolicy, 'no-referrer');
  assert.equal(seen.opts.headers, undefined);
  const body = seen.opts.body;
  assert.equal(body.get('entry.11'), 'Email [removed] about [removed]');
  assert.equal(body.get('entry.22'), '/map/ /ask/');
  assert.equal(body.get('entry.33'), '2');
  assert.equal(body.get('entry.44'), '/ask/');
  assert.equal(body.get('entry.55'), '2026-11-15T17:57:00.000Z');
  assert.equal(body.get('entry.66'), '11111111-1111-4111-8111-111111111111');
  const packed = body.toString();
  assert.doesNotMatch(packed, /user-agent|userAgent|fingerprint|ada@example|202-555-0100/i);
  for (const pair of [...body]) assert.match(pair[0], /^entry\.\d+$/);
});

test('the session id is random and reused for the tab', () => {
  const storage = memory();
  let calls = 0;
  const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
  const first = log.sessionId(storage, () => ids[calls++]);
  const second = log.sessionId(storage, () => ids[calls++]);
  assert.equal(first, ids[0]);
  assert.equal(second, first);
  assert.equal(calls, 1);
  assert.equal(storage.data.get(log.SESSION_KEY), first);
});

test('an empty endpoint keeps the checkbox hidden and sends nothing', async () => {
  const calls = [];
  const box = { checked: false, addEventListener() {} };
  const wrap = { hidden: false };
  const doc = { getElementById(id) { return id === 'ask-keep' ? box : id === 'ask-keep-wrap' ? wrap : null; } };
  const local = memory();
  local.setItem(log.KEEP_KEY, '1');
  const win = {
    localStorage: local,
    sessionStorage: memory(),
    fetch(url, opts) {
      calls.push({ url, method: opts && opts.method });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(config('', FIELDS)) });
    }
  };
  await log.mount(doc, win);
  await log.note({ question: 'How do I stay consistent?', urls: [], count: 0, page: '/' });
  assert.equal(wrap.hidden, true);
  assert.equal(box.checked, false);
  assert.equal(win.sessionStorage.data.has(log.SESSION_KEY), false);
  assert.deepEqual(calls.map((call) => call.url), ['/content/site.json']);
});

test('dtrt-ask-session is created only after opt-in', async () => {
  const calls = [];
  const box = { checked: false, addEventListener() {} };
  const wrap = { hidden: true };
  const doc = { getElementById(id) { return id === 'ask-keep' ? box : id === 'ask-keep-wrap' ? wrap : null; } };
  const session = memory();
  const win = {
    localStorage: memory(),
    sessionStorage: session,
    fetch() {
      calls.push('fetch');
      return Promise.resolve({ ok: true, json: () => Promise.resolve(config(FORM, FIELDS)) });
    }
  };
  await log.mount(doc, win);
  await log.note({ question: 'Where is the free office map?', urls: ['/map/'], count: 1, page: '/ask/' });
  assert.equal(session.data.has(log.SESSION_KEY), false);
  assert.equal(calls.filter((item) => item !== 'fetch').length, 0);
  box.checked = true;
  await log.note({ question: 'Where is the free office map?', urls: ['/map/'], count: 1, page: '/ask/' });
  assert.equal(typeof session.data.get(log.SESSION_KEY), 'string');
  assert.ok(calls.length > 1);
});

test('privacy states the opt-in Ask log in English and Spanish', () => {
  const privacy = read('legal/privacy.html');
  const en = [
    'The Ask box on the home page and on /ask/ searches this site\'s public pages in your browser.',
    'The search is free, and no paid model is connected.',
    'The checkbox starts unchecked, and nothing from a question is sent unless you check it.',
    'If you check "Let Ian keep my questions to improve this page. No name or email needed.", this browser sends the question, the addresses of the matching pages, how many results came back, the page you were on, the time in UTC, and a random id for this tab.',
    'Ian keeps that log for weekly audits, fixes, and updates.',
    'No name or email is asked.',
    'Before a question is sent, this browser replaces text that looks like an email, a phone number, or a long number with [removed], and it keeps at most 500 characters.',
    'The log is a Google Form owned by Ian.',
    'Google receives the request, including your IP address and browser information, under Google\'s privacy policy.',
    'This site does not add your IP address or browser name to the log, and this page does not build a fingerprint.',
    'Questions are kept for up to 12 months, then deleted.',
    'To ask for a question to be deleted, use the contact page and include the date and the text of the question.',
    'Uncheck the box to stop.',
    'The choice stays on this device.',
    'Until a log address is set for the site, the checkbox stays hidden and nothing is sent.'
  ];
  const es = [
    'La caja de preguntas en la página de inicio y en /ask/ busca las páginas públicas de este sitio en tu navegador.',
    'La búsqueda es gratis y no hay un modelo de pago conectado.',
    'La casilla empieza sin marcar, y no se envía nada de una pregunta salvo que tú la marques.',
    'Si marcas "Let Ian keep my questions to improve this page. No name or email needed.", este navegador envía la pregunta, las direcciones de las páginas que coinciden, cuántos resultados hubo, la página en la que estabas, la hora en UTC y un id aleatorio de esta pestaña.',
    'Ian guarda ese registro para auditorías, correcciones y actualizaciones semanales.',
    'No se pide nombre ni correo.',
    'Antes de enviar una pregunta, este navegador sustituye el texto que parece un correo, un teléfono o un número de muchos dígitos por [removed], y deja como máximo 500 caracteres.',
    'El registro es un formulario de Google que pertenece a Ian.',
    'Google recibe la solicitud, incluida tu dirección IP y la información del navegador, según la política de privacidad de Google.',
    'Este sitio no añade tu dirección IP ni el nombre del navegador al registro, y esta página no arma una huella.',
    'Las preguntas se guardan hasta 12 meses y después se borran.',
    'Para pedir que se borre una pregunta, usa la página de contacto e incluye la fecha y el texto de la pregunta.',
    'Quita la marca para parar.',
    'La elección se queda en este dispositivo.',
    'Hasta que el sitio tenga una dirección de registro, la casilla permanece oculta y no se envía nada.'
  ];
  const visible = privacy.replace(/<[^>]+>/g, '');
  for (const line of en) assert.ok(visible.includes(line), line);
  for (const line of es) assert.ok(visible.includes(line), line);
  assert.match(read('js/biz-lang.js'), /se añadió un registro opcional de preguntas/);
  assert.match(read('js/biz-lang.js'), /formulario de contacto/);
  assert.match(read('js/biz-lang.js'), /Contacto de seguridad/);
  assert.doesNotMatch(read('js/biz-lang.js'), /Cómo DTRT Lab trata los mensajes/);
  const cookies = read('legal/cookies.html');
  assert.match(cookies, /dtrt-ask-keep/);
  assert.match(cookies, /dtrt-ask-session/);
  assert.match(cookies, /lang="es"/);
  assert.match(privacy, /href="https:\/\/policies\.google\.com\/privacy"/);
});
