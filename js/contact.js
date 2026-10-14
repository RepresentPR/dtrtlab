(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;
  const field = name => form.elements.namedItem(name);
  const status = document.getElementById('contact-status');
  const preview = document.getElementById('email-message');
  const address = document.getElementById('business-email');
  const recipient = 'hello@dtrtlab.com';
  const categories = ['Free plan', 'Paid project inquiry', 'Shop interest', 'Highlight', 'Partner', 'Work opportunity', 'Website', 'Other'];
  const params = new URLSearchParams(window.location.search);
  const route = params.get('intent');
  const productInterest = (params.get('product') || '').trim().slice(0, 80);
  let language = params.get('lang') === 'es' ? 'es' : 'en';
  // Handoff from homepage plan tool (session only; cleared after read).
  try {
    const raw = sessionStorage.getItem('dtrt-plan-draft');
    if (raw) {
      const draft = JSON.parse(raw);
      sessionStorage.removeItem('dtrt-plan-draft');
      if (draft && typeof draft === 'object') {
        if (typeof draft.project === 'string' && draft.project.trim()) field('project').value = draft.project.trim().slice(0, 2000);
        if (typeof draft.goal === 'string' && draft.goal.trim()) field('goal').value = draft.goal.trim().slice(0, 1000);
        if (draft.lang === 'es' || draft.lang === 'en') language = draft.lang;
        if (!field('category').value) field('category').value = 'Free plan';
      }
    }
  } catch (_) {}
  const copy = {
    en: {
      categories: { '': 'Choose one', 'Free plan': 'Free plan', 'Paid project inquiry': 'Paid project inquiry', 'Shop interest': 'Shop interest', Highlight: 'Highlight', Partner: 'Partner', 'Work opportunity': 'Work opportunity', Website: 'Website', Other: 'Other' },
      defaults: { 'Free plan': 'Free plan — business or idea', 'Paid project inquiry': 'Discuss a paid project', 'Shop interest': 'Shop interest — product I’d buy' },
      title: 'Say hello to DTRT Lab', freeTitle: 'Your free writing plan starts here', paidTitle: 'Discuss writing for your business', shopTitle: 'Tell us what you’d buy', pageTitle: 'Contact — DTRT Lab',
      freeContext: 'Three practical priorities, one sample improvement and one next step. Free, with no purchase required. Implementation is agreed separately. Open to any age / any size idea.',
      paidContext: 'Tell us what you need written. Named writing plans are Mini Social Pack $50, Week Pack $129, and Writing Retainer — Starter $250/30 days, paid on Whop. Custom work still needs a written scope first. This page does not collect a card.',
      shopContext: 'Checkout is not live. Tell us which digital or merch item you’d buy so we can open the store with real demand. No charge from this page.',
      context: 'This page prepares an email. It does not send a request or confirm a booking.', optionalMessage: 'Other context (optional)', requiredMessage: 'Message (required)',
      category: 'Category', subject: 'Subject', name: 'Name', reply: 'Reply email', project: 'Business link or idea', goal: 'Goal', to: 'To',
      validation: { category: 'Choose a category.', subject: 'Add a subject.', project: 'Add your public business link or a brief idea description.', goal: 'Add one goal.', message: 'Add a message.', email: 'Enter a valid email address, or leave this optional field empty.' },
      missingPlan: 'Add your business link or idea and one goal before preparing the email.',
      requested: 'Your email app was requested. Review and press Send there. This website has not sent your message or confirmed receipt.',
      copiedAddress: 'Email address copied.', copiedMessage: 'Email message copied.', copied: 'Paste it into your email app, review and send there. This website has not sent anything.',
      copyFailed: 'Select the text and copy manually, then paste it into your email app. This website has not sent anything.',
      nav: 'Main navigation', footer: 'Footer', routes: 'Ways to connect', inquiry: 'Email inquiry',
      labels: {
        'contact-skip': 'Skip to content', 'contact-nav-work': 'Packages', 'contact-nav-results': 'Company', 'contact-nav-about': 'About', 'contact-nav-partner': 'Partner', 'contact-current-link': 'Contact',
        'contact-intro': 'Choose a free writing plan, a named writing plan on Whop, or send a question. You stay in control of sending the email.',
        'contact-free-route': 'Free plan', 'contact-paid-route': 'Discuss writing', 'contact-support-route': 'Writing plans', 'contact-email-intro': 'Email',
        'contact-privacy-note': 'Share public information only; no passwords, customer records or financial details are needed.', 'category-label': 'Category',
        'free-plan-details-title': 'Two required details', 'project-label': '1. Public business link or brief idea description (required)',
        'project-help': 'Any size business or an idea is welcome. A website is optional if you describe the idea.', 'goal-label': '2. One goal (required)', 'goal-help': 'What would you like to make clearer or improve?',
        'subject-label': 'Subject', 'optional-details-title': 'Add a name or reply address (optional)', 'sender-help': 'Your email app already supplies your sender address.', 'name-label': 'Name', 'reply-label': 'Reply email (optional)',
        'prepare-email': 'Prepare email', 'send-help': 'Step 1: prepare your email here. Step 2: review it and press Send in your email app. Nothing is sent by this website, and it cannot confirm receipt.',
        'fallback-title': 'Email app did not open?', 'fallback-help': 'Copy these into a new email, then review and send it yourself. You can also select the text and copy it manually.',
        'to-label': 'To', 'copy-email': 'Copy email address', 'copy-message-label': 'Subject and message to copy', 'copy-message': 'Copy email message',
        'language-help': 'This inquiry page is available in English and Spanish. Spanish wording prepared with AI; no independent native-speaker review. Other linked resources may be in English. Your browser may offer translation into other languages; that translation may be imperfect.',
        'contact-credit': 'DTRT Lab · Writing for local businesses', 'contact-home-link': 'Home', 'contact-footer-about': 'About', 'contact-footer-work': 'Packages', 'contact-footer-results': 'Company', 'contact-footer-partner': 'Partner', 'contact-footer-privacy': 'Privacy', 'contact-footer-terms': 'Terms', 'contact-footer-cookies': 'Cookies'
      }
    },
    es: {
      categories: { '': 'Elige una categoría', 'Free plan': 'Plan gratuito', 'Paid project inquiry': 'Proyecto de pago', 'Shop interest': 'Interés en la tienda', Highlight: 'Clip destacado', Partner: 'Colaboración', 'Work opportunity': 'Oportunidad de trabajo', Website: 'Sitio web', Other: 'Otra consulta' },
      defaults: { 'Free plan': 'Plan gratuito — negocio o idea', 'Paid project inquiry': 'Consultar sobre un proyecto de pago', 'Shop interest': 'Interés en la tienda — producto que compraría' },
      title: 'Contacta con DTRT Lab', freeTitle: 'Tu plan de escritura gratis empieza aquí', paidTitle: 'Hablemos de escritura para tu negocio', shopTitle: 'Dinos qué comprarías', pageTitle: 'Contacto — DTRT Lab',
      freeContext: 'Tres prioridades prácticas, una mejora de ejemplo y un siguiente paso. Gratis, sin obligación de compra. La implementación se acuerda por separado. Abierto a cualquier edad / cualquier tamaño de idea.',
      paidContext: 'Cuéntanos qué necesitas que escribamos. Antes de un trabajo a medida, acordamos por escrito el alcance y el presupuesto. Los planes con nombre se pagan en Whop. Esta página no recoge una tarjeta.',
      shopContext: 'El pago en línea no está activo. Dinos qué producto digital o merch comprarías para abrir la tienda con demanda real. Esta página no cobra nada.',
      context: 'Esta página prepara un correo. No envía una solicitud ni confirma una contratación.', optionalMessage: 'Más contexto (opcional)', requiredMessage: 'Mensaje (obligatorio)',
      category: 'Categoría', subject: 'Asunto', name: 'Nombre', reply: 'Correo para responder', project: 'Enlace del negocio o idea', goal: 'Objetivo', to: 'Para',
      validation: { category: 'Elige una categoría.', subject: 'Añade un asunto.', project: 'Añade el enlace público de tu negocio o una breve descripción de tu idea.', goal: 'Añade un objetivo.', message: 'Añade un mensaje.', email: 'Introduce una dirección de correo válida o deja vacío este campo opcional.' },
      missingPlan: 'Añade el enlace de tu negocio o idea y un objetivo antes de preparar el correo.',
      requested: 'Se solicitó abrir tu aplicación de correo. Revisa el mensaje y pulsa Enviar allí. Este sitio no ha enviado tu mensaje ni puede confirmar su recepción.',
      copiedAddress: 'Dirección de correo copiada.', copiedMessage: 'Mensaje de correo copiado.', copied: 'Pégalo en tu aplicación de correo, revísalo y envíalo allí. Este sitio no ha enviado nada.',
      copyFailed: 'Selecciona el texto y cópialo manualmente; después pégalo en tu aplicación de correo. Este sitio no ha enviado nada.',
      nav: 'Navegación principal', footer: 'Pie de página', routes: 'Formas de contactar', inquiry: 'Consulta por correo',
      labels: {
        'contact-skip': 'Ir al contenido', 'contact-nav-work': 'Paquetes', 'contact-nav-results': 'Empresa', 'contact-nav-about': 'Acerca', 'contact-nav-partner': 'Colabora', 'contact-current-link': 'Contacto',
        'contact-intro': 'Elige un plan de escritura gratis, un plan de escritura en Whop, o envía una pregunta. Tú decides cuándo enviar el correo.',
        'contact-free-route': 'Plan gratis', 'contact-paid-route': 'Hablar de escritura', 'contact-support-route': 'Planes de escritura', 'contact-email-intro': 'Correo',
        'contact-privacy-note': 'Comparte solo información pública; no necesitamos contraseñas, datos de clientes ni detalles financieros.', 'category-label': 'Categoría',
        'free-plan-details-title': 'Dos datos obligatorios', 'project-label': '1. Enlace público del negocio o breve descripción de la idea (obligatorio)',
        'project-help': 'Cualquier tamaño de negocio o idea es bienvenido. No necesitas un sitio web si describes tu idea.', 'goal-label': '2. Un objetivo (obligatorio)', 'goal-help': '¿Qué te gustaría explicar mejor o mejorar?',
        'subject-label': 'Asunto', 'optional-details-title': 'Añadir nombre o correo de respuesta (opcional)', 'sender-help': 'Tu aplicación de correo ya incluye tu dirección de remitente.', 'name-label': 'Nombre', 'reply-label': 'Correo para responder (opcional)',
        'prepare-email': 'Preparar correo', 'send-help': 'Paso 1: prepara tu correo aquí. Paso 2: revísalo y pulsa Enviar en tu aplicación de correo. Este sitio no envía nada ni puede confirmar su recepción.',
        'fallback-title': '¿No se abrió tu aplicación de correo?', 'fallback-help': 'Copia estos datos en un correo nuevo, revísalo y envíalo tú. También puedes seleccionar el texto y copiarlo manualmente.',
        'to-label': 'Para', 'copy-email': 'Copiar dirección de correo', 'copy-message-label': 'Asunto y mensaje para copiar', 'copy-message': 'Copiar asunto y mensaje',
        'language-help': 'Esta página de consultas está disponible en inglés y español. Texto en español preparado con IA; sin revisión independiente de una persona nativa. Otros recursos enlazados pueden estar en inglés. Tu navegador puede ofrecer traducción a otros idiomas; esa traducción puede ser imperfecta.',
        'contact-credit': 'DTRT Lab · Escritura para negocios locales', 'contact-home-link': 'Inicio', 'contact-footer-about': 'Acerca', 'contact-footer-work': 'Paquetes', 'contact-footer-results': 'Empresa', 'contact-footer-partner': 'Colabora', 'contact-footer-privacy': 'Privacidad', 'contact-footer-terms': 'Términos', 'contact-footer-cookies': 'Cookies'
      }
    }
  };
  const allDefaults = Object.values(copy).flatMap(text => Object.values(text.defaults));
  if (route === 'free-plan') field('category').value = 'Free plan';
  if (route === 'paid-project') field('category').value = 'Paid project inquiry';
  if (route === 'shop-interest') field('category').value = 'Shop interest';

  function contactUrl(lang, category = field('category').value) {
    const query = new URLSearchParams();
    if (category === 'Free plan') query.set('intent', 'free-plan');
    if (category === 'Paid project inquiry') query.set('intent', 'paid-project');
    if (category === 'Shop interest') {
      query.set('intent', 'shop-interest');
      if (productInterest) query.set('product', productInterest);
    }
    query.set('lang', lang);
    return '/contact.html?' + query;
  }
  function updateLanguage() {
    const text = copy[language];
    document.documentElement.lang = language;
    document.title = text.pageTitle;
    for (const [id, value] of Object.entries(text.labels)) document.getElementById(id).textContent = value;
    for (const option of field('category').options) option.textContent = text.categories[option.value];
    document.getElementById('contact-main-nav').setAttribute('aria-label', text.nav);
    document.getElementById('contact-footer-nav').setAttribute('aria-label', text.footer);
    document.getElementById('contact-routes').setAttribute('aria-label', text.routes);
    document.getElementById('contact-fields').setAttribute('aria-label', text.inquiry);
    for (const lang of ['en', 'es']) {
      const link = document.getElementById('language-' + lang);
      link.href = contactUrl(lang);
      if (lang === language) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    document.getElementById('contact-free-route').href = contactUrl(language, 'Free plan');
    document.getElementById('contact-paid-route').href = contactUrl(language, 'Paid project inquiry');
    document.getElementById('contact-support-route').href = '/support.html?lang=' + language;
    document.getElementById('contact-current-link').href = contactUrl(language);
    document.getElementById('contact-home-link').href = '/?lang=' + language;
    document.getElementById('contact-brand-link').href = '/?lang=' + language;
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', contactUrl(language));
  }
  function updateValidation() {
    for (const name of ['category', 'subject', 'project', 'goal', 'message', 'email']) {
      const input = field(name);
      input.setCustomValidity('');
      if (input.required && !input.value.trim()) input.setCustomValidity(copy[language].validation[name]);
      else if (name === 'email' && input.value && input.validity.typeMismatch) input.setCustomValidity(copy[language].validation.email);
    }
  }
  function draft() {
    const words = copy[language];
    const data = new FormData(form);
    const text = name => String(data.get(name) || '').trim();
    const category = categories.includes(text('category')) ? text('category') : 'Other';
    const subject = '[' + words.categories[category] + '] ' + text('subject').replace(/[\r\n]+/g, ' ');
    const lines = [words.category + ': ' + words.categories[category]];
    if (text('name')) lines.push(words.name + ': ' + text('name'));
    if (text('email')) lines.push(words.reply + ': ' + text('email'));
    if (category === 'Free plan') lines.push('', words.project + ': ' + text('project'), words.goal + ': ' + text('goal'));
    if (text('message')) lines.push('', text('message'));
    return { subject, body: lines.join('\n') };
  }
  function updatePreview() {
    const email = draft();
    preview.value = copy[language].to + ': ' + recipient + '\n' + copy[language].subject + ': ' + email.subject + '\n\n' + email.body;
  }
  function updateRoute() {
    const category = field('category').value;
    const text = copy[language];
    const free = category === 'Free plan';
    document.getElementById('free-plan-fields').hidden = !free;
    field('project').required = free;
    field('goal').required = free;
    field('message').required = !free;
    document.getElementById('message-label').textContent = free ? text.optionalMessage : text.requiredMessage;
    if (!field('subject').value || allDefaults.includes(field('subject').value)) field('subject').value = text.defaults[category] || '';
    const shop = category === 'Shop interest';
    document.getElementById('contact-title').textContent = free ? text.freeTitle : category === 'Paid project inquiry' ? text.paidTitle : shop ? text.shopTitle : text.title;
    document.getElementById('contact-context').textContent = free ? text.freeContext : category === 'Paid project inquiry' ? text.paidContext : shop ? text.shopContext : text.context;
    if (shop && productInterest && !field('message').value.trim()) {
      field('message').value = language === 'es'
        ? 'Producto de interés: ' + productInterest + '\n\nMe gustaría comprarlo cuando la tienda esté en vivo.'
        : 'Product interest: ' + productInterest + '\n\nI would buy this when checkout is live.';
    }
    status.textContent = '';
    updateLanguage();
    updateValidation();
    updatePreview();
  }
  async function copyText(input, messageKey) {
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = copy[language][messageKey] + ' ' + copy[language].copied;
    } catch (_) {
      input.focus();
      input.select();
      status.textContent = copy[language].copyFailed;
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    updateValidation();
    if (field('category').value === 'Free plan' && (!field('project').value.trim() || !field('goal').value.trim())) {
      status.textContent = copy[language].missingPlan;
      return;
    }
    if (!form.reportValidity()) return;
    const email = draft();
    updatePreview();
    status.textContent = copy[language].requested;
    window.location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(email.subject) + '&body=' + encodeURIComponent(email.body);
  });
  field('category').addEventListener('change', updateRoute);
  form.addEventListener('input', () => { updateValidation(); updatePreview(); });
  document.getElementById('copy-email').addEventListener('click', () => copyText(address, 'copiedAddress'));
  document.getElementById('copy-message').addEventListener('click', () => { updatePreview(); return copyText(preview, 'copiedMessage'); });
  for (const lang of ['en', 'es']) document.getElementById('language-' + lang).addEventListener('click', event => {
    event.preventDefault();
    language = lang;
    updateRoute();
  });
  document.getElementById('contact-fields').disabled = false;
  updateRoute();
})();
