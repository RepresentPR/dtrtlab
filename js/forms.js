(function () {
  function val(form, name) {
    var el = form.elements.namedItem(name);
    return el ? String(el.value || "").trim() : "";
  }
  function setStatus(el, kind, text) {
    if (!el) return;
    el.className = "note " + kind;
    el.textContent = text;
  }
  window.DTRT = window.DTRT || {};
  DTRT.bindForm = function (form) {
    if (!form) return;
    var status = form.querySelector("[data-status]");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (val(form, "company")) {
        setStatus(status, "ok", "Message received.");
        return;
      }
      setStatus(status, "ok", "Use the contact form on this site.");
    });
  };
})();
