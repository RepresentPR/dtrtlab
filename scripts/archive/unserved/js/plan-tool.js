/* Interactive office map tool — guided steps, no network, visitor sends email themselves. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root.document) api.mount(root.document, root);
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  const DRAFT_KEY = 'dtrt-plan-draft';
  const STEPS = ['type', 'project', 'goal', 'ready'];

  const strings = {
    en: {
      toolTitle: 'Office map tool',
      stepOf: (n, total) => 'Step ' + n + ' of ' + total,
      back: 'Back',
      next: 'Continue',
      typeAsk: 'What are you starting with?',
      typeBiz: 'A business with a public link',
      typeIdea: 'Just an idea (no website yet)',
      projectBiz: 'Paste your public business link',
      projectIdea: 'Describe your idea in one or two sentences',
      projectHelpBiz: 'Website, Instagram, Google Business, or any public page.',
      projectHelpIdea: 'No passwords or private customer data — public idea only.',
      projectPlaceholderBiz: 'https://…',
      projectPlaceholderIdea: 'e.g. A small café that wants clearer weekend hours…',
      goalAsk: 'Pick one goal — or type your own',
      goalCustom: 'Or write your own goal',
      goalPlaceholder: 'What should be clearer or better?',
      goals: [
        'Make my page clearer',
        'Get more inquiries',
        'Explain my offer simply',
        'Launch this idea publicly',
        'Show my work with more proof'
      ],
      readyTitle: 'Ready. One tap to prepare email.',
      readyHint: 'Nothing is sent until you press Send in your email app.',
      summaryType: 'Starting with',
      summaryProject: 'Link or idea',
      summaryGoal: 'Goal',
      prepare: 'Prepare office map email',
      edit: 'Change answers',
      sample: 'See a sample plan first',
      missingProject: 'Add a link or a short idea description to continue.',
      missingGoal: 'Pick a goal or write one to continue.',
      tabStart: 'Start',
      tabExamples: 'Examples',
      tabCompany: 'Company',
      tabMore: 'More',
      moreTitle: 'More',
      morePaid: 'Paid project',
      moreContact: 'Contact',
      moreLang: 'Language',
      moreClose: 'Close',
      typeBizLabel: 'Business',
      typeIdeaLabel: 'Idea'
    },
    es: {
      toolTitle: 'Herramienta de plan gratis',
      stepOf: (n, total) => 'Paso ' + n + ' de ' + total,
      back: 'Atrás',
      next: 'Continuar',
      typeAsk: '¿Con qué empiezas?',
      typeBiz: 'Un negocio con enlace público',
      typeIdea: 'Solo una idea (sin sitio aún)',
      projectBiz: 'Pega el enlace público de tu negocio',
      projectIdea: 'Describe tu idea en una o dos frases',
      projectHelpBiz: 'Sitio web, Instagram, Google Business u otra página pública.',
      projectHelpIdea: 'Sin contraseñas ni datos privados de clientes — solo la idea pública.',
      projectPlaceholderBiz: 'https://…',
      projectPlaceholderIdea: 'p. ej. Un café pequeño que quiere horarios de fin de semana más claros…',
      goalAsk: 'Elige una meta — o escribe la tuya',
      goalCustom: 'O escribe tu propia meta',
      goalPlaceholder: '¿Qué debería quedar más claro o mejorar?',
      goals: [
        'Hacer mi página más clara',
        'Conseguir más consultas',
        'Explicar mi oferta con simpleza',
        'Lanzar esta idea en público',
        'Mostrar mi trabajo con más prueba'
      ],
      readyTitle: 'Listo. Un toque para preparar el correo.',
      readyHint: 'No se envía nada hasta que pulses Enviar en tu app de correo.',
      summaryType: 'Empiezas con',
      summaryProject: 'Enlace o idea',
      summaryGoal: 'Meta',
      prepare: 'Preparar correo del plan gratis',
      edit: 'Cambiar respuestas',
      sample: 'Ver un plan de muestra primero',
      missingProject: 'Añade un enlace o una breve descripción de la idea para continuar.',
      missingGoal: 'Elige una meta o escríbela para continuar.',
      tabStart: 'Empezar',
      tabExamples: 'Ejemplos',
      tabCompany: 'Empresa',
      tabMore: 'Más',
      moreTitle: 'Más',
      morePaid: 'Proyecto de pago',
      moreContact: 'Contacto',
      moreLang: 'Idioma',
      moreClose: 'Cerrar',
      typeBizLabel: 'Negocio',
      typeIdeaLabel: 'Idea'
    }
  };

  function languageOf(document) {
    return document.documentElement.lang === 'es' ? 'es' : 'en';
  }

  function saveDraft(state, language, storage) {
    try {
      const store = storage || sessionStorage;
      store.setItem(DRAFT_KEY, JSON.stringify({
        type: state.type,
        project: String(state.project || '').trim().slice(0, 2000),
        goal: String(state.goal || '').trim().slice(0, 1000),
        lang: language === 'es' ? 'es' : 'en',
        savedAt: Date.now()
      }));
      return true;
    } catch (_) {
      return false;
    }
  }

  function readDraft(storage) {
    try {
      const raw = (storage || sessionStorage).getItem(DRAFT_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      return {
        type: data.type === 'idea' ? 'idea' : data.type === 'business' ? 'business' : '',
        project: String(data.project || '').trim().slice(0, 2000),
        goal: String(data.goal || '').trim().slice(0, 1000)
      };
    } catch (_) {
      return null;
    }
  }

  function clearDraft(storage) {
    try { (storage || sessionStorage).removeItem(DRAFT_KEY); } catch (_) {}
  }

  function contactHandoffUrl(language) {
    return '/contact.html?intent=free-map&lang=' + (language === 'es' ? 'es' : 'en') + '#message';
  }

  function mount(document, win) {
    const root = document.getElementById('plan-tool');
    if (!root) return null;
    const windowRef = win || window;
    const state = { step: 0, type: '', project: '', goal: '', status: '' };

    function t() { return strings[languageOf(document)]; }
    function panel(name) { return root.querySelector('[data-plan-panel="' + name + '"]'); }
    function showStep() {
      const text = t();
      const name = STEPS[state.step];
      for (const el of root.querySelectorAll('[data-plan-panel]')) {
        el.hidden = el.getAttribute('data-plan-panel') !== name;
      }
      const progress = root.querySelector('[data-plan-progress]');
      if (progress) progress.textContent = text.stepOf(state.step + 1, STEPS.length);
      const back = root.querySelector('[data-plan-back]');
      if (back) back.hidden = state.step === 0;
      const status = root.querySelector('[data-plan-status]');
      if (status) status.textContent = state.status;
      refreshCopy();
      if (name === 'ready') fillSummary();
      const focus = panel(name) && panel(name).querySelector('button, textarea, input, a');
      if (focus && typeof focus.focus === 'function') try { focus.focus({ preventScroll: true }); } catch (_) {}
    }

    function refreshCopy() {
      const text = t();
      const set = (sel, value, html) => {
        const node = root.querySelector(sel);
        if (!node) return;
        if (html) node.innerHTML = value;
        else node.textContent = value;
      };
      set('[data-plan-title]', text.toolTitle);
      set('[data-plan-type-ask]', text.typeAsk);
      set('[data-plan-type-biz]', text.typeBiz);
      set('[data-plan-type-idea]', text.typeIdea);
      set('[data-plan-next]', text.next);
      set('[data-plan-back]', text.back);
      set('[data-plan-prepare]', text.prepare);
      set('[data-plan-edit]', text.edit);
      set('[data-plan-sample]', text.sample);
      set('[data-plan-ready-title]', text.readyTitle);
      set('[data-plan-ready-hint]', text.readyHint);
      set('[data-plan-goal-ask]', text.goalAsk);
      set('[data-plan-goal-custom-label]', text.goalCustom);
      const projectLabel = root.querySelector('[data-plan-project-label]');
      const projectHelp = root.querySelector('[data-plan-project-help]');
      const projectInput = root.querySelector('#plan-project');
      if (state.type === 'idea') {
        if (projectLabel) projectLabel.textContent = text.projectIdea;
        if (projectHelp) projectHelp.textContent = text.projectHelpIdea;
        if (projectInput) projectInput.placeholder = text.projectPlaceholderIdea;
      } else {
        if (projectLabel) projectLabel.textContent = text.projectBiz;
        if (projectHelp) projectHelp.textContent = text.projectHelpBiz;
        if (projectInput) projectInput.placeholder = text.projectPlaceholderBiz;
      }
      const goalInput = root.querySelector('#plan-goal');
      if (goalInput) goalInput.placeholder = text.goalPlaceholder;
      const chips = root.querySelector('[data-plan-goal-chips]');
      if (chips) {
        chips.replaceChildren();
        text.goals.forEach((label, index) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'plan-chip';
          btn.textContent = label;
          btn.setAttribute('data-plan-goal-chip', String(index));
          btn.setAttribute('aria-pressed', state.goal === label ? 'true' : 'false');
          btn.addEventListener('click', () => {
            state.goal = label;
            state.status = '';
            const custom = root.querySelector('#plan-goal');
            if (custom) custom.value = label;
            for (const c of chips.querySelectorAll('.plan-chip')) c.setAttribute('aria-pressed', c === btn ? 'true' : 'false');
          });
          chips.appendChild(btn);
        });
      }
      const nextBtn = root.querySelector('[data-plan-next]');
      if (nextBtn) nextBtn.hidden = state.step === 0 || state.step === STEPS.length - 1;
      const nav = root.querySelector('.plan-nav');
      if (nav) nav.hidden = state.step === 0 || state.step === STEPS.length - 1;
      // App tabs + more sheet
      set('[data-tab-label="start"]', text.tabStart);
      set('[data-tab-label="examples"]', text.tabExamples);
      set('[data-tab-label="company"]', text.tabCompany);
      set('[data-tab-label="more"]', text.tabMore);
      set('[data-more-title]', text.moreTitle);
      set('[data-more-paid]', text.morePaid);
      set('[data-more-contact]', text.moreContact);
      set('[data-more-lang]', text.moreLang);
      set('[data-more-close]', text.moreClose);
    }

    function fillSummary() {
      const text = t();
      const typeLabel = state.type === 'idea' ? text.typeIdeaLabel : text.typeBizLabel;
      const set = (sel, value) => { const n = root.querySelector(sel); if (n) n.textContent = value; };
      set('[data-plan-summary-type-label]', text.summaryType);
      set('[data-plan-summary-type]', typeLabel);
      set('[data-plan-summary-project-label]', text.summaryProject);
      set('[data-plan-summary-project]', state.project);
      set('[data-plan-summary-goal-label]', text.summaryGoal);
      set('[data-plan-summary-goal]', state.goal);
    }

    function go(delta) {
      const text = t();
      if (delta > 0) {
        if (state.step === 0 && !state.type) { state.status = text.typeAsk; showStep(); return; }
        if (state.step === 1) {
          const input = root.querySelector('#plan-project');
          state.project = (input && input.value || '').trim();
          if (state.project.length < 3) { state.status = text.missingProject; showStep(); return; }
        }
        if (state.step === 2) {
          const input = root.querySelector('#plan-goal');
          state.goal = (input && input.value || state.goal || '').trim();
          if (state.goal.length < 2) { state.status = text.missingGoal; showStep(); return; }
        }
      }
      state.status = '';
      state.step = Math.max(0, Math.min(STEPS.length - 1, state.step + delta));
      showStep();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    root.querySelectorAll('[data-plan-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.type = btn.getAttribute('data-plan-type');
        state.status = '';
        root.querySelectorAll('[data-plan-type]').forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        go(1);
      });
    });
    const next = root.querySelector('[data-plan-next]');
    if (next) next.addEventListener('click', () => go(1));
    const back = root.querySelector('[data-plan-back]');
    if (back) back.addEventListener('click', () => go(-1));
    const edit = root.querySelector('[data-plan-edit]');
    if (edit) edit.addEventListener('click', () => { state.step = 0; state.status = ''; showStep(); });
    const prepare = root.querySelector('[data-plan-prepare]');
    if (prepare) prepare.addEventListener('click', () => {
      const lang = languageOf(document);
      saveDraft(state, lang);
      windowRef.location.href = contactHandoffUrl(lang);
    });

    // Mobile more sheet
    const sheet = document.getElementById('app-more-sheet');
    const openMore = () => { if (sheet) { sheet.hidden = false; document.body.classList.add('app-sheet-open'); } };
    const closeMore = () => { if (sheet) { sheet.hidden = true; document.body.classList.remove('app-sheet-open'); } };
    document.querySelectorAll('[data-app-more-open]').forEach(el => el.addEventListener('click', event => { event.preventDefault(); openMore(); }));
    document.querySelectorAll('[data-app-more-close]').forEach(el => el.addEventListener('click', event => { event.preventDefault(); closeMore(); }));
    if (sheet) sheet.addEventListener('click', event => { if (event.target === sheet) closeMore(); });

    // Tab active state by hash / path intent
    function syncTabs() {
      const hash = (windowRef.location.hash || '').replace('#', '');
      let active = 'start';
      if (hash === 'packages' || hash === 'services') active = 'packages';
      else if (hash === 'contact' || hash === 'contact-band') active = 'contact';
      else if (hash === 'highlights' || hash === 'company-work') active = 'examples';
      document.querySelectorAll('[data-app-tab]').forEach(tab => {
        const on = tab.getAttribute('data-app-tab') === active;
        tab.setAttribute('aria-current', on ? 'page' : 'false');
      });
    }
    windowRef.addEventListener('hashchange', syncTabs);
    syncTabs();

    // Re-render chips when language changes via journey-language links
    document.querySelectorAll('[data-language]').forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => { refreshCopy(); showStep(); }, 0);
      });
    });

    showStep();
    return { state, go, showStep, saveDraft, readDraft, clearDraft, strings, STEPS, DRAFT_KEY, contactHandoffUrl };
  }

  function applyContactDraft(document, storage) {
    const draft = readDraft(storage);
    if (!draft || (!draft.project && !draft.goal)) return false;
    const project = document.getElementById('contact-project');
    const goal = document.getElementById('contact-goal');
    if (project && draft.project) project.value = draft.project;
    if (goal && draft.goal) goal.value = draft.goal;
    clearDraft(storage);
    return true;
  }

  return { mount, saveDraft, readDraft, clearDraft, applyContactDraft, strings, STEPS, DRAFT_KEY, contactHandoffUrl };
});
