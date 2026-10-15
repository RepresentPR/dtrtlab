const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('brand kit has the public paste text and a short bio', () => {
  const kit = read('brand-kit.md');
  assert.match(kit, /#080808/);
  assert.match(kit, /#fafafa/);
  assert.match(kit, /#b6b6b6/);
  assert.match(kit, /#303030/);
  assert.match(kit, /#141414/);
  assert.match(kit, /#cfe35a/);
  assert.match(kit, /Source Sans 3/);
  assert.match(kit, /Source Serif 4/);
  const oneLine = kit.match(/DTRT Lab writes for local businesses\. Do the right thing\. Free plan: dtrtlab\.com/);
  assert.ok(oneLine, 'one-line bio is present');
  assert.ok(oneLine[0].length < 150);
  for (const name of ['X', 'Instagram', 'TikTok', 'YouTube', 'Twitch']) {
    assert.match(kit, new RegExp('### ' + name));
  }
  assert.match(kit, /https:\/\/x\.com\/DTRTLab/);
  assert.match(kit, /https:\/\/www\.instagram\.com\/officiallydtrt\//);
  assert.match(kit, /plan_HAGSLXXUeGkcz/);
  assert.match(kit, /plan_RVDjSToI7vKOM/);
  assert.match(kit, /plan_kZqq0jgr6VrGG/);
  assert.doesNotMatch(kit, /@gmail\.com|PayPal/);
});

test('business pages show theme A offers and keep hobby off the company face', () => {
  const home = read('index.html');
  const main = home.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(main, /We study what makes big companies win, <span>and hand the playbook to yours\.<\/span>/);
  assert.match(main, /Do the right thing\. We help businesses grow\./);
  assert.match(main, /DMV Area/);
  assert.match(main, /Mine\. Test\. Playbook\. Deliver\./);
  assert.match(home, /"name": "Washington DC metropolitan area \(DMV\)"/);
  for (const file of ['index.html', 'find.html', 'contact.html', 'js/nav.js', 'legal/terms.html', 'content/company.json']) {
    assert.doesNotMatch(read(file), /Clinton|Southern Maryland|SoMD/i, file + ' carries no day-job location');
  }
  for (const id of ['plan_HAGSLXXUeGkcz', 'plan_RVDjSToI7vKOM', 'plan_kZqq0jgr6VrGG', 'plan_Vn0gQGFWQx9CA']) assert.match(main, new RegExp(id));
  assert.match(main, /DTRT 7-Day Do-It-Right Guarantee/);
  assert.doesNotMatch(home, /free plan|PayPal|Stripe|twitch\.tv|\/cs2\.html|\/afterlight\.html|#080808|cfe35a/i);
  assert.doesNotMatch(main, /\/careers\.html/i);
  for (const file of ['find.html', 'contact.html']) {
    const html = read(file);
    assert.match(html, /theme-a\.css/, file);
    assert.doesNotMatch(html, /free plan|@gmail\.com|PayPal/i, file);
  }
  const cs2 = read('cs2.html');
  for (const id of ['votes', 'tabs', 'account', 'notes']) {
    assert.match(cs2, new RegExp('id="' + id + '"[^>]*hidden|hidden[^>]*id="' + id + '"'));
  }
  assert.match(read('brand.html'), /brand-kit\.md/);
});
