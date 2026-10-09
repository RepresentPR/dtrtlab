/* Latest Clips — live feed for DTRTLab.com (homepage + /live).
   Data: /content/clips.json (built from the social post tracker; real posts and counts only).
   Mount: <div data-latest-clips></div>. Refreshes every 5 minutes. No keys, no build step. */
(function () {
  "use strict";
  var SRC = "/content/clips.json";
  var CSS = ".lcf{--b:#EAE4D3;--k:#0D0E0B;--a:#CFE35A;--r:#E5361F;--m:#8C9097;--ln:#25282D;color:var(--b);font-family:'IBM Plex Mono',ui-monospace,monospace}" +
    ".lcf-hd{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-bottom:14px}" +
    ".lcf-pill{display:inline-flex;align-items:center;gap:7px;height:24px;padding:0 10px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:.12em;background:rgba(207,227,90,.12);color:var(--a);border:1px solid rgba(207,227,90,.35)}" +
    ".lcf-pill i{width:7px;height:7px;border-radius:50%;background:var(--a);animation:lcfp 2s infinite}@keyframes lcfp{50%{opacity:.3}}" +
    ".lcf-up{font-size:12px;color:var(--m);letter-spacing:.06em}.lcf-nx{margin-left:auto;font-size:12px;color:var(--b);letter-spacing:.04em}.lcf-nx b{color:var(--a)}" +
    ".lcf-row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(170px,200px);gap:14px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x mandatory;scrollbar-width:thin}" +
    ".lcf-c{scroll-snap-align:start;background:#15171A;border:1px solid var(--ln);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:transform .2s,border-color .2s}" +
    ".lcf-c:hover{transform:translateY(-3px);border-color:rgba(207,227,90,.5)}" +
    ".lcf-t{position:relative;display:block;aspect-ratio:9/16;background:linear-gradient(160deg,#1d2015,#0D0E0B);overflow:hidden}" +
    ".lcf-t img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".lcf-new{position:absolute;top:8px;left:8px;background:var(--a);color:var(--k);font-size:10px;font-weight:700;letter-spacing:.12em;padding:3px 7px;border-radius:4px}" +
    ".lcf-v{position:absolute;bottom:8px;left:8px;background:rgba(13,14,11,.85);font-size:12px;font-weight:700;padding:3px 8px;border-radius:4px}" +
    ".lcf-i{padding:10px 11px 12px;display:flex;flex-direction:column;gap:6px;flex:1}.lcf-n{font-size:13px;font-weight:700;line-height:1.3;color:var(--b)}" +
    ".lcf-d{font-size:11px;color:var(--m)}.lcf-l{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}" +
    ".lcf-l a{font-size:10px;font-weight:700;letter-spacing:.08em;text-decoration:none;color:var(--b);border:1px solid #3a3d42;border-radius:6px;padding:4px 7px}.lcf-l a:hover{border-color:var(--a);color:var(--a)}" +
    ".lcf-f{display:flex;align-items:center;gap:12px;margin-top:12px;font-size:12px;color:var(--m)}.lcf-f a{color:var(--a);font-weight:700;text-decoration:none}.lcf-e{color:var(--m);font-size:13px}";
  var NAMES = { youtube: "YT", tiktok: "TIKTOK", instagram: "IG", x: "X" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function safeUrl(u) { return /^https:\/\//.test(u || "") ? u : ""; }
  function ago(iso) {
    var s = (Date.now() - Date.parse(iso)) / 1000; if (!(s >= 0)) return "";
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    return Math.round(s / 86400) + " d ago";
  }
  function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K" : String(n); }
  function card(c) {
    var main = safeUrl((c.links || {}).youtube || (c.links || {}).tiktok || (c.links || {}).instagram || (c.links || {}).x);
    var fresh = Date.now() - Date.parse(c.posted_utc) < 6 * 3600 * 1000;
    var links = Object.keys(NAMES).filter(function (k) { return safeUrl((c.links || {})[k]); }).map(function (k) {
      return '<a href="' + esc(c.links[k]) + '" target="_blank" rel="noopener noreferrer">' + NAMES[k] + "</a>";
    }).join("");
    return '<article class="lcf-c"><a class="lcf-t" href="' + esc(main) + '" target="_blank" rel="noopener noreferrer" aria-label="Watch ' + esc(c.title) + '">' +
      (safeUrl(c.thumb) || /^data:image\//.test(c.thumb || "") ? '<img loading="lazy" alt="" src="' + esc(c.thumb) + '">' : "") +
      (fresh ? '<span class="lcf-new">NEW</span>' : "") +
      (typeof c.views === "number" ? '<span class="lcf-v">' + fmt(c.views) + " views</span>" : "") +
      '</a><div class="lcf-i"><div class="lcf-n">' + esc(c.title) + '</div><div class="lcf-d">' + esc(ago(c.posted_utc)) + '</div><div class="lcf-l">' + links + "</div></div></article>";
  }
  function render(el, d) {
    var clips = (d && d.clips) || [];
    var nx = ((d && d.next) || []).filter(function (n) { return Date.parse(n.drop_utc) > Date.now(); })[0];
    var f = d && d.feature;
    el.innerHTML = '<div class="lcf"><div class="lcf-hd"><span class="lcf-pill"><i></i>LIVE FEED</span><span class="lcf-up">' +
      (d && d.updated_et ? "Updated " + esc(d.updated_et) : "") + "</span>" +
      (nx ? '<span class="lcf-nx">Next drop: <b>' + esc(nx.title) + "</b> · " + esc(nx.drop_et) + "</span>" : "") + "</div>" +
      (clips.length ? '<div class="lcf-row">' + clips.map(card).join("") + "</div>" : '<p class="lcf-e">New clips are on the way.</p>') +
      (f && safeUrl(f.url) ? '<div class="lcf-f">Every clip points to the full story: <a href="' + esc(f.url) + '" target="_blank" rel="noopener noreferrer">Watch ' + esc(f.title) + " on YouTube</a></div>" : "") +
      "</div>";
  }
  function load() {
    var els = document.querySelectorAll("[data-latest-clips]"); if (!els.length) return;
    fetch(SRC + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      for (var i = 0; i < els.length; i++) render(els[i], d);
    }).catch(function () {});
  }
  var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
  setInterval(load, 5 * 60 * 1000);
})();
