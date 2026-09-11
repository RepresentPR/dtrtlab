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
  function inbox() {
    return fetch("content/site.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (site) {
        return (site && (site.contactEmail || site.supportEmail || site.pressEmail)) || "DTRTCollision@outlook.com";
      })
      .catch(function () {
        return "DTRTCollision@outlook.com";
      });
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
      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.name === "company") return;
        payload[el.name] = el.value;
      });
      inbox().then(function (email) {
        var lines = [];
        Object.keys(payload).forEach(function (k) {
          if (payload[k]) lines.push(k + ": " + payload[k]);
        });
          window.location.href =
          "mailto:" +
          email +
          "?subject=" +
          encodeURIComponent("DTRT Lab — " + (payload.category || "contact")) +
          "&body=" +
          encodeURIComponent(lines.join("\n"));
        setStatus(
          status,
          "ok",
          "Your email app should open a draft to " + email + ". If it does not, write that address yourself."
        );
      });
    });
  };
})();
