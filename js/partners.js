(() => {
  'use strict';
  const form = document.getElementById('partner-form');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const text = ['DTRT partnership enquiry', '', ...['name', 'brand', 'email', 'placement', 'budget', 'dates', 'message'].map(key => key.toUpperCase() + ': ' + String(data.get(key) || ''))].join('\n');
    const link = 'mailto:hello@dtrtlab.com?subject=' + encodeURIComponent('DTRT partnership enquiry — ' + data.get('brand')) + '&body=' + encodeURIComponent(text);
    window.location.href = link;
    document.getElementById('partner-status').textContent = 'Your email app was requested. Review and send the brief there. If it did not open, email hello@dtrtlab.com directly. This website has not sent your enquiry.';
    // Preparation is an intent only. Never send the brief or personal fields to analytics.
    try {
      if (typeof window.dtrtTrackEvent === 'function') window.dtrtTrackEvent('PartnershipBriefPrepared');
    } catch (error) {
      // Blocked analytics must not interrupt the email handoff.
    }
  });
  document.getElementById('partner-fields').disabled = false;
})();
