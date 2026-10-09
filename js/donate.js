/* Single source of truth: content/donate.json. Blank url = everything donate-related stays hidden. */
(function () {
  var s = document.currentScript, base = "";
  var src = (s && s.src) || "";
  base = src.replace(/js\/donate\.js.*$/, "");
  if (window.__donateInit) return; window.__donateInit = true;
  fetch(base + "content/donate.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var ms = ((d && d.methods) || []).filter(function (m) { return m && (m.url || "").trim(); });
    var url = (d && d.url || "").trim() || (ms[0] && ms[0].url) || "";
    var slots = document.querySelectorAll("[data-donate]");
    if (!url) { for (var i = 0; i < slots.length; i++) slots[i].hidden = true; return; }
    var es = /^es/i.test(navigator.language || "");
    var label = (es && d.labelEs) || d.label || "Support the stream";
    function btn(cls) {
      var a = document.createElement("a");
      a.className = cls; a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = "\u2764 " + label; a.setAttribute("data-donate-btn", "1");
      return a;
    }
    for (var j = 0; j < slots.length; j++) {
      slots[j].hidden = false;
      if (!slots[j].querySelector("[data-donate-btn]")) slots[j].insertBefore(btn("cta"), slots[j].firstChild);
    }
    var list = document.getElementById("donate-methods");
    if (list) {
      var h = '<p class="lead">' + (es ? d.purposeEs : d.purposeEn) + '</p><ul class="donate-list" style="list-style:none;padding:0;display:grid;gap:12px">';
      ms.forEach(function (m) {
        h += '<li><a class="cta" target="_blank" rel="noopener noreferrer" href="' + encodeURI(m.url) + '">' + m.name + (m.recurring ? (es ? " · mensual" : " · monthly") : "") + '</a> <span>' + ((es ? m.noteEs : m.noteEn) || "") + '</span></li>';
      });
      list.innerHTML = h + "</ul>";
    }
    document.querySelectorAll("[data-donate-href]").forEach(function (a) { a.href = url; a.hidden = false; });
    document.querySelectorAll("[data-donate-short]").forEach(function (a) { a.textContent = d.short || url; });
    // sticky floating button on every page
    if (!document.getElementById("donate-fab")) {
      var f = btn("donate-fab"); f.id = "donate-fab";
      f.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:9999;background:#ff5e5b;color:#fff;padding:12px 18px;border-radius:999px;font:700 15px system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 18px rgba(0,0,0,.4)";
      document.body.appendChild(f);
    }
  }).catch(function () {});
})();
