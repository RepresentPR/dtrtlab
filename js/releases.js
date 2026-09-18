(function () {
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pretty(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    var date = d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "America/Puerto_Rico"
    });
    var time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Puerto_Rico",
      timeZoneName: "short"
    });
    return date + " · " + time;
  }
  function list(title, items) {
    if (!items || !items.length) return "";
    var html = "<p class=\"rel-k\">" + esc(title) + "</p><ul>";
    items.forEach(function (x) {
      html += "<li>" + esc(x) + "</li>";
    });
    return html + "</ul>";
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
        var items = (data.items || []).slice().sort(function (a, b) {
          return String(a.at).localeCompare(String(b.at));
        });
        host.innerHTML = "";
        if (data.intro) {
          var intro = document.createElement("p");
          intro.className = "caption";
          intro.textContent = data.intro;
          host.appendChild(intro);
        }
        items.forEach(function (u, i) {
          var art = document.createElement("article");
          art.className = "update-card release-note";
          art.innerHTML =
            '<p class="rel-step">Step ' + (i + 1) + " of " + items.length + "</p>" +
            '<time datetime="' + esc(u.at) + '">' + esc(pretty(u.at)) + "</time>" +
            "<h3>" + esc(u.title) + "</h3>" +
            list("Added", u.added) +
            list("Changed", u.changed);
          host.appendChild(art);
        });
      })
      .catch(function () {
        host.innerHTML = "<p>Updates could not load. Refresh the page.</p>";
      });
  };
})();
