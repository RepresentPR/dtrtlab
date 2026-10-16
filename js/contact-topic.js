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
})();
