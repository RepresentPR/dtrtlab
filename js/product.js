(function () {
  function load() {
    var parts = (location.pathname || "").replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.pop();
    var root = parts.length ? "../".repeat(parts.length) : "";
    return fetch(root + "content/product.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("product.json");
      return r.json();
    });
  }
  function statusClass(s) {
    if (s === "in-production") return "chip chip-now";
    if (s === "in-development") return "chip chip-dev";
    return "chip chip-plan";
  }
  function statusText(s) {
    if (s === "in-production") return "In production";
    if (s === "in-development") return "In development";
    if (s === "story") return "Story still";
    if (s === "planned") return "Planned";
    return s || "";
  }
  window.DTRT = window.DTRT || {};
  DTRT.loadProduct = load;
  DTRT.statusClass = statusClass;
  DTRT.statusText = statusText;
  DTRT.applyProductMeta = function (p) {
    document.querySelectorAll("[data-status-label]").forEach(function (el) {
      el.textContent = p.statusLabel;
    });
    document.querySelectorAll("[data-verified]").forEach(function (el) {
      el.textContent = "Verified " + p.verifiedDate;
    });
    document.querySelectorAll("[data-verified-bare]").forEach(function (el) {
      el.textContent = p.verifiedDate;
    });
  };
})();
