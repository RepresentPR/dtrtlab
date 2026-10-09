/* Live Lab Stats. Reads content/stats.json (public numbers, refreshed by the box)
   and checks Twitch/Kick live status client-side with keyless endpoints. No keys here. */
(function () {
  var MARKUP = [
    '<section id="stats" class="lab-stats" aria-labelledby="stats-title"><div class="wrap">',
    '<div class="section-head stats-head"><div><p class="hud">Telemetry // Live Lab Stats</p><h2 id="stats-title">Live Lab Stats</h2></div>',
    '<div class="stats-status"><p class="stat-badges" role="status" aria-live="polite">',
    '<a class="stat-badge" id="badge-twitch" href="https://www.twitch.tv/dtrtc" rel="noopener noreferrer" target="_blank"><span class="dot" aria-hidden="true"></span><span class="b-txt">Twitch</span></a>',
    '<a class="stat-badge" id="badge-kick" href="https://kick.com/movebro" rel="noopener noreferrer" target="_blank"><span class="dot" aria-hidden="true"></span><span class="b-txt">Kick</span></a></p>',
    '<p class="stats-updated" id="stats-updated">Reading the instruments\u2026</p></div></div>',
    '<div class="stats-kpis">',
    '<div class="kpi kpi-main"><p class="kpi-label">Total views \u00b7 all clips</p><p class="kpi-num" id="kpi-views">\u2014</p><p class="kpi-sub"><span id="kpi-week">\u2014</span> this week</p><svg class="spark" id="kpi-spark" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"></svg></div>',
    '<div class="kpi"><p class="kpi-label">Followers \u00b7 6 platforms</p><p class="kpi-num" id="kpi-followers">\u2014</p><p class="kpi-sub">Twitch \u00b7 Kick \u00b7 YouTube \u00b7 TikTok \u00b7 IG \u00b7 X</p></div>',
    '<a class="kpi kpi-link" id="kpi-lf001" href="https://www.youtube.com/watch?v=lsExh8z7fVI" rel="noopener noreferrer" target="_blank"><p class="kpi-label">Lab File #001 \u00b7 YouTube</p><p class="kpi-num" id="kpi-lf001-views">New</p><p class="kpi-sub">Come On, Code \u25b8 watch</p></a>',
    '</div>',
    '<div class="plat-grid" id="plat-grid"></div>',
    '<div class="clip-pair">',
    '<a class="exhibit-card" id="top-clip" href="#clips" rel="noopener noreferrer" target="_blank"><span class="kpi-label">Top clip</span><span class="ex-title" id="top-clip-title">\u2014</span><span class="ex-meta" id="top-clip-meta"></span></a>',
    '<a class="exhibit-card" id="latest-clip" href="#clips" rel="noopener noreferrer" target="_blank"><span class="kpi-label">Latest clip</span><span class="ex-title" id="latest-clip-title">\u2014</span><span class="ex-meta" id="latest-clip-meta"></span></a>',
    '</div>',
    '<p class="fine stats-fine">Public counts only. Clip views are summed across tracked posts on TikTok, Reels, Shorts and X; YouTube rounds its subscriber count.</p>',
    '</div></section>'
  ].join("");

  var root = document.getElementById("stats");
  if (!root) {
    var before = document.getElementById("trailer") || document.getElementById("clips");
    if (!before || !before.parentNode) return;
    var holder = document.createElement("div");
    holder.innerHTML = MARKUP;
    root = holder.firstChild;
    before.parentNode.insertBefore(root, before);
  }
  var data = null;
  var live = { twitch: null, kick: null, tv: null, kv: null };

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(n) {
    if (n == null || isNaN(n)) return "\u2014";
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K";
    return Number(n).toLocaleString("en-US");
  }
  function ago(iso) {
    var t = Date.parse(iso);
    if (!t) return "";
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    var h = Math.round(m / 60);
    if (h < 48) return h + " h ago";
    return Math.round(h / 24) + " days ago";
  }
  function icon(id) { return (window.DTRT_ICONS && window.DTRT_ICONS[id]) || ""; }

  function spark(points) {
    var svg = $("kpi-spark");
    if (!svg) return;
    var vals = (points || []).map(function (p) { return p.views; }).filter(function (v) { return v != null; });
    if (vals.length < 2) { svg.innerHTML = '<line x1="0" y1="28" x2="120" y2="28" class="spark-base"/>'; return; }
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), span = max - min || 1;
    var pts = vals.map(function (v, i) {
      return ((i / (vals.length - 1)) * 120).toFixed(1) + "," + (29 - ((v - min) / span) * 26).toFixed(1);
    });
    var last = pts[pts.length - 1].split(",");
    svg.innerHTML =
      '<polygon class="spark-fill" points="0,32 ' + pts.join(" ") + ' 120,32"/>' +
      '<polyline class="spark-line" points="' + pts.join(" ") + '"/>' +
      '<circle class="spark-dot" r="2.4" cx="' + last[0] + '" cy="' + last[1] + '"/>';
  }

  function badges() {
    [["twitch", live.twitch, live.tv], ["kick", live.kick, live.kv]].forEach(function (b) {
      var el = $("badge-" + b[0]);
      if (!el) return;
      var on = b[1];
      el.classList.toggle("is-live", on === true);
      el.classList.toggle("is-off", on === false);
      var name = b[0] === "twitch" ? "Twitch" : "Kick";
      el.querySelector(".b-txt").textContent =
        on === true ? name + " \u00b7 Live" + (b[2] ? " \u00b7 " + b[2] + " watching" : "") : on === false ? name + " \u00b7 Offline" : name;
    });
    document.querySelectorAll(".plat-card[data-id=twitch], .plat-card[data-id=kick]").forEach(function (c) {
      var on = c.getAttribute("data-id") === "twitch" ? live.twitch : live.kick;
      c.classList.toggle("is-live", on === true);
    });
  }

  function render() {
    if (!data) return;
    var t = data.totals || {};
    $("kpi-views").textContent = fmt(t.views);
    $("kpi-week").textContent = "+" + fmt(t.views_week);
    $("kpi-followers").textContent = fmt(t.followers);
    var lf = data.lab_file_001 || {};
    $("kpi-lf001-views").textContent = lf.views != null ? fmt(lf.views) : "New";
    spark(data.history);

    $("plat-grid").innerHTML = (data.platforms || []).map(function (p) {
      var f = p.followers != null ? fmt(p.followers) : "\u2014";
      var views = p.views != null ? fmt(p.views) : null;
      var second = views != null
        ? '<span class="pc-stat"><b>' + views + "</b> views</span>"
        : (p.live_viewers ? '<span class="pc-stat"><b>' + fmt(p.live_viewers) + "</b> watching</span>" : '<span class="pc-stat pc-dim">streams</span>');
      return (
        '<a class="plat-card" data-id="' + esc(p.id) + '" href="' + esc(p.url) + '" rel="noopener noreferrer" target="_blank" aria-label="' +
        esc(p.label + " " + p.handle + ": " + f + " followers" + (views ? ", " + views + " views" : "")) + '">' +
        '<span class="pc-top"><span class="pc-icon">' + icon(p.id) + '</span><span class="pc-live">Live</span></span>' +
        '<span class="pc-name">' + esc(p.label) + '</span><span class="pc-handle">' + esc(p.handle) + "</span>" +
        '<span class="pc-num">' + f + '</span><span class="pc-unit">followers</span>' + second +
        "</a>"
      );
    }).join("");

    [["top", data.top_clip], ["latest", data.latest_clip]].forEach(function (c) {
      var clip = c[1], a = $(c[0] + "-clip");
      if (!clip || !a) return;
      $(c[0] + "-clip-title").textContent = clip.title;
      $(c[0] + "-clip-meta").textContent = fmt(clip.views) + " views" + (clip.posted ? " \u00b7 posted " + ago(clip.posted) : "");
      if (clip.url) a.href = clip.url;
    });
    if (live.twitch == null && data.live) { live.twitch = data.live.twitch; live.tv = data.live.twitch_viewers; }
    if (live.kick == null && data.live) { live.kick = data.live.kick; live.kv = data.live.kick_viewers; }
    badges();
    tick();
  }

  function tick() {
    if (data && data.generated_at) $("stats-updated").textContent = "Updated " + ago(data.generated_at);
  }

  function load() {
    fetch("/content/stats.json?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j) { data = j; render(); } })
      .catch(function () { $("stats-updated").textContent = "Stats offline"; });
  }

  function checkLive() {
    fetch("https://decapi.me/twitch/uptime/dtrtc", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (txt) {
        txt = String(txt || "").toLowerCase();
        if (txt.indexOf("offline") !== -1) { live.twitch = false; live.tv = null; badges(); }
        else if (/\d/.test(txt) && /hour|minute|second/.test(txt)) {
          live.twitch = true; badges();
          return fetch("https://decapi.me/twitch/viewercount/dtrtc", { cache: "no-store" })
            .then(function (r) { return r.ok ? r.text() : ""; })
            .then(function (v) { v = parseInt(v, 10); if (!isNaN(v)) { live.tv = v; badges(); } });
        }
      })
      .catch(function () {});
    fetch("https://kick.com/api/v2/channels/movebro", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        var s = j.livestream;
        live.kick = !!(s && s.is_live);
        live.kv = live.kick ? s.viewer_count : null;
        badges();
      })
      .catch(function () {});
  }

  load();
  checkLive();
  setInterval(tick, 30000);
  setInterval(checkLive, 90000);
  setInterval(load, 300000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { load(); checkLive(); }
  });
})();
