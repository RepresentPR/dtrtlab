import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const modulePath = new URL('../js/homepage-video.mjs', import.meta.url);
function setup({ portrait = false, playing = false } = {}) {
  assert.ok(fs.existsSync(modulePath), 'responsive homepage player exists');
  const listeners = {};
  const source = { src: 'https://site.test/media/desktop.mp4' };
  const frame = { dataset: {} };
  const video = {
    dataset: { desktopSrc: source.src, portraitSrc: 'https://site.test/media/mobile.mp4',
      desktopPoster: '/desktop.png', portraitPoster: '/mobile.png' },
    paused: !playing, ended: false, currentTime: 0, readyState: 0, duration: 14.5,
    currentSrc: source.src, loads: 0, poster: '/desktop.png',
    querySelector() { return source; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    load() { this.loads++; this.currentTime = 0; this.readyState = 0; this.emit('pause'); },
    play() { throw new Error('Only the visitor may start playback'); },
    emit(type) { for (const fn of listeners[type] ?? []) fn(); },
  };
  const query = { matches: portrait, addEventListener(type, fn) { this.changed = fn; } };
  vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), {
    document: { getElementById: id => id === 'homepage-video' ? video : frame },
    window: { matchMedia: condition => {
      assert.equal(condition, '(max-width: 600px) and (orientation: portrait)'); return query;
    } },
  });
  return { video, source, frame,
    resize(portrait) { query.matches = portrait; query.changed(); },
    metadata() { video.currentSrc = source.src; video.readyState = 1; video.emit('loadedmetadata'); },
  };
}

test('selects portrait only for narrow upright screens and keeps initial playback stopped', () => {
  const phone = setup({ portrait: true });
  assert.match(phone.source.src, /mobile.mp4$/);
  assert.equal(phone.frame.dataset.layout, 'portrait');
  assert.equal(phone.video.poster, '/mobile.png');
  assert.equal(phone.video.paused, true);
  const desktop = setup();
  assert.equal(desktop.video.loads, 0);
  assert.equal(desktop.frame.dataset.layout, 'desktop');
});

test('resize does not interrupt playback; pause selects the latest viewport and preserves position', () => {
  const ui = setup();
  ui.video.paused = false; ui.video.readyState = 1; ui.video.currentTime = 5;
  ui.resize(true);
  assert.equal(ui.video.loads, 0);
  assert.equal(ui.frame.dataset.layout, 'desktop');
  ui.resize(false); ui.video.paused = true; ui.video.emit('pause');
  assert.equal(ui.video.loads, 0, 'obsolete portrait choice must not be queued');
  ui.resize(true);
  assert.equal(ui.video.loads, 1);
  ui.metadata();
  assert.equal(ui.video.currentTime, 5);
  assert.equal(ui.video.paused, true);
});

test('rapid source changes retain position and ignore metadata for the old source', () => {
  const ui = setup(); ui.video.readyState = 1; ui.video.currentTime = 7;
  ui.resize(true); ui.resize(false); ui.resize(true);
  ui.video.readyState = 1; ui.video.emit('loadedmetadata');
  assert.equal(ui.video.currentTime, 0, 'stale source metadata cannot seek');
  ui.metadata();
  assert.equal(ui.video.currentTime, 7);
});

test('ended switches at zero and startup does not interrupt a visitor who already pressed play', () => {
  const running = setup({ portrait: true, playing: true });
  assert.equal(running.video.loads, 0);
  assert.equal(running.frame.dataset.layout, 'desktop');
  running.video.ended = true; running.video.currentTime = 14.5; running.video.emit('ended');
  running.metadata();
  assert.equal(running.video.currentTime, 0);
  assert.equal(running.frame.dataset.layout, 'portrait');
});
