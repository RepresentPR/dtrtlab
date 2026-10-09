/* Live pulse: real-time Twitch + Kick status/viewers for dtrtlab.com. Keyless public sources only.
   HONEST: Twitch/Kick refresh their public viewer counts roughly every 30-60 s, so we poll every 8-15 s and
   show "checked Ns ago" ticking every second. Numbers are never faked. Failure => "n/a", never a stale value. */
(function () {
  if (window.DTRTLive) return;
  var GQL = "https://gql.twitch.tv/gql", CID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
  var CFG = { tw: { every: 8000, name: "Twitch", url: "https://www.twitch.tv/dtrtc" }, kick: { every: 15000, name: "Kick", url: "https://kick.com/movebro" } };
  var STALE_MS = 60000; // older than this with no good reading => n/a
  var S = {
    tw: { live: null, viewers: null, since: null, okAt: 0, changedAt: 0, fails: 0, src: "", gap: CFG.tw.every },
    kick: { live: null, viewers: null, since: null, okAt: 0, changedAt: 0, fails: 0, src: "", gap: CFG.kick.every }
  };
  var timers = {}, shown = {}, tween = {};
  function fresh(k) { return S[k].okAt && Date.now() - S[k].okAt < STALE_MS; }
  function emit() { try { document.dispatchEvent(new CustomEvent("dtrt-live", { detail: api.get() })); } catch (e) {} paint(); }
  function ok(k, live, viewers, since, src) {
    var s = S[k];
    if (s.viewers !== viewers || s.live !== live) s.changedAt = Date.now();
    s.live = live; s.viewers = live ? viewers : null; s.since = live ? since : null; s.okAt = Date.now(); s.fails = 0; s.src = src; s.gap = CFG[k].every;
    emit();
  }
  function bad(k) { var s = S[k]; s.fails++; s.gap = Math.min(60000, CFG[k].every * Math.pow(2, Math.min(s.fails, 3))); emit(); }
  function to(ms, p) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error("timeout")); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }

  function twGql() {
    return to(7000, fetch(GQL, { method: "POST", cache: "no-store", headers: { "Client-ID": CID, "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ query: 'query{user(login:"dtrtc"){stream{viewersCount createdAt}}}' }) }))
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
      .then(function (j) {
        if (!j || !j.data || !j.data.user) throw new Error("shape");
        var st = j.data.user.stream;
        if (!st) return ok("tw", false, null, null, "twitch-gql");
        ok("tw", true, +st.viewersCount, Date.parse(st.createdAt) || null, "twitch-gql");
      });
  }
  function twDecapi() {
    return to(7000, fetch("https://decapi.me/twitch/uptime/dtrtc?t=" + Date.now(), { cache: "no-store" })).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
      t = String(t || "").toLowerCase();
      if (t.indexOf("offline") !== -1) return ok("tw", false, null, null, "decapi");
      if (!/\d/.test(t) || !/hour|minute|second/.test(t)) throw new Error("shape");
      var m = function (re) { var x = re.exec(t); return x ? +x[1] : 0; };
      var since = Date.now() - ((m(/(\d+) hour/) * 3600) + (m(/(\d+) minute/) * 60) + m(/(\d+) second/)) * 1000;
      return to(7000, fetch("https://decapi.me/twitch/viewercount/dtrtc?t=" + Date.now(), { cache: "no-store" })).then(function (r) { return r.text(); }).then(function (v) {
        v = parseInt(v, 10); if (isNaN(v)) throw new Error("shape"); ok("tw", true, v, since, "decapi");
      });
    });
  }
  function pollTw() { twGql().catch(function () { return twDecapi(); }).catch(function () { bad("tw"); }).then(function () { sched("tw", pollTw); }); }
  function pollKick() {
    to(7000, fetch("https://kick.com/api/v2/channels/movebro", { cache: "no-store" })).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
      .then(function (j) {
        var s = j && j.livestream;
        if (j && "livestream" in j) ok("kick", !!(s && s.is_live), s ? +s.viewer_count : null, s && s.start_time ? Date.parse(String(s.start_time).replace(" ", "T") + (/Z|[+-]\d\d:?\d\d$/.test(s.start_time) ? "" : "Z")) || null : null, "kick");
        else throw new Error("shape");
      }).catch(function () { bad("kick"); }).then(function () { sched("kick", pollKick); });
  }
  function sched(k, fn) { clearTimeout(timers[k]); timers[k] = setTimeout(function () { if (document.hidden) { sched(k, fn); return; } fn(); }, S[k].gap); }

  /* ---------- rendering ---------- */
  function $(id) { return document.getElementById(id); }
  function up(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = function (n) { return n < 10 ? "0" + n : "" + n; }; return h + ":" + p(m) + ":" + p(x); }
  function agoS(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return s < 60 ? s + "s ago" : Math.floor(s / 60) + "m " + (s % 60) + "s ago"; }
  function animate(el, k, to) {
    if (to == null) { el.textContent = "n/a"; shown[k] = null; return; }
    var from = shown[k]; if (from == null || from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to.toLocaleString("en-US"); shown[k] = to; return; }
    cancelAnimationFrame(tween[k]); var t0 = performance.now();
    (function step(t) { var f = Math.min(1, (t - t0) / 700), v = Math.round(from + (to - from) * f); el.textContent = v.toLocaleString("en-US"); if (f < 1) tween[k] = requestAnimationFrame(step); else shown[k] = to; })(t0);
    el.classList.remove("lp-bump"); void el.offsetWidth; el.classList.add("lp-bump");
  }
  function ensureBar() {
    if ($("livebar")) return $("livebar");
    var stage = document.querySelector(".stage"); if (!stage || !$("lp")) return null;
    var d = document.createElement("section"); d.id = "livebar"; d.className = "card livebar"; d.setAttribute("aria-label", "Live status");
    d.innerHTML = ["tw", "kick"].map(function (k) {
      return '<div class="lb-col" id="lb-' + k + '"><div class="lb-h"><span class="lb-dot"></span><b>' + CFG[k].name + '</b><span class="lb-st" data-f="st">Checking\u2026</span></div>' +
        '<div class="lb-n"><span data-f="n">\u2014</span><small> watching now</small></div>' +
        '<div class="lb-m">On air for <b data-f="up">n/a</b> \u00b7 checked <b data-f="ck">n/a</b></div></div>';
    }).join("") + '<p class="lb-fine">The clock and timers tick every second. Viewer counts are checked every few seconds, but ' +
      'Twitch and Kick only refresh their public numbers about once a minute, so the number moves in steps. Nothing here is made up; if a check fails it says n/a.</p>';
    stage.parentNode.insertBefore(d, stage); return d;
  }
  function paint() {
    var bar = ensureBar(), pill = $("lp");
    ["tw", "kick"].forEach(function (k) {
      var s = S[k], f = fresh(k), col = bar && bar.querySelector("#lb-" + k); if (!col) return;
      var q = function (n) { return col.querySelector('[data-f="' + n + '"]'); };
      col.className = "lb-col" + (f && s.live ? " is-live" : f ? " is-off" : " is-na");
      q("st").textContent = !f ? (s.okAt ? "n/a" : "Checking\u2026") : s.live ? "LIVE" : "Offline";
      animate(q("n"), k, f && s.live ? s.viewers : null);
      col.querySelector("small").style.display = f && s.live ? "" : "none";
    });
    if (pill) {
      var s = S.tw, f = fresh("tw");
      pill.className = "pill " + (f && s.live ? "live" : "off");
      pill.innerHTML = !f ? (s.okAt ? "Twitch status n/a" : "Checking\u2026") : s.live ? "<i></i>Live now \u00b7 " + (s.viewers != null ? s.viewers.toLocaleString("en-US") + " watching" : "") : "Not live right now";
    }
  }
  var GEN = null;
  function loadGen() {
    if (!$("upd")) return;
    fetch("/content/stats.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var d = j && j.generated_at ? new Date(j.generated_at) : null; GEN = d && !isNaN(d) ? d : null; if (!GEN) $("upd").textContent = "Numbers n/a";
    }).catch(function () { GEN = null; if ($("upd")) $("upd").textContent = "Numbers n/a"; });
  }
  function updStamp() {
    if (!GEN || !$("upd")) return;
    var s = Math.max(0, Math.floor((Date.now() - GEN) / 1000)), a = s < 60 ? s + "s" : s < 3600 ? Math.floor(s / 60) + "m " + (s % 60) + "s" : Math.floor(s / 3600) + "h " + Math.floor(s % 3600 / 60) + "m";
    $("upd").textContent = "Numbers updated " + a + " ago (" + GEN.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }) + " ET)";
  }
  function sec() {
    updStamp(); paint();
    ["tw", "kick"].forEach(function (k) {
      var s = S[k], col = document.querySelector("#lb-" + k); if (!col) return;
      var u = col.querySelector('[data-f="up"]'), c = col.querySelector('[data-f="ck"]'), m = col.querySelector(".lb-m");
      c.textContent = s.okAt ? agoS(Date.now() - s.okAt) : "n/a";
      u.textContent = fresh(k) && s.live && s.since ? up(Date.now() - s.since) : "n/a";
      m.style.display = fresh(k) && s.live ? "" : (s.okAt && !fresh(k) ? "" : "none");
      if (s.okAt && !fresh(k)) paint();
    });
  }
  var api = window.DTRTLive = { get: function () { return JSON.parse(JSON.stringify({ tw: S.tw, kick: S.kick, twFresh: fresh("tw"), kickFresh: fresh("kick") })); }, fresh: fresh, S: S, up: up, agoS: agoS };
  function start() { paint(); pollTw(); pollKick(); loadGen(); setInterval(loadGen, 30000); setInterval(sec, 1000); }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { clearTimeout(timers.tw); clearTimeout(timers.kick); pollTw(); pollKick(); } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
