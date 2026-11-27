(function () {
  var box = document.getElementById("checkout");
  if (!box) return;
  var status = document.getElementById("pay-status");
  function note(kind, text) {
    if (!status) return;
    status.className = "note " + kind;
    status.textContent = text;
  }
  fetch("/api/health")
    .then(function (r) {
      return r.json();
    })
    .then(function (h) {
      if (!h || !h.paypalConfigured || !h.preorderEnabled) {
        note(
          "warn",
          "Checkout is not live. " +
            (h && h.reason ? h.reason : "Configure PayPal sandbox Client ID/Secret and a price in site/.env, then run Start-Site.ps1.")
        );
        return;
      }
      note("muted", "Sandbox checkout is available. You will not be charged live funds in sandbox mode.");
      var btn = document.getElementById("pay-start");
      if (btn) btn.disabled = false;
    })
    .catch(function () {
      note("warn", "Payment server is not running. Open this page via Start-Site.ps1 — not as a file:// page. No fake payments.");
    });

  var start = document.getElementById("pay-start");
  if (start) {
    start.addEventListener("click", function () {
      start.disabled = true;
      note("muted", "Creating PayPal order…");
      fetch("/api/paypal/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, j: j };
          });
        })
        .then(function (res) {
          if (!res.ok || !res.j || !res.j.approveUrl) {
            note("bad", (res.j && res.j.error) || "Could not create an order. Checkout stays closed until PayPal confirms.");
            start.disabled = false;
            return;
          }
          location.href = res.j.approveUrl;
        })
        .catch(function () {
          note("bad", "Could not reach the payment server.");
          start.disabled = false;
        });
    });
  }

  var params = new URLSearchParams(location.search);
  var token = params.get("token");
  if (token && params.get("paypal") === "return") {
    note("muted", "Checking payment with PayPal…");
    fetch("/api/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token }),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        if (res.ok && res.j && res.j.status === "COMPLETED") {
          note(
            "ok",
            "Payment confirmed by PayPal. Order " +
              (res.j.orderId || "") +
              ". This is a pre-order of a future PC build — you do not receive a finished installer today."
          );
          return;
        }
        note("bad", (res.j && res.j.error) || "PayPal did not confirm payment. Nothing was marked paid.");
      })
      .catch(function () {
        note("bad", "Could not verify the payment. Returning from PayPal is not enough — the server must confirm.");
      });
  }
  if (params.get("paypal") === "cancel") {
    note("warn", "Payment cancelled. No charge.");
  }
})();
