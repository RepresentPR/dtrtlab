(function () {
  var KEY = "dtrt-afterlight-v1";
  function get(k) {
    try { return localStorage.getItem(KEY + k); } catch (e) { return null; }
  }
  function set(k, v) {
    try { localStorage.setItem(KEY + k, v); } catch (e) {}
  }
  function readSet() {
    return (get(":read") || "").split(",").filter(Boolean);
  }
  function markRead(id) {
    var ids = readSet();
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      set(":read", ids.join(","));
    }
  }

  var chapters = document.querySelectorAll("a.al-chapter");
  if (chapters.length) {
    var read = readSet();
    chapters.forEach(function (el) {
      if (read.indexOf(el.getAttribute("data-id")) !== -1) el.classList.add("read");
    });
    var notes = document.getElementById("al-notes");
    var lock = document.getElementById("al-lock");
    if (notes && lock) {
      var done = read.indexOf("section-18") !== -1 || read.indexOf("section-17") !== -1;
      notes.hidden = !done;
      lock.hidden = done;
    }
  }

  var paper = document.body.classList.contains("al-paper");
  if (!paper) return;

  var root = document.documentElement;
  var size = Number(get(":size")) || 19;
  size = Math.min(26, Math.max(16, size));
  function resize() { root.style.fontSize = size + "px"; }
  resize();
  root.dataset.theme = get(":theme") || "light";

  var smaller = document.getElementById("smaller");
  var larger = document.getElementById("larger");
  var theme = document.getElementById("theme");
  var resume = document.getElementById("resume");
  var printBtn = document.getElementById("print");
  if (smaller) smaller.onclick = function () { size = Math.max(16, size - 1); resize(); set(":size", size); };
  if (larger) larger.onclick = function () { size = Math.min(26, size + 1); resize(); set(":size", size); };
  if (theme) theme.onclick = function () {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    set(":theme", root.dataset.theme);
  };
  var saved = Number(get(":position")) || 0;
  if (resume) {
    resume.disabled = saved <= 0;
    resume.onclick = function () { window.scrollTo(0, saved); };
  }
  if (printBtn) printBtn.onclick = function () { window.print(); };
  var controls = document.querySelector(".al-reader .controls");
  if (controls) controls.hidden = false;

  var bar = document.getElementById("reading-progress");
  var timer;
  function progress() {
    var range = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (range > 0 ? Math.min(100, scrollY / range * 100) : 0) + "%";
    clearTimeout(timer);
    timer = setTimeout(function () { set(":position", Math.round(scrollY)); }, 300);
  }
  addEventListener("scroll", progress, { passive: true });
  addEventListener("resize", progress);
  progress();

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.target.id) markRead(entry.target.id);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll("article h2[id]").forEach(function (h) { io.observe(h); });
  }
})();
