(() => {
  'use strict';
  const copy = {
    map: {
      where: 'Free map · DMV Area',
      title: 'Get your free office map',
      sub: "Answer 3 short questions and you'll get a free one-page office map within 3 business days."
    },
    check: {
      where: 'Free AI check · DMV Area',
      title: 'Get your free AI check',
      sub: 'Business name, website, and the city or service area you cover.'
    },
    partner: {
      where: 'Partnership',
      title: 'Start a partnership note',
      sub: 'Your name, your brand, and what you want to work on.'
    }
  };

  function modeFromValue(value) {
    if (value === 'Free AI visibility check') return 'check';
    if (value === 'Partnership') return 'partner';
    return 'map';
  }

  function apply(mode) {
    const text = copy[mode];
    const where = document.querySelector('.where');
    const title = document.getElementById('map-title');
    const sub = document.querySelector('.hero .sub');
    if (where) where.textContent = text.where;
    if (title) title.textContent = text.title;
    if (sub) sub.textContent = text.sub;
    document.querySelectorAll('[data-ask]').forEach((block) => {
      const on = block.getAttribute('data-ask').split(/\s+/).includes(mode);
      block.hidden = !on;
      block.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = !on;
        el.required = on && el.dataset.req === '1';
      });
    });
  }

  const want = new URLSearchParams(location.search).get('want');
  const initial = want === 'check' ? 'check' : want === 'partner' ? 'partner' : 'map';
  const selected = initial === 'check' ? 'Free AI visibility check' : initial === 'partner' ? 'Partnership' : 'Free office map';
  const preset = document.querySelector('input[name="What do you want"][value="' + selected + '"]');
  if (preset) preset.checked = true;
  document.querySelectorAll('input[name="What do you want"]').forEach((el) => {
    el.addEventListener('change', () => {
      if (el.checked) apply(modeFromValue(el.value));
    });
  });
  apply(initial);
})();
