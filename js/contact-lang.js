/* Spanish for /contact.html?lang=es. */
(function () {
  if (!/(?:\?|&)lang=es(?:&|$)/.test(location.search)) return;
  document.documentElement.lang = "es";
  document.title = "Contacto — Ian | DTRT Lab";
  var map = {
    "Talk to Ian.": "Habla con Ian.",
    "Send a note with the form. I work remotely and I answer myself.": "Envía una nota con el formulario. Trabajo en remoto y contesto yo mismo.",
    "Contact": "Contacto",
    "Name": "Nombre",
    "Email": "Correo",
    "Topic": "Tema",
    "General": "General",
    "DMCA notice": "Aviso DMCA",
    "Privacy request": "Solicitud de privacidad",
    "Refund or billing": "Reembolso o facturación",
    "Other": "Otro",
    "Message": "Mensaje",
    "Send": "Enviar",
    "We use your message only to reply.": "Usamos tu mensaje solo para responder.",
    "Never send a password, login or code. I don't need one. Answer 3 short questions and we'll follow up by email.": "Nunca envíes una contraseña, un acceso o un código. No los necesito. Responde 3 preguntas cortas y te escribo por correo.",
    "Shop": "Mercado",
    "Ask (AI)": "Preguntar (IA)",
    "Links": "Enlaces",
    "Contact": "Contacto",
    "Privacy": "Privacidad",
    "Terms": "Términos",
    "Refunds": "Reembolsos",
    "works remotely": "trabaja en remoto",
    "Leave this blank": "Déjalo en blanco",
    "You're not alone. Call or text 988 (US). Si estás en crisis: llama o textea al 988. findahelpline.com (outside US).": "No estás solo/a. Llama o textea al 988 (EE. UU.). Si estás en crisis: llama o textea al 988. findahelpline.com (fuera de EE. UU)."
  };
  var nodes = document.querySelectorAll("h1, h2, .where, .sub, label, button, option, .fine, .pin, nav a, a, p, span");
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var raw = el.textContent.replace(/\s+/g, " ").trim();
    if (map[raw]) {
      if (el.childElementCount === 0) { el.textContent = map[raw]; continue; }
    }
    // Replace leading text node when the element also contains a link (the .fine line).
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) {
        var t = n.textContent;
        var trimmed = t.replace(/\s+/g, " ").trim();
        if (map[trimmed]) n.textContent = t.replace(trimmed, map[trimmed]);
        else {
          for (var k in map) {
            if (k && t.indexOf(k) !== -1) n.textContent = t.replace(k, map[k]);
          }
        }
      }
    }
  }
})();
