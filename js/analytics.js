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
    if (optedOut) return;
    if (window.plausible) window.plausible(name, props ? { props: props } : undefined);
    if (gaOn && window.gtag) window.gtag("event", name);
  }

  // Reuse the same privacy and consent decisions for validated form intents.
  window.dtrtTrackEvent = track;

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
    if (!id || optedOut || gaOn) return;
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

  var status = document.getElementById("analytics-status");
  var allow = document.getElementById("analytics-allow");
  var withdraw = document.getElementById("analytics-withdraw");

  function showChoice(choice) {
    if (!status || !allow || !withdraw || typeof allow.addEventListener !== "function") return;
    if (optedOut) status.textContent = "Your browser privacy signal blocks site analytics.";
    else if (!gaId) status.textContent = "Google Analytics is not configured on this site.";
    else if (choice === "yes") status.textContent = "Google Analytics is allowed in this browser.";
    else status.textContent = "Google Analytics is off in this browser.";
    allow.hidden = optedOut || !gaId || choice === "yes";
    withdraw.hidden = optedOut || !gaId || choice !== "yes";
  }

  function clearGaCookies() {
    String(document.cookie || "").split(";").forEach(function (entry) {
      var name = entry.split("=")[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) return;
      var expired = name + "=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = expired;
      document.cookie = expired + "; domain=.dtrtlab.com";
    });
  }

  function applyChoice(choice) {
    if (choice === "yes") {
      startGa(gaId);
    } else if (gaOn) {
      gaOn = false;
      window["ga-disable-" + gaId] = true;
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
      clearGaCookies();
      showChoice(choice);
      location.reload();
      return;
    }
    showChoice(choice);
  }

  function setChoice(choice) {
    try { localStorage.setItem(KEY, choice); } catch (err) {}
    applyChoice(choice);
  }

  // Storage events reach other tabs, not the tab that changed the choice.
  // Apply withdrawal without writing it back and triggering another event.
  if (typeof window.addEventListener === "function") {
    window.addEventListener("storage", function (event) {
      if (event.storageArea !== localStorage) return;
      if (event.key !== KEY && event.key !== null) return;
      if (event.newValue !== "yes") applyChoice("no");
    });
  }

  if (allow && typeof allow.addEventListener === "function") {
    allow.addEventListener("click", function () { setChoice("yes"); });
  }
  if (withdraw && typeof withdraw.addEventListener === "function") {
    withdraw.addEventListener("click", function () { setChoice("no"); });
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
      hideBar(bar);
      setChoice(choice);
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
      if (!gaId || optedOut) {
        showChoice("");
        return;
      }
      var choice = "";
      try {
        choice = localStorage.getItem(KEY) || "";
      } catch (err) {}
      if (choice === "yes") startGa(gaId);
      else if (choice !== "no") askGa(gaId);
      showChoice(choice);
    })
    .catch(function () {
      if (status) status.textContent = "Analytics settings could not be loaded. Google Analytics was not started.";
    });
})();
