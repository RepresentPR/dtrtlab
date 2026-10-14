/* Quiet Find-me strip on every page. Reads content/socials.js. Non-intrusive. */
(function () {
  var ASSET_V = "20261013-find1";
  var LAB_IDS = { x: 1, instagram: 1, youtube: 1, tiktok: 1 };
  var STREAM_IDS = { twitch: 1, kick: 1 };
  var CAREER_IDS = { resume: 1, linkedin: 1, github: 1 };

  function rootPrefix() {
    var here = (location.pathname || "").toLowerCase().replace(/\\/g, "/");
    var parts = here.split("/").filter(Boolean);
    if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.pop();
    return parts.length ? "../".repeat(parts.length) : "/";
  }

  function ensureCss(root) {
    if (document.querySelector('link[href*="css/find-me.css"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = root + "css/find-me.css?v=" + ASSET_V;
    document.head.appendChild(link);
  }

  function networks() {
    var data = window.DTRT_SOCIALS;
    var list = data && data.networks ? data.networks : [];
    return list.filter(function (n) {
      return n && n.enabled && n.url;
    });
  }

  function icon(id) {
    var icons = window.DTRT_ICONS || {};
    return icons[id] || "";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function linkHtml(item) {
    var surface = item.surface || (STREAM_IDS[item.id] ? "stream" : CAREER_IDS[item.id] ? "career" : "lab");
    var label = escapeHtml(item.label);
    var handle = item.handle ? escapeHtml(item.handle) : "";
    var name = label + (handle ? " " + handle : "");
    return (
      '<li><a href="' +
      escapeHtml(item.url) +
      '" rel="noopener noreferrer" target="_blank" data-surface="' +
      surface +
      '" data-event="FindMeOpen" data-network="' +
      escapeHtml(item.id) +
      '" aria-label="' +
      name +
      '">' +
      icon(item.id) +
      "<span>" +
      label +
      "</span>" +
      (handle ? '<span class="handle">' + handle + "</span>" : "") +
      "</a></li>"
    );
  }

  function stripHtml(items, root) {
    var hub = (window.DTRT_SOCIALS && window.DTRT_SOCIALS.hub) || "/find.html";
    if (hub.charAt(0) === "/") hub = root.replace(/\/$/, "") + hub;
    return (
      '<aside class="find-me" data-find-me-strip aria-label="Find Ian across socials">' +
      '<div class="find-me-head"><p>Find me</p><a href="' +
      escapeHtml(hub) +
      '">All links <span aria-hidden="true">↗</span></a></div>' +
      '<ul class="find-me-links">' +
      items.map(linkHtml).join("") +
      "</ul></aside>"
    );
  }

  function injectStrip(root) {
    if (document.querySelector("[data-find-me-strip]")) return;
    var items = networks();
    if (!items.length) return;
    var html = stripHtml(items, root);

    var foot = document.querySelector("footer.site-footer") || document.getElementById("site-foot");
    if (foot) {
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      var node = wrap.firstChild;
      if (foot.classList && foot.classList.contains("site-footer")) {
        foot.insertBefore(node, foot.firstChild);
      } else {
        foot.appendChild(node);
      }
      return;
    }

    var main = document.getElementById("main") || document.body;
    var wrap2 = document.createElement("div");
    wrap2.innerHTML = html;
    main.appendChild(wrap2.firstChild);
  }

  function fillFindPage() {
    var rootEl = document.querySelector("[data-find-page]");
    if (!rootEl) return;
    var items = networks();
    var groups = {
      lab: items.filter(function (n) {
        return (n.surface || "lab") === "lab" || LAB_IDS[n.id];
      }),
      stream: items.filter(function (n) {
        return (n.surface || "") === "stream" || STREAM_IDS[n.id];
      }),
      career: items.filter(function (n) {
        return (n.surface || "") === "career" || CAREER_IDS[n.id];
      })
    };
    Object.keys(groups).forEach(function (key) {
      var host = rootEl.querySelector('[data-find-group="' + key + '"]');
      if (!host) return;
      host.innerHTML = groups[key].map(linkHtml).join("") || "<li><span>None listed</span></li>";
    });
  }

  function whenReady(done) {
    if (window.DTRT_SOCIALS) {
      done();
      return;
    }
    var root = rootPrefix();
    var script = document.createElement("script");
    script.src = root + "content/socials.js?v=" + ASSET_V;
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  function boot() {
    var root = rootPrefix();
    ensureCss(root);
    whenReady(function () {
      injectStrip(root);
      fillFindPage();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
