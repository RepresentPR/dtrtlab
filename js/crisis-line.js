/* Site-wide 988 line: keep a body-level copy, and one next to every visible text field. */
(function () {
  "use strict";
  var ROOT_ID = "dtrt-crisis-root";
  var STYLE_ID = "dtrt-crisis-css";
  var FIELD_CLASS = "dtrt-crisis-field";
  var HTML = 'If you\'re thinking about suicide or in crisis: <a href="tel:988">call</a> or <a href="sms:988">text 988</a> (US) · Si estás en crisis: llama o textea al <a href="tel:988">988</a> · <a href="https://findahelpline.com" rel="noopener" target="_blank">findahelpline.com</a> (outside US)';
  var CSS_HREF = "/css/crisis-line.css?v=20261127h2";

  var applying = false;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID) || document.querySelector('link[href*="crisis-line.css"]')) return;
    var s = document.createElement("link");
    s.id = STYLE_ID;
    s.rel = "stylesheet";
    s.href = CSS_HREF;
    (document.head || document.documentElement).appendChild(s);
  }

  function rootHtml() {
    var el = document.createElement("div");
    el.id = ROOT_ID;
    el.setAttribute("role", "note");
    el.innerHTML = "<p class=\"site-crisis dtrt-crisis-line\">" + HTML + "</p>";
    return el;
  }

  function ensureRoot() {
    if (!document.body) return;
    var el = document.getElementById(ROOT_ID);
    if (el && el.closest("footer")) {
      el.parentNode.removeChild(el);
      el = null;
    }
    if (!el) {
      el = rootHtml();
      document.body.appendChild(el);
      return;
    }
    if (!el.isConnected || el.parentNode !== document.body) {
      document.body.appendChild(el);
    } else if (el.nextSibling) {
      document.body.appendChild(el);
    }
    if (!/988/.test(el.textContent || "") || !/findahelpline/i.test(el.innerHTML || "")) {
      el.innerHTML = "<p class=\"site-crisis dtrt-crisis-line\">" + HTML + "</p>";
    }
  }

  function isTextish(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName !== "INPUT") return false;
    var t = (el.getAttribute("type") || "text").toLowerCase();
    return t === "text" || t === "search" || t === "email" || t === "url" || t === "tel" || t === "number" || t === "password" || t === "";
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.type === "hidden") return false;
    if (el.name === "_honey" || el.getAttribute("tabindex") === "-1" && /honey/i.test(el.name || "")) return false;
    if (el.closest("[hidden]")) return false;
    var cs = window.getComputedStyle(el);
    if (!cs || cs.display === "none" || cs.visibility === "hidden") return false;
    if (parseFloat(cs.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    if (r.bottom < -2 && r.top < -2) return false;
    if ((r.right < 0 && r.left < -200) || r.left > (window.innerWidth || 0) + 200) return false;
    return true;
  }

  function existingNote(host) {
    var n = host.nextElementSibling;
    if (n && n.classList && n.classList.contains(FIELD_CLASS)) return n;
    return null;
  }

  function placeNear(el) {
    var host = el.closest("label") || el;
    if (existingNote(host) || existingNote(el)) {
      el.setAttribute("data-dtrt-crisis", "1");
      return;
    }
    var note = document.createElement("p");
    note.className = "site-crisis " + FIELD_CLASS;
    note.setAttribute("role", "note");
    note.innerHTML = HTML;
    host.insertAdjacentElement("afterend", note);
    el.setAttribute("data-dtrt-crisis", "1");
  }

  function pruneOrphans() {
    var notes = document.querySelectorAll("." + FIELD_CLASS);
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      var prev = note.previousElementSibling;
      var field = null;
      if (prev) {
        if (prev.matches && (prev.matches("input, textarea, label"))) field = prev.tagName === "LABEL" ? prev.querySelector("input, textarea") : prev;
      }
      if (!field || !isTextish(field) || !isVisible(field)) {
        if (field) field.removeAttribute("data-dtrt-crisis");
        if (note.parentNode) note.parentNode.removeChild(note);
      }
    }
  }

  function scan() {
    if (applying) return;
    applying = true;
    try {
      ensureStyle();
      ensureRoot();
      var nodes = document.querySelectorAll("input, textarea");
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (isTextish(el) && isVisible(el)) placeNear(el);
      }
      pruneOrphans();
    } finally {
      applying = false;
    }
  }

  var scheduled = false;
  function requestScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; scan(); }, 50);
  }

  function start() {
    scan();
    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var t = recs[i].target;
          if (t && (t.id === ROOT_ID || (t.classList && t.classList.contains(FIELD_CLASS)) || t.id === STYLE_ID)) continue;
          requestScan();
          return;
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style", "class", "disabled", "type"] });
    }
    setInterval(function () {
      var el = document.getElementById(ROOT_ID);
      if (!el || !el.isConnected || el.closest("footer") || !/988/.test(el.textContent || "")) ensureRoot();
    }, 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
