(function () {
  var btn = document.getElementById("copy-email");
  var el = document.getElementById("hello-email");
  if (!btn || !el) return;
  var label = btn.textContent;
  btn.addEventListener("click", function () {
    var text = (el.textContent || "").trim();
    function selectText() {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = "Selected";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied";
      }).catch(selectText);
    } else {
      selectText();
    }
    window.setTimeout(function () { btn.textContent = label; }, 2000);
  });
})();
