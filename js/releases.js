(function () {
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pretty(iso) {
    var d = new Date(iso + "T12:00:00Z");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    });
  }
  window.DTRT = window.DTRT || {};
  DTRT.renderReleases = function (host) {
    if (!host) return;
    fetch("content/releases.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("releases");
        return r.json();
      })
      .then(function (data) {
        var items = data.items || [];
        host.innerHTML = "";
        if (data.intro) {
          var intro = document.createElement("p");
          intro.className = "caption";
          intro.textContent = data.intro;
          host.appendChild(intro);
        }
        items.forEach(function (u) {
          var art = document.createElement("article");
          art.className = "update-card release-note";
          art.innerHTML =
            '<time datetime="' + esc(u.date) + '">' + esc(pretty(u.date)) + "</time>" +
            "<h3>" + esc(u.title) + "</h3>" +
            "<p>" + esc(u.body) + "</p>" +
            "<p><strong>You can experience:</strong> " + esc(u.canExperience) + "</p>" +
            "<p><strong>Still in development:</strong> " + esc(u.inDevelopment) + "</p>";
          host.appendChild(art);
        });
      })
      .catch(function () {
        host.innerHTML = "<p>Release notes could not load. Refresh, or open Updates again.</p>";
      });
  };
})();
