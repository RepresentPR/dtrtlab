(function () {
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

  var warmedTwitch = false;

  function preconnect(href) {
    if (document.head.querySelector('link[rel="preconnect"][href="' + href + '"]')) return;
    var link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }

  function warmTwitch() {
    if (warmedTwitch) return;
    warmedTwitch = true;
    preconnect("https://clips.twitch.tv");
    preconnect("https://player.twitch.tv");
    preconnect("https://static-cdn.jtvnw.net");
  }

  function warmYouTube() {
    preconnect("https://www.youtube-nocookie.com");
  }

  function initTrailer() {
    var button = document.getElementById("trailer-play");
    if (!button) return;
    button.addEventListener("pointerover", warmYouTube);
    button.addEventListener("pointerdown", warmYouTube);
    button.addEventListener("focus", warmYouTube);
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
    if (clip.thumb) {
      var img = document.createElement("img");
      var small = String(clip.thumb).replace(/\.webp(\?.*)?$/, "-320.webp$1");
      img.src = clip.thumb;
      img.srcset = small + " 320w, " + clip.thumb + " 640w";
      img.sizes = "(max-width: 640px) 100vw, (max-width: 900px) 50vw, 360px";
      img.width = 640;
      img.height = 360;
      img.alt = "";
      img.decoding = "async";
      img.loading = index < 3 ? "eager" : "lazy";
      if (index >= 3) img.setAttribute("fetchpriority", "low");
      img.addEventListener("error", function () {
        if (img.parentNode) img.parentNode.removeChild(img);
      });
      button.appendChild(img);
    }
    var tone = document.createElement("span");
    tone.className = "tone";
    tone.setAttribute("aria-hidden", "true");
    var play = document.createElement("span");
    play.className = "play";
    play.setAttribute("aria-hidden", "true");
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = "Play clip: " + clip.title;
    button.appendChild(tone);
    button.appendChild(play);
    button.appendChild(sr);
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
      var evidence = document.createElement("div");
      evidence.className = "evidence";
      var stamp = document.createElement("p");
      stamp.className = "exhibit-stamp";
      stamp.textContent = "Exhibit " + pad(index + 1);
      var mark = document.createElement("p");
      mark.className = "t-stamp";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "T+ 23:41:07";
      evidence.appendChild(stamp);
      evidence.appendChild(mark);
      var title = document.createElement("h3");
      title.textContent = clip.title;
      card.appendChild(stage);
      card.appendChild(evidence);
      card.appendChild(title);
      grid.appendChild(card);
    });

    grid.addEventListener("pointerover", warmTwitch, { passive: true });
    grid.addEventListener("pointerdown", warmTwitch, { passive: true });
    grid.addEventListener("focusin", warmTwitch);

    grid.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest(".clip-facade") : null;
      if (!button || !grid.contains(button)) return;
      warmTwitch();
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
    var panelTitle = document.getElementById("offline-title");
    var panelCopy = document.getElementById("offline-copy");
    if (!frame || !slot || !pill || !pillText) return;

    var STATUS_URL = "https://decapi.me/twitch/uptime/dtrtc";
    var KICK_URL = "https://kick.com/api/v2/channels/movebro";
    var CACHE_KEY = "dtrtc-twitch-live";
    var CACHE_MS = 45000;
    var mode = "checking";
    var requestSeq = 0;

    function playerSrc() {
      var parts = [
        "channel=dtrtc",
        "parent=dtrtlab.com",
        "parent=www.dtrtlab.com",
        "muted=true",
        "autoplay=true"
      ];
      var host = (location.hostname || "").toLowerCase();
      if (host && host !== "dtrtlab.com" && host !== "www.dtrtlab.com") {
        parts.push("parent=" + encodeURIComponent(host));
      }
      return "https://player.twitch.tv/?" + parts.join("&");
    }

    function readCache() {
      try {
        var raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || (data.status !== "live" && data.status !== "offline")) return null;
        if (Date.now() - data.at > CACHE_MS) return null;
        return data.status;
      } catch (error) {
        return null;
      }
    }

    function writeCache(status) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), status: status }));
      } catch (error) {}
    }

    function interpret(text) {
      var body = String(text || "").replace(/^\uFEFF/, "").trim().toLowerCase();
      if (!body) return "unknown";
      if (body.indexOf("offline") !== -1) return "offline";
      if (/\d/.test(body) && /hour|minute|second/.test(body)) return "live";
      return "unknown";
    }

    function mountPlayer() {
      var src = playerSrc();
      var iframe = slot.querySelector("iframe");
      if (iframe && iframe.getAttribute("src") === src) return;
      iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "Live Twitch stream for DTRTC";
      iframe.allow = "autoplay; fullscreen; encrypted-media";
      iframe.allowFullscreen = true;
      iframe.setAttribute("fetchpriority", "low");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      slot.replaceChildren ? slot.replaceChildren(iframe) : (slot.innerHTML = "", slot.appendChild(iframe));
    }

    function clearPlayer() {
      if (slot.replaceChildren) slot.replaceChildren();
      else slot.innerHTML = "";
    }

    function paint() {
      var showPlayer = mode === "live" || mode === "unknown";
      pill.classList.toggle("is-live", mode === "live");
      pill.classList.toggle("is-offline", mode === "offline");
      frame.classList.toggle("is-live", showPlayer);
      frame.setAttribute("aria-busy", mode === "checking" ? "true" : "false");
      if (mode === "live") pillText.textContent = "Live on Twitch";
      else if (mode === "offline") pillText.textContent = "Offline";
      else if (mode === "unknown") pillText.textContent = "Twitch";
      else pillText.textContent = "Checking Twitch";
    }

    function showPlayer(liveKnown) {
      mode = liveKnown ? "live" : "unknown";
      mountPlayer();
      paint();
    }

    function showOffline() {
      mode = "offline";
      clearPlayer();
      if (panelTitle) panelTitle.textContent = "Offline — catch the clips";
      if (panelCopy) panelCopy.textContent = "DTRTC is not live on Twitch. The highlights on this page stay up.";
      paint();
      noteKick();
    }

    function noteKick() {
      fetch(KICK_URL, { cache: "no-store" })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (data) {
          if (mode !== "offline" || !panelCopy) return;
          var stream = data && data.livestream;
          if (stream && stream.is_live) {
            panelCopy.textContent = "DTRTC is not live on Twitch. Kick is live, and the highlights on this page stay up.";
          }
        })
        .catch(function () {});
    }

    function checkStatus() {
      var controller = typeof AbortController === "function" ? new AbortController() : null;
      var timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, 8000)
        : 0;
      return fetch(STATUS_URL, {
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      })
        .then(function (response) {
          if (!response.ok) throw new Error("status");
          return response.text();
        })
        .then(interpret)
        .catch(function () {
          return "unknown";
        })
        .then(function (status) {
          if (timer) window.clearTimeout(timer);
          return status;
        });
    }

    function apply(status) {
      if (status === "offline") showOffline();
      else showPlayer(status === "live");
    }

    function refresh(force) {
      if (!force) {
        var cached = readCache();
        if (cached) {
          apply(cached);
          return;
        }
      }
      var seq = ++requestSeq;
      checkStatus().then(function (status) {
        if (seq !== requestSeq) return;
        if (status === "live" || status === "offline") writeCache(status);
        apply(status);
      });
    }

    var cached = readCache();
    if (cached) apply(cached);
    else paint();
    refresh(true);
    window.setInterval(function () {
      refresh(true);
    }, 60000);
  }

  function onFirstInteraction() {
    warmTwitch();
    document.removeEventListener("pointerdown", onFirstInteraction);
    document.removeEventListener("keydown", onFirstInteraction);
    document.removeEventListener("touchstart", onFirstInteraction);
  }
  document.addEventListener("pointerdown", onFirstInteraction, { passive: true });
  document.addEventListener("keydown", onFirstInteraction);
  document.addEventListener("touchstart", onFirstInteraction, { passive: true });

  initTrailer();
  initClips();
  initLive();
})();
