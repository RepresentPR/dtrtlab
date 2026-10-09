/* Calm layer: folds each goal card's reward list behind a "show more" button. Pure display, no data changes. */
(function () {
  function fold() {
    document.querySelectorAll(".gl-c").forEach(function (c) {
      var list = c.querySelector(".gl-t");
      if (!list || list.parentNode.classList.contains("gl-more")) return;
      var d = document.createElement("details");
      d.className = "gl-more";
      var s = document.createElement("summary");
      s.textContent = "Show the rewards for this goal";
      list.parentNode.insertBefore(d, list);
      d.appendChild(s);
      d.appendChild(list);
    });
  }
  var NAMES = { YT: "YouTube", TIKTOK: "TikTok", IG: "Instagram" };
  function relabel() {
    document.querySelectorAll(".lcf-l a").forEach(function (a) {
      var n = NAMES[a.textContent.trim()];
      if (n) a.textContent = n;
    });
    document.querySelectorAll(".lcf-new").forEach(function (a) { if (a.textContent === "NEW") a.textContent = "New"; });
  }
  function both() { fold(); relabel(); }
  new MutationObserver(both).observe(document.body, { childList: true, subtree: true });
  both();
})();

/* Live page: visible "Main site" button back to the homepage (?main=1 stops the live redirect for this visit). */
(function () {
  if (!/^\/live\/?(index\.html)?$/.test(location.pathname)) return;
  var top = document.querySelector("header.top");
  if (!top || top.querySelector(".mainsite")) return;
  var a = document.createElement("a");
  a.className = "mainsite";
  a.href = "/?main=1";
  a.textContent = "Main site \u2192";
  a.style.cssText = "color:#CFE35A;font-weight:700;border:1px solid #CFE35A;border-radius:999px;padding:6px 14px;text-decoration:none;white-space:nowrap;min-height:34px;display:inline-flex;align-items:center";
  var mark = top.querySelector(".mark");
  top.insertBefore(a, mark ? mark.nextSibling : top.firstChild);
})();
