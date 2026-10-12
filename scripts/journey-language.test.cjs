const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const language = require('../js/journey-language.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('language routes preserve both intake intents, fragments, and unrelated query values', () => {
  for (const intent of ['free-plan', 'paid-project']) {
    for (const lang of ['en', 'es']) {
      assert.equal(language.localizeHref('/contact.html?intent=' + intent + '#details', lang), '/contact.html?intent=' + intent + '&lang=' + lang + '#details');
    }
  }
  assert.equal(language.localizeHref('/?ref=workshop#highlights', 'es'), '/?ref=workshop&lang=es#highlights');
  assert.equal(language.localizeHref('/support.html?lang=en', 'es'), '/support.html?lang=es');
  assert.equal(language.localizeHref('/watch/workshop-guide.html', 'es'), '/watch/workshop-guide.html');
  assert.equal(language.localizeHref('https://x.com/DTRTLab', 'es'), 'https://x.com/DTRTLab');
  assert.equal(language.localizeHref('#free-plan', 'es'), '#free-plan');
  assert.equal(language.languageFromSearch('?lang=fr'), 'en');
  assert.equal(language.languageFromSearch('?lang=es&intent=free-plan'), 'es');
});

test('all translated homepage and support elements have complete EN/ES copy', () => {
  for (const file of ['index.html', 'support.html']) {
    const html = read(file);
    assert.match(html, /data-language="en"[^>]*>English<\/a>/);
    assert.match(html, /data-language="es"[^>]*>Español<\/a>/);
    assert.match(html, /\/js\/journey-language\.js/);
    const keys = [...html.matchAll(/data-journey-(?:i18n|label)="([^"]+)"/g)].map(match => match[1]);
    assert.ok(keys.length > 20, file + ' covers its customer-facing route');
    for (const key of keys) {
      for (const lang of ['en', 'es']) assert.equal(typeof language.copy[key]?.[lang], 'string', file + ': ' + key + '/' + lang);
    }
    assert.match(html, /lang="en"/);
  }
  assert.match(language.copy.coverage.es, /inglés/);
  assert.match(language.copy.translation.es, /IA/);
  assert.match(language.copy.unsupported.es, /traducción del navegador/);
  assert.doesNotMatch(read('js/journey-language.js'), /fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
  assert.doesNotMatch(read('support.html'), /src="\/js\/experience\.js/, 'no unlocalized secondary header or sound-resume controls on the support route');
  assert.match(read('css/journey-language.css'), /html\[lang=es\] \.offer-fallback a\[lang=es\]\{display:none\}/, 'Spanish view has one email fallback');
});

test('Spanish route applies language metadata, page title, accessible selection and preserved link intent', () => {
  const makeNode = attrs => ({ attrs: { ...attrs }, innerHTML: '', textContent: '', setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; }, removeAttribute(key) { delete this.attrs[key]; } });
  const translated = makeNode({ 'data-journey-i18n': 'supportTitle' });
  const navigation = makeNode({ 'data-journey-label': 'mainNavigation', 'aria-label': 'Main navigation' });
  const routes = [makeNode({ href: '/contact.html?intent=paid-project' }), makeNode({ href: '/?lang=en#highlights' })];
  const selectors = ['en', 'es'].map(lang => makeNode({ 'data-language': lang, href: '?lang=' + lang }));
  const document = {
    documentElement: { lang: 'en' }, body: { dataset: { journeyPage: 'support' } }, title: '',
    querySelectorAll(selector) { return selector === '[data-journey-i18n]' ? [translated] : selector === '[data-journey-label]' ? [navigation] : selector === '[data-language]' ? selectors : selector === 'a[href]' ? routes : []; }
  };
  language.apply(document, { search: '?lang=es&intent=paid-project', pathname: '/support.html', hash: '#faq' });
  assert.equal(document.documentElement.lang, 'es');
  assert.equal(document.title, 'Apoya al Lab — DTRT Lab');
  assert.equal(translated.innerHTML, language.copy.supportTitle.es);
  assert.equal(navigation.attrs['aria-label'], 'Navegación principal');
  assert.equal(selectors[1].attrs['aria-current'], 'page');
  assert.equal(selectors[0].attrs['aria-current'], undefined);
  assert.equal(routes[0].attrs.href, '/contact.html?intent=paid-project&lang=es');
  assert.equal(routes[1].attrs.href, '/?lang=es#highlights');
  assert.equal(selectors[0].attrs.href, '/support.html?lang=en&intent=paid-project#faq');
});
