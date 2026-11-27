import { isCrisisText } from '/js/safety-core.mjs?v=20261127h7';
/* Reactive 988 message on the contact form when crisis words are typed. Never submits. */
(function () {
  "use strict";
  var isEs = /(?:\?|&)lang=es(?:&|$)/.test(location.search);
  var EN = "You're not alone. Call or text 988 (US). Si estás en crisis: llama o textea al 988. findahelpline.com (outside US).";
  var ES = "No estás solo/a. Llama o textea al 988 (EE. UU.). Si estás en crisis: llama o textea al 988. findahelpline.com (fuera de EE. UU).";
  var FIELD_IDS = { name: 1, email: 1, message: 1 };
  function ensureBox() {
    var box = document.getElementById("contact-crisis-reactive");
    if (box) return box;
    box = document.createElement("p");
    box.id = "contact-crisis-reactive";
    box.setAttribute("role", "alert");
    box.hidden = true;
    box.style.cssText = "max-width:70ch;margin:12px 0;padding:10px 12px;background:#fff8e7;border:1px solid #c9b48a;border-radius:8px;color:#111;";
    var form = document.querySelector("form");
    if (form) form.insertAdjacentElement("afterbegin", box);
    else (document.querySelector("main") || document.body).appendChild(box);
    return box;
  }
  function check() {
    var hit = false;
    var ids = ["name", "email", "message"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && isCrisisText(el.value || "")) { hit = true; break; }
    }
    var box = ensureBox();
    box.textContent = isEs ? ES : EN;
    box.hidden = !hit;
  }
  function start() {
    ensureBox();
    document.addEventListener("input", function (e) {
      var t = e.target;
      if (t && t.id && FIELD_IDS[t.id]) check();
    }, true);
    check();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", check);
})();
