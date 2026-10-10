/* Social links for the DTRTC hub.
   Header, hero, Find me, footer, and the socials rail all read this file.
   To add a network, append a block below with handle + url. No build step.
   This file also loads the homepage Live Lab Stats section (js/stats.js).
*/
window.DTRT_SOCIALS = {
  networks: [
    {
      id: "twitch",
      label: "Twitch",
      handle: "dtrtc",
      url: "https://www.twitch.tv/dtrtc",
      enabled: true
    },
    {
      id: "kick",
      label: "Kick",
      handle: "movebro",
      url: "https://kick.com/movebro",
      enabled: true
    },
    {
      id: "youtube",
      label: "YouTube",
      handle: "@DTRTLabYT",
      url: "https://www.youtube.com/@DTRTLabYT",
      enabled: true
    },
    {
      id: "shorts",
      label: "Shorts",
      handle: "@DTRTLabYT",
      url: "https://www.youtube.com/@DTRTLabYT/shorts",
      enabled: true
    },
    {
      id: "x",
      label: "X",
      handle: "DTRTLab",
      url: "https://x.com/DTRTLab",
      enabled: true
    },
    {
      id: "tiktok",
      label: "TikTok",
      handle: "@iananthonyfc",
      url: "https://www.tiktok.com/@iananthonyfc",
      enabled: true
    },
    {
      id: "instagram",
      label: "Instagram",
      handle: "@officiallydtrt",
      url: "https://www.instagram.com/officiallydtrt/",
      enabled: true
    },
    {
      id: "kofi",
      label: "Ko-fi",
      handle: "dtrtlab",
      url: "https://ko-fi.com/dtrtlab",
      enabled: true
    }

    /* Hidden until a handle is filled in.
    ,{
      id: "snapchat",
      label: "Snapchat",
      handle: "",
      url: "https://www.snapchat.com/add/HANDLE",
      enabled: true
    }
    */
  ]
};

/* Shared icons (stats section + socials rail). */
window.DTRT_ICONS = {
  twitch:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.3 2 2.5 5.7v13.6h4.6V22l3.2-2.7h3.7L21.5 12V2H4.3zm15.4 9.2-3.2 3.2h-4.1l-2.8 2.3v-2.3H6.4V3.8h13.3v7.4z"/><path fill="currentColor" d="M16.2 6.2h1.6v4.8h-1.6V6.2zm-4.3 0h1.6v4.8h-1.6V6.2z"/></svg>',
  kick:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3h4.2v7.1L14.6 3H19l-7.3 8.1L19.2 21h-4.5l-6.5-7.4V21H4V3z"/></svg>',
  youtube:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z"/></svg>',
  shorts:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.8 8.4 9 3.6a3.5 3.5 0 0 0-3.4 6.1l1 .5-1 .5A3.5 3.5 0 0 0 9 16.8l8.8 4.8a3.5 3.5 0 0 0 3.4-6.1l-1-.5 1-.5a3.5 3.5 0 0 0-3.4-6.1zM10 14.6V9.4l4.6 2.6-4.6 2.6z"/></svg>',
  x:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.6 3H20.4l-6.6 7.5L21.5 21h-6.2l-4.8-6.3L5.4 21H2.6l7.1-8.1L2.2 3h6.3l4.4 5.8L17.6 3zm-1.1 16.2h1.7L7.6 4.7H5.8l10.7 14.5z"/></svg>',
  kofi:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 21s-6.6-4.2-6.6-8.6A3.7 3.7 0 0 1 12 9.2a3.7 3.7 0 0 1 6.6 3.2C18.6 16.8 12 21 12 21z"/></svg>',
  tiktok:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 3h2.2a5.4 5.4 0 0 0 3.6 3.4v2.3a7.6 7.6 0 0 1-3.6-1v6.6a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v2.4a3.4 3.4 0 1 0 2.4 3.3V3z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8a3.2 3.2 0 0 0 3.2-3.2V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>'
};

/* Persistent socials rail, injected on every page that loads this file. */
(function () {
  function build() {
    if (!document.body || !document.body.hasAttribute("data-social-rail") || document.getElementById("social-rail")) return;
    var css = document.createElement("style");
    css.textContent =
      ".social-rail{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:6px;padding:5px 8px 5px 12px;background:rgba(13,14,11,.92);border:1px solid rgba(234,228,211,.22);border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:'IBM Plex Mono',ui-monospace,monospace}" +
      ".social-rail-tag{color:#cfe35a;font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}" +
      ".social-rail-links{display:flex;gap:2px}" +
      ".social-rail-links a{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;color:#eae4d3;transition:background .15s,color .15s}" +
      ".social-rail-links a:hover,.social-rail-links a:focus-visible{background:#cfe35a;color:#0d0e0b;outline:none}" +
      ".social-rail-links svg{width:19px;height:19px}" +
      "html.has-social-rail body{padding-bottom:64px}" +
      "@media (max-width:420px){.social-rail-tag{display:none}.social-rail{padding:4px 6px}.social-rail-links a{width:36px;height:36px}}" +
      "@media print{.social-rail{display:none}}";
    document.head.appendChild(css);
    var rail = document.createElement("nav");
    rail.id = "social-rail";
    rail.className = "social-rail";
    rail.setAttribute("aria-label", "Socials");
    var html = '<span class="social-rail-tag" aria-hidden="true">+ Signal</span><span class="social-rail-links">';
    window.DTRT_SOCIALS.networks.forEach(function (n) {
      if (!n || !n.enabled || !n.url) return;
      var name = n.label + (n.handle ? " " + n.handle : "");
      html += '<a href="' + n.url + '" rel="noopener noreferrer" target="_blank" aria-label="' + name + '" title="' + name + '">' + (window.DTRT_ICONS[n.id] || n.label) + "</a>";
    });
    rail.innerHTML = html + "</span>";
    document.body.appendChild(rail);
    document.documentElement.classList.add("has-social-rail");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

/* Homepage only: load the Live Lab Stats section (public numbers from content/stats.json). */
(function () {
  var p = (location.pathname || "/").toLowerCase();
  if (p !== "/" && p !== "/index.html") return;
  if (document.querySelector('script[src*="js/stats.js"]')) return;
  var v = "20261009a";
  var l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "/css/stats.css?v=" + v;
  document.head.appendChild(l);
  var sc = document.createElement("script");
  sc.src = "/js/stats.js?v=" + v;
  sc.defer = true;
  function add() { document.body.appendChild(sc); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add);
  else add();
})();
