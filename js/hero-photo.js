(function () {
  var img = document.querySelector(".hero-photo img");
  if (!img) return;
  function hide() { img.hidden = true; }
  function check() {
    if (!img.naturalWidth || img.naturalWidth < 32) hide();
  }
  img.addEventListener("error", hide);
  img.addEventListener("load", check);
  if (img.complete) check();
})();
