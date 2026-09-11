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
  function prettyDay(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return when(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
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
  function leak(s) {
    return /aimlabs|aim\s*labs?|grok|copilot|codex|chatgpt|openai|claude|bot prompt|bot_prompt|autonomous visual production/i.test(
      String(s || "")
    );
  }
  function paint(host, data) {
    var owner = data.owner || "RepresentPR";
    var repo = data.repo || "DTRTCore";
    var repoUrl = "https://github.com/" + owner + "/" + repo;
    var prs = (data.pulls || [])
      .filter(function (pr) {
        return !leak(pr.title);
      })
      .slice()
      .sort(function (a, b) {
        return String(b.created_at || "").localeCompare(String(a.created_at || ""));
      });
    var commits = (data.commits || []).filter(function (c) {
      return !leak(c.message || (c.commit && c.commit.message));
    });
    var created = data.created || (commits.length ? when(commits[commits.length - 1].date) : "");
    var html =
      '<p class="lead"><a href="' +
      esc(repoUrl) +
      '" rel="noopener noreferrer" target="_blank">' +
      esc(owner) +
      "/" +
      esc(repo) +
      "</a></p>" +
      '<p class="muted">Catalog from ' +
      esc(created || "creation") +
      " · " +
      commits.length +
      " commits · " +
      prs.length +
      " pull requests</p>";

    html += "<h3>Pull requests</h3><div class='gh-list'>";
    prs.forEach(function (pr) {
      html += row(pr.html_url, "#" + pr.number, pr.title, pr.state + (pr.created_at ? " · " + when(pr.created_at) : ""));
    });
    html += "</div>";

    html += "<h3>Commits</h3>";
    var lastDay = "";
    var listOpen = false;
    commits.forEach(function (c) {
      var msg = firstLine(c.message || (c.commit && c.commit.message));
      var rawDate = c.date || (c.commit && c.commit.author && c.commit.author.date);
      var date = when(rawDate);
      var sha = String(c.sha || "").slice(0, 7);
      if (date !== lastDay) {
        if (listOpen) html += "</div>";
        html += '<p class="gh-day">' + esc(prettyDay(rawDate || date)) + "</p><div class='gh-list'>";
        lastDay = date;
        listOpen = true;
      }
      html += row(c.html_url, sha, msg, date);
    });
    if (listOpen) html += "</div>";
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
