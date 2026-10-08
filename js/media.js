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
      btn.appendChild(pictureFor(m));
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
  function swapExt(value, ext) {
    return String(value || "").replace(/\.(jpe?g|png)(?=(\?|#|\s|$))/gi, "." + ext);
  }

  function pictureFor(m) {
    var picture = document.createElement("picture");
    ["avif", "webp"].forEach(function (ext) {
      var source = document.createElement("source");
      source.type = "image/" + ext;
      source.srcset = m.srcset ? swapExt(m.srcset, ext) : swapExt(m.src, ext);
      picture.appendChild(source);
    });
    var img = document.createElement("img");
    img.src = swapExt(m.src, "webp");
    if (m.srcset) img.srcset = swapExt(m.srcset, "webp");
    img.alt = m.alt || "";
    img.width = m.w || 1920;
    img.height = m.h || 1080;
    img.loading = "lazy";
    img.decoding = "async";
    picture.appendChild(img);
    return picture;
  }

  function open(m) {
    dlgImg.src = swapExt(m.src, "webp");
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
