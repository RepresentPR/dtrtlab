(function () {
  var here = (location.pathname || "").toLowerCase();
  var parts = here.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.pop();
  var root = parts.length ? "../".repeat(parts.length) : "";
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var afterlightOn =
    file === "afterlight.html" ||
    file === "game.html" ||
    file === "story.html" ||
    file === "worlds.html" ||
    file === "training.html" ||
    file === "media.html" ||
    file === "news.html" ||
    file === "radio.html" ||
    file === "isabella.html" ||
    here.indexOf("/stories/") !== -1;

  function link(href, label, on) {
    var cur = on ? ' aria-current="page"' : "";
    return '<a href="' + root + href + '"' + cur + ">" + label + "</a>";
  }

  var html =
    '<div class="wrap nav-row">' +
    '<a class="brand" href="' + root + 'index.html">DTRTC</a>' +
    '<nav class="links" id="site-links" aria-label="Primary">' +
    link("index.html#clips", "Clips", false) +
    link("index.html#about", "About", false) +
    link("index.html#schedule", "Schedule", false) +
    link("afterlight.html", "AFTERLIGHT", afterlightOn) +
    link("index.html#find", "Find me", false) +
    '<div class="nav-socials nav-socials-menu" data-social-slot="menu"></div>' +
    "</nav>" +
    '<div class="nav-end">' +
    '<div class="nav-socials nav-socials-desktop" data-social-slot="nav"></div>' +
    '<a class="nav-cta" id="nav-follow" data-social-href="twitch" href="https://www.twitch.tv/dtrtc" rel="noopener noreferrer" target="_blank">Follow</a>' +
    '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-links">Menu</button>' +
    "</div>" +
    "</div>";

  if (!document.querySelector('link[href*="css/adapt.css"]')) {
    var adapt = document.createElement("link");
    adapt.rel = "stylesheet";
    adapt.href = root + "css/adapt.css";
    document.head.appendChild(adapt);
  }

  var host = document.getElementById("site-nav");
  if (host) host.innerHTML = html;

  var foot = document.getElementById("site-foot");
  if (foot) {
    foot.innerHTML =
      '<div class="wrap">' +
      "<span>DTRTC · DTRT Lab</span>" +
      '<a href="' + root + 'index.html">Home</a>' +
      '<a href="' + root + 'index.html#clips">Clips</a>' +
      '<a href="' + root + 'index.html#schedule">Schedule</a>' +
      '<a href="' + root + 'afterlight.html">AFTERLIGHT</a>' +
      '<a href="' + root + 'game.html">Game</a>' +
      '<a href="' + root + 'story.html">Story</a>' +
      '<a href="' + root + 'stories/afterlight/volume-one/">Volume One</a>' +
      '<a href="' + root + 'worlds.html">World</a>' +
      '<a href="' + root + 'training.html">Training</a>' +
      '<a href="' + root + 'media.html">Media</a>' +
      '<a href="' + root + 'news.html">Updates</a>' +
      '<a href="' + root + 'radio.html">Radio</a>' +
      '<a href="' + root + 'contact.html">Contact</a>' +
      '<a href="' + root + 'faq.html">FAQ</a>' +
      '<a href="' + root + 'donate.html">Support</a>' +
      '<a href="' + root + 'legal/privacy.html">Privacy</a>' +
      '<a href="' + root + 'legal/terms.html">Terms</a>' +
      "</div>" +
      '<div class="wrap socials" data-social-slot="footer"></div>';
  }

  var ICONS = {
    twitch:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.3 2 2.5 5.7v13.6h4.6V22l3.2-2.7h3.7L21.5 12V2H4.3zm15.4 9.2-3.2 3.2h-4.1l-2.8 2.3v-2.3H6.4V3.8h13.3v7.4z"/><path fill="currentColor" d="M16.2 6.2h1.6v4.8h-1.6V6.2zm-4.3 0h1.6v4.8h-1.6V6.2z"/></svg>',
    kick:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3h4.2v7.1L14.6 3H19l-7.3 8.1L19.2 21h-4.5l-6.5-7.4V21H4V3z"/></svg>',
    youtube:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.6 3H20.4l-6.6 7.5L21.5 21h-6.2l-4.8-6.3L5.4 21H2.6l7.1-8.1L2.2 3h6.3l4.4 5.8L17.6 3zm-1.1 16.2h1.7L7.6 4.7H5.8l10.7 14.5z"/></svg>',
    kofi:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 21s-6.6-4.2-6.6-8.6A3.7 3.7 0 0 1 12 9.2a3.7 3.7 0 0 1 6.6 3.2C18.6 16.8 12 21 12 21z"/></svg>',
    tiktok:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 3h2.2a5.4 5.4 0 0 0 3.6 3.4v2.3a7.6 7.6 0 0 1-3.6-1v6.6a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.4a3.4 3.4 0 1 0 2.4 3.3V3z"/></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8a3.2 3.2 0 0 0 3.2-3.2V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>',
    snapchat:
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3c2.4 0 4.2 1.8 4.2 4.6v1.1c.5.2 1.2.3 1.6.8.3.4 0 .8-.4 1-.6.2-.8.5-.7.9.2.5 1.1.7 1.5 1.1.3.3.1.8-.3.9-.7.2-1.3.6-1.3 1.1 0 .8 1.6 1.5 2.4 1.7.4.1.5.6.2.9-.8.7-2.2 1-3.2.8-.3.7-1.2 1.6-4 1.6s-3.7-.9-4-1.6c-1 .2-2.4-.1-3.2-.8-.3-.3-.2-.8.2-.9.8-.2 2.4-.9 2.4-1.7 0-.5-.6-.9-1.3-1.1-.4-.1-.6-.6-.3-.9.4-.4 1.3-.6 1.5-1.1.1-.4-.1-.7-.7-.9-.4-.2-.7-.6-.4-1 .4-.5 1.1-.6 1.6-.8V7.6C7.8 4.8 9.6 3 12 3z"/></svg>'
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function networks() {
    var data = window.DTRT_SOCIALS;
    var list = data && data.networks ? data.networks : [];
    return list.filter(function (item) {
      return item && item.enabled && item.url;
    });
  }

  function network(id) {
    var list = networks();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function icon(id) {
    return ICONS[id] || "";
  }

  function external(url, inner, extra) {
    return (
      '<a href="' +
      escapeHtml(url) +
      '" rel="noopener noreferrer" target="_blank"' +
      (extra || "") +
      ">" +
      inner +
      "</a>"
    );
  }

  function renderSlot(el) {
    var kind = el.getAttribute("data-social-slot") || "footer";
    var items = networks();
    var htmlOut = items
      .map(function (item) {
        var label = escapeHtml(item.label);
        var handle = item.handle ? escapeHtml(item.handle) : "";
        var svg = icon(item.id);
        if (kind === "nav" || kind === "menu") {
          var name = label + (handle ? ", " + handle : "");
          if (item.unverified) name += ", handle not confirmed";
          return external(item.url, svg, ' aria-label="' + name + '"');
        }
        if (kind === "hero") {
          return external(item.url, svg + "<span>" + label + "</span>", ' class="hero-social"');
        }
        if (kind === "find") {
          var note = item.unverified
            ? '<span class="find-note">' + escapeHtml(item.note || "Handle not confirmed.") + "</span>"
            : "";
          return external(
            item.url,
            svg +
              '<span class="find-label">' +
              label +
              "</span>" +
              (handle ? '<span class="find-handle">' + handle + "</span>" : "") +
              note,
            ' class="find-card"'
          );
        }
        var flag = item.unverified ? " (unconfirmed)" : "";
        return external(item.url, label + flag);
      })
      .join("");
    el.innerHTML = htmlOut;
    if (kind === "nav" || kind === "menu" || kind === "footer") {
      el.setAttribute("aria-label", "Social");
    }
    if (kind === "nav") el.setAttribute("role", "navigation");
  }

  function applySocials() {
    document.querySelectorAll("[data-social-slot]").forEach(renderSlot);
    document.querySelectorAll("[data-social-href]").forEach(function (el) {
      var item = network(el.getAttribute("data-social-href"));
      if (item && item.url) el.href = item.url;
    });
    var twitch = network("twitch");
    document.querySelectorAll("[data-schedule-link]").forEach(function (el) {
      if (twitch && twitch.url) el.href = twitch.url.replace(/\/$/, "") + "/schedule";
    });
  }

  function whenSocialsReady(done) {
    if (window.DTRT_SOCIALS) {
      done();
      return;
    }
    var script = document.createElement("script");
    script.src = root + "content/socials.js";
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  whenSocialsReady(applySocials);

  var btn = host && host.querySelector(".menu-btn");
  function setOpen(open, restoreFocus) {
    if (!host || !btn) return;
    host.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
    if (open) {
      var first = host.querySelector("nav.links a");
      if (first) first.focus();
    } else if (restoreFocus !== false) {
      btn.focus();
    }
  }
  if (btn && host) {
    btn.addEventListener("click", function () {
      setOpen(!host.classList.contains("open"));
    });
    host.addEventListener("click", function (event) {
      var anchor = event.target.closest ? event.target.closest("a") : null;
      if (!anchor || !host.contains(anchor)) return;
      if (window.innerWidth <= 1100) setOpen(false, false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && host.classList.contains("open")) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100) setOpen(false, false);
    });
  }

  function onScroll() {
    if (!host) return;
    host.classList.toggle("scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!document.querySelector('meta[name="referrer"]')) {
    var ref = document.createElement("meta");
    ref.name = "referrer";
    ref.content = "strict-origin-when-cross-origin";
    document.head.appendChild(ref);
  }
  fetch(root + "content/site.json", { cache: "no-store" })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (site) {
      if (!site || !site.googleSiteVerification) return;
      if (document.querySelector('meta[name="google-site-verification"]')) return;
      var meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = site.googleSiteVerification;
      document.head.appendChild(meta);
    })
    .catch(function () {});

  var analytics = document.createElement("script");
  analytics.src = root + "js/analytics.js";
  analytics.defer = true;
  document.head.appendChild(analytics);
})();
