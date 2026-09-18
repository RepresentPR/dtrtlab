(function () {
  var TRACKS = [
    { title: "Antes que crezcas", src: "audio/radios/antes-que-crezcas.mp3" },
    { title: "La isla recuerda", src: "audio/radios/la-isla-recuerda.mp3" },
    { title: "La Silla Vacía", src: "audio/radios/la-silla-vacia.mp3" },
    { title: "No firmé pa’ esto", src: "audio/radios/no-firme-pa-esto.mp3" },
    { title: "No te me quites", src: "audio/radios/no-te-me-quites.mp3" },
    { title: "Por la Libre", src: "audio/radios/por-la-libre.mp3" },
    { title: "The Second Envelope", src: "audio/radios/the-second-envelope.mp3" }
  ];

  var root = document.getElementById("al-radio");
  if (!root) return;

  var audio = document.getElementById("al-radio-audio");
  var listEl = document.getElementById("al-radio-list");
  var titleEl = document.getElementById("al-radio-now");
  var playBtn = document.getElementById("al-radio-play");
  var prevBtn = document.getElementById("al-radio-prev");
  var nextBtn = document.getElementById("al-radio-next");
  var shuffleBtn = document.getElementById("al-radio-shuffle");
  var knob = document.getElementById("al-radio-knob");
  var volRead = document.getElementById("al-radio-vol");
  var seek = document.getElementById("al-radio-seek");
  var timeEl = document.getElementById("al-radio-time");

  var order = TRACKS.map(function (_, i) { return i; });
  var pos = 0;
  var shuffled = false;
  var volume = 0.8;

  function fmt(s) {
    if (!isFinite(s) || s < 0) return "0:00";
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function current() {
    return TRACKS[order[pos]];
  }

  function paintList() {
    listEl.innerHTML = "";
    TRACKS.forEach(function (t, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = t.title;
      if (t === current()) b.setAttribute("aria-current", "true");
      b.addEventListener("click", function () {
        var at = order.indexOf(i);
        pos = at === -1 ? 0 : at;
        load(true);
      });
      li.appendChild(b);
      listEl.appendChild(li);
    });
  }

  function setKnob(v) {
    volume = Math.max(0, Math.min(1, v));
    audio.volume = volume;
    var deg = -135 + volume * 270;
    knob.style.setProperty("--deg", deg + "deg");
    knob.setAttribute("aria-valuenow", String(Math.round(volume * 100)));
    if (volRead) volRead.textContent = Math.round(volume * 100) + "%";
  }

  function load(play) {
    var t = current();
    audio.src = t.src;
    titleEl.textContent = t.title;
    paintList();
    playBtn.setAttribute("aria-pressed", play ? "true" : "false");
    playBtn.textContent = play ? "Pause" : "Play";
    if (play) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function step(dir) {
    pos = (pos + dir + order.length) % order.length;
    load(true);
  }

  function shuffleOrder() {
    var cur = order[pos];
    var rest = order.filter(function (i) { return i !== cur; });
    for (var i = rest.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = rest[i];
      rest[i] = rest[j];
      rest[j] = tmp;
    }
    order = [cur].concat(rest);
    pos = 0;
  }

  playBtn.addEventListener("click", function () {
    if (!audio.src) load(true);
    else if (audio.paused) {
      audio.play();
      playBtn.textContent = "Pause";
      playBtn.setAttribute("aria-pressed", "true");
    } else {
      audio.pause();
      playBtn.textContent = "Play";
      playBtn.setAttribute("aria-pressed", "false");
    }
  });
  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });
  shuffleBtn.addEventListener("click", function () {
    shuffled = !shuffled;
    shuffleBtn.setAttribute("aria-pressed", shuffled ? "true" : "false");
    if (shuffled) shuffleOrder();
    else {
      var cur = order[pos];
      order = TRACKS.map(function (_, i) { return i; });
      pos = order.indexOf(cur);
    }
    paintList();
  });

  audio.addEventListener("ended", function () { step(1); });
  audio.addEventListener("timeupdate", function () {
    if (!audio.duration) return;
    seek.value = String((audio.currentTime / audio.duration) * 1000);
    timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
  });
  seek.addEventListener("input", function () {
    if (!audio.duration) return;
    audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
  });

  function volumeFromPointer(e) {
    var r = knob.getBoundingClientRect();
    var x = (e.clientX || 0) - r.left - r.width / 2;
    var y = (e.clientY || 0) - r.top - r.height / 2;
    var ang = Math.atan2(x, -y) * 180 / Math.PI;
    ang = Math.max(-135, Math.min(135, ang));
    setKnob((ang + 135) / 270);
  }

  var dragging = false;
  knob.addEventListener("pointerdown", function (e) {
    dragging = true;
    knob.setPointerCapture(e.pointerId);
    volumeFromPointer(e);
  });
  knob.addEventListener("pointermove", function (e) {
    if (dragging) volumeFromPointer(e);
  });
  knob.addEventListener("pointerup", function () { dragging = false; });
  knob.addEventListener("pointercancel", function () { dragging = false; });
  knob.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { setKnob(volume + 0.05); e.preventDefault(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setKnob(volume - 0.05); e.preventDefault(); }
  });

  setKnob(volume);
  load(false);
})();
