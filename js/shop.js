(() => {
  'use strict';
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  function badge(status) {
    if (status === 'free_now') return { cls: 'shop-badge free', label: 'Free now' };
    return { cls: 'shop-badge interest', label: 'Interest open' };
  }

  function card(item) {
    const b = badge(item.status);
    const kind = item.kind === 'merch' ? 'Merch · POD' : 'Digital';
    const cta = item.status === 'free_now' && item.href
      ? '<a class="shop-cta" href="' + item.href + '"' + (item.href.endsWith('.txt') ? ' download' : '') + '>' + (item.priceNote || 'Open') + ' <span aria-hidden="true">↗</span></a>'
      : '<a class="shop-cta ghost" href="/contact.html?intent=shop-interest&amp;product=' + encodeURIComponent(item.id) + '">I want this <span aria-hidden="true">↗</span></a>';
    return (
      '<article class="shop-card" data-product-id="' + item.id + '">' +
        '<span class="kind">' + kind + '</span>' +
        '<h3>' + item.name + '</h3>' +
        '<span class="' + b.cls + '">' + b.label + '</span>' +
        '<p>' + item.description + '</p>' +
        '<p class="shop-note">' + (item.priceNote || '') + '</p>' +
        cta +
      '</article>'
    );
  }

  fetch('/content/shop.json', { cache: 'no-store' })
    .then(res => { if (!res.ok) throw new Error('shop'); return res.json(); })
    .then(data => {
      if (data.checkoutLive === true) {
        grid.innerHTML = '<p class="shop-banner" role="status">Checkout flag is on in shop.json — verify payment before taking money.</p>';
        return;
      }
      const products = Array.isArray(data.products) ? data.products : [];
      grid.innerHTML = products.map(card).join('') || '<p>No products listed yet.</p>';
    })
    .catch(() => {
      grid.innerHTML = '<p class="shop-note">Catalog could not load. Email <a href="mailto:hello@dtrtlab.com">hello@dtrtlab.com</a> or <a href="/contact.html?intent=shop-interest">send shop interest</a>.</p>';
    });
})();
