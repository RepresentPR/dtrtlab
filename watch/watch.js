'use strict';

const start = Date.parse('2026-10-11T20:00:00-04:00');
const countdown = document.getElementById('countdown');
const label = document.getElementById('countdown-label');
const note = document.getElementById('countdown-note');

function updateCountdown() {
  const remaining = Math.max(0, Math.ceil((start - Date.now()) / 1000));
  if (remaining === 0) {
    label.textContent = 'SCHEDULED START REACHED';
    countdown.textContent = 'Check YouTube';
    note.textContent = 'The YouTube event page has the current stream status.';
    return;
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  countdown.textContent = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

updateCountdown();
setInterval(updateCountdown, 1000);
