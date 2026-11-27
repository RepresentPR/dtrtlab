/* Contact: no classifier. The form always sends. The 988 / Crisis Text Line
   block stays visible on load and after submit, in English and Spanish. */
(function () {
  "use strict";
  var isEs = /(?:\?|&)lang=es(?:&|$)/.test(location.search) || (document.documentElement.lang || "").toLowerCase() === "es";
  var HTML_EN = 'If you\'re thinking about suicide or in crisis: <a href="tel:988">call</a> or <a href="sms:988">text 988</a> (US). Crisis Text Line: text HOME to <a href="sms:741741">741741</a> (US). Si estás en crisis: llama o textea al <a href="tel:988">988</a>. <a href="https://findahelpline.com" rel="noopener" target="_blank">findahelpline.com</a> (outside US).';
  var HTML_ES = 'Si estás pensando en suicidio o en crisis: <a href="tel:988">llama</a> o <a href="sms:988">textea al 988</a> (EE. UU.). Crisis Text Line: envía HOME al <a href="sms:741741">741741</a> (EE. UU.). <a href="https://findahelpline.com" rel="noopener" target="_blank">findahelpline.com</a> (fuera de EE. UU.).';

  function ensure() {
    var el = document.getElementById("contact-crisis-help") || document.querySelector("form .site-crisis, p.site-crisis");
    if (!el) {
      el = document.createElement("p");
      el.id = "contact-crisis-help";
      el.className = "site-crisis";
      el.setAttribute("role", "note");
      var form = document.querySelector("form");
      if (form) form.insertAdjacentElement("afterbegin", el);
      else (document.querySelector("main") || document.body).insertAdjacentElement("afterbegin", el);
    }
    el.hidden = false;
    el.removeAttribute("hidden");
    if (el.style) el.style.removeProperty("display");
    if (!/741741/.test(el.innerHTML) || !/988/.test(el.innerHTML)) {
      el.innerHTML = isEs ? HTML_ES : HTML_EN;
    }
    return el;
  }

  function start() {
    ensure();
    var form = document.querySelector("form");
    if (form) form.addEventListener("submit", function () { ensure(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", ensure);
})();
