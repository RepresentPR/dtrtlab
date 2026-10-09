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
    '<div class="growth" id="growth"><div class="growth-head"><p class="kpi-label">Growth // Total views</p><p class="growth-delta" id="growth-delta">\u2014</p></div>',
    '<div class="growth-chart" id="growth-chart"><svg class="growth-svg" id="growth-svg" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"></svg><div class="growth-pins" id="growth-pins"></div></div>',
    '<div class="growth-axis" id="growth-axis"></div><p class="growth-note" id="growth-note"></p></div>',
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


  function tparse(s) { // "YYYY-MM-DD HH:MM" in ET
    var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(s || "");
    return m ? Date.parse(m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":00-04:00") : NaN;
  }
  function tlabel(ms, withDay) {
    var d = new Date(ms - 4 * 3600e3), h = d.getUTCHours(), mi = d.getUTCMinutes();
    var hh = (h % 12 || 12) + (mi ? ":" + (mi < 10 ? "0" : "") + mi : "") + (h < 12 ? "a" : "p");
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return withDay ? days[d.getUTCDay()] + " " + hh : hh;
  }
  function growth(points) {
    var svg = $("growth-svg"), pins = $("growth-pins"), axis = $("growth-axis");
    if (!svg) return;
    var P = (points || []).map(function (p) { return { t: tparse(p.at), v: p.views }; })
      .filter(function (p) { return !isNaN(p.t) && p.v != null; });
    if (P.length < 2) { $("growth").style.display = "none"; return; }
    $("growth").style.display = "";
    var t0 = P[0].t, t1 = P[P.length - 1].t, ts = (t1 - t0) || 1;
    var vmax = Math.max.apply(null, P.map(function (p) { return p.v; })) || 1;
    var top = vmax * 1.12;
    function X(t) { return ((t - t0) / ts) * 1000; }
    function Y(v) { return 196 - (v / top) * 186; }
    var line = P.map(function (p, i) { return (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.v).toFixed(1); }).join(" ");
    var grid = [0.25, 0.5, 0.75, 1].map(function (f) {
      var y = Y(vmax * f).toFixed(1); return '<line class="g-grid" x1="0" x2="1000" y1="' + y + '" y2="' + y + '"/>';
    }).join("");
    svg.innerHTML = grid + '<path class="g-area" d="' + line + " L1000 200 L0 200Z" + '"/><path class="g-line" d="' + line + '"/>';
    pins.innerHTML = P.map(function (p, i) {
      var last = i === P.length - 1;
      return '<span class="g-pin' + (last ? " is-last" : "") + '" style="left:' + (X(p.t) / 10) + "%;top:" + (Y(p.v) / 2) + '%"></span>';
    }).join("") +
      '<span class="g-val g-start" style="top:' + (Y(P[0].v) / 2) + '%">' + fmt(P[0].v) + "</span>" +
      '<span class="g-val g-end" style="top:' + (Y(P[P.length - 1].v) / 2) + '%">' + fmt(P[P.length - 1].v) + "</span>" +
      '<span class="g-max">' + fmt(vmax) + "</span>";
    var n = 4, ticks = [];
    for (var i = 0; i <= n; i++) ticks.push(t0 + (ts * i) / n);
    var lastDay = null;
    axis.innerHTML = ticks.map(function (t, i) {
      var day = new Date(t - 4 * 3600e3).getUTCDate(), wd = day !== lastDay; lastDay = day;
      return '<span style="left:' + (i * 100 / n) + '%">' + tlabel(t, wd) + "</span>";
    }).join("");
    var d = P[P.length - 1].v - P[0].v;
    $("growth-delta").innerHTML = "<b>+" + fmt(d) + "</b> views since first post";
    $("growth-note").textContent = P.length + " data points \u00b7 ET \u00b7 views summed across tracked posts";
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
    growth(data.history);

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
