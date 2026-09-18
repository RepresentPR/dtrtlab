(function () {
  var host = (location.hostname || "").replace(/^www\./, "");
  if (host !== "dtrtlab.com") return;

  var optedOut =
    navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1";
  var parts = (location.pathname || "/").replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.pop();
  var root = parts.length ? "../".repeat(parts.length) : "";
  var KEY = "dtrt-ga";
  var gaId = "";
  var gaOn = false;

  function track(name, props) {
    if (window.plausible) window.plausible(name, props ? { props: props } : undefined);
    if (gaOn && window.gtag) window.gtag("event", name);
  }

  function bindClicks() {
    document.addEventListener(
      "click",
      function (e) {
        var el = e.target && e.target.closest && e.target.closest("[data-event]");
        if (!el) return;
        var name = el.getAttribute("data-event");
        if (name) track(name);
      },
      true
    );
  }

  function startPlausible() {
    window.plausible =
      window.plausible ||
      function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
    var s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", "dtrtlab.com");
    s.src = "https://plausible.io/js/script.outbound-links.file-downloads.tagged-events.js";
    document.head.appendChild(s);
    if (/^404\b/.test(document.title)) track("404", { path: location.pathname });
  }

  function startGa(id) {
    if (!id || optedOut) return;
    gaOn = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", id, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function hideBar(bar) {
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function askGa(id) {
    var bar = document.createElement("div");
    bar.className = "consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Google Analytics");
    bar.innerHTML =
      '<div class="wrap">' +
      "<p>Google Analytics cookies count visits so we can see what the site is doing. Ads stay off. <a href=\"" +
      root +
      'legal/privacy.html">Privacy</a></p>' +
      '<div class="actions">' +
      '<button class="cta" type="button" data-ga="yes">Allow Google</button>' +
      '<button class="cta ghost" type="button" data-ga="no">No Google cookies</button>' +
      "</div></div>";
    document.body.appendChild(bar);
    bar.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest && e.target.closest("[data-ga]");
      if (!btn) return;
      var choice = btn.getAttribute("data-ga");
      try {
        localStorage.setItem(KEY, choice);
      } catch (err) {}
      hideBar(bar);
      if (choice === "yes") startGa(id);
    });
  }

  bindClicks();
  if (!optedOut) startPlausible();

  fetch(root + "content/site.json", { cache: "no-store" })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (site) {
      gaId = site && site.gaMeasurementId ? String(site.gaMeasurementId).trim() : "";
      if (!gaId || optedOut) return;
      var choice = "";
      try {
        choice = localStorage.getItem(KEY) || "";
      } catch (err) {}
      if (choice === "yes") startGa(gaId);
      else if (choice !== "no") askGa(gaId);
    })
    .catch(function () {});
})();
