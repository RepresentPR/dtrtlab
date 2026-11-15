(function () {
  var form = document.getElementById("ask-form");
  var input = document.getElementById("ask-q");
  var log = document.getElementById("ask-log");
  var corpus = window.DTRT_ASK_CORPUS;
  if (!form || !input || !log || !window.DTRTAsk) return;

  function escape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function add(html) {
    var item = document.createElement("article");
    item.className = "ask-bubble";
    item.innerHTML = html;
    log.append(item);
    item.scrollIntoView({ block: "nearest" });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var question = input.value.trim();
    if (!question) {
      input.focus();
      return;
    }
    add("<p><strong>You.</strong> " + escape(question) + "</p>");
    window.DTRTAsk.answer(question, corpus || { passages: [] }).then(function (result) {
      var matches = (result && result.matches) || [];
      if (!matches.length) {
        add("<p><strong>Ask DTRT.</strong> Nothing on the public pages matches that closely. Try words from the site, or open the <a href=\"/notebook/\">notebook</a> and the <a href=\"/map/\">office map</a>.</p>");
        return;
      }
      var hits = matches.map(function (item) {
        var passage = item.passage || {};
        return (
          '<div class="ask-hit"><p><a href="' + escape(passage.url) + '">' + escape(passage.title || passage.url) + "</a></p><p>" +
          escape(passage.text) + "</p></div>"
        );
      }).join("");
      add("<p><strong>Ask DTRT.</strong> Answered from DTRT Lab's public pages. This search stays in the browser.</p>" + hits);
    }).catch(function () {
      add("<p><strong>Ask DTRT.</strong> The search on this page did not finish. The public pages are still linked from the home page.</p>");
    });
    input.value = "";
    input.focus();
  });
})();
