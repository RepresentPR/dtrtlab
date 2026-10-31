/* Spanish title, h1 and lead for served pages that load js/nav.js. Each entry translates that page's current English. */
(function () {
  "use strict";
  var lang = /(?:\?|&)lang=es(?:&|$)/.test(location.search) ? "es" : "en";
  if (lang !== "es") return;
  if (document.body && document.body.getAttribute("data-journey-page")) return;
  var path = (location.pathname || "/").replace(/\/index\.html$/, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  var pages = {
    "/brand.html": { title: "Marca — DTRT Lab", h1: "Kit de marca de DTRT Lab", lead: "El nombre de la empresa es DTRT Lab. La cuenta es @DTRTLab. El negocio es el DTRT Job Desk, un gerente de oficina con IA para pequeños negocios de servicios. Las solicitudes de prensa empiezan en <a href=\"/press.html\">Prensa</a>." },
    "/careers.html": { title: "Empleo — DTRT Lab", h1: "No estamos contratando.", lead: "No hay puestos abiertos ni solicitudes de empleo en este sitio. DTRT Lab vende sistemas de oficina con IA para pequeños negocios de servicios: el DTRT Job Desk y el AI Visibility Fix." },
    "/donate.html": { title: "Apoyo — DTRT Lab", h1: "Sin propinas directas.", lead: "Las propinas directas no están disponibles por ahora. Los planes pagados están en Whop. Esta página no hace cargos a ninguna tarjeta." },
    "/404.html": { title: "No encontrada — DTRT Lab", h1: "Esa página no está.", lead: "Vuelve al inicio del negocio o a Lab / Pasatiempo." },
    "/legal/terms.html": { title: "Términos — DTRT Lab", h1: "Términos de uso", lead: "Última actualización: 30 de octubre de 2026. Estos términos cubren dtrtlab.com y las páginas relacionadas de DTRT Lab. Preguntas: <a href=\"/contact.html\">formulario de contacto</a>." },
    "/legal/privacy.html": { title: "Privacidad — DTRT Lab", h1: "Privacidad", lead: "Cómo DTRT Lab trata los mensajes, la analítica y los pagos que ocurren en Whop." },
    "/legal/cookies.html": { title: "Cookies — DTRT Lab", h1: "Cookies", lead: "Cookies, almacenamiento local y analítica en dtrtlab.com." },
    "/legal/refunds.html": { title: "Reembolsos — DTRT Lab", h1: "Reembolsos", lead: "Última actualización: 15 de octubre de 2026. El checkout de la tienda, de la mercancía y del juego en dtrtlab.com no está activo, así que esas páginas no tienen nada que reembolsar." },
    "/legal/dmca.html": { title: "DMCA — DTRT Lab", h1: "DMCA", lead: "Avisos de derechos de autor para DTRT Lab." }
  };
  var page = pages[path];
  if (!page) return;
  document.documentElement.lang = "es";
  if (page.title) document.title = page.title;
  var h1 = document.querySelector("h1");
  if (h1 && page.h1 && !h1.hasAttribute("data-journey-i18n")) h1.innerHTML = page.h1;
  var lead = document.querySelector("p.lead, p.hero-copy, p.about-lede");
  if (lead && page.lead && !lead.hasAttribute("data-journey-i18n")) lead.innerHTML = page.lead;
})();
