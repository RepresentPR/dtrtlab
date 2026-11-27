const video = document.getElementById('homepage-video');
const frame = document.getElementById('homepage-video-frame');

if (video && frame) {
  const source = video.querySelector('source');
  const portrait = window.matchMedia('(max-width: 600px) and (orientation: portrait)');
  let selected = 'desktop';
  let restoreTime = null;
  frame.dataset.layout = selected;

  function chooseVariant() {
    // A rotation must not interrupt a visitor's playback or start it again.
    if (!video.paused && !video.ended) return;
    const next = portrait.matches ? 'portrait' : 'desktop';
    if (next === selected) return;
    restoreTime = video.ended ? 0 : (restoreTime ?? video.currentTime);
    selected = next;
    frame.dataset.layout = selected;
    video.poster = video.dataset[`${selected}Poster`];
    source.src = video.dataset[`${selected}Src`];
    video.load();
  }

  video.addEventListener('loadedmetadata', () => {
    // Ignore an event from a previous load after a rapid orientation change.
    if (restoreTime === null || video.currentSrc !== source.src) return;
    const time = Math.max(0, Math.min(restoreTime, video.duration || 0));
    restoreTime = null;
    if (time > 0) video.currentTime = time;
  });
  portrait.addEventListener('change', chooseVariant);
  video.addEventListener('pause', chooseVariant);
  video.addEventListener('ended', chooseVariant);
  chooseVariant();
}
