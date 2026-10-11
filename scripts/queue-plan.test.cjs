const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../js/campaign-home.js');
const now = Date.parse('2026-10-11T19:00:00Z');
const platforms = ['YouTube', 'Instagram', 'TikTok', 'X'];
function drop(groupId, scheduledAt) {
  return platforms.map(platform => ({ groupId, title: groupId, platform, scheduledAt, status: 'scheduled' }));
}
function campaign(queue) {
  return {
    capturedAt: '2026-10-11T18:45:00Z',
    campaign: { viewsGoal: 250000, viewsDeadlineAt: '2027-01-01T05:00:00Z' },
    results: { lifetimeViews: { value: 146093, status: 'verified', observedAt: '2026-10-11T18:42:45.204Z' }, views: { value: 1641, status: 'verified', observedAt: '2026-10-11T18:45:29.470Z' } },
    operations: { activePosts: 7, scheduledPosts: 10, queueVerifiedAt: '2026-10-11T18:45:00Z' },
    queue
  };
}
test('next24h contains scheduled posts only while all saved reservations retain capacity', () => {
  const queue = [...drop('Knife', '2026-10-11T20:00:00Z'), ...drop('Door', '2026-10-11T22:00:00Z'),
    { groupId: 'Knife', title: 'Held support post', platform: 'Ko-fi', status: 'draft', scheduledAt: '2026-10-11T20:00:00Z' },
    ...drop('Outside horizon', '2026-10-12T19:00:01Z')];
  const view = model.createViewModel(campaign(queue), now);
  assert.equal(view.queue.length, 8);
  assert.equal(view.operations.completeDrops, 2);
  assert.equal(view.operations.planningHorizonHours, 24);
  assert.equal(view.operations.targetSpacingHours, 2);
  assert.equal(view.operations.used, 17);
  assert.equal(view.operations.scheduled, 10);
  assert.equal(view.views.observedAt, '2026-10-11T18:45:29.470Z');
  assert.equal(view.lifetimeViews.value, 146093);
});
test('missing, duplicate, ungrouped or differently timed destinations cannot form a complete drop', () => {
  const full = drop('Knife', '2026-10-11T20:00:00Z');
  for (const queue of [full.slice(0, 3), [...full, { ...full[0] }], full.map(({ groupId, ...row }) => row), full.map((row, i) => i === 3 ? { ...row, scheduledAt: '2026-10-11T20:01:00Z' } : row)]) {
    const view = model.createViewModel(campaign(queue), now);
    assert.equal(view.operations.completeDrops, 0);
    assert.equal(view.queue.length, queue.length, 'incomplete saved posts stay visible');
  }
  const optional = model.createViewModel(campaign([...full, { ...full[0], platform: 'Ko-fi' }]), now);
  assert.equal(optional.operations.completeDrops, 1, 'Ko-fi does not become a fifth required destination');
  const laterOptional = model.createViewModel(campaign([...full, { ...full[0], platform: 'Ko-fi', scheduledAt: '2026-10-11T21:00:00Z' }]), now);
  assert.deepEqual(laterOptional.groups[0].platforms, platforms, 'a differently timed optional post is not presented as synchronized');
  assert.equal(laterOptional.incompleteQueue[0].platform, 'Ko-fi', 'the separately timed reservation remains visible');
});
test('elapsed drop dates leave the display without silently freeing reserved slots', () => {
  const data = campaign([...drop('Knife', '2026-10-11T20:00:00Z'), ...drop('Door', '2026-10-11T22:00:00Z')]);
  const view = model.createViewModel(data, Date.parse('2026-10-11T21:00:00Z'));
  assert.equal(view.operations.completeDrops, 1);
  assert.deepEqual(view.groups.map(group => group.groupId), ['Door']);
  assert.equal(view.operations.used, 17);
  assert.equal(model.createViewModel(data, Date.parse('2026-10-11T23:00:00Z')).operations.completeDrops, 0);
});

// The browser boundary is simulated; the dashboard and shared model run unchanged.
test('live dashboard renders grouped24h plan, excludes held/far posts and preserves total capacity', async () => {
  const nodes = new Map();
  function element() {
    return { textContent: '', value: '', style: {}, children: [], append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, setAttribute() {}, addEventListener() {} };
  }
  const document = { hidden: false, getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); }, createElement: element, createElementNS: element, addEventListener() {} };
  const data = campaign([...drop('Knife', '2026-10-11T20:00:00Z'), ...drop('Door', '2026-10-11T22:00:00Z'), { title: 'Held support post', platform: 'Ko-fi', status: 'draft', scheduledAt: '2026-10-11T20:00:00Z' }, ...drop('Outside horizon', '2026-10-12T20:00:00Z')]);
  const database = { posts: [], campaignAddedHistory: [], reviews: [], experiments: [], coverage: 'Saved coverage' };
  class FixedDate extends Date { static now() { return now; } }
  const context = vm.createContext({ document, window: { DtrtCampaign: model }, Date: FixedDate, Intl, AbortController, setTimeout: () => 1, clearTimeout() {}, setInterval() {}, fetch: async url => ({ ok: true, json: async () => url.endsWith('campaign.json') ? data : database }) });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../live/performance.js'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(nodes.get('runway').textContent, /2 complete.*24 hours/i);
  assert.match(nodes.get('runway').textContent, /2 hours.*quality.*cap/i);
  assert.equal(nodes.get('queue').children.filter(node => /^(Knife|Door) ·/.test(node.textContent)).length, 2);
  assert.match(nodes.get('queue').children.at(-1).textContent, /4 later scheduled posts remain counted/);
  assert.doesNotMatch(nodes.get('queue').children.map(node => node.textContent).join(' '), /Held support|Outside horizon/);
  assert.equal(nodes.get('capacity').textContent, '7 active + 10 scheduled / 17');
});
