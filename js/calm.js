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
