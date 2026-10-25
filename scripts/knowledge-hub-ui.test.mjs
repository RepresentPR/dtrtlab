import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { getRoute, prepareRequest } from '../js/knowledge-model.mjs';

// Minimal DOM boundary for the actual UI module: no browser or network needed.
// Removing draft invalidation from a suggestion click must fail the first test.
function setup() {
  class Element {
    value = ''; checked = false; hidden = true; disabled = true; textContent = '';
    dataset = {}; attributes = {}; listeners = {};
    classList = { toggle() {} };
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
    setAttribute(name, value) { this.attributes[name] = value; }
    emit(type) { for (const fn of this.listeners[type] ?? []) fn({ preventDefault() {} }); }
  }
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const suggestions = ['products', 'software', 'ventures', 'services'].map(topic => {
    const button = new Element(); button.dataset.topic = topic; return button;
  });
  const downloaded = [];
  const blobs = [];
  const windowEvents = {};
  // Simulate values restored by the browser before module initialization.
  el('need').value = 'Previously entered draft';
  el('consent').checked = true;
  const document = {
    getElementById: el,
    querySelectorAll: selector => selector === '[data-topic]' ? suggestions : [],
    createElement: () => ({ click() { downloaded.push(this.download); } }),
  };
  const source = fs.readFileSync(new URL('../js/knowledge-guide.mjs', import.meta.url), 'utf8');
  vm.runInNewContext(source.replace(/^import[^\n]+\n/, ''), {
    document, getRoute, prepareRequest, Blob,
    window: { addEventListener(type, fn) { windowEvents[type] = fn; } },
    URL: { createObjectURL(blob) { blobs.push(blob); return 'blob:local-test'; }, revokeObjectURL() {} },
    setTimeout: fn => fn(),
  });
  const prepare = () => {
    el('topic').value = 'services'; el('need').value = 'A clearer customer workflow'; el('consent').checked = true;
    el('request-form').emit('submit');
  };
  return { el, suggestions, downloaded, blobs, prepare, windowEvents };
}

test('initialization and back/forward restoration clear drafts and reset consent', () => {
  const ui = setup();
  assert.equal(ui.el('need').value, '');
  assert.equal(ui.el('consent').checked, false);
  assert.equal(ui.el('capture-toggle').attributes['aria-checked'], 'false');
  ui.el('capture-toggle').emit('click'); ui.prepare();
  ui.windowEvents.pageshow({ persisted: true });
  assert.equal(ui.el('need').value, '');
  assert.equal(ui.el('consent').checked, false);
  assert.equal(ui.el('request-preview').hidden, true);
  assert.equal(ui.el('capture-toggle').attributes['aria-checked'], 'false');
  assert.equal(ui.el('need').disabled, true);
  ui.el('download').emit('click');
  assert.equal(ui.downloaded.length, 0);
});

test('a suggestion change invalidates the previously consented draft before download', () => {
  const ui = setup();
  ui.el('capture-toggle').emit('click'); ui.prepare();
  assert.equal(ui.el('request-preview').hidden, false);
  ui.suggestions[0].emit('click');
  assert.equal(ui.el('topic').value, 'products');
  assert.equal(ui.el('request-preview').hidden, true);
  ui.el('download').emit('click');
  assert.equal(ui.downloaded.length, 0);
});

test('off switch erases the request and prevents stale downloads after re-enabling', () => {
  const ui = setup();
  ui.el('capture-toggle').emit('click'); ui.prepare();
  ui.el('capture-toggle').emit('click');
  assert.equal(ui.el('capture-toggle').attributes['aria-checked'], 'false');
  assert.equal(ui.el('need').value, '');
  assert.equal(ui.el('consent').checked, false);
  for (const id of ['topic', 'need', 'consent', 'prepare']) assert.equal(ui.el(id).disabled, true);
  ui.el('capture-toggle').emit('click'); ui.el('download').emit('click');
  assert.equal(ui.downloaded.length, 0);
});

test('only an unchanged consented draft can be downloaded, with not-sent metadata', async () => {
  const ui = setup();
  ui.el('capture-toggle').emit('click'); ui.prepare();
  ui.el('download').emit('click');
  const record = JSON.parse(await ui.blobs[0].text());
  assert.equal(record.deliveryStatus, 'not_sent');
  assert.equal(record.topic, 'services');
  assert.equal(record.publicationConsent, false);
  ui.el('need').value = 'Changed request'; ui.el('need').emit('input');
  ui.el('download').emit('click');
  assert.equal(ui.downloaded.length, 1);
});
