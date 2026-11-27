/* Time-of-day line and optional original tones.
   Music stays off until the visitor presses Play. No autoplay, and no
   start from a key or a tap elsewhere on the page. The light dream layer
   applies only when the page already has class "dream". */
(function () {
  if (window.__dtrtVisit) return;
  window.__dtrtVisit = true;
  var path = location.pathname || "/";
  if (/^\/(live|hq)(\/|$)/.test(path)) return;

  var body = document.body;
  if (!body) return;
  var dream = body.classList.contains("dream");

  var hour = new Date().getHours();
  var mood = hour < 5 || hour >= 21 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  if (dream) body.dataset.mood = mood;

  var isEs = /(?:\?|&)lang=es(?:&|$)/.test(location.search);
  var lines = isEs
    ? { morning: "Buenos días.", afternoon: "Buenas tardes.", evening: "Buenas tardes.", night: "Buenas noches." }
    : { morning: "Good morning.", afternoon: "Good afternoon.", evening: "Good evening.", night: "Good night." };
  var line = document.getElementById("visit-line");
  if (line) line.textContent = lines[mood];

  if (dream && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
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
  var names = isEs
    ? { morning: "Ambiente de mañana", afternoon: "Ambiente de tarde", evening: "Ambiente de atardecer", night: "Ambiente de noche" }
    : { morning: "Morning ambience", afternoon: "Afternoon ambience", evening: "Evening ambience", night: "Night ambience" };

  var prefKey = "dtrt-ambience";
  var volKey = "dtrt-ambience-volume";
  function read(key) {
    try { return sessionStorage.getItem(key); } catch (err) { return null; }
  }
  function write(key, value) {
    try { sessionStorage.setItem(key, value); } catch (err) {}
  }

  var saved = read(volKey);
  var volume = Number(saved);
  if (saved == null || saved === "" || !isFinite(volume)) volume = 40;

  var panel = document.createElement("section");
  panel.className = "ambience";
  panel.setAttribute("aria-label", isEs ? "Música del sitio" : "Site music");
  panel.innerHTML =
    '<p id="ambience-status"></p>' +
    '<div class="ambience-row">' +
    '<button type="button" id="ambience-toggle" aria-pressed="false">' + (isEs ? 'Reproducir música' : 'Play music') + '</button>' +
    '<label>' + (isEs ? 'Volumen' : 'Volume') + ' <input id="ambience-volume" type="range" min="0" max="100" aria-label="' + (isEs ? 'Volumen de la música' : 'Music volume') + '"></label>' +
    "</div>" +
    '<p>' + (isEs ? 'Tonos originales hechos en este navegador.' : 'Original tones made in this browser.') + '</p>';
  body.append(panel);

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
    button.textContent = on ? (isEs ? "Pausar música" : "Pause music") : (isEs ? "Reproducir música" : "Play music");
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
    setStatus(isEs ? "Reproduciendo." : "Playing.", true);
  }

  function stop() {
    playing = false;
    level();
    setStatus(isEs ? "Apagado hasta que pulses Reproducir." : "Off until you press Play.", false);
  }

  button.addEventListener("click", function () {
    if (playing) stop();
    else start().catch(function () { setStatus(isEs ? "La música no está disponible en este navegador." : "Music is unavailable in this browser.", false); });
  });
  slider.addEventListener("input", function () {
    write(volKey, slider.value);
    level();
  });
  document.addEventListener("visibilitychange", level);
  setStatus(isEs ? "Apagado hasta que pulses Reproducir." : "Off until you press Play.", false);
})();
