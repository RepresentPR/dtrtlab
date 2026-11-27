/* Spanish title, h1 and lead for served pages that load js/nav.js. Each entry translates that page's current English. */
(function () {
  "use strict";
  var lang = /(?:\?|&)lang=es(?:&|$)/.test(location.search) ? "es" : "en";
  if (lang !== "es") return;
  document.documentElement.lang = "es";
  var dataEs = document.querySelectorAll("[data-es]");
  for (var i = 0; i < dataEs.length; i++) {
    var el = dataEs[i];
    if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
    el.innerHTML = el.getAttribute("data-es");
  }
  var ariaEs = document.querySelectorAll("[data-es-aria]");
  for (var j = 0; j < ariaEs.length; j++) ariaEs[j].setAttribute("aria-label", ariaEs[j].getAttribute("data-es-aria"));
  if (document.body && document.body.getAttribute("data-journey-page")) return;
  var path = (location.pathname || "/").replace(/\/index\.html$/, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  var pages = {
    "/lab.html": { title: "Lab / Pasatiempo — DTRT Lab" },
    "/brand.html": { title: "Marca — DTRT Lab", h1: "Kit de marca de DTRT Lab", lead: "El nombre de la empresa es DTRT Lab. La cuenta es @DTRTLab. DTRT Lab es la tienda independiente de Jafra, MOTION, Candles y una prueba muy temprana de IA. Las solicitudes de prensa empiezan en <a href=\"/press.html\">Prensa</a>." },
    "/careers.html": { title: "Empleo — DTRT Lab", h1: "No estamos contratando.", lead: "No hay puestos abiertos ni solicitudes de empleo en este sitio. DTRT Lab es la tienda de Jafra, MOTION, Candles y una prueba muy temprana de IA que todavía no está en vivo." },
    "/donate.html": { title: "Apoyo — DTRT Lab", h1: "Sin propinas directas.", lead: "Las propinas directas no están disponibles por ahora. Esta página no hace cargos a ninguna tarjeta." },
    "/404.html": { title: "No encontrada — DTRT Lab", h1: "Esa página no está.", lead: "Vuelve al inicio o a Lab / Pasatiempo." },
    "/legal/terms.html": { title: "Términos — DTRT Lab", h1: "Términos de uso", lead: "Última actualización: 27 de noviembre de 2026 — se actualizó el usuario de Instagram a @dtrt.xyng; el texto legal no cambió. Estos términos cubren dtrtlab.com y las páginas relacionadas de DTRT Lab. Preguntas: <a href=\"/contact.html\">formulario de contacto</a>." },
    "/legal/privacy.html": { title: "Privacidad — DTRT Lab", h1: "Privacidad", lead: "Última actualización: 27 de noviembre de 2026 — se actualizó el usuario de Instagram a @dtrt.xyng; el texto legal no cambió. Cómo DTRT Lab trata los mensajes, la analítica y los pagos que ocurren en Whop." },
    "/legal/cookies.html": { title: "Cookies — DTRT Lab", h1: "Cookies", lead: "Última actualización: 27 de noviembre de 2026 — se actualizó el usuario de Instagram a @dtrt.xyng; el texto legal no cambió. Cookies, almacenamiento local y analítica en dtrtlab.com." },
    "/legal/refunds.html": { title: "Reembolsos — DTRT Lab", h1: "Reembolsos", lead: "Última actualización: 27 de noviembre de 2026 — se actualizó el usuario de Instagram a @dtrt.xyng; el texto legal no cambió. El checkout de la tienda, de la mercancía y del juego en dtrtlab.com no está activo, así que esas páginas no tienen nada que reembolsar." },
    "/legal/dmca.html": { title: "DMCA — DTRT Lab", h1: "DMCA", lead: "Última actualización: 27 de noviembre de 2026 — se actualizó el usuario de Instagram a @dtrt.xyng; el texto legal no cambió. Avisos de derechos de autor para DTRT Lab." },
    "/legal/preorder-terms.html": { title: "Términos de reserva — DTRT Lab", h1: "Términos de reserva", lead: "Última actualización: 27 de noviembre de 2026 — se actualizó el usuario de Instagram a @dtrt.xyng; el texto legal no cambió. <strong>El checkout no está activo.</strong> DTRT AFTERLIGHT no tiene descarga pública ni reserva pública en este sitio." }
  };
  var page = pages[path];
  if (!page) return;
  document.documentElement.lang = "es";
  if (page.title) document.title = page.title;
  var h1 = document.querySelector("h1");
  if (h1 && page.h1 && !h1.hasAttribute("data-journey-i18n")) h1.innerHTML = page.h1;
  var lead = document.querySelector("p.lead, p.hero-copy, p.about-lede");
  if (lead && page.lead && !lead.hasAttribute("data-journey-i18n")) lead.innerHTML = page.lead;
  if (path === "/lab.html") {
    var links = document.querySelectorAll('a[href^="/"]');
    for (var li = 0; li < links.length; li++) {
      var href = links[li].getAttribute("href") || "";
      if (/^https?:/i.test(href)) continue;
      if (/(?:\?|&)lang=/.test(href)) continue;
      var hash = "";
      var h = href;
      var hp = h.indexOf("#");
      if (hp !== -1) { hash = h.slice(hp); h = h.slice(0, hp); }
      var sep = h.indexOf("?") === -1 ? "?" : "&";
      if (!h) h = "/lab.html";
      links[li].setAttribute("href", h + sep + "lang=es" + hash);
    }
  }
})();
