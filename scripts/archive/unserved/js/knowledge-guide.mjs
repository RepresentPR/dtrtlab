import { getRoute, prepareRequest } from './knowledge-model.mjs?v=20261024-hub1';
const el = id => document.getElementById(id);
let captureEnabled = false;
let request = null;
document.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => {
  const route = getRoute(button.dataset.topic);
  if (!route) return;
  document.querySelectorAll('[data-topic]').forEach(b => b.classList.toggle('active', b === button));
  el('route-title').textContent = route.title;
  el('route-text').textContent = route.text;
  el('route-link').textContent = route.link;
  el('route-link').href = route.href;
  el('route').hidden = false;
  el('topic').value = button.dataset.topic;
  invalidateRequest();
}));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(b => {
    b.classList.toggle('selected', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  });
  document.querySelectorAll('[data-kind]').forEach(article => {
    article.hidden = button.dataset.filter !== 'all' && button.dataset.filter !== article.dataset.kind;
  });
}));
function clearRequest() {
  el('need').value = '';
  el('consent').checked = false;
  invalidateRequest();
}
function invalidateRequest() {
  request = null;
  el('request-summary').textContent = '';
  el('request-preview').hidden = true;
  el('form-status').textContent = '';
}
function resetPreparation() {
  captureEnabled = false;
  el('capture-toggle').setAttribute('aria-checked', 'false');
  el('capture-toggle').textContent = 'Preparation off';
  el('capture-status').textContent = 'Turn on local idea preparation to try it.';
  el('topic').value = 'services';
  for (const id of ['topic','need','consent','prepare']) el(id).disabled = true;
  clearRequest();
}
// Discard browser-restored form values, including a page returned from back/forward cache.
resetPreparation();
window.addEventListener('pageshow', resetPreparation);
el('capture-toggle').addEventListener('click', () => {
  captureEnabled = !captureEnabled;
  el('capture-toggle').setAttribute('aria-checked', String(captureEnabled));
  el('capture-toggle').textContent = captureEnabled ? 'Preparation on' : 'Preparation off';
  el('capture-status').textContent = captureEnabled ? 'Local preview only. No AI or paid work activated.' : 'Turn on local idea preparation to try it.';
  for (const id of ['topic','need','consent','prepare']) el(id).disabled = !captureEnabled;
  if (!captureEnabled) clearRequest();
});
el('request-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!captureEnabled) return;
  try {
    request = prepareRequest({topic:el('topic').value,need:el('need').value,consent:el('consent').checked});
    el('request-summary').textContent = request.need;
    el('request-preview').hidden = false;
    el('form-status').textContent = 'Prepared in this tab only. Not sent, published or added to a central backlog.';
  } catch (error) {
    el('form-status').textContent = error.message;
  }
});
el('download').addEventListener('click', () => {
  if (!captureEnabled || !request || !el('consent').checked) return;
  const blob = new Blob([JSON.stringify(request,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dtrt-request-draft.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url),0);
});
el('clear').addEventListener('click',clearRequest);
for (const id of ['topic','need','consent']) el(id).addEventListener('input', invalidateRequest);
