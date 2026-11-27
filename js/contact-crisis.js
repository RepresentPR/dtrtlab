import { classifyCrisis, GENTLE_LINE } from '/js/safety-core.mjs?v=20261127r8b';
/* Contact pop-up: PR #111 classifyCrisis as is (head 2e137a18 / classifier 878e0427).
   tier1: crisis card, do not send the form.
   tier2: send normally, show the gentle 988 line. */
(function () {
  "use strict";
  var isEs = /(?:\?|&)lang=es(?:&|$)/.test(location.search);
  var TIER1_EN = "If you're thinking about suicide or in crisis: call or text 988 (US). Si estás en crisis: llama o textea al 988. findahelpline.com (outside US). This message was not sent.";
  var TIER1_ES = "Si estás pensando en suicidio o en crisis: llama o textea al 988 (EE. UU.). findahelpline.com (fuera de EE. UU.). Este mensaje no se envió.";
  var FIELD_IDS = { name: 1, email: 1, message: 1 };

  function fieldValues() {
    var ids = ["name", "email", "message"];
    var values = [];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      values.push(el ? (el.value || "") : "");
    }
    return values;
  }

  function rank() {
    var values = fieldValues();
    var worst = "none";
    for (var i = 0; i < values.length; i++) {
      var history = values.filter(function (_, j) { return j !== i; });
      var t = classifyCrisis(values[i], history);
      if (t === "tier1") return "tier1";
      if (t === "tier2") worst = "tier2";
    }
    return worst;
  }

  function box(id, className) {
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("p");
    el.id = id;
    el.hidden = true;
    if (id === "contact-crisis-card") el.setAttribute("role", "alert");
    else el.setAttribute("role", "note");
    var form = document.querySelector("form");
    if (form) form.insertAdjacentElement("afterbegin", el);
    else (document.querySelector("main") || document.body).appendChild(el);
    return el;
  }

  function paint() {
    var t = rank();
    var crisis = box("contact-crisis-card");
    var gentle = box("contact-gentle-988");
    crisis.textContent = isEs ? TIER1_ES : TIER1_EN;
    gentle.textContent = GENTLE_LINE;
    crisis.hidden = t !== "tier1";
    gentle.hidden = t !== "tier2";
    return t;
  }

  function start() {
    paint();
    document.addEventListener("input", function (e) {
      var t = e.target;
      if (t && t.id && FIELD_IDS[t.id]) paint();
    }, true);
    var form = document.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (ev) {
        if (paint() === "tier1") ev.preventDefault();
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", paint);
})();
