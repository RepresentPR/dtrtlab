/* Live front page: while dtrtc is live (or content/force_live.json force:true) send homepage visitors to /live/.
   JS only (no server redirect), canonical stays /. Skips: ?main=1, ?offline=1, bots, same-site referrers, "Main site" choice this session. */
(function () {
  try {
    var q = location.search || "";
    var K = "dtrt-live-front", M = "dtrt-main-site";
    if (/[?&]main=1/.test(q)) { try { sessionStorage.setItem(M, "1"); } catch (e) {} return; }
    if (/[?&](offline|nolive)=1/.test(q)) return;
    if (/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent || "")) return;
    try { if (document.referrer && new URL(document.referrer).host === location.host) return; } catch (e) {}
    try { if (sessionStorage.getItem(M) === "1") return; } catch (e) {}
    function go() { location.replace("/live/"); }
    try {
      var c = JSON.parse(sessionStorage.getItem(K) || "null");
      if (c && c.live && Date.now() - c.at < 60000) { go(); return; }
    } catch (e) {}
    var done = false;
    function yes() {
      if (done) return;
      done = true;
      try { sessionStorage.setItem(K, JSON.stringify({ live: 1, at: Date.now() })); } catch (e) {}
      go();
    }
    function get(url, ms, cb) {
      var a = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function () { if (a) a.abort(); }, ms);
      var o = { cache: "no-store" };
      if (a) o.signal = a.signal;
      fetch(url, o).then(function (r) { return r.text(); }).then(function (x) { clearTimeout(t); cb(x); }, function () { clearTimeout(t); });
    }
    get("/content/force_live.json", 2500, function (x) {
      try { if (JSON.parse(x).force === true) yes(); } catch (e) {}
    });
    get("https://decapi.me/twitch/uptime/dtrtc", 3500, function (x) {
      var b = String(x || "").toLowerCase();
      if (b.indexOf("offline") === -1 && /\d/.test(b) && /hour|minute|second/.test(b)) yes();
      else try { sessionStorage.removeItem(K); } catch (e) {}
    });
  } catch (e) {}
})();
