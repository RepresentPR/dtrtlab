(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function parents() {
    var list = ["dtrtlab.com", "www.dtrtlab.com"];
    var host = (location.hostname || "").toLowerCase();
    if (host && list.indexOf(host) === -1) list.push(host);
    return list;
  }

  function clipSrc(slug) {
    var src =
      "https://clips.twitch.tv/embed?clip=" +
      encodeURIComponent(slug) +
      "&parent=dtrtlab.com&parent=www.dtrtlab.com";
    var host = (location.hostname || "").toLowerCase();
    if (host && host !== "dtrtlab.com" && host !== "www.dtrtlab.com") {
      src += "&parent=" + encodeURIComponent(host);
    }
    return src + "&autoplay=true&muted=false";
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function initTrailer() {
    var button = document.getElementById("trailer-play");
    if (!button) return;
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-video") || "";
      if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return;
      var frame = button.parentNode;
      var iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        id +
        "?autoplay=1&rel=0&modestbranding=1";
      iframe.title = "DTRTC: The Cursed Queue — Halloween trailer";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.replaceChild(iframe, button);
    });
  }

  function facadeButton(clip, index) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "clip-facade";
    button.innerHTML =
      '<span class="clip-idx">' +
      pad(index + 1) +
      '</span><span class="play" aria-hidden="true"></span><span class="sr-only">Play clip: ' +
      clip.title.replace(/&/g, "&amp;").replace(/</g, "&lt;") +
      "</span>";
    return button;
  }

  function mountFacade(stage, clip, index) {
    stage.innerHTML = "";
    stage.appendChild(facadeButton(clip, index));
  }

  function initClips() {
    var grid = document.getElementById("clip-grid");
    if (!grid) return;
    var clips = (window.DTRT_CLIPS || []).filter(function (clip) {
      return clip && clip.slug && clip.title;
    });
    if (!clips.length) {
      grid.innerHTML = "<p>No clips listed yet. Add one in content/clips.js.</p>";
      return;
    }
    clips.forEach(function (clip, index) {
      var card = document.createElement("article");
      card.className = "clip-card";
      var stage = document.createElement("div");
      stage.className = "clip-stage";
      mountFacade(stage, clip, index);
      var title = document.createElement("h3");
      title.textContent = clip.title;
      card.appendChild(stage);
      card.appendChild(title);
      grid.appendChild(card);
    });

    grid.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest(".clip-facade") : null;
      if (!button || !grid.contains(button)) return;
      var stage = button.parentNode;
      var card = stage.parentNode;
      var index = Array.prototype.indexOf.call(grid.children, card);
      var clip = clips[index];
      if (!clip) return;
      grid.querySelectorAll(".clip-stage").forEach(function (other, otherIndex) {
        if (other === stage) return;
        if (other.querySelector("iframe")) mountFacade(other, clips[otherIndex], otherIndex);
      });
      var iframe = document.createElement("iframe");
      iframe.src = clipSrc(clip.slug);
      iframe.title = clip.title + " — DTRTC clip";
      iframe.allow = "autoplay; fullscreen";
      iframe.allowFullscreen = true;
      stage.innerHTML = "";
      stage.appendChild(iframe);
    });
  }

  function initLive() {
    var frame = document.getElementById("live-frame");
    var slot = document.getElementById("twitch-slot");
    var pill = document.getElementById("live-pill");
    var pillText = document.getElementById("live-pill-text");
    var panel = document.getElementById("offline-panel");
    var panelTitle = document.getElementById("offline-title");
    var panelCopy = document.getElementById("offline-copy");
    if (!frame || !slot || !pill || !pillText) return;

    var mode = "checking";

    function paint() {
      pill.classList.toggle("is-live", mode === "live");
      pill.classList.toggle("is-offline", mode === "offline");
      frame.classList.toggle("is-live", mode === "live");
      frame.setAttribute("aria-busy", mode === "checking" ? "true" : "false");
    }

    function setLive() {
      mode = "live";
      pillText.textContent = "Live on Twitch";
      paint();
    }

    function setOffline(kind) {
      if (mode === "live") return;
      mode = "offline";
      pillText.textContent = "Offline";
      if (panelTitle && panelCopy) {
        if (kind === "event") {
          panelTitle.textContent = "Signal lost";
          panelCopy.textContent = "DTRTC is not live on Twitch right now. The queue starts when the channel goes live. Kick is linked if the show is over there.";
        } else {
          panelTitle.textContent = "Player unavailable";
          panelCopy.textContent = "This page could not confirm a Twitch signal. Open the channel directly, or try Kick.";
        }
      }
      if (panel) panel.hidden = false;
      paint();
    }

    paint();

    function start(player) {
      var sawOffline = false;
      try {
        player.addEventListener(Twitch.Player.ONLINE, function () {
          setLive();
          if (!reduceMotion) {
            try {
              player.setMuted(true);
              player.play();
            } catch (error) {}
          }
        });
        player.addEventListener(Twitch.Player.OFFLINE, function () {
          sawOffline = true;
          setOffline("event");
        });
        player.addEventListener(Twitch.Player.READY, function () {
          var iframe = slot.querySelector("iframe");
          if (iframe) iframe.title = "Twitch player for DTRTC";
        });
      } catch (error) {
        setOffline("error");
        return;
      }
      window.setTimeout(function () {
        if (mode === "checking") setOffline(sawOffline ? "event" : "timeout");
      }, 12000);
    }

    var script = document.createElement("script");
    script.src = "https://player.twitch.tv/js/embed/v1.js";
    script.async = true;
    script.onload = function () {
      if (!window.Twitch || !window.Twitch.Player) {
        setOffline("error");
        return;
      }
      var width = slot.clientWidth || frame.clientWidth || 640;
      var height = slot.clientHeight || frame.clientHeight || Math.round((width * 9) / 16);
      try {
        var player = new Twitch.Player("twitch-slot", {
          width: width,
          height: height,
          channel: "dtrtc",
          parent: parents(),
          autoplay: false,
          muted: true
        });
        start(player);
      } catch (error) {
        setOffline("error");
      }
    };
    script.onerror = function () {
      setOffline("error");
    };
    document.head.appendChild(script);
  }

  initTrailer();
  initClips();
  initLive();
})();
