(function () {
  var AFTERLIGHT = [
    { title: "Antes que crezcas", src: "audio/radios/antes-que-crezcas.mp3" },
    { title: "La isla recuerda", src: "audio/radios/la-isla-recuerda.mp3" },
    { title: "La Silla Vacía", src: "audio/radios/la-silla-vacia.mp3" },
    { title: "No firmé pa’ esto", src: "audio/radios/no-firme-pa-esto.mp3" },
    { title: "No te me quites", src: "audio/radios/no-te-me-quites.mp3" },
    { title: "Por la Libre", src: "audio/radios/por-la-libre.mp3" },
    { title: "The Second Envelope", src: "audio/radios/the-second-envelope.mp3" }
  ];

  var ISABELLA = [
    { title: "A tu pasito", note: "Daddy’s Voice Edition", src: "audio/isabella/a-tu-pasito.mp3" },
    { title: "At Your Own Pace", note: "Daddy’s Voice Edition", src: "audio/isabella/at-your-own-pace.mp3" }
  ];

  function fmt(s) {
    if (!isFinite(s) || s < 0) return "0:00";
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function bind(root, TRACKS) {
    if (!root || !TRACKS || !TRACKS.length) return;
    var id = root.id;
    function $(name) { return document.getElementById(id + "-" + name); }
    var audio = $( "audio");
    var listEl = $("list");
    var titleEl = $("now");
    var noteEl = $("note");
    var playBtn = $("play");
    var prevBtn = $("prev");
    var nextBtn = $("next");
    var shuffleBtn = $("shuffle");
    var knob = $("knob");
    var volRead = $("vol");
    var seek = $("seek");
    var timeEl = $("time");
    if (!audio || !titleEl || !playBtn) return;

    var order = TRACKS.map(function (_, i) { return i; });
    var pos = 0;
    var shuffled = false;
    var volume = 0.8;

    function current() {
      return TRACKS[order[pos]];
    }

    function paintList() {
      if (!listEl) return;
      listEl.innerHTML = "";
      TRACKS.forEach(function (t, i) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = t.note ? t.title + " — " + t.note : t.title;
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
      if (!knob) return;
      var deg = -135 + volume * 270;
      knob.style.setProperty("--deg", deg + "deg");
      knob.setAttribute("aria-valuenow", String(Math.round(volume * 100)));
      if (volRead) volRead.textContent = Math.round(volume * 100) + "%";
    }

    function load(play) {
      var t = current();
      audio.src = t.src;
      titleEl.textContent = t.title;
      if (noteEl) noteEl.textContent = t.note || "";
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
    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });
    if (shuffleBtn) shuffleBtn.addEventListener("click", function () {
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
    if (seek && timeEl) {
      audio.addEventListener("timeupdate", function () {
        if (!audio.duration) return;
        seek.value = String((audio.currentTime / audio.duration) * 1000);
        timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
      });
      seek.addEventListener("input", function () {
        if (!audio.duration) return;
        audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
      });
    }

    if (knob) {
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
    }

    load(false);
  }

  bind(document.getElementById("al-radio"), AFTERLIGHT);
  bind(document.getElementById("isa-radio"), ISABELLA);
})();
