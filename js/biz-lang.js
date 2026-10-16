/* Spanish leads for pages that do not use the homepage journey dictionary. */
(function () {
  "use strict";
  var lang = /(?:\?|&)lang=es(?:&|$)/.test(location.search) ? "es" : "en";
  if (lang !== "es") return;
  if (document.body && document.body.getAttribute("data-journey-page")) return;
  var path = (location.pathname || "/").replace(/\/index\.html$/, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  var pages = {
    "/": { title: "DTRT Lab — Haz lo correcto", h1: "Haz lo correcto.", lead: "DTRT Lab escribe para negocios locales." },
    "/company.html": { title: "Empresa — DTRT Lab", h1: "DTRT Lab escribe para negocios locales.", lead: "Misión: Do the right thing. Ayudamos a operadores locales de verdad. No extraemos de ellos. Los planes de escritura se pagan en Whop." },
    "/about.html": { title: "Acerca de DTRT Lab", h1: "Escritura para negocios locales.", lead: "DTRT Lab es el negocio. La misión es Do the right thing: ayudar a operadores locales, no extraer de ellos." },
    "/shop.html": { title: "Tienda — DTRT Lab", h1: "La tienda no cobra.", lead: "El interés de la tienda sigue abierto y el checkout de mercancía no está activo. Los planes de escritura se pagan en Whop desde la página de inicio." },
    "/contact.html": { title: "Contacto — DTRT Lab", h1: "Saluda a DTRT Lab", lead: "Plan gratis, planes de escritura en Whop, o una pregunta. Tú envías el correo." },
    "/brand.html": { title: "Marca — DTRT Lab", h1: "Marca DTRT Lab", lead: "Marca del negocio de escritura." },
    "/press.html": { title: "Prensa — DTRT Lab", h1: "Prensa", lead: "Hechos con fecha. Sin escala falsa. DTRT Lab escribe para negocios locales." },
    "/find.html": { title: "X e Instagram — DTRT Lab", h1: "X e Instagram.", lead: "Las puertas públicas del negocio son X @DTRTLab e Instagram @officiallydtrt." },
    "/partners.html": { title: "Colabora — DTRT Lab", h1: "Colaboraciones de escritura.", lead: "Trabajo de escritura para un negocio local. No es un patrocinio del stream." },
    "/faq.html": { title: "Preguntas — DTRT Lab", h1: "Preguntas", lead: "El negocio es escritura para operadores locales. El stream, CS2 y el juego están en Lab / Pasatiempo." },
    "/support.html": { title: "Apoyo — DTRT Lab", h1: "Empieza con un plan.", lead: "El plan gratis no se compra. Los tres planes de escritura se pagan en Whop." },
    "/sample-plan.html": { title: "Plan de muestra — DTRT Lab", h1: "Un plan de muestra.", lead: "Un ejemplo de plan gratis para un negocio local. No es una compra." },
    "/careers.html": { title: "Empleo — DTRT Lab", h1: "No estamos contratando.", lead: "No hay solicitudes de empleo en este sitio." },
    "/donate.html": { title: "Apoyo — DTRT Lab", h1: "Sin propinas directas.", lead: "Los planes de escritura se pagan en Whop. Este sitio no cobra tarjetas." },
    "/preorder.html": { title: "Checkout — DTRT Lab", h1: "El juego no está a la venta.", lead: "AFTERLIGHT está en desarrollo. Los planes de escritura están en la página de inicio." },
    "/404.html": { title: "No encontrada — DTRT Lab", h1: "Esa página no está.", lead: "Vuelve al inicio del negocio o a Lab / Pasatiempo." },
    "/legal/terms.html": { title: "Términos — DTRT Lab", h1: "Términos de uso", lead: "El plan gratis no es una compra. Tres planes de escritura se pagan en Whop. Este sitio no guarda tarjetas." },
    "/legal/privacy.html": { title: "Privacidad — DTRT Lab", h1: "Privacidad", lead: "Cómo DTRT Lab trata los mensajes, la analítica y los pagos que ocurren en Whop." },
    "/legal/cookies.html": { title: "Cookies — DTRT Lab", h1: "Cookies", lead: "Cookies, almacenamiento local y analítica en dtrtlab.com." },
    "/legal/refunds.html": { title: "Reembolsos — DTRT Lab", h1: "Reembolsos", lead: "La tienda de este sitio no cobra. Los planes de escritura se reembolsan según la política de Whop." },
    "/legal/dmca.html": { title: "DMCA — DTRT Lab", h1: "DMCA", lead: "Avisos de derechos de autor para DTRT Lab." },
    "/lab.html": { title: "Lab / Pasatiempo — DTRT Lab", h1: "Transmisión, The Lab Files, CS2 y el juego.", lead: "Esta página está aparte del negocio. AFTERLIGHT está en desarrollo y no está a la venta. La sala de CS2 sigue cerrada." },
    "/history.html": { title: "Historia — DTRT Lab", h1: "Notas con fecha.", lead: "Esto no es una solicitud de empleo. El negocio está en la página de inicio." }
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
