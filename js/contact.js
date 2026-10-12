(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;
  const field = name => form.elements.namedItem(name);
  const status = document.getElementById('contact-status');
  const preview = document.getElementById('email-message');
  const address = document.getElementById('business-email');
  const recipient = 'DTRTCollision@outlook.com';
  const categories = ['Free plan', 'Paid project inquiry', 'Highlight', 'Partner', 'Work opportunity', 'Website', 'Other'];
  const route = new URLSearchParams(window.location.search).get('intent');
  const defaults = { 'Free plan': 'Free plan — business or idea', 'Paid project inquiry': 'Discuss a paid project' };
  if (route === 'free-plan') field('category').value = 'Free plan';
  if (route === 'paid-project') field('category').value = 'Paid project inquiry';

  function draft() {
    const data = new FormData(form);
    const text = name => String(data.get(name) || '').trim();
    const category = categories.includes(text('category')) ? text('category') : 'Other';
    const subject = '[' + category + '] ' + text('subject').replace(/[\r\n]+/g, ' ');
    const lines = ['Category: ' + category];
    if (text('name')) lines.push('Name: ' + text('name'));
    if (text('email')) lines.push('Reply email: ' + text('email'));
    if (category === 'Free plan') lines.push('', 'Business link or idea: ' + text('project'), 'Goal: ' + text('goal'));
    if (text('message')) lines.push('', text('message'));
    return { subject, body: lines.join('\n') };
  }
  function updatePreview() {
    const email = draft();
    preview.value = 'To: ' + recipient + '\nSubject: ' + email.subject + '\n\n' + email.body;
  }
  function updateRoute() {
    const category = field('category').value;
    const free = category === 'Free plan';
    document.getElementById('free-plan-fields').hidden = !free;
    field('project').required = free;
    field('goal').required = free;
    field('message').required = !free;
    document.getElementById('message-label').textContent = free ? 'Other context (optional)' : 'Message (required)';
    if (!field('subject').value || Object.values(defaults).includes(field('subject').value)) field('subject').value = defaults[category] || '';
    document.getElementById('contact-title').textContent = free ? 'Your free plan starts here' : category === 'Paid project inquiry' ? 'Discuss a paid project' : 'Say hello to DTRT Lab';
    document.getElementById('contact-context').textContent = free ? 'Three practical priorities, one sample improvement and one next step. Free, with no purchase required. Implementation is agreed separately.' : category === 'Paid project inquiry' ? 'Tell us what you need. A written scope, quote and agreement come before paid work. This is an inquiry, not a booking. Online checkout is unavailable.' : 'This page prepares an email. It does not send a request or confirm a booking.';
    status.textContent = '';
    updatePreview();
  }
  async function copyText(input, label) {
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = label + ' copied. Paste it into your email app, review and send there. This website has not sent anything.';
    } catch (_) {
      input.focus();
      input.select();
      status.textContent = 'Select the text and copy manually, then paste it into your email app. This website has not sent anything.';
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (field('category').value === 'Free plan' && (!field('project').value.trim() || !field('goal').value.trim())) {
      status.textContent = 'Add your business link or idea and one goal before preparing the email.';
      return;
    }
    if (!form.reportValidity()) return;
    const email = draft();
    updatePreview();
    status.textContent = 'Your email app was requested. Review and press Send there. This website has not sent your message or confirmed receipt.';
    window.location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(email.subject) + '&body=' + encodeURIComponent(email.body);
  });
  field('category').addEventListener('change', updateRoute);
  form.addEventListener('input', updatePreview);
  document.getElementById('copy-email').addEventListener('click', () => copyText(address, 'Email address'));
  document.getElementById('copy-message').addEventListener('click', () => { updatePreview(); return copyText(preview, 'Email message'); });
  document.getElementById('contact-fields').disabled = false;
  updateRoute();
})();
