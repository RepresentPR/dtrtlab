const guide = document.getElementById('story-guide');
const triggers = [...document.querySelectorAll('[data-story-open]')];
let lastTrigger = null;
let held = [];

function backgroundNodes() {
  const nodes = new Set();
  const consider = (el) => {
    if (!el || el === guide || guide.contains(el)) return;
    if (el.contains(guide)) {
      for (const child of el.children) consider(child);
      return;
    }
    nodes.add(el);
  };
  for (const child of document.body.children) consider(child);
  return [...nodes];
}

function setInert(on) {
  if (on) {
    held = backgroundNodes().filter((el) => !el.inert);
    for (const el of held) el.inert = true;
    return;
  }
  for (const el of held) el.inert = false;
  held = [];
}

function showPanel(id) {
  let title = null;
  for (const panel of guide.querySelectorAll('[data-panel]')) {
    const on = panel.dataset.panel === id;
    panel.hidden = !on;
    if (on) title = panel.querySelector('h2');
  }
  const back = document.getElementById('story-back');
  back.hidden = id === 'start';
  if (title) {
    guide.setAttribute('aria-labelledby', title.id);
    title.focus();
  }
}

function onKey(event) {
  if (guide.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeGuide();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = [...guide.querySelectorAll('button, a')].filter((el) => !el.hidden && !el.closest('[hidden]'));
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openGuide(panelId, trigger) {
  lastTrigger = trigger;
  guide.hidden = false;
  setInert(true);
  for (const button of triggers) button.setAttribute('aria-expanded', String(button === trigger));
  showPanel(panelId);
  document.addEventListener('keydown', onKey);
}

function closeGuide() {
  if (guide.hidden) return;
  guide.hidden = true;
  for (const button of triggers) button.setAttribute('aria-expanded', 'false');
  document.removeEventListener('keydown', onKey);
  setInert(false);
  if (lastTrigger) lastTrigger.focus();
}

for (const button of triggers) {
  button.addEventListener('click', () => openGuide(button.dataset.storyOpen, button));
}
guide.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : event.target.parentElement;
  const next = target && target.closest('[data-panel-target]');
  if (next) showPanel(next.dataset.panelTarget);
});
document.getElementById('story-back').addEventListener('click', () => showPanel('start'));
document.getElementById('story-close').addEventListener('click', closeGuide);
