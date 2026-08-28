(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function val(form, name) {
    var el = form.elements.namedItem(name);
    return el ? String(el.value || "").trim() : "";
  }
  function setStatus(el, kind, text) {
    if (!el) return;
    el.className = "note " + kind;
    el.textContent = text;
  }
  function siteInbox() {
    return fetch("content/site.json", { cache: "no-store" }).then(function (r) {
      return r.ok ? r.json() : {};
    }).then(function (site) {
      return (site && (site.contactEmail || site.supportEmail || site.pressEmail)) || "";
    }).catch(function () {
      return "";
    });
  }
  function fallbackSend(payload, status, form) {
    return siteInbox().then(function (email) {
      if (!email) {
        setStatus(status, "bad", "Could not send. The contact inbox is not configured.");
        return;
      }
      return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(email), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().then(
            function (j) {
              return { ok: r.ok, j: j };
            },
            function () {
              return { ok: false, j: null };
            }
          );
        })
        .then(function (res) {
          if (res.ok && res.j && (res.j.success === "true" || res.j.success === true)) {
            setStatus(status, "ok", "Message sent.");
            form.reset();
            return;
          }
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
          setStatus(status, "ok", "Opening your email app to finish sending.");
        })
        .catch(function () {
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
          setStatus(status, "ok", "Opening your email app to finish sending.");
        });
    });
  }
  window.DTRT = window.DTRT || {};
  DTRT.bindForm = function (form, endpoint) {
    if (!form) return;
    var status = form.querySelector("[data-status]");
    var started = Date.now();
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (val(form, "company")) {
        setStatus(status, "ok", "Message received.");
        return;
      }
      if (Date.now() - started < 1200) {
        setStatus(status, "bad", "Please wait a moment and try again.");
        return;
      }
      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.name === "company") return;
        payload[el.name] = el.value;
      });
      payload.page = location.href;
      setStatus(status, "muted", "Sending…");
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().then(
            function (j) {
              return { ok: r.ok, j: j };
            },
            function () {
              return { ok: false, j: null };
            }
          );
        })
        .then(function (res) {
          if (res.ok && res.j && res.j.received) {
            setStatus(status, "ok", res.j.message || "Message received.");
            form.reset();
            return;
          }
          return fallbackSend(payload, status, form);
        })
        .catch(function () {
          return fallbackSend(payload, status, form);
        });
    });
  };
})();
