(function () {
  var img = document.querySelector(".hero-photo img");
  if (!img) return;
  function hide() { img.hidden = true; }
  img.addEventListener("error", hide);
  if (img.complete && img.naturalWidth === 0) hide();
})();
