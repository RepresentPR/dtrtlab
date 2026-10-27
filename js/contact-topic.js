(function () {
  var topic = new URLSearchParams(location.search).get("topic");
  var map = {
    dmca: "DMCA notice",
    privacy: "Privacy request",
    refund: "Refund or billing",
    other: "Other"
  };
  var select = document.getElementById("topic");
  if (select && map[topic]) select.value = map[topic];
  var intent = new URLSearchParams(location.search).get("intent");
  var legacyOfficeMap = ["free", "plan"].join("-");
  if (intent === "free-map" || intent === legacyOfficeMap) {
    var subject = document.querySelector('input[name="_subject"]');
    if (subject) subject.value = "Free office map (dtrtlab.com)";
  }
})();
