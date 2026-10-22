(function () {
  'use strict';
  var valid = /^DTRT-\d{8}-[a-f0-9]{12}$/;
  function refresh(form) {
    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') return;
    var value = 'DTRT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    var input = form.querySelector('input[name="Request reference"]');
    if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = 'Request reference'; form.appendChild(input); }
    input.value = value;
    var next = form.querySelector('input[name="_next"]');
    if (next) { var url = new URL(next.value); url.searchParams.set('reference', value); next.value = url.href; }
  }
  var forms = document.querySelectorAll('form[action^="https://formsubmit.co/"]');
  forms.forEach(refresh);
  window.addEventListener('pageshow', function (event) { if (event.persisted) forms.forEach(refresh); });
  var reference = document.getElementById('request-reference');
  var value = new URLSearchParams(location.search).get('reference');
  if (reference && valid.test(value || '')) { reference.textContent = 'Your request reference: ' + value; reference.hidden = false; }
}());
