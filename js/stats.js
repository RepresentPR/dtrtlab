/* Live Lab Stats: plain-language numbers from content/stats.json (public counts only).
   Live status uses keyless endpoints. No keys here. All numbers come from the data file. */
(function () {
  var MARKUP = [
    '<section id="stats" class="lab-stats" aria-labelledby="stats-title"><div class="wrap">',
    '<div class="section-head stats-head"><div><p class="what">What is this? Real numbers from our channels, in plain words.</p><h2 id="stats-title">How the channel is doing</h2></div>',
    '<div class="stats-status"><p class="stat-badges" role="status" aria-live="polite">',
    '<a class="stat-badge" id="badge-twitch" href="https://www.twitch.tv/dtrtc" rel="noopener noreferrer" target="_blank"><span class="dot" aria-hidden="true"></span><span class="b-txt">Twitch</span></a>',
    '<a class="stat-badge" id="badge-kick" href="https://kick.com/movebro" rel="noopener noreferrer" target="_blank"><span class="dot" aria-hidden="true"></span><span class="b-txt">Kick</span></a></p>',
    '<p class="stats-updated" id="stats-updated">Loading the numbers\u2026</p></div></div>',
    '<div class="stats-kpis">',
    '<div class="kpi kpi-main"><p class="kpi-label">Total views</p><p class="kpi-num" id="kpi-views">\u2014</p><p class="kpi-sub" id="kpi-views-sub"></p></div>',
    '<div class="kpi"><p class="kpi-label">Total followers</p><p class="kpi-num" id="kpi-followers">\u2014</p><p class="kpi-sub" id="kpi-fol-sub"></p></div>',
    '</div>',
    '<div class="growth" id="growth"><div class="growth-head"><h3 class="growth-title" id="growth-title">Total views over time</h3>',
    '<div class="seg" role="group" aria-label="Choose what the chart shows"><button type="button" class="seg-b is-on" data-m="views" aria-pressed="true">Views</button><button type="button" class="seg-b" data-m="followers" aria-pressed="false">Followers</button></div></div>',
    '<p class="growth-take" id="growth-take"></p>',
    '<div class="growth-chart" id="growth-chart"></div>',
    '<p class="growth-note" id="growth-note"></p></div>',
    '<div class="race"><h3 class="blk-title">Which site gets the most views?</h3><p class="blk-sub">Views on each site, biggest first.</p><div class="bars" id="race-bars"></div></div>',
    '<details class="more"><summary>Show followers on each site</summary><p class="blk-sub">Followers are people who chose to follow us. The goal is the next round number.</p><div class="bars" id="fol-bars"></div></details>',
    '<div class="clip-pair">',
    '<a class="exhibit-card" id="top-clip" href="#clips" rel="noopener noreferrer" target="_blank"><span class="kpi-label">Most watched clip</span><span class="ex-title" id="top-clip-title">\u2014</span><span class="ex-meta" id="top-clip-meta"></span></a>',
    '<a class="exhibit-card" id="latest-clip" href="#clips" rel="noopener noreferrer" target="_blank"><span class="kpi-label">Newest clip</span><span class="ex-title" id="latest-clip-title">\u2014</span><span class="ex-meta" id="latest-clip-meta"></span></a>',
    '</div>',
    '<p class="fine stats-fine">Only public counts. Views add up our clips on TikTok, Instagram, YouTube Shorts and X. YouTube rounds its follower number, so it has a + sign.</p>',
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
  var data = null, mode = "views";
  var live = { twitch: null, kick: null, tv: null, kv: null };
  var MS = [10, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 25000, 50000, 100000];
  var NAMES = { twitch: "Twitch", kick: "Kick", youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", x: "X" };

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function num(n) { return n == null || isNaN(n) ? "\u2014" : Number(n).toLocaleString("en-US"); }
  function ago(iso) {
    var t = Date.parse(iso);
    if (!t) return "";
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    var h = Math.round(m / 60);
    if (h < 48) return h + " hours ago";
    return Math.round(h / 24) + " days ago";
  }
  function icon(id) { return (window.DTRT_ICONS && window.DTRT_ICONS[id]) || ""; }
  function tparse(s) {
    var m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(s || "");
    return m ? Date.parse(m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":00-04:00") : NaN;
  }
  function tlabel(ms) {
    var d = new Date(ms - 4 * 3600e3), h = d.getUTCHours(), mi = d.getUTCMinutes();
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[d.getUTCDay()] + " " + (h % 12 || 12) + (mi ? ":" + (mi < 10 ? "0" : "") + mi : "") + (h < 12 ? " AM" : " PM");
  }
  function series() {
    return ((data && data.history) || []).map(function (p) { return { t: tparse(p.at), v: p[mode] }; })
      .filter(function (p) { return !isNaN(p.t) && p.v != null; });
  }

  function takeaway(P) {
    var unit = mode === "views" ? "views" : "followers";
    var base = null, i;
    for (i = 0; i < P.length; i++) { if (P[i].v > 0) { base = P[i]; break; } }
    var last = P[P.length - 1];
    if (!base || base === last || last.v === base.v) return "No change in " + unit + " since " + (base ? tlabel(base.t) : "the first count") + ".";
    var diff = last.v - base.v, ratio = last.v / base.v;
    if (ratio >= 1.5) return (mode === "views" ? "Views" : "Followers") + " are up " + (ratio >= 10 ? Math.round(ratio) : (Math.round(ratio * 10) / 10)) + " times since " + tlabel(base.t) + ".";
    return (mode === "views" ? "Views" : "Followers") + " are up by " + num(diff) + " since " + tlabel(base.t) + ".";
  }

  function chart() {
    var box = $("growth-chart"), P = series();
    if (!box) return;
    if (P.length < 2) { $("growth").style.display = "none"; return; }
    $("growth").style.display = "";
    var unit = mode === "views" ? "views" : "followers";
    $("growth-title").textContent = mode === "views" ? "Total views over time" : "Total followers over time";
    $("growth-take").textContent = takeaway(P);
    var W = Math.max(280, box.clientWidth || 600), small = W < 520;
    var H = small ? 220 : 280, padL = 8, padR = small ? 74 : 96, padT = 22, padB = 34;
    var t0 = P[0].t, t1 = P[P.length - 1].t, ts = (t1 - t0) || 1;
    var vmin = Math.min.apply(null, P.map(function (p) { return p.v; })), vmax = Math.max.apply(null, P.map(function (p) { return p.v; }));
    if (mode === "followers") { var pad = Math.max(2, (vmax - vmin) * 0.5); vmin = Math.max(0, vmin - pad); vmax = vmax + pad; } else { vmin = 0; vmax = vmax * 1.08 || 1; }
    var span = (vmax - vmin) || 1;
    function X(t) { return padL + ((t - t0) / ts) * (W - padL - padR); }
    function Y(v) { return padT + (1 - (v - vmin) / span) * (H - padT - padB); }
    var line = P.map(function (p, i) { return (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.v).toFixed(1); }).join(" ");
    var last = P[P.length - 1], lx = X(last.t), ly = Y(last.v), base = H - padB;
    var fs = small ? 15 : 16;
    var svg = '<svg class="g-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' +
      esc(takeaway(P) + " Latest: " + num(last.v) + " " + unit + ".") + '">' +
      '<line class="g-base" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + base + '" y2="' + base + '"/>' +
      '<line class="g-grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + Y(vmax - span * 0.04).toFixed(1) + '" y2="' + Y(vmax - span * 0.04).toFixed(1) + '"/>' +
      '<path class="g-area" d="' + line + " L" + lx.toFixed(1) + " " + base + " L" + padL + " " + base + 'Z"/><path class="g-line" d="' + line + '"/>' +
      '<circle class="g-dot" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="6"/>' +
      '<text class="g-end" x="' + (lx + 12).toFixed(1) + '" y="' + (ly + 2).toFixed(1) + '" font-size="' + (small ? 22 : 26) + '">' + num(last.v) + '</text>' +
      '<text class="g-endu" x="' + (lx + 12).toFixed(1) + '" y="' + (ly + 20).toFixed(1) + '" font-size="' + fs + '">' + unit + '</text>' +
      '<text class="g-ax" x="' + padL + '" y="' + (H - 8) + '" font-size="' + fs + '">' + tlabel(t0) + '</text>' +
      '<text class="g-ax" text-anchor="end" x="' + (lx + 4).toFixed(1) + '" y="' + (H - 8) + '" font-size="' + fs + '">' + tlabel(t1) + '</text></svg>';
    box.innerHTML = svg;
    $("growth-note").textContent = mode === "views"
      ? "Views from all our clips added together. Times are Eastern."
      : "Followers on all six sites added together. Times are Eastern. Counts start when we began tracking.";
  }

  function bars(id, rows) {
    $(id).innerHTML = rows.map(function (r, i) {
      return '<a class="bar-row' + (i === 0 && r.lead ? " is-lead" : "") + '" href="' + esc(r.url) + '" rel="noopener noreferrer" target="_blank">' +
        '<span class="br-name">' + icon(r.id) + "<span>" + esc(r.name) + "</span></span>" +
        '<span class="br-track" aria-hidden="true"><i style="width:' + r.pct.toFixed(1) + '%"></i></span>' +
        '<span class="br-val">' + r.val + "</span></a>";
    }).join("");
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
        on === true ? name + ": live now" + (b[2] ? ", " + b[2] + " watching" : "") : on === false ? name + ": not live right now" : name;
    });
  }

  function render() {
    if (!data) return;
    var t = data.totals || {}, P = data.platforms || [];
    $("kpi-views").textContent = num(t.views);
    $("kpi-views-sub").innerHTML = t.views_week != null ? "<b>+" + num(t.views_week) + " views</b> in the last 7 days" : "";
    $("kpi-followers").textContent = num(t.followers);
    var fs = ((data.history || []).filter(function (p) { return p.followers != null; }));
    var fd = fs.length > 1 ? fs[fs.length - 1].followers - fs[0].followers : null;
    $("kpi-fol-sub").innerHTML = fd != null ? (fd > 0 ? "<b>+" + num(fd) + " followers</b> since " + tlabel(tparse(fs[0].at)) : "Same as " + tlabel(tparse(fs[0].at))) : "On all six sites";
    chart();

    var R = P.filter(function (p) { return p.views != null; }).sort(function (a, b) { return b.views - a.views; });
    var mx = (R[0] && R[0].views) || 1;
    bars("race-bars", R.map(function (p) {
      return { id: p.id, name: NAMES[p.id] || p.label, url: p.url, pct: Math.max(2, p.views / mx * 100), val: "<b>" + num(p.views) + "</b> views", lead: true };
    }));
    var F = P.filter(function (p) { return p.followers != null; }).sort(function (a, b) { return b.followers - a.followers; });
    var fm = (F[0] && F[0].followers) || 1;
    bars("fol-bars", F.map(function (p) {
      var g = MS.filter(function (m) { return m > p.followers; })[0];
      return { id: p.id, name: NAMES[p.id] || p.label, url: p.url, pct: Math.max(2, p.followers / fm * 100),
        val: "<b>" + num(p.followers) + (p.followers_rounded ? "+" : "") + "</b> followers" + (g ? '<small>goal ' + num(g) + "</small>" : ""), lead: false };
    }));

    [["top", data.top_clip], ["latest", data.latest_clip]].forEach(function (c) {
      var clip = c[1], a = $(c[0] + "-clip");
      if (!clip || !a) return;
      $(c[0] + "-clip-title").textContent = clip.title;
      $(c[0] + "-clip-meta").textContent = num(clip.views) + " views" + (clip.posted ? " \u00b7 posted " + ago(clip.posted) : "");
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
      .catch(function () { $("stats-updated").textContent = "Numbers are offline right now"; });
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".seg-b");
    if (!b) return;
    mode = b.getAttribute("data-m");
    root.querySelectorAll(".seg-b").forEach(function (x) {
      var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false");
    });
    chart();
  });
  var rz;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(chart, 150); });

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
