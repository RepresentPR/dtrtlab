(function () {
  var root = document.getElementById("gallery");
  if (!root || !window.DTRT || !DTRT.loadProduct) return;
  DTRT.loadProduct().then(function (p) {
    DTRT.applyProductMeta(p);
    p.media.forEach(function (m) {
      var fig = document.createElement("figure");
      fig.className = "gallery-item";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-open";
      btn.setAttribute("data-kind", m.kind);
      var img = document.createElement("img");
      img.src = m.src;
      if (m.srcset) img.srcset = m.srcset;
      img.alt = m.alt || "";
      img.width = m.w || 1920;
      img.height = m.h || 1080;
      img.loading = "lazy";
      img.decoding = "async";
      btn.appendChild(img);
      var cap = document.createElement("figcaption");
      cap.innerHTML = "<span class=\"chip\">" + m.kind.replace("-", " ") + "</span> " + m.caption;
      fig.appendChild(btn);
      fig.appendChild(cap);
      root.appendChild(fig);
      btn.addEventListener("click", function () { open(m); });
    });
  }).catch(function () {});

  var dlg = document.getElementById("lightbox");
  if (!dlg) return;
  var dlgImg = dlg.querySelector("img");
  var dlgCap = dlg.querySelector("p");
  var closeBtn = dlg.querySelector(".lightbox-close");
  function open(m) {
    dlgImg.src = m.src;
    dlgImg.alt = m.alt || "";
    dlgCap.textContent = m.caption;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    closeBtn.focus();
  }
  function close() {
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  }
  closeBtn.addEventListener("click", close);
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg) close();
  });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();
