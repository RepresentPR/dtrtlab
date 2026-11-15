/* Dreamy visit layer: time-of-day mood and original in-browser music.
   No audio files, no network, no accounts. A later page load starts the
   piece again. Browsers may wait for a tap before sound is allowed. */
(function () {
  if (window.__dtrtVisit) return;
  window.__dtrtVisit = true;
  var path = location.pathname || "/";
  if (/^\/(live|hq)(\/|$)/.test(path)) return;

  var body = document.body;
  if (!body) return;
  body.classList.add("dream");

  var hour = new Date().getHours();
  var mood = hour < 5 || hour >= 21 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  body.dataset.mood = mood;

  var lines = {
    morning: "Good morning. The page is light, and the music stays soft.",
    afternoon: "Good afternoon. Take the page at an easy pace.",
    evening: "Good evening. The light is warmer, and the music stays low.",
    night: "Good night. The page is quieter, and the music stays sparse."
  };
  var line = document.getElementById("visit-line");
  if (line) line.textContent = lines[mood];

  if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    var a = document.createElement("div");
    var b = document.createElement("div");
    a.className = "dream-orb dream-orb-a";
    b.className = "dream-orb dream-orb-b";
    a.setAttribute("aria-hidden", "true");
    b.setAttribute("aria-hidden", "true");
    body.append(a, b);
  }

  var chords = {
    morning: [261.63, 329.63, 392, 523.25],
    afternoon: [220, 277.18, 329.63, 440],
    evening: [196, 246.94, 293.66, 392],
    night: [146.83, 174.61, 220, 293.66]
  };
  var names = {
    morning: "Morning ambience",
    afternoon: "Afternoon ambience",
    evening: "Evening ambience",
    night: "Night ambience"
  };

  var prefKey = "dtrt-ambience";
  var volKey = "dtrt-ambience-volume";
  function read(key) {
    try { return sessionStorage.getItem(key); } catch (err) { return null; }
  }
  function write(key, value) {
    try { sessionStorage.setItem(key, value); } catch (err) {}
  }

  var wantOn = read(prefKey) !== "off";
  var volume = Number(read(volKey));
  if (!isFinite(volume)) volume = 22;

  var panel = document.createElement("section");
  panel.className = "ambience";
  panel.setAttribute("aria-label", "Site music");
  panel.innerHTML =
    '<p id="ambience-status"></p>' +
    '<div class="ambience-row">' +
    '<button type="button" id="ambience-toggle" aria-pressed="false">Play music</button>' +
    '<label>Volume <input id="ambience-volume" type="range" min="0" max="100" aria-label="Music volume"></label>' +
    "</div>" +
    '<p>Original tones made in this browser.</p>';
  var header = document.querySelector("header");
  if (header) header.insertAdjacentElement("afterend", panel);
  else body.append(panel);

  var status = panel.querySelector("#ambience-status");
  var button = panel.querySelector("#ambience-toggle");
  var slider = panel.querySelector("#ambience-volume");
  slider.value = String(volume);

  var ctx = null;
  var master = null;
  var playing = false;

  function setStatus(text, on) {
    status.textContent = names[mood] + ". " + text;
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.textContent = on ? "Pause music" : "Play music";
  }

  function level() {
    if (!master || !ctx) return;
    var next = playing && !document.hidden ? Number(slider.value) / 100 : 0;
    master.gain.setTargetAtTime(next, ctx.currentTime, 0.25);
  }

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("no audio");
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    var delay = ctx.createDelay();
    delay.delayTime.value = 0.37;
    var feedback = ctx.createGain();
    feedback.gain.value = 0.18;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(master);
    master.connect(ctx.destination);
    chords[mood].forEach(function (frequency, index) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var lfo = ctx.createOscillator();
      var depth = ctx.createGain();
      osc.type = index % 2 ? "triangle" : "sine";
      osc.frequency.value = frequency;
      gain.gain.value = 0.03;
      lfo.frequency.value = 0.04 + index * 0.015;
      depth.gain.value = 0.008;
      lfo.connect(depth);
      depth.connect(gain.gain);
      osc.connect(gain);
      gain.connect(master);
      gain.connect(delay);
      osc.start();
      lfo.start();
    });
  }

  async function start() {
    if (!ctx) build();
    if (ctx.state === "suspended") await ctx.resume();
    playing = true;
    write(prefKey, "on");
    level();
    setStatus("Playing.", true);
  }

  function stop() {
    playing = false;
    write(prefKey, "off");
    level();
    setStatus("Paused.", false);
  }

  button.addEventListener("click", function () {
    if (playing) stop();
    else start().catch(function () { setStatus("Music is unavailable in this browser.", false); });
  });
  slider.addEventListener("input", function () {
    write(volKey, slider.value);
    level();
  });
  document.addEventListener("visibilitychange", level);

  if (!wantOn) {
    setStatus("Paused.", false);
    return;
  }

  setStatus("Waiting for a tap to start the music.", false);
  start().then(function () {
    if (ctx && ctx.state === "running") setStatus("Playing.", true);
  }).catch(function () {
    setStatus("Waiting for a tap to start the music.", false);
  });

  function nudge() {
    if (!wantOn || playing) return;
    start().catch(function () {});
  }
  document.addEventListener("pointerdown", nudge);
  document.addEventListener("keydown", nudge);
})();
