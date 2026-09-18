(function () {
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var here = (location.pathname || "").toLowerCase();
  var parts = here.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.pop();
  var root = parts.length ? "../".repeat(parts.length) : "";
  var storyOn = /(^|\/)story\.html$/.test(here) || here.indexOf("/stories/") !== -1;
  function a(href, label, eventName) {
    var on = href === "story.html" ? storyOn : path === href.toLowerCase();
    var cur = on ? ' aria-current="page"' : "";
    var ev = eventName ? ' data-event="' + eventName + '"' : "";
    return '<a href="' + root + href + '"' + cur + ev + ">" + label + "</a>";
  }
  var html =
    '<div class="wrap nav-row">' +
    '<a class="brand" href="' + root + 'index.html">DTRT</a>' +
    '<nav class="links" id="site-links" aria-label="Primary">' +
    a("game.html", "Lab", "Lab") +
    a("story.html", "Story", "Story") +
    a("radio.html", "Radio", "Radio") +
    a("isabella.html", "Isabella", "Isabella") +
    a("faq.html", "FAQ", "FAQ") +
    a("news.html", "GitHub", "GitHub") +
    a("donate.html", "Support", "Support") +
    "</nav>" +
    '<div class="nav-end">' +
    '<a class="nav-cta" href="' + root + 'contact.html" data-event="Access">Access</a>' +
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
  var btn = host && host.querySelector(".menu-btn");
  function setOpen(open) {
    if (!host || !btn) return;
    host.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
  }
  if (btn && host) {
    btn.addEventListener("click", function () {
      setOpen(!host.classList.contains("open"));
    });
    host.querySelectorAll("nav.links a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }
  function onScroll() {
    if (!host) return;
    host.classList.toggle("scrolled", window.scrollY > 20);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  var foot = document.getElementById("site-foot");
  if (foot) {
    foot.innerHTML =
      '<div class="wrap">' +
      "<span>DTRT Lab</span>" +
      '<a href="' + root + 'contact.html" data-event="Contact">Contact</a>' +
      '<a href="' + root + 'faq.html" data-event="FAQ">FAQ</a>' +
      '<a href="' + root + 'index.html#setup" data-event="Setup">Setup</a>' +
      '<a href="' + root + 'press.html" data-event="Press">Press</a>' +
      '<a href="' + root + 'story.html" data-event="Story">Story</a>' +
      '<a href="' + root + 'radio.html" data-event="Radio">Radio</a>' +
      '<a href="' + root + 'isabella.html" data-event="Isabella">Isabella</a>' +
      '<a href="' + root + 'legal/privacy.html">Privacy</a>' +
      '<a href="' + root + 'legal/terms.html">Terms</a>' +
      '<a href="' + root + 'donate.html" data-event="Support">Support</a>' +
      "</div>" +
      '<div class="wrap socials">' +
      '<a href="https://x.com/DTRTLab" rel="noopener noreferrer" target="_blank">X</a>' +
      '<a href="https://www.instagram.com/officiallydtrt/" rel="noopener noreferrer" target="_blank">Instagram</a>' +
      '<a href="https://www.twitch.tv/dtrtc" rel="noopener noreferrer" target="_blank">Twitch</a>' +
      '<a href="https://www.youtube.com/@DTRTLabYT" rel="noopener noreferrer" target="_blank">YouTube</a>' +
      '<a href="https://ko-fi.com/dtrtlab" rel="noopener noreferrer" target="_blank">Ko-fi</a>' +
      "</div>";
  }
  if (!document.querySelector('meta[name="referrer"]')) {
    var ref = document.createElement("meta");
    ref.name = "referrer";
    ref.content = "strict-origin-when-cross-origin";
    document.head.appendChild(ref);
  }
  fetch(root + "content/site.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (site) {
      if (!site || !site.googleSiteVerification) return;
      if (document.querySelector('meta[name="google-site-verification"]')) return;
      var g = document.createElement("meta");
      g.name = "google-site-verification";
      g.content = site.googleSiteVerification;
      document.head.appendChild(g);
    })
    .catch(function () {});
  var analytics = document.createElement("script");
  analytics.src = root + "js/analytics.js";
  analytics.defer = true;
  document.head.appendChild(analytics);
})();
