(function () {
  function load(path) {
    return fetch(path, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(path);
      return r.json();
    });
  }
  window.DTRT = window.DTRT || {};
  DTRT.loadSite = function () {
    return load("content/site.json");
  };
  DTRT.loadCatalog = function () {
    return load("content/catalog.json");
  };
  DTRT.statusLabel = function (s) {
    if (s === "in-production") return "In production";
    if (s === "available") return "In production";
    if (s === "in-development") return "In development";
    if (s === "planned") return "Planned";
    if (s === "experimental") return "Experimental";
    return s || "";
  };
})();
