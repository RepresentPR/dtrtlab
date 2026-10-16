(() => {
  'use strict';
  const want = new URLSearchParams(location.search).get('want');
  const value = want === 'check' ? 'Free AI visibility check' : want === 'partner' ? 'Partnership' : '';
  if (!value) return;
  const input = document.querySelector('input[name="What do you want"][value="' + value + '"]');
  if (input) input.checked = true;
})();
