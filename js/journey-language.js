/* EN/ES customer-journey copy only. Fixed local strings; no translation service or form data. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.apply(root.document, root.location);
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const copy = {
  "evidenceNote": {
    "en": "Optional proof below is in English. Skip it if you already know what you need — use Free plan or Company above.",
    "es": "La prueba opcional de abajo está en inglés. Si ya sabes lo que necesitas, sáltala — usa Plan gratis o Empresa arriba."
  },
  "skip": {
    "en": "Skip to content",
    "es": "Saltar al contenido"
  },
  "navWork": {
    "en": "Examples",
    "es": "Ejemplos"
  },
  "navFree": {
    "en": "Free plan",
    "es": "Plan gratis"
  },
  "navPaid": {
    "en": "Paid",
    "es": "De pago"
  },
  "navCompany": {
    "en": "Company",
    "es": "Empresa"
  },
  "navGuide": {
    "en": "Guide",
    "es": "Guía (inglés)"
  },
  "dockFree": {
    "en": "Free plan",
    "es": "Plan gratis"
  },
  "dockPaid": {
    "en": "Paid",
    "es": "De pago"
  },
  "dockCompany": {
    "en": "Company",
    "es": "Empresa"
  },
  "dockContact": {
    "en": "Contact",
    "es": "Contacto"
  },
  "quickActions": {
    "en": "Quick actions",
    "es": "Acciones rápidas"
  },
  "companyStep": {
    "en": "03 / Orient",
    "es": "03 / Orientarte"
  },
  "companyLabel": {
    "en": "Company hub",
    "es": "Centro de la empresa"
  },
  "companyRoute": {
    "en": "Press, brand, careers, proof — one page, not a maze.",
    "es": "Prensa, marca, empleos y prueba — una página, no un laberinto."
  },
  "dmFallback": {
    "en": "Prefer a DM? <a href=\"https://x.com/DTRTLab\" rel=\"noopener noreferrer\" data-event=\"FreePlanOpenX\">Open X</a> · <a href=\"https://www.instagram.com/officiallydtrt/\" rel=\"noopener noreferrer\" data-event=\"FreePlanOpenInstagram\">Open Instagram</a>",
    "es": "¿Prefieres un mensaje directo? <a href=\"https://x.com/DTRTLab\" rel=\"noopener noreferrer\" data-event=\"FreePlanOpenX\">Abrir X</a> · <a href=\"https://www.instagram.com/officiallydtrt/\" rel=\"noopener noreferrer\" data-event=\"FreePlanOpenInstagram\">Abrir Instagram</a>"
  },

  "navContact": {
    "en": "Contact",
    "es": "Contacto"
  },
  "homeEyebrow": {
    "en": "<span class=\"small-mark\" aria-hidden=\"true\"></span> DTRT LAB / ONE CLICK TO START",
    "es": "<span class=\"small-mark\" aria-hidden=\"true\"></span> DTRT LAB / UN CLIC PARA EMPEZAR"
  },
  "homeTitle": {
    "en": "Make useful stuff.<br><span>Have fun doing it.</span>",
    "es": "Crea cosas útiles.<br><span>Disfruta al hacerlo.</span>"
  },
  "homeLead": {
    "en": "Is your page making people guess what you do? Send one link and one goal. We’ll send back a free plan.",
    "es": "¿Tu página hace que la gente adivine qué haces? Envía un enlace y una meta. Te devolvemos un plan gratis."
  },
  "freeDown": {
    "en": "Get a free plan <span aria-hidden=\"true\">↗</span>",
    "es": "Pide un plan gratis <span aria-hidden=\"true\">↗</span>"
  },
  "workDown": {
    "en": "See examples <span aria-hidden=\"true\">↓</span>",
    "es": "Ver ejemplos <span aria-hidden=\"true\">↓</span>"
  },
  "getGuide": {
    "en": "Grab the free guide <span aria-hidden=\"true\">↗</span>",
    "es": "Obtén la guía gratis (inglés) <span aria-hidden=\"true\">↗</span>"
  },
  "hello": {
    "en": "Say hello <span aria-hidden=\"true\">↗</span>",
    "es": "Salúdanos <span aria-hidden=\"true\">↗</span>"
  },
  "homeNote": {
    "en": "One button. Two details. No treasure map.",
    "es": "Un botón. Dos datos. Sin mapa del tesoro."
  },
  "start": {
    "en": "01 / Start",
    "es": "01 / Empieza"
  },
  "freePlan": {
    "en": "Free plan",
    "es": "Plan gratis"
  },
  "freeRoute": {
    "en": "One click → email draft. Business link or idea + one goal.",
    "es": "Un clic → borrador de correo. Enlace o idea + un objetivo."
  },
  "together": {
    "en": "02 / Hire",
    "es": "02 / Contrata"
  },
  "paidTitle": {
    "en": "Paid project",
    "es": "Proyecto de pago"
  },
  "paidRoute": {
    "en": "Agree on a scope and quote before deciding to begin.",
    "es": "Acordamos el alcance y la cotización antes de decidir si comenzamos."
  },
  "cheer": {
    "en": "03 / Cheer us on",
    "es": "03 / Anímanos"
  },
  "supportLabel": {
    "en": "Support the Lab",
    "es": "Apoya al Lab"
  },
  "supportRoute": {
    "en": "Watch, share, or explore voluntary platform support.",
    "es": "Mira, comparte o explora las opciones de apoyo voluntario de cada plataforma."
  },
  "startEyebrow": {
    "en": "A USEFUL PLACE TO START",
    "es": "UN BUEN COMIENZO"
  },
  "freeTitle": {
    "en": "Get a free plan.<br><span>A clearer next step.</span>",
    "es": "Pide un plan gratis.<br><span>Tu próximo paso, más claro.</span>"
  },
  "freeDetails": {
    "en": "Whether your business is big or small—or you’re starting with an idea—we can work alongside you. Send us your business link or a brief description of your idea, plus one goal. We’ll build you a free plan: three practical priorities, one sample improvement, and a clear next step. No purchase required.",
    "es": "Tengas un negocio grande, pequeño o apenas una idea, podemos trabajar contigo. Envíanos el enlace de tu negocio o una breve descripción de tu idea, más una meta. Te preparamos un plan gratis: tres prioridades prácticas, una mejora de ejemplo y un próximo paso claro. No necesitas comprar nada."
  },
  "satisfaction": {
    "en": "Your satisfaction matters. We agree on the scope, share progress, and ask whether the work meets your expectations.",
    "es": "Tu satisfacción nos importa. Acordamos el alcance, compartimos el progreso y preguntamos si el trabajo cumple tus expectativas."
  },
  "scope": {
    "en": "This offer covers the plan. Any implementation is scoped separately.",
    "es": "La oferta incluye el plan. Cualquier implementación se acuerda por separado."
  },
  "twoDetails": {
    "en": "Two details. One click.",
    "es": "Dos datos. Un clic."
  },
  "openProfile": {
    "en": "Tap the button. Your email app opens with a draft. Add:",
    "es": "Pulsa el botón. Se abre tu aplicación de correo con un borrador. Añade:"
  },
  "businessLink": {
    "en": "Your business’s public link, or a brief description of your idea.",
    "es": "El enlace público de tu negocio o una breve descripción de tu idea."
  },
  "oneGoal": {
    "en": "One goal you want to work toward.",
    "es": "Una meta que quieras alcanzar."
  },
  "openX": {
    "en": "Open DTRT Lab on X <span aria-hidden=\"true\">↗</span>",
    "es": "Abre DTRT Lab en X <span aria-hidden=\"true\">↗</span>"
  },
  "openIg": {
    "en": "Open Instagram · @officiallydtrt <span aria-hidden=\"true\">↗</span>",
    "es": "Abre Instagram · @officiallydtrt <span aria-hidden=\"true\">↗</span>"
  },
  "prepareEmail": {
    "en": "Prepare free-plan email <span aria-hidden=\"true\">↗</span>",
    "es": "Preparar correo del plan gratis <span aria-hidden=\"true\">↗</span>"
  },
  "dmNote": {
    "en": "You may need to sign in to send a DM. Opening a profile does not send a request. The email button does not send anything until you press Send in your email app.",
    "es": "Puede que tengas que iniciar sesión para enviar un mensaje directo. Abrir un perfil no envía una solicitud. El botón de correo no envía nada hasta que pulses Enviar en tu aplicación de correo."
  },
  "inside": {
    "en": "A LOOK INSIDE THE LAB",
    "es": "UNA MIRADA AL LAB"
  },
  "ideas": {
    "en": "Ideas you can see.",
    "es": "Ideas que puedes ver."
  },
  "tryProject": {
    "en": "Try it on your project <span aria-hidden=\"true\">↗</span>",
    "es": "Pruébalo en tu proyecto (inglés) <span aria-hidden=\"true\">↗</span>"
  },
  "workIntro": {
    "en": "Start with a quick hello, or settle in for a five-minute look at the website, workshop, and creative process.",
    "es": "Empieza con una presentación breve o dedica cinco minutos al sitio, el taller y el proceso creativo. Los videos tienen texto en inglés."
  },
  "masterEyebrow": {
    "en": "THE BIGGER PICTURE / 5:04",
    "es": "UNA VISTA MÁS AMPLIA / 5:04"
  },
  "masterTitle": {
    "en": "From ideas to useful public work.",
    "es": "De las ideas al trabajo útil que compartimos."
  },
  "masterCopy": {
    "en": "A tour of the Lab, with original diagrams and a clearly labeled fictional café project. Music, no narration.",
    "es": "Un recorrido por el Lab, con diagramas originales y un proyecto de café claramente identificado como ficticio. Música, sin narración."
  },
  "watchYoutube": {
    "en": "Watch on YouTube <span aria-hidden=\"true\">↗</span>",
    "es": "Míralo en YouTube <span aria-hidden=\"true\">↗</span>"
  },
  "shortEyebrow": {
    "en": "THE QUICK HELLO / 28 SECONDS",
    "es": "UNA PRESENTACIÓN BREVE / 28 SEGUNDOS"
  },
  "shortTitle": {
    "en": "Make your work clear.",
    "es": "Haz que tu trabajo se entienda."
  },
  "shortCopy": {
    "en": "A real example. A useful next step. A little introduction to what we make.",
    "es": "Un ejemplo real. Un próximo paso útil. Una breve presentación de lo que hacemos."
  },
  "watchShort": {
    "en": "Watch the short <span aria-hidden=\"true\">↗</span>",
    "es": "Mira el video corto <span aria-hidden=\"true\">↗</span>"
  },
  "workFootnote": {
    "en": "These edited company videos are separate from the October 11 workshop broadcast. Music credits are included with each video.",
    "es": "Estos videos editados de la empresa son distintos de la transmisión del taller del 11 de octubre. Cada video incluye los créditos de la música."
  },
  "try": {
    "en": "01 / Try",
    "es": "01 / Prueba"
  },
  "guide": {
    "en": "The free guide",
    "es": "La guía gratuita (inglés)"
  },
  "guideCopy": {
    "en": "Practical steps for making and sharing a project",
    "es": "Pasos prácticos para crear y compartir un proyecto"
  },
  "make": {
    "en": "02 / Make",
    "es": "02 / Crea"
  },
  "worksheet": {
    "en": "A blank worksheet",
    "es": "Una hoja de trabajo (inglés)"
  },
  "worksheetCopy": {
    "en": "Your idea, a few useful questions, room to begin",
    "es": "Tu idea, algunas preguntas útiles y espacio para empezar"
  },
  "talk": {
    "en": "03 / Talk",
    "es": "03 / Conversa"
  },
  "sayHello": {
    "en": "Say hello",
    "es": "Salúdanos"
  },
  "helloCopy": {
    "en": "Tell Ian what you’re working on",
    "es": "Cuéntale a Ian en qué estás trabajando"
  },
  "joinEyebrow": {
    "en": "LET’S MAKE SOMETHING USEFUL",
    "es": "CREEMOS ALGO ÚTIL"
  },
  "joinTitle": {
    "en": "Got an idea?<br>Start with a free plan.",
    "es": "¿Tienes una idea?<br>Empieza con un plan gratis."
  },
  "joinCopy": {
    "en": "A business link or a short idea description, plus one goal, is enough to start.",
    "es": "El enlace de tu negocio o una breve descripción de tu idea, más una meta, es suficiente para empezar."
  },
  "freeUp": {
    "en": "Get a free plan <span aria-hidden=\"true\">↗</span>",
    "es": "Pide un plan gratis <span aria-hidden=\"true\">↗</span>"
  },
  "workRoutes": {
    "en": "Do one thing now",
    "es": "Haz una sola cosa ahora"
  },

  "signature": {
    "en": "Do the right thing. Make useful stuff. Have fun doing it.",
    "es": "Haz lo correcto. Crea cosas útiles. Disfruta al hacerlo."
  },
  "workshop": {
    "en": "Workshop",
    "es": "Taller (inglés)"
  },
  "results": {
    "en": "Proof",
    "es": "Prueba (inglés)"
  },
  "about": {
    "en": "About",
    "es": "Acerca del Lab (inglés)"
  },
  "history": {
    "en": "History",
    "es": "Historia (inglés)"
  },
  "privacy": {
    "en": "Privacy",
    "es": "Privacidad (inglés)"
  },
  "terms": {
    "en": "Terms",
    "es": "Términos (inglés)"
  },
  "cookies": {
    "en": "Cookies",
    "es": "Cookies (inglés)"
  },
  "supportTitle": {
    "en": "Help build<br>what's next.",
    "es": "Ayuda a crear<br>lo que viene."
  },
  "supportLead": {
    "en": "Enjoy the work? Watch, share, or choose voluntary support through a platform you use.<br>Direct tips are temporarily unavailable.",
    "es": "¿Te gusta el trabajo? Mira, comparte o elige apoyar voluntariamente a través de una plataforma que uses.<br>Las propinas directas no están disponibles por ahora."
  },
  "navResults": {
    "en": "Results",
    "es": "Resultados (inglés)"
  },
  "navPartner": {
    "en": "Partner",
    "es": "Colabora (inglés)"
  },
  "watchTag": {
    "en": "01 / Watch · Free",
    "es": "01 / Mira · Gratis"
  },
  "watchWork": {
    "en": "Watch the work.",
    "es": "Mira el trabajo."
  },
  "exploreWork": {
    "en": "Explore the company videos, free guide, and projects as they develop.",
    "es": "Explora los videos de la empresa, la guía gratuita y los proyectos mientras se desarrollan."
  },
  "freeSupport": {
    "en": "Watching and sharing are free ways to support the Lab.",
    "es": "Ver y compartir son formas gratuitas de apoyar al Lab."
  },
  "seeWork": {
    "en": "See the work ↗",
    "es": "Mira el trabajo ↗"
  },
  "shareTag": {
    "en": "02 / Share · Free",
    "es": "02 / Comparte · Gratis"
  },
  "shareTitle": {
    "en": "Share a release.",
    "es": "Comparte una publicación."
  },
  "shareCopy": {
    "en": "Pass along a video, guide, or idea that you think someone would value.",
    "es": "Comparte un video, una guía o una idea que creas que alguien apreciaría."
  },
  "shareNote": {
    "en": "Choose something useful for the person you're sharing it with.",
    "es": "Elige algo útil para la persona con quien lo compartas."
  },
  "findShare": {
    "en": "Find something to share ↗",
    "es": "Encuentra algo para compartir ↗"
  },
  "paidTag": {
    "en": "03 / Paid projects",
    "es": "03 / Proyectos de pago"
  },
  "wantTogether": {
    "en": "Want to work together?",
    "es": "¿Quieres trabajar con nosotros?"
  },
  "paidCopy": {
    "en": "Tell us about your business or idea and the help you need. Paid work is agreed separately through a written scope and quote.",
    "es": "Cuéntanos sobre tu negocio o idea y la ayuda que necesitas. El trabajo de pago se acuerda por separado, con un alcance y una cotización por escrito."
  },
  "paidNote": {
    "en": "An enquiry does not create a booking or charge.",
    "es": "Una consulta no crea una reserva ni un cargo."
  },
  "discussPaid": {
    "en": "Discuss a paid project ↗",
    "es": "Consulta sobre un proyecto de pago ↗"
  },
  "platformSupport": {
    "en": "Voluntary platform support",
    "es": "Apoyo voluntario en las plataformas"
  },
  "streamTitle": {
    "en": "Already part<br>of the stream?",
    "es": "¿Ya sigues<br>las transmisiones?"
  },
  "streamLead": {
    "en": "See the subscription and gift options available to your account.",
    "es": "Consulta las opciones de suscripción y regalos disponibles para tu cuenta."
  },
  "streamCopy": {
    "en": "Use the existing Twitch or Kick channel routes below. Availability, eligibility and renewal terms are shown by the platform. Supporting the channel does not purchase a service or book a project.",
    "es": "Usa los enlaces de los canales de Twitch o Kick de abajo. La plataforma muestra la disponibilidad, los requisitos y las condiciones de renovación. Apoyar al canal no compra un servicio ni reserva un proyecto."
  },
  "twitchOptions": {
    "en": "Subscription options on Twitch ↗",
    "es": "Opciones de suscripción en Twitch ↗"
  },
  "kickOptions": {
    "en": "Support options on Kick ↗",
    "es": "Opciones de apoyo en Kick ↗"
  },
  "twitchChat": {
    "en": "Visit Twitch chat ↗",
    "es": "Visita el chat de Twitch ↗"
  },
  "beforeSupport": {
    "en": "Before you support",
    "es": "Antes de apoyar"
  },
  "answers": {
    "en": "A few clear answers.",
    "es": "Algunas respuestas claras."
  },
  "supportFaq": {
    "en": "Does support buy a service or booking?",
    "es": "¿El apoyo compra un servicio o una reserva?"
  },
  "supportAnswer": {
    "en": "No. Support is voluntary. For paid work, <a href=\"/contact.html?intent=paid-project\">discuss a project</a> with us first. We agree the scope, quote and terms with you before any work is booked. Sending an enquiry creates no charge.",
    "es": "No. El apoyo es voluntario. Para trabajo de pago, <a href=\"/contact.html?intent=paid-project\">consulta sobre un proyecto</a> primero. Acordamos contigo el alcance, la cotización y las condiciones antes de reservar el trabajo. Enviar una consulta no genera ningún cargo."
  },
  "freeFaq": {
    "en": "Can I start with a free plan?",
    "es": "¿Puedo empezar con un plan gratis?"
  },
  "freeAnswer": {
    "en": "Yes. Send a business link or brief idea description and one goal. The plan includes three practical priorities, one sample improvement and a clear next step. No purchase required; implementation is scoped separately. <a href=\"/contact.html?intent=free-plan\">Request a free plan</a>.",
    "es": "Sí. Envía el enlace de tu negocio o una breve descripción de tu idea y una meta. El plan incluye tres prioridades prácticas, una mejora de ejemplo y un próximo paso claro. No necesitas comprar nada; la implementación se acuerda por separado. <a href=\"/contact.html?intent=free-plan\">Pide un plan gratis</a>."
  },
  "gameFaq": {
    "en": "Can I buy a game or key?",
    "es": "¿Puedo comprar un juego o una clave?"
  },
  "gameAnswer": {
    "en": "No. Store and preorder checkout are off. There is no public game download.",
    "es": "No. Las compras en la tienda y las preventas están desactivadas. No hay un juego disponible para descarga pública."
  },
  "subscriptionsFaq": {
    "en": "Where are subscriptions handled?",
    "es": "¿Dónde se gestionan las suscripciones?"
  },
  "subscriptionsAnswer": {
    "en": "Twitch and Kick handle their own subscriptions and gifts. DTRT Lab does not collect your card details on this website. Review the platform's terms before choosing an option.",
    "es": "Twitch y Kick gestionan sus propias suscripciones y regalos. DTRT Lab no recoge los datos de tu tarjeta en este sitio. Revisa las condiciones de la plataforma antes de elegir una opción."
  },
  "brandFaq": {
    "en": "What about a brand partnership?",
    "es": "¿Y una colaboración de marca?"
  },
  "brandAnswer": {
    "en": "<a href=\"/partners.html\">Explore partnership enquiries</a>. We agree the placement, creative, dates, quote and disclosure before a booking. An enquiry alone does not book a placement.",
    "es": "<a href=\"/partners.html\">Consulta sobre colaboraciones (inglés)</a>. Acordamos el espacio, el contenido, las fechas, la cotización y la identificación publicitaria antes de una reserva. Una consulta por sí sola no reserva un espacio."
  },
  "helpFaq": {
    "en": "How else can I help?",
    "es": "¿De qué otra forma puedo ayudar?"
  },
  "helpAnswer": {
    "en": "Watch a video, try the guide, share something useful, and tell us what you want to see next.",
    "es": "Mira un video, prueba la guía, comparte algo útil y cuéntanos qué te gustaría ver después."
  },
  "taxNote": {
    "en": "Support is not represented as a tax-deductible charitable donation.",
    "es": "El apoyo no se presenta como una donación benéfica deducible de impuestos."
  },
  "supportFooter": {
    "en": "Support",
    "es": "Apoyo"
  },
  "createdBy": {
    "en": "© 2026 DTRT Lab. Created by Ian.",
    "es": "© 2026 DTRT Lab. Creado por Ian."
  },
  "insights": {
    "en": "Audience &amp; insights",
    "es": "Audiencia y datos (inglés)"
  },
  "coverage": {
    "en": "This customer journey is available in English and Spanish. Guides, videos, archives, and dated evidence remain in English.",
    "es": "Este recorrido está disponible en inglés y español. Las guías, los videos, los archivos y la evidencia fechada siguen en inglés."
  },
  "translation": {
    "en": "Spanish wording was prepared with AI assistance; it has not had independent native-language review.",
    "es": "El texto en español se preparó con ayuda de IA; no ha recibido una revisión independiente de una persona nativa del idioma."
  },
  "unsupported": {
    "en": "Another language? Your browser may offer translation. Review its output carefully; other languages and language-specific service availability are not verified.",
    "es": "¿Otro idioma? La traducción del navegador puede estar disponible. Revisa su resultado con cuidado; no se han verificado otros idiomas ni la disponibilidad de servicios en cada idioma."
  },
  "languageLabel": {
    "en": "Language / Idioma",
    "es": "Idioma / Language"
  },
  "howEyebrow": {
    "en": "HOW WE WORK",
    "es": "CÓMO TRABAJAMOS"
  },
  "howTitle": {
    "en": "Make. Check. Learn. Repeat.",
    "es": "Crea. Revisa. Aprende. Repite."
  },
  "howAside": {
    "en": "Small steps.<br>Something useful at the end.",
    "es": "Pasos pequeños.<br>Algo útil al final."
  },
  "choose": {
    "en": "Choose",
    "es": "Elige"
  },
  "chooseCopy": {
    "en": "Start with a useful question and material we can share.",
    "es": "Empieza con una pregunta útil y material que podamos compartir."
  },
  "makeStep": {
    "en": "Make",
    "es": "Crea"
  },
  "makeCopy": {
    "en": "Give the idea a clear opening and an easy next step.",
    "es": "Dale a la idea un comienzo claro y un próximo paso sencillo."
  },
  "publish": {
    "en": "Publish",
    "es": "Publica"
  },
  "publishCopy": {
    "en": "Each platform post takes one of 17 available spots.",
    "es": "Cada publicación en una plataforma ocupa uno de los 17 espacios disponibles."
  },
  "review": {
    "en": "Review <small>4h</small>",
    "es": "Revisa <small>4h</small>"
  },
  "reviewCopy": {
    "en": "Read the results with their limits before choosing a change.",
    "es": "Lee los resultados y considera sus límites antes de elegir un cambio."
  },
  "improve": {
    "en": "Improve",
    "es": "Mejora"
  },
  "improveCopy": {
    "en": "Try one useful change. Keep learning as the evidence grows.",
    "es": "Prueba un cambio útil. Sigue aprendiendo a medida que se reúne la evidencia."
  },
  "releasesCopy": {
    "en": "Each new release starts with a suitable platform. The saved schedule below shows confirmed plans; planned times are not proof of publication.",
    "es": "Cada nueva publicación empieza en una plataforma adecuada. El calendario guardado que aparece abajo, en inglés, muestra planes confirmados; las horas previstas no prueban que algo se haya publicado."
  },
  "afterlight": {
    "en": "AFTERLIGHT",
    "es": "AFTERLIGHT (inglés)"
  },
  "mainNavigation": {
    "en": "Main navigation",
    "es": "Navegación principal"
  },
  "footerNavigation": {
    "en": "Footer",
    "es": "Pie de página"
  },
  "homeLink": {
    "en": "DTRT Lab home",
    "es": "Inicio de DTRT Lab"
  },
  "usefulRoutes": {
    "en": "Something useful to take with you",
    "es": "Algo útil para llevar contigo"
  },
  "archiveNav": {
    "en": "Work archive",
    "es": "Archivo (inglés)"
  },
  "seeSample": {
    "en": "See a sample plan first <span aria-hidden=\"true\">↗</span>",
    "es": "Mira un plan de muestra primero <span aria-hidden=\"true\">↗</span>"
  },
  "spEyebrow": {
    "en": "SAMPLE FREE PLAN · FICTIONAL EXAMPLE",
    "es": "PLAN GRATIS DE MUESTRA · EJEMPLO FICTICIO"
  },
  "spTitle": {
    "en": "This is what you get back.<br><span>One link. One goal. One plan.</span>",
    "es": "Esto es lo que recibes.<br><span>Un enlace. Una meta. Un plan.</span>"
  },
  "spLabel": {
    "en": "Café Ejemplo is a made-up business. The page and wording below are illustrations, not a client result.",
    "es": "Café Ejemplo es un negocio inventado. La página y el texto son ilustraciones, no el resultado de un cliente."
  },
  "spGoalH": {
    "en": "What they sent",
    "es": "Lo que enviaron"
  },
  "spGoal": {
    "en": "<strong>Link:</strong> their café homepage. <strong>Goal:</strong> more weekday breakfast pickup orders.",
    "es": "<strong>Enlace:</strong> la página principal del café. <strong>Meta:</strong> más órdenes de desayuno para recoger entre semana."
  },
  "spPriH": {
    "en": "Three practical priorities",
    "es": "Tres prioridades prácticas"
  },
  "spP1": {
    "en": "<strong>Say what you sell in the first line.</strong> The page opens with “Welcome to our family since 2019.” A hungry visitor still doesn’t know you do fast breakfast.",
    "es": "<strong>Di lo que vendes en la primera línea.</strong> La página abre con “Bienvenidos a nuestra familia desde 2019.” Alguien con hambre todavía no sabe que haces desayunos rápidos."
  },
  "spP2": {
    "en": "<strong>Give one clear next step.</strong> Menu, About, Gallery and Events all compete. Put one button first: Order for pickup.",
    "es": "<strong>Da un solo próximo paso claro.</strong> Menú, Nosotros, Galería y Eventos compiten entre sí. Pon un botón primero: Ordenar para recoger."
  },
  "spP3": {
    "en": "<strong>Show proof you already have.</strong> Their best reviews sit on another site. Place two or three real ones, used with permission, beside the order button.",
    "es": "<strong>Muestra la prueba que ya tienes.</strong> Sus mejores reseñas están en otro sitio. Coloca dos o tres reales, con permiso, al lado del botón de ordenar."
  },
  "spSampleH": {
    "en": "One sample improvement",
    "es": "Una mejora de ejemplo"
  },
  "spBeforeL": {
    "en": "Before",
    "es": "Antes"
  },
  "spBefore": {
    "en": "Welcome to our family since 2019. We love coffee, community and good vibes.",
    "es": "Bienvenidos a nuestra familia desde 2019. Amamos el café, la comunidad y la buena vibra."
  },
  "spAfterL": {
    "en": "After",
    "es": "Después"
  },
  "spAfter": {
    "en": "Breakfast sandwiches and local coffee, ready in 5 minutes.<br><em>[ Order for pickup ]</em>",
    "es": "Sándwiches de desayuno y café local, listos en 5 minutos.<br><em>[ Ordenar para recoger ]</em>"
  },
  "spNextH": {
    "en": "A clear next step",
    "es": "Un próximo paso claro"
  },
  "spNext": {
    "en": "Change the first line and the button this week. Then compare weekday pickup orders for two weeks against the two weeks before. Keep it if it helps; try the next priority if it doesn’t.",
    "es": "Cambia la primera línea y el botón esta semana. Luego compara las órdenes para recoger entre semana durante dos semanas contra las dos semanas anteriores. Si ayuda, déjalo; si no, prueba la próxima prioridad."
  },
  "spChecksH": {
    "en": "What we look at on every plan",
    "es": "Lo que revisamos en cada plan"
  },
  "spChecks": {
    "en": "<li>Can a stranger tell what you do in five seconds?</li><li>Is there one obvious next step?</li><li>Is the offer clear: what it is, who it’s for, and how to ask?</li><li>Is real proof visible near the decision?</li><li>Does it work on a phone?</li><li>Is it easy to contact you?</li>",
    "es": "<li>¿Un desconocido entiende lo que haces en cinco segundos?</li><li>¿Hay un solo próximo paso obvio?</li><li>¿La oferta está clara: qué es, para quién y cómo pedirla?</li><li>¿Hay prueba real cerca del momento de decidir?</li><li>¿Funciona bien en el celular?</li><li>¿Es fácil contactarte?</li>"
  },
  "spLimits": {
    "en": "A free plan reads your public page and your goal. It does not access your accounts, measure your traffic, or promise results.",
    "es": "Un plan gratis lee tu página pública y tu meta. No entra a tus cuentas, no mide tu tráfico y no promete resultados."
  },
  "spCtaH": {
    "en": "Want one for your business or idea?",
    "es": "¿Quieres uno para tu negocio o tu idea?"
  },
  "spCta": {
    "en": "Send your public link or a short idea, plus one goal. No purchase required.",
    "es": "Envía tu enlace público o una idea corta, más una meta. No necesitas comprar nada."
  }
};
  const titles = { home: { en: 'DTRT Lab — Make useful stuff. Have fun doing it.', es: 'DTRT Lab — Crea cosas útiles. Disfruta al hacerlo.' }, support: { en: 'Support the Lab — DTRT Lab', es: 'Apoya al Lab — DTRT Lab' }, sample: { en: 'Sample free plan — DTRT Lab', es: 'Plan gratis de muestra — DTRT Lab' } };
  function languageFromSearch(search) { return new URLSearchParams(search).get('lang') === 'es' ? 'es' : 'en'; }
  function localizeHref(href, language) {
    if (!href || !href.startsWith('/') || href.startsWith('//')) return href;
    const url = new URL(href, 'https://dtrtlab.com');
    if (!['/', '/index.html', '/contact.html', '/support.html', '/sample-plan.html'].includes(url.pathname)) return href;
    url.searchParams.set('lang', language === 'es' ? 'es' : 'en');
    return url.pathname + url.search + url.hash;
  }
  function apply(document, location) {
    const language = languageFromSearch(location.search);
    document.documentElement.lang = language;
    const title = titles[document.body.dataset.journeyPage];
    if (title) document.title = title[language];
    for (const node of document.querySelectorAll('[data-journey-i18n]')) {
      const entry = copy[node.getAttribute('data-journey-i18n')];
      if (entry) node.innerHTML = entry[language];
    }
    for (const node of document.querySelectorAll('[data-journey-label]')) {
      const entry = copy[node.getAttribute('data-journey-label')];
      if (entry) node.setAttribute('aria-label', entry[language]);
    }
    for (const link of document.querySelectorAll('a[href]')) {
      // The explicit Spanish fallback remains a Spanish route in either view.
      const requested = link.getAttribute('lang') === 'es' ? 'es' : language;
      link.setAttribute('href', localizeHref(link.getAttribute('href'), requested));
    }
    for (const link of document.querySelectorAll('[data-language]')) {
      const value = link.getAttribute('data-language');
      const query = new URLSearchParams(location.search);
      query.set('lang', value);
      link.setAttribute('href', location.pathname + '?' + query.toString() + (location.hash || ''));
      if (value === language) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    return language;
  }
  return { copy, languageFromSearch, localizeHref, apply };
});
