/* Freshness labels for /proof and /live.
   "live" and "updated every 2 hours" are used only when the stored
   America/New_York timestamp is under 2 hours old. */
(function (root) {
  function parseEt(stamp) {
    var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(stamp || ""));
    if (!m) return null;
    var want = m[1] + "-" + m[2] + "-" + m[3] + " " + m[4] + ":" + m[5];
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    function wall(ms) {
      var p = {};
      fmt.formatToParts(new Date(ms)).forEach(function (part) { p[part.type] = part.value; });
      return p.year + "-" + p.month + "-" + p.day + " " + p.hour + ":" + p.minute;
    }
    var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], min = +m[5];
    for (var i = 0; i < 2; i++) {
      var ms = Date.UTC(y, mo - 1, d, h + (i === 0 ? 4 : 5), min);
      if (wall(ms) === want) return ms;
    }
    return null;
  }

  function asOfLabel(stamp, now) {
    var text = stamp ? "as of " + stamp : "as of unknown";
    var ms = parseEt(stamp);
    var age = ms == null ? null : (now == null ? Date.now() : now) - ms;
    var fresh = age != null && age >= 0 && age < 2 * 60 * 60 * 1000;
    return fresh ? "live · updated every 2 hours · " + text : text;
  }

  var api = { parseEt: parseEt, asOfLabel: asOfLabel };
  root.DTRTAsOf = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
