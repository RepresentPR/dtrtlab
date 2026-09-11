(function () {
  var host = (location.hostname || "").replace(/^www\./, "");
  if (host !== "dtrtlab.com") return;
  if (navigator.globalPrivacyControl === true) return;

  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };

  var s = document.createElement("script");
  s.defer = true;
  s.setAttribute("data-domain", "dtrtlab.com");
  s.src = "https://plausible.io/js/script.outbound-links.tagged-events.js";
  document.head.appendChild(s);

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest && e.target.closest("[data-event]");
      if (!el) return;
      var name = el.getAttribute("data-event");
      if (!name) return;
      window.plausible(name);
    },
    true
  );
})();
