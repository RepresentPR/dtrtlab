(function () {
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var nested = location.pathname.indexOf("/legal/") !== -1;
  var root = nested ? "../" : "";
  function a(href, label) {
    var cur = path === href.toLowerCase() ? ' aria-current="page"' : "";
    return '<a href="' + root + href + '"' + cur + ">" + label + "</a>";
  }
  var html =
    '<div class="wrap nav-row">' +
    '<a class="brand" href="' + root + 'index.html">DTRT</a>' +
    '<nav class="links" id="site-links" aria-label="Primary">' +
    a("game.html", "Lab") +
    a("news.html", "GitHub") +
    a("donate.html", "Support") +
    "</nav>" +
    '<div class="nav-end">' +
    '<a class="nav-cta" href="' + root + 'contact.html">Access</a>' +
    '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-links">Menu</button>' +
    "</div>" +
    "</div>";
  var host = document.getElementById("site-nav");
  if (host) host.innerHTML = html;
  var btn = host && host.querySelector(".menu-btn");
  if (btn && host) {
    btn.addEventListener("click", function () {
      var open = host.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
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
      '<a href="' + root + 'contact.html">Contact</a>' +
      '<a href="' + root + 'press.html">Press</a>' +
      '<a href="' + root + 'story.html">Mission</a>' +
      '<a href="' + root + 'legal/privacy.html">Privacy</a>' +
      '<a href="' + root + 'legal/terms.html">Terms</a>' +
      '<a href="' + root + 'donate.html">Support</a>' +
      "</div>" +
      '<div class="wrap socials">' +
      '<a href="https://x.com/DTRTLab" rel="noopener noreferrer" target="_blank">X</a>' +
      '<a href="https://www.instagram.com/officiallydtrt/" rel="noopener noreferrer" target="_blank">Instagram</a>' +
      '<a href="https://www.twitch.tv/dtrtc" rel="noopener noreferrer" target="_blank">Twitch</a>' +
      '<a href="https://www.youtube.com/@DTRTLabYT" rel="noopener noreferrer" target="_blank">YouTube</a>' +
      '<a href="https://ko-fi.com/dtrtlab" rel="noopener noreferrer" target="_blank">Ko-fi</a>' +
      "</div>";
  }
})();
