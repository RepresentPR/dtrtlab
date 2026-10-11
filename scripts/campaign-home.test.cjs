const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../js/campaign-home.js');
const model = fs.existsSync(source) ? require(source) : {};
const now = Date.parse('2026-10-11T12:00:00Z');
function campaign(overrides = {}) {
  return {
    capturedAt: '2026-10-11T11:00:00Z',
    campaign: { startAt: '2026-10-11T06:28:12Z', deadlineAt: '2026-12-25T05:00:00Z', viewsGoal: 250000, revenueGoalUsd: 10000 },
    results: { views: { value: null, status: 'baseline_pending' }, revenue: { value: null, status: 'baseline_pending' } },
    spend: { newAuthorizedUsd: 0, newVerifiedUsd: null },
    operations: { activePosts: 0, scheduledPosts: 0, cap: 17, runwayDays: 0, queueVerifiedAt: null },
    highlights: [], queue: [], evidenceNotes: [], ...overrides
  };
}
test('pending campaign metrics never turn null or unverified values into zero', () => {
  assert.equal(typeof model.createViewModel, 'function', 'campaign data model must be implemented');
  const view = model.createViewModel(campaign({ results: { views: { value: 25000, status: 'baseline_pending' }, revenue: { value: null, status: 'verified' } } }), now);
  assert.equal(view.views.value, null);
  assert.equal(view.revenue.value, null);
  assert.equal(view.views.progress, null);
});
test('verified zero and earned progress survive while invalid money is withheld', () => {
  const view = model.createViewModel(campaign({ results: { views: { value: 125000, status: 'verified' }, revenue: { value: 0, status: 'verified' } } }), now);
  assert.equal(view.views.progress, 50);
  assert.equal(view.revenue.value, 0);
  assert.equal(model.createViewModel(campaign({ results: { revenue: { value: -1, status: 'verified' } } }), now).revenue.value, null);
});
test('saved observations become stale and malformed future timestamps do not appear fresh', () => {
  assert.equal(model.createViewModel(campaign({ capturedAt: '2026-10-11T00:00:00Z' }), now).freshness, 'stale');
  assert.equal(model.createViewModel(campaign({ capturedAt: '2027-01-01T00:00:00Z' }), now).freshness, 'unknown');
  assert.equal(model.createViewModel(campaign(), now).freshness, 'recent');
});
test('combined scheduled and active posts cannot conceal a breach of the 17 post ceiling', () => {
  const view = model.createViewModel(campaign({ operations: { activePosts: 5, scheduledPosts: 14, cap: 100, runwayDays: 7, queueVerifiedAt: null } }), now);
  assert.equal(view.operations.used, 19);
  assert.equal(view.operations.cap, 17);
  assert.equal(view.operations.overCapacity, true);
  assert.equal(view.operations.runwayVerified, false);
});
test('only approved dated highlights on allowed destinations appear', () => {
  const good = { title: 'A real moment', platform: 'YouTube', url: 'https://www.youtube.com/shorts/abc', status: 'approved', reviewedAt: '2026-10-11T10:00:00Z' };
  const view = model.createViewModel(campaign({ highlights: [good, { ...good, status: 'pending' }, { ...good, url: 'javascript:alert(1)' }, { ...good, url: 'https://youtube.com.attacker.test/abc' }, { ...good, reviewedAt: null }] }), now);
  assert.equal(view.highlights.length, 1);
  assert.equal(view.highlights[0].url, good.url);
  assert.equal(model.safeUrl('https://www.youtube.com@attacker.test/abc'), null);
  assert.equal(model.safeUrl('/clips/#lurk-king'), 'https://dtrtlab.com/clips/#lurk-king');
});
test('queue lists only upcoming scheduled entries in time order', () => {
  const view = model.createViewModel(campaign({ queue: [
    { title: 'Later', platform: 'Instagram', scheduledAt: '2026-10-13T12:00:00Z', status: 'scheduled' },
    { title: 'Earlier', platform: 'YouTube', scheduledAt: '2026-10-12T12:00:00Z', status: 'scheduled' },
    { title: 'Draft', platform: 'YouTube', scheduledAt: '2026-10-12T12:00:00Z', status: 'draft' },
    { title: 'Past', platform: 'YouTube', scheduledAt: '2026-10-10T12:00:00Z', status: 'scheduled' }
  ] }), now);
  assert.deepEqual(view.queue.map(item => item.title), ['Earlier', 'Later']);
});
test('invalid roster counts are unknown rather than an apparently empty queue', () => {
  const view = model.createViewModel(campaign({ operations: { activePosts: null, scheduledPosts: '14', cap: 17 } }), now);
  assert.equal(view.operations.active, null);
  assert.equal(view.operations.scheduled, null);
  assert.equal(view.operations.used, null);
});
test('runway falls as the saved schedule ages and reaches zero after the last post', () => {
  const data = campaign({ operations: { activePosts: 0, scheduledPosts: 2, cap: 17, runwayDays: 7, queueVerifiedAt: '2026-10-11T11:00:00Z' }, queue: [
    { title: 'First', platform: 'YouTube', scheduledAt: '2026-10-12T12:00:00Z', status: 'scheduled' },
    { title: 'Last', platform: 'Instagram', scheduledAt: '2026-10-13T12:00:00Z', status: 'scheduled' },
    { title: 'Unapproved future', platform: 'YouTube', scheduledAt: '2026-12-12T12:00:00Z', status: 'draft' }
  ] });
  assert.equal(model.createViewModel(data, now).operations.runwayDays, 2);
  assert.equal(model.createViewModel(data, now + 86400000).operations.runwayDays, 1);
  const expired = model.createViewModel(data, now + 3 * 86400000);
  assert.equal(expired.operations.runwayDays, 0);
  assert.equal(expired.queue.length, 0);
  assert.equal(expired.operations.scheduled, 2, 'saved count is retained for reconciliation, not silently released');
});
test('queue verification expires after six hours even if the overall record was just updated', () => {
  const data = campaign({ operations: { activePosts: 0, scheduledPosts: 1, cap: 17, runwayDays: 7, queueVerifiedAt: '2026-10-11T11:00:00Z' } });
  assert.equal(model.createViewModel(data, now).operations.queueFreshness, 'recent');
  assert.equal(model.createViewModel(data, now).operations.runwayVerified, true);
  const stale = model.createViewModel({ ...data, capturedAt: '2026-10-11T18:00:00Z' }, now + 6 * 3600000);
  assert.equal(stale.freshness, 'recent');
  assert.equal(stale.operations.queueFreshness, 'stale');
  assert.equal(stale.operations.runwayVerified, false);
});
