// Test-run panel: reads the hand-edited record once. No refresh, no outside requests.
(function () {
  var root = document.getElementById('test-run');
  if (!root || !window.fetch) return;
  function fmt(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d)) return null;
    return d.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET';
  }
  fetch('/content/test-run.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (data) {
    Object.keys(data.metrics || {}).forEach(function (key) {
      var m = data.metrics[key];
      var card = root.querySelector('[data-metric="' + key + '"]');
      if (!card) return;
      var when = fmt(m.asOf);
      card.querySelector('strong').textContent = when ? m.display : 'Not available';
      card.querySelector('.as-of').textContent = when ? 'As of ' + when + ' · ' + m.source : 'No as-of time recorded';
    });
  }).catch(function () {
    var s = root.querySelector('.test-run-error');
    if (s) s.hidden = false;
  });
})();
