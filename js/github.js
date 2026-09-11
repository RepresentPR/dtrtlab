(function () {
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function firstLine(s) {
    return String(s || "").split("\n")[0];
  }
  function when(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  }
  function row(href, kicker, title, meta) {
    return (
      '<a class="gh-row" href="' +
      esc(href) +
      '" rel="noopener noreferrer" target="_blank"><span class="muted">' +
      esc(kicker) +
      "</span><strong>" +
      esc(title) +
      '</strong><span class="muted">' +
      esc(meta) +
      "</span></a>"
    );
  }
  function paint(host, data) {
    var owner = data.owner || "RepresentPR";
    var repo = data.repo || "DTRTCore";
    var branch = data.branch || "";
    var repoUrl = "https://github.com/" + owner + "/" + repo;
    var html =
      '<p class="lead"><a href="' +
      esc(repoUrl) +
      (branch ? "/tree/" + encodeURIComponent(branch) : "") +
      '" rel="noopener noreferrer" target="_blank">' +
      esc(owner) +
      "/" +
      esc(repo) +
      "</a>" +
      (branch ? " · " + esc(branch) : "") +
      "</p>";
    var prs = data.pulls || [];
    var commits = data.commits || [];
    if (prs.length) {
      html += "<h3>Pull requests</h3><div class='gh-list'>";
      prs.forEach(function (pr) {
        html += row(pr.html_url, "#" + pr.number, pr.title, pr.state);
      });
      html += "</div>";
    }
    html += "<h3>Commits</h3><div class='gh-list'>";
    commits.forEach(function (c) {
      var msg = firstLine(c.message || (c.commit && c.commit.message));
      var date = when(c.date || (c.commit && c.commit.author && c.commit.author.date));
      var sha = String(c.sha || "").slice(0, 7);
      html += row(c.html_url, sha, msg, date);
    });
    html += "</div>";
    host.innerHTML = html;
  }
  window.DTRT = window.DTRT || {};
  DTRT.renderGithub = function (host) {
    if (!host) return;
    fetch("content/github.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("missing");
        return r.json();
      })
      .then(function (data) {
        paint(host, data);
      })
      .catch(function () {
        host.innerHTML =
          '<p><a href="https://github.com/RepresentPR/DTRTCore" rel="noopener noreferrer" target="_blank">RepresentPR/DTRTCore</a></p>';
      });
  };
})();
