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
  assert.equal(view.operations.targetSpacingHours, null);
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

test('an explicitly designated primary placement is complete without inventing other destinations', () => {
  const primary = { groupId: 'website-tip', title: 'A useful page', platform: 'instagram-standalone', scheduledAt: '2026-10-11T21:00:00Z', status: 'scheduled', distributionMode: 'primary_placement', requiredPlatforms: ['Instagram'] };
  const view = model.createViewModel(campaign([...drop('Knife', '2026-10-11T20:00:00Z'), primary]), now);
  assert.equal(view.operations.completeDrops, 1);
  assert.equal(view.operations.completeReleases, 2);
  assert.deepEqual(view.primaryPlacements.map(post => [post.title, post.platform]), [['A useful page', 'Instagram']]);
  assert.equal(view.incompleteQueue.length, 0);
  assert.equal(view.operations.used, 17, 'presentation must not free saved reservations');
});

test('primary label alone cannot complete ambiguous, mismatched or duplicated placements', () => {
  const primary = { groupId: 'tip', title: 'Tip', platform: 'Instagram', scheduledAt: '2026-10-11T21:00:00Z', status: 'scheduled', distributionMode: 'primary_placement', requiredPlatforms: ['Instagram'] };
  for (const queue of [[{ ...primary, requiredPlatforms: [] }], [{ ...primary, requiredPlatforms: ['YouTube'] }], [primary, primary], [{ ...primary, status: 'draft' }]]) {
    const view = model.createViewModel(campaign(queue), now);
    assert.equal(view.primaryPlacements.length, 0);
    assert.equal(view.operations.completeDrops, 0);
    assert.equal(view.operations.used, 17);
  }
});

// The browser boundary is simulated; the dashboard and shared model run unchanged.
async function renderDashboard(data) {
  const nodes = new Map();
  function element() {
    return { textContent: '', value: '', style: {}, children: [], append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, setAttribute() {}, addEventListener() {} };
  }
  const document = { hidden: false, getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); }, createElement: element, createElementNS: element, addEventListener() {} };
  const database = { posts: [], campaignAddedHistory: [], reviews: [], experiments: [], coverage: 'Saved coverage' };
  class FixedDate extends Date { static now() { return now; } }
  const context = vm.createContext({ document, window: { DtrtCampaign: model }, Date: FixedDate, Intl, AbortController, setTimeout: () => 1, clearTimeout() {}, setInterval() {}, fetch: async url => ({ ok: true, json: async () => url.endsWith('campaign.json') ? data : database }) });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../live/performance.js'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  return nodes;
}
test('live dashboard renders grouped24h plan, excludes held/far posts and preserves total capacity', async () => {
  const data = campaign([...drop('Knife', '2026-10-11T20:00:00Z'), ...drop('Door', '2026-10-11T22:00:00Z'), { title: 'Held support post', platform: 'Ko-fi', status: 'draft', scheduledAt: '2026-10-11T20:00:00Z' }, ...drop('Outside horizon', '2026-10-12T20:00:00Z')]);
  const nodes = await renderDashboard(data);
  assert.match(nodes.get('runway').textContent, /2 complete.*24 hours/i);
  assert.match(nodes.get('runway').textContent, /reviewed releases.*quality.*capacity/i);
  assert.equal(nodes.get('queue').children.filter(node => /^(Knife|Door) ·/.test(node.textContent)).length, 2);
  assert.match(nodes.get('queue').children.at(-1).textContent, /4 later scheduled posts remain counted/);
  assert.doesNotMatch(nodes.get('queue').children.map(node => node.textContent).join(' '), /Held support|Outside horizon/);
  assert.equal(nodes.get('capacity').textContent, '7 active + 10 scheduled / 17');
});

test('live dashboard keeps a verified primary placement visible without labeling it incomplete', async () => {
  const nodes = await renderDashboard(campaign([{ groupId: 'tip', title: 'Useful website tip', platform: 'instagram-standalone', scheduledAt: '2026-10-11T21:00:00Z', status: 'scheduled', distributionMode: 'primary_placement', requiredPlatforms: ['Instagram'] }]));
  assert.match(nodes.get('runway').textContent, /1 planned release in the next 24 hours/);
  const output = nodes.get('queue').children.map(node => node.textContent).join(' ');
  assert.match(output, /Useful website tip · Instagram · primary placement/);
  assert.doesNotMatch(output, /incomplete/i);
  assert.equal(nodes.get('capacity').textContent, '7 active + 10 scheduled / 17');
});
