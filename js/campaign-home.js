(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) { root.DtrtCampaign = api; api.start(root.document, root); }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  var SITE = 'https://dtrtlab.com';
  var HOSTS = new Set(['dtrtlab.com', 'www.dtrtlab.com', 'youtube.com', 'www.youtube.com', 'youtu.be', 'instagram.com', 'www.instagram.com', 'tiktok.com', 'www.tiktok.com', 'twitch.tv', 'www.twitch.tv', 'clips.twitch.tv', 'x.com', 'www.x.com', 'faceit.com', 'www.faceit.com']);
  function safeUrl(input) {
    if (typeof input !== 'string' || !input.trim()) return null;
    try {
      var url = new URL(input, SITE);
      return url.protocol === 'https:' && !url.username && !url.password && !url.port && HOSTS.has(url.hostname) ? url.href : null;
    } catch (_) { return null; }
  }
  function cleanText(value, limit) { return typeof value === 'string' ? value.trim().slice(0, limit || 180) : ''; }
  function amount(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null; }
  function count(value) { return Number.isSafeInteger(value) && value >= 0 ? value : null; }
  function time(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null; }
  function metric(raw, target, now) {
    var value = raw && raw.status === 'verified' ? amount(raw.value) : null;
    var observed = value === null ? null : time(raw.observedAt);
    if (observed !== null && observed > now + 300000) observed = null;
    return { value: value, target: target, progress: value === null ? null : Math.min(100, value / target * 100), note: cleanText(raw && raw.note, 180), observedAt: observed === null ? null : new Date(observed).toISOString(), freshness: observed === null ? 'unknown' : now - observed > 21600000 ? 'stale' : 'recent' };
  }
  function createViewModel(data, now) {
    data = data && typeof data === 'object' ? data : {};
    now = Number.isFinite(now) ? now : Date.now();
    var campaign = data.campaign || {};
    var captured = time(data.capturedAt);
    if (captured !== null && captured > now + 300000) captured = null;
    var operations = data.operations || {};
    var queueTime = time(operations.queueVerifiedAt);
    if (queueTime !== null && queueTime > now + 300000) queueTime = null;
    var queueFreshness = queueTime === null ? 'unknown' : now - queueTime > 21600000 ? 'stale' : 'recent';
    var active = count(operations.activePosts), scheduled = count(operations.scheduledPosts);
    var highlights = (Array.isArray(data.highlights) ? data.highlights : []).filter(function (entry) {
      return entry && entry.status === 'approved' && cleanText(entry.title) && safeUrl(entry.url) && time(entry.reviewedAt) !== null && time(entry.reviewedAt) <= now;
    }).slice(0, 5).map(function (entry) {
      return { title: cleanText(entry.title), platform: cleanText(entry.platform, 40), url: safeUrl(entry.url), reason: cleanText(entry.reason, 220), reviewedAt: entry.reviewedAt };
    });
    var allUpcoming = (Array.isArray(data.queue) ? data.queue : []).filter(function (entry) {
      return entry && entry.status === 'scheduled' && cleanText(entry.title) && time(entry.scheduledAt) !== null && time(entry.scheduledAt) >= now;
    }).sort(function (a, b) { return time(a.scheduledAt) - time(b.scheduledAt); }).map(function (entry) {
      return { groupId: cleanText(entry.groupId, 120), title: cleanText(entry.title), platform: cleanText(entry.platform, 40), scheduledAt: entry.scheduledAt };
    });
    var queue = allUpcoming.filter(function (entry) { return time(entry.scheduledAt) <= now + 86400000; });
    var required = ['YouTube', 'Instagram', 'TikTok', 'X'];
    var aliases = { youtube: 'YouTube', instagram: 'Instagram', 'instagram-standalone': 'Instagram', tiktok: 'TikTok', 'tiktok-business': 'TikTok', x: 'X' };
    var groups = [], grouped = new Map();
    allUpcoming.forEach(function (entry) { if (entry.groupId) { if (!grouped.has(entry.groupId)) grouped.set(entry.groupId, []); grouped.get(entry.groupId).push(entry); } });
    grouped.forEach(function (members, groupId) {
      var main = members.filter(function (entry) { return required.includes(aliases[entry.platform.toLowerCase()]); });
      var complete = main.length === 4 && required.every(function (platform) { return main.filter(function (entry) { return aliases[entry.platform.toLowerCase()] === platform; }).length === 1; });
      if (!complete || !main.every(function (entry) { return time(entry.scheduledAt) === time(main[0].scheduledAt) && time(entry.scheduledAt) <= now + 86400000; })) return;
      var visible = members.filter(function (entry) { return time(entry.scheduledAt) === time(main[0].scheduledAt); });
      groups.push({ groupId: groupId, title: main[0].title, scheduledAt: main[0].scheduledAt, platforms: Array.from(new Set(visible.map(function (entry) { return aliases[entry.platform.toLowerCase()] || entry.platform; }))) });
    });
    groups.sort(function (a, b) { return time(a.scheduledAt) - time(b.scheduledAt); });
    var completeDates = new Map(groups.map(function (group) { return [group.groupId, time(group.scheduledAt)]; }));
    var incompleteQueue = queue.filter(function (entry) { return completeDates.get(entry.groupId) !== time(entry.scheduledAt); });
    var runwayDays = allUpcoming.length ? Math.max(0, (time(allUpcoming[allUpcoming.length - 1].scheduledAt) - now) / 86400000) : 0;
    return {
      capturedAt: captured === null ? null : new Date(captured).toISOString(),
      freshness: captured === null ? 'unknown' : now - captured > 21600000 ? 'stale' : 'recent',
      lifetimeViews: metric((data.results || {}).lifetimeViews, amount(campaign.viewsGoal) || 250000, now),
      viewPace: (function () { var reading = metric((data.results || {}).lifetimeViews, amount(campaign.viewsGoal) || 250000, now); var end = time(campaign.viewsDeadlineAt); var daysLeft = end === null ? null : Math.max(0, (end - now) / 86400000); var gap = reading.value === null ? null : Math.max(0, reading.target - reading.value); return { gap: gap, daysLeft: daysLeft, daily: gap === null || !daysLeft ? null : Math.ceil(gap / daysLeft), fourHourly: gap === null || !daysLeft ? null : Math.ceil(gap / (daysLeft * 6)) }; })(),
      views: metric((data.results || {}).views, amount(campaign.viewsGoal) || 250000, now),
      spend: { newAuthorizedUsd: 0, newVerifiedUsd: amount((data.spend || {}).newVerifiedUsd) },
      operations: { active: active, scheduled: scheduled, used: active === null || scheduled === null ? null : active + scheduled, cap: 17, overCapacity: active !== null && scheduled !== null && active + scheduled > 17, runwayDays: runwayDays, runwayVerified: queueFreshness === 'recent', queueFreshness: queueFreshness, queueVerifiedAt: queueTime === null ? null : new Date(queueTime).toISOString(), planningHorizonHours: 24, targetSpacingHours: 2, completeDrops: groups.length, outsideHorizonPosts: allUpcoming.length - queue.length },
      highlights: highlights, queue: queue, groups: groups, incompleteQueue: incompleteQueue,
      evidenceNotes: (Array.isArray(data.evidenceNotes) ? data.evidenceNotes : []).map(function (note) { return cleanText(note, 500); }).filter(Boolean).slice(0, 12)
    };
  }
  function start(doc, win) {
    if (!doc.getElementById('data-status')) return;
    var number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    var date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' });
    var lastData = null, busy = false;
    function set(id, text) { var node = doc.getElementById(id); if (node) node.textContent = text; }
    function dateLabel(value) { return date.format(new Date(value)); }
    function element(tag, className, text) { var node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
    function renderMetric(name, reading) {
      set(name + '-value', reading.value === null ? '—' : number.format(reading.value));
      set(name + '-goal', number.format(reading.target));
      var bar = doc.getElementById(name + '-progress');
      bar.hidden = reading.progress === null;
      if (reading.progress !== null) bar.value = reading.progress;
      var note = name === 'views' && reading.value !== null
        ? 'Partial tracked total from matched counters and campaign posts. See Results for coverage.'
        : reading.note || (reading.value === null ? 'Baseline pending. No gain claimed yet.' : 'Added views since the campaign baseline.');
      if (reading.value !== null) note += reading.observedAt ? ' Measured ' + dateLabel(reading.observedAt) + (reading.freshness === 'stale' ? ' · over 6 hours old.' : '.') : ' Measurement time unavailable.';
      set(name + '-note', note);
      doc.getElementById(name + '-note').classList.toggle('warning', reading.value !== null && reading.freshness !== 'recent');
    }
    function render(data) {
      var view = createViewModel(data);
      set('lifetime-value', view.lifetimeViews.value === null ? '\u2014' : number.format(view.lifetimeViews.value));
      set('lifetime-note', (view.lifetimeViews.value === null ? 'Inventory totals pending.' : 'Dated historical and current post inventory. See Results for scope and limits.') + (view.lifetimeViews.observedAt ? ' Earliest component measured ' + dateLabel(view.lifetimeViews.observedAt) + '.' : ''));
      var lifetimeBar = doc.getElementById('lifetime-progress'); if (lifetimeBar) { lifetimeBar.hidden = view.lifetimeViews.value === null; lifetimeBar.value = view.lifetimeViews.progress || 0; }
      set('view-pace', view.viewPace.daily === null ? 'Pace unavailable until dated totals are verified.' : number.format(view.viewPace.gap) + ' views remaining. Required average: ' + number.format(view.viewPace.daily) + ' views/day or ' + number.format(view.viewPace.fourHourly) + ' views per 4 hours, through December 31 Eastern. Recalculated from the latest known total and time remaining; planning targets, not guaranteed results.');
      renderMetric('views', view.views);
      var status = doc.getElementById('data-status');
      status.dataset.state = view.freshness;
      var pending = view.views.value === null;
      set('data-status', view.freshness === 'stale' ? 'Saved ' + dateLabel(view.capturedAt) + ' · over 6 hours old' : view.freshness === 'unknown' ? 'Update time unavailable · verification pending' : 'Saved ' + dateLabel(view.capturedAt) + (pending ? ' · some measurements pending' : ' · measurement dates below'));
      set('saved-at', view.capturedAt ? 'Last saved update: ' + dateLabel(view.capturedAt) + '.' : 'Last saved update: unavailable.');
      set('spend-note', (view.spend.newVerifiedUsd === null ? 'Actual new spend: verification pending.' : 'Verified new spend: ' + money.format(view.spend.newVerifiedUsd) + '.') + ' This is a campaign budget, not an all-time cost claim.');
      set('roster-count', (view.operations.used === null ? '—' : number.format(view.operations.used)) + ' / 17');
      set('roster-detail', 'Saved: ' + (view.operations.active === null ? 'unknown' : number.format(view.operations.active)) + ' active · ' + (view.operations.scheduled === null ? 'unknown' : number.format(view.operations.scheduled)) + ' scheduled' + (view.operations.queueVerifiedAt ? ' · as of ' + dateLabel(view.operations.queueVerifiedAt) : ' · reconciliation pending'));
      set('runway-count', number.format(view.operations.completeDrops) + ' complete ' + (view.operations.completeDrops === 1 ? 'drop' : 'drops'));
      set('plan-detail', 'Next 24 hours · target every 2 hours when quality and the 17-post cap permit. Ko-fi is optional.');
      set('queue-verification', view.operations.queueFreshness === 'stale' ? 'Saved schedule · checked ' + dateLabel(view.operations.queueVerifiedAt) + ' · over 6 hours old' : view.operations.queueVerifiedAt ? 'Saved schedule · checked ' + dateLabel(view.operations.queueVerifiedAt) : 'Saved schedule · queue verification pending');
      doc.getElementById('queue-verification').classList.toggle('warning', view.operations.queueFreshness === 'stale');
      set('roster-rule', view.operations.overCapacity ? 'Capacity exceeded. Publishing must pause until the roster is reconciled.' : '17 is the ceiling, never a quota. An empty spot is better than a weak clip.');
      doc.getElementById('roster-rule').classList.toggle('warning', view.operations.overCapacity);
      var notes = doc.getElementById('evidence-notes'); notes.replaceChildren();
      view.evidenceNotes.forEach(function (note) { notes.appendChild(element('li', '', note)); });
      var highlights = doc.getElementById('highlight-list'); highlights.replaceChildren();
      if (!view.highlights.length) {
        var empty = element('div', 'empty-state'), icon = element('span', 'empty-icon', '▶'), words = element('div');
        icon.setAttribute('aria-hidden', 'true'); words.append(element('h3', '', 'Reviewed clips being prepared.'), element('p', '', 'The strongest moments appear here after review. Quality earns the space.')); empty.append(icon, words); highlights.appendChild(empty);
      } else view.highlights.forEach(function (clip, index) {
        var row = element('a', 'highlight-row'); row.href = clip.url; row.rel = 'noopener noreferrer';
        var words = element('div'); words.append(element('h3', '', clip.title), element('p', '', [clip.platform, clip.reason || 'Reviewed ' + dateLabel(clip.reviewedAt)].filter(Boolean).join(' · ')));
        var arrow = element('span', 'arrow', '↗'); arrow.setAttribute('aria-hidden', 'true'); row.append(element('span', 'highlight-number', String(index + 1).padStart(2, '0')), words, arrow); highlights.appendChild(row);
      });
      var queue = doc.getElementById('queue-list'); queue.replaceChildren();
      if (!view.queue.length) queue.appendChild(element('p', '', 'No scheduled posts in the next 24 hours. All saved reservations still count toward capacity until reconciled.'));
      else {
        var list = element('ul', 'queue-list');
        view.groups.forEach(function (group) { var row = element('li'), words = element('span', '', group.title), when = element('time', '', dateLabel(group.scheduledAt)); when.dateTime = group.scheduledAt; words.appendChild(element('span', 'platform', group.platforms.join(' · '))); row.append(words, when); list.appendChild(row); });
        if (view.incompleteQueue.length) queue.appendChild(element('p', '', view.incompleteQueue.length + ' saved platform posts do not form a complete four-platform drop.'));
        view.incompleteQueue.forEach(function (post) { var row = element('li'), words = element('span', '', post.title), when = element('time', '', dateLabel(post.scheduledAt)); when.dateTime = post.scheduledAt; words.appendChild(element('span', 'platform', post.platform + ' · incomplete drop')); row.append(words, when); list.appendChild(row); });
        queue.appendChild(list);
      }
      if (view.operations.outsideHorizonPosts) queue.appendChild(element('p', '', view.operations.outsideHorizonPosts + ' later scheduled posts remain counted in saved capacity outside this 24-hour display.'));
    }
    async function refresh() {
      if (busy || doc.hidden) return;
      busy = true;
      var controller = new AbortController(), timeout = win.setTimeout(function () { controller.abort(); }, 12000);
      try {
        var response = await win.fetch('/content/campaign.json', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Campaign record unavailable');
        var data = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data) || !data.campaign || !data.results) throw new Error('Invalid campaign record');
        lastData = data; render(data);
      } catch (_) {
        if (lastData) render(lastData);
        set('data-status', lastData ? 'Refresh unavailable · showing the last saved reading' : 'Campaign record unavailable · targets shown; results unverified');
        doc.getElementById('data-status').dataset.state = 'error';
      } finally { win.clearTimeout(timeout); busy = false; }
    }
    refresh(); win.setInterval(refresh, 60000);
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) refresh(); });
  }
  return { createViewModel: createViewModel, safeUrl: safeUrl, start: start };
});
