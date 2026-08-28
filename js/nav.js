(function () {
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  function a(href, label) {
    var cur = path === href.toLowerCase() ? ' aria-current="page"' : "";
    return '<a href="' + href + '"' + cur + ">" + label + "</a>";
  }
  var html =
    '<div class="wrap nav-row">' +
    '<a class="brand" href="index.html">DTRT Lab<small>Created by Ian Ferraro Crespo</small></a>' +
    '<nav class="links" aria-label="Primary">' +
    a("index.html", "Home") +
    a("game.html", "The game") +
    a("worlds.html", "Worlds") +
    a("news.html", "News") +
    a("catalog.html", "Catalog") +
    a("story.html", "Story") +
    a("history.html", "Journey") +
    a("support.html", "Support") +
    a("faq.html", "FAQ") +
    a("press.html", "Press") +
    "</nav>" +
    '<span class="cta ghost" id="nav-preorder">Coming soon</span>' +
    "</div>";
  var host = document.getElementById("site-nav");
  if (host) host.innerHTML = html;
  fetch("content/site.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (site) {
      var cta = document.getElementById("nav-preorder");
      if (!cta || !site || !site.preorderEnabled) return;
      var link = document.createElement("a");
      link.className = "cta";
      link.href = "preorder.html";
      link.textContent = "Pre-order";
      cta.replaceWith(link);
    })
    .catch(function () {});
  var foot = document.getElementById("site-foot");
  if (foot) {
    foot.innerHTML =
      '<div class="wrap">' +
      "<span>DTRT Lab  ·  offline  ·  original</span>" +
      '<a href="contact.html">Contact</a>' +
      '<a href="legal/privacy.html">Privacy</a>' +
      '<a href="legal/terms.html">Terms</a>' +
      '<a href="legal/refunds.html">Refunds</a>' +
      "</div>";
  }
})();
