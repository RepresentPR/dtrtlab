import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { getRoute, prepareRequest } from '../js/knowledge-model.mjs';
const { isExcluded, loadExclude } = createRequire(import.meta.url)('./stage-site.cjs');

test('unknown suggestions do not invent an available service',()=>{
  assert.equal(getRoute('anything'),null);
  assert.equal(getRoute('products').orderable,false);
  assert.match(getRoute('software').text,/fictional|development/);
});
test('request requires an explicit current consent and a supported topic',()=>{
  assert.throws(()=>prepareRequest({topic:'services',need:'Need help',consent:false}),/consent/i);
  assert.throws(()=>prepareRequest({topic:'services',need:'Need help',consent:'true'}),/consent/i);
  assert.throws(()=>prepareRequest({topic:'unknown',need:'Need help',consent:true}),/topic/i);
});
test('request minimization: empty and oversized text rejected, no identity required',()=>{
  assert.throws(()=>prepareRequest({topic:'services',need:'  ',consent:true}),/need/i);
  assert.throws(()=>prepareRequest({topic:'services',need:'x'.repeat(601),consent:true}),/600/);
  const r=prepareRequest({topic:'services',need:'  One clear office workflow  ',consent:true});
  assert.equal(r.need,'One clear office workflow');
  assert.equal(r.deliveryStatus,'not_sent');
  assert.equal(r.publicationConsent,false);
  assert.equal('email' in r,false);
});
test('untrusted request text is preserved as data, not HTML',()=>{
  const r=prepareRequest({topic:'software',need:'<img src=x onerror=alert(1)>',consent:true});
  assert.equal(r.need,'<img src=x onerror=alert(1)>');
});
test('public guide cannot submit a form and private source remains excluded',()=>{
  const root=new URL('../',import.meta.url);
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  const js=fs.readFileSync(new URL('js/knowledge-guide.mjs',root),'utf8');
  assert.match(html,/How can I help you today\?/);
  assert.match(html,/Live AI is not connected/);
  assert.match(html,/connect-src https:\/\/dtrtlab\.goatcounter\.com/);
  assert.doesNotMatch(html,/connect-src[^;]*'none'/);
  assert.match(html,/form-action 'none'/);
  assert.doesNotMatch(html,/noindex|PRIVATE HOMEPAGE CONCEPT/);
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|innerHTML/);
  assert.doesNotMatch(html,/<input[^>]+type="checkbox"[^>]+checked/);
  assert.match(fs.readFileSync(new URL('_config.yml',root),'utf8'),/  - docs/);
  assert.equal(isExcluded('docs/prototypes/knowledge-hub/index.html', loadExclude()), true);
  assert.equal(isExcluded('outputs/private.json', loadExclude()), true);
});
