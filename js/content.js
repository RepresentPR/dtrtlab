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
  DTRT.loadWorlds = function () {
    return load("content/worlds.json");
  };
  DTRT.loadCatalog = function () {
    return load("content/catalog.json");
  };
  DTRT.loadNews = function () {
    return load("content/news.json");
  };
  DTRT.statusLabel = function (s) {
    if (s === "available") return "Available";
    if (s === "in-development") return "In development";
    if (s === "planned") return "Planned";
    if (s === "experimental") return "Experimental";
    return s || "";
  };
})();
