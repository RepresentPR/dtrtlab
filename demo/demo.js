/* DTRT Job Desk demo v2. Every name, number and job below is invented.
   "Pretendwell Heating & Air Co." is a fictional company. Demo clock: Thu, Oct 15, 4:50 PM. */
window.DEMO = {
  company: "Pretendwell Heating & Air Co. (demo)",
  owner: "Dana",
  today: "Thu, Oct 15",
  nowLabel: "4:50 PM",
  nowMin: 16 * 60 + 50,
  sendTimes: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "6:00 AM (next morning)", "7:00 AM (next morning)"],
  sendAt: "8:00 PM",
  /* Every customer message is a draft until the owner approves it. Autopilot (sending without asking) is an
     opt-in setting; it is false here and the demo never turns it on. */
  autopilotOptIn: false,
  automations: [
    { id: "report", name: "Nightly Report Card", on: true, what: "One phone screen to you at your send time: what needs you, 4 numbers vs last week. Never sent to a customer.", never: "Any number that isn't counted from the day's records" },
    { id: "email", name: "Email and web form → job card", on: true, what: "Drafts the job card with the fields filled in and a confidence score. You approve it. Suggests filing newsletters.", never: "Delete an email" },
    { id: "reply", name: "First \"got it\" reply to a new lead", on: true, what: "Drafts the first reply in your voice. You approve it. Leads waiting over 15 minutes turn red.", never: "Quote a price, diagnose, or promise a time" },
    { id: "status", name: "Job status texts", on: true, what: "Booked, tech on the way, part ordered, job done. Drafted at each step; sent from your business number only after you approve.", never: "Text anyone without consent on file, or after STOP" },
    { id: "nudge", name: "Quote nudges (day 2, 5, 10)", on: true, marketing: true, what: "Up to 3 drafted nudges per open quote, each sent only after you approve. Drafts stop the moment the customer replies.", never: "Offer a price or discount; keep going after a reply" },
    { id: "reviewask", name: "Review request after every job", on: true, what: "Drafts the same Google review link for every finished job, whatever their rating. Sent after you approve.", never: "Hold the link back from anyone based on their score" },
    { id: "reviewreply", name: "Replies to public reviews", on: true, what: "Drafts replies to new reviews for you to approve.", never: "Reply to any review without your OK" },
    { id: "callback", name: "Low score (6 or below) → callback", on: true, what: "Puts \"call them\" in Needs you with what they said.", never: "Let the system contact an upset customer" },
    { id: "safety", name: "Safety words (gas, CO, sparks, flood)", on: true, urgent: true, what: "Pings your phone right away (to you only). Max 2 urgent pings a day.", never: "Give technical or safety advice, or message the customer" },
    { id: "schedule", name: "Scheduling suggestions", on: true, what: "Suggests open slots. You book.", never: "Book on a closed day" },
    { id: "money", name: "Prices, refunds, invoices, payments", on: false, locked: true, what: "Never drafted. Always you.", never: "Ever drafted or sent by the system" }
  ],
  jobs: [
    { id: "J-1041", customer: "Maria L.", street: "14 Maple Ct", problem: "No heat", stage: "lead", source: "Web form", inMin: 16 * 60 + 2, replyMin: null,
      events: [["4:02 PM", "Customer", "Web form: \"No heat, furnace clicks but won't start.\""], ["4:02 PM", "System", "Job card drafted (web form, 99% confident)"], ["4:03 PM", "You", "Approved the job card"], ["4:03 PM", "System", "First reply drafted. Waiting for your OK"]] },
    { id: "J-1046", customer: "Rachel T.", street: "220 Birch Ln", problem: "Gas smell near furnace", stage: "lead", source: "Email", inMin: 16 * 60 + 21, replyMin: 3, repliedBy: "owner-manual",
      events: [["4:21 PM", "Customer", "Email: \"Faint gas smell near the furnace since this afternoon.\""], ["4:21 PM", "System", "Safety word found (gas). Urgent ping to your phone only. Nothing sent to the customer"], ["4:24 PM", "You", "Called Rachel. Told her to leave and call the gas company. Tech booked after the all-clear"]] },
    { id: "J-1042", customer: "Kevin O.", street: "9 Willow Way", problem: "Thermostat blank", stage: "lead", source: "Email", inMin: 13 * 60 + 12, replyMin: 6, repliedBy: "owner-approved",
      events: [["1:12 PM", "Customer", "Email: \"Thermostat screen went blank. New batteries didn't help.\""], ["1:12 PM", "System", "Job card drafted (97% confident)"], ["1:13 PM", "You", "Approved the job card"], ["1:18 PM", "You", "Approved the first reply"]] },
    { id: "J-1043", customer: "Priya S.", street: "318 Fern Dr", problem: "Upstairs too hot", stage: "lead", source: "Missed call", inMin: 11 * 60 + 40, replyMin: 2, repliedBy: "owner-manual",
      events: [["11:40 AM", "Customer", "Missed call"], ["11:42 AM", "You", "Texted back yourself"]] },
    { id: "J-1031", customer: "Tom B.", street: "75 Juniper Pl", problem: "Heat pump replacement", stage: "quoted", value: 9800, quoteDay: 2, nudge: 0, sent: "Tue",
      events: [["Mon 10:00 AM", "Tech", "Site visit"], ["Tue 4:30 PM", "You", "Quote sent: $9,800 (2 options)"], ["Today", "System", "Nudge 1 of 3 drafted. Waiting for your OK"]] },
    { id: "J-1029", customer: "Alicia R.", street: "1402 Sparrow Rd", problem: "2-zone mini-split", stage: "quoted", value: 7400, quoteDay: 5, nudge: 1, sent: "Sat",
      events: [["Sat 11:00 AM", "You", "Quote sent: $7,400"], ["Mon 9:14 AM", "You", "Approved by owner · nudge 1 of 3 sent (text)"], ["Today", "System", "Nudge 2 of 3 drafted. Waiting for your OK"]] },
    { id: "J-1024", customer: "Grace H.", street: "63 Hemlock Ter", problem: "Furnace + AC combo", stage: "quoted", value: 12600, quoteDay: 10, nudge: 3, sent: "Mon 10/5",
      events: [["Mon 10/5", "You", "Quote sent: $12,600"], ["Wed 10/7", "You", "Approved by owner · nudge 1 of 3 sent"], ["Sat 10/10", "You", "Approved by owner · nudge 2 of 3 sent (email)"], ["Today 9:12 AM", "You", "Approved by owner · nudge 3 of 3 sent. No more nudges"]] },
    { id: "J-1035", customer: "Luis M.", street: "27 Bluebird Ave", problem: "Duct cleaning + sealing", stage: "quoted", value: 1150, quoteDay: 1, nudge: 0, sent: "Wed",
      events: [["Wed 3:00 PM", "You", "Quote sent: $1,150"], ["Fri", "System", "Nudge 1 of 3 will be drafted for your OK"]] },
    { id: "J-1037", customer: "Nina P.", street: "410 Chestnut St", problem: "Heating tune-up", stage: "scheduled", value: 149, when: "Fri 8-10 AM", tech: "Jess",
      events: [["Wed", "Customer", "Booked online"], ["10:05 AM", "You", "Approved by owner · \"Booked\" text sent"]] },
    { id: "J-1038", customer: "Omar F.", street: "88 Poplar Ct", problem: "Water heater flush", stage: "scheduled", value: 189, when: "Fri 1-3 PM", tech: "Sam",
      events: [["Tue", "You", "Booked by phone"]] },
    { id: "J-1033", customer: "Beth C.", street: "5 Dogwood Cir", problem: "Heat pump install", stage: "scheduled", value: 8900, when: "Mon all day", tech: "Andre", partDays: 3,
      events: [["Mon", "You", "Quote won: $8,900"], ["Mon 2:00 PM", "Tech", "Part ordered"], ["11:20 AM", "You", "Approved by owner · \"Part ordered\" text sent. Part waiting 3 days"]] },
    { id: "J-1039", customer: "Carlos D.", street: "1190 Hazel Ln", problem: "Blower motor repair", stage: "progress", value: 640, tech: "Andre",
      events: [["2:10 PM", "Tech", "On site"]] },
    { id: "J-1040", customer: "Helen W.", street: "36 Wren Way", problem: "AC winter shutdown", stage: "progress", value: 129, tech: "Jess",
      events: [["2:58 PM", "You", "Approved by owner · \"Tech on the way\" text sent"], ["3:31 PM", "Tech", "On site"]] },
    { id: "J-1034", customer: "Rob T.", street: "702 Hickory Dr", problem: "Furnace ignitor", stage: "done", value: 385, tech: "Sam",
      events: [["9:40 AM", "You", "Approved by owner · \"Job done\" text sent"], ["9:45 AM", "You", "Approved by owner · review link sent"], ["11:02 AM", "Customer", "Scored 10/10 and posted a Google review"]] },
    { id: "J-1036", customer: "Sofia K.", street: "19 Thistle Pl", problem: "Heating tune-up", stage: "done", value: 149, tech: "Jess",
      events: [["12:15 PM", "You", "Approved by owner · \"Job done\" text sent"], ["12:20 PM", "You", "Approved by owner · review link sent"]] },
    { id: "J-1032", customer: "Mark E.", street: "244 Robin Rd", problem: "Condensate line clog", stage: "done", value: 210, tech: "Andre",
      events: [["4:05 PM", "You", "Approved by owner · \"Job done\" text sent"], ["4:10 PM", "You", "Approved by owner · review link sent"]] },
    { id: "J-1025", customer: "Paul G.", street: "51 Spruce Ct", problem: "Furnace tune-up", stage: "done", value: 149, tech: "Sam", earlier: true,
      events: [["Wed 10:30 AM", "You", "Approved by owner · \"Job done\" text sent"], ["Wed 10:35 AM", "You", "Approved by owner · review link sent"], ["Wed 6:12 PM", "Customer", "Scored 3/10: \"Tech left a mess by the unit.\""], ["Wed 6:12 PM", "System", "Callback added to Needs you"]] },
    { id: "J-1027", customer: "Ann V.", street: "133 Alder Ave", problem: "AC repair", stage: "done", value: 420, tech: "Andre", earlier: true,
      events: [["Wed 3:10 PM", "You", "Approved by owner · review link sent"], ["Wed 8:40 PM", "Customer", "Scored 6/10: \"Fixed, but I had to call twice to get a time.\""], ["Wed 8:40 PM", "System", "Callback added to Needs you"]] }
  ],
  closed: [
    { id: "J-1022", customer: "Dave N.", problem: "AC replacement", value: 4900, result: "won", afterNudge: 2 },
    { id: "J-1019", customer: "Ellen K.", problem: "Duct repair", value: 2350, result: "won", afterNudge: 1 },
    { id: "J-1020", customer: "Frank Z.", problem: "Thermostat upgrade", value: 780, result: "lost", note: "Went with another company" }
  ],
  queue: [
    { id: "q-maria", kind: "reply", auto: "reply", job: "J-1041", verb: "Reply to", why: "New lead from the web form: no heat, furnace clicks.",
      draft: "Hi Maria, thanks for reaching out to Pretendwell Heating & Air. Sorry you're without heat. What's a good time today or tomorrow for a tech to come out? Dana" },
    { id: "q-paul", kind: "callback", auto: "callback", job: "J-1025", verb: "Call", why: "Scored 3/10 yesterday: \"Tech left a mess by the unit.\"", red: true, complaint: true },
    { id: "q-tom", kind: "nudge", auto: "nudge", job: "J-1031", verb: "Send nudge 1 of 3 to", why: "Quote open 2 days, no reply yet.", channel: "Text",
      draft: "Hi Tom, it's Dana at Pretendwell Heating & Air. Any questions on the heat pump quote? Happy to walk through the two options." },
    { id: "q-alicia", kind: "nudge", auto: "nudge", job: "J-1029", verb: "Send nudge 2 of 3 to", why: "Quote open 5 days. Nudge 1 (approved by you, sent Mon) got no reply.", channel: "Text",
      draft: "Hi Alicia, checking in on the 2-zone mini-split quote. If timing is the question, we have install openings the week of Oct 26. Dana" },
    { id: "q-june", kind: "email", auto: "email", verb: "Check new request from", customer: "June R.", why: "Email at 4:38 PM. Only 72% confident: no street, and urgency unclear. Check the guessed fields.",
      guess: { Customer: "June R.", Street: "Not given (check)", Problem: "Water pooling under indoor unit", Urgency: "Today? (unsure)", Contact: "555-0177 · j.rivera@example.com" } },
    { id: "q-ann", kind: "callback", auto: "callback", job: "J-1027", verb: "Call", why: "Scored 6/10 yesterday: \"Fixed, but I had to call twice to get a time.\"" }
  ],
  /* Today's full log. Every customer message here was approved by the owner first (approvedBy: "owner");
     to: "owner" items go only to the owner. Nothing in this log went out without the owner's OK. */
  log: [
    { t: "9:12 AM", auto: "nudge", job: "J-1024", text: "Nudge 3 of 3 to Grace H.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "9:40 AM", auto: "status", job: "J-1034", text: "\"Job done\" text to Rob T.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "9:45 AM", auto: "reviewask", job: "J-1034", text: "Review link to Rob T.", result: "Delivered · scored 10/10", undo: "sent", approvedBy: "owner" },
    { t: "10:05 AM", auto: "status", job: "J-1037", text: "\"Booked\" text to Nina P.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "11:20 AM", auto: "status", job: "J-1033", text: "\"Part ordered\" text to Beth C.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "12:15 PM", auto: "status", job: "J-1036", text: "\"Job done\" text to Sofia K.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "12:20 PM", auto: "reviewask", job: "J-1036", text: "Review link to Sofia K.", result: "Delivered · scored 9/10", undo: "sent", approvedBy: "owner" },
    { t: "1:12 PM", auto: "email", job: "J-1042", text: "Job card J-1042 from kevin.o@example.com", result: "You checked the fields · 97% confident", undo: "open", approvedBy: "owner" },
    { t: "1:18 PM", auto: "reply", job: "J-1042", text: "First reply to Kevin O.", result: "Delivered · 6 min after the email", undo: "sent", approvedBy: "owner" },
    { t: "2:58 PM", auto: "status", job: "J-1040", text: "\"Tech on the way\" text to Helen W.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "3:30 PM", auto: "email", text: "Newsletter from newsletter@example.com filed (not a request)", result: "Filed, no job card", undo: "open", approvedBy: "owner" },
    { t: "4:05 PM", auto: "status", job: "J-1032", text: "\"Job done\" text to Mark E.", result: "Delivered", undo: "sent", approvedBy: "owner" },
    { t: "4:10 PM", auto: "reviewask", job: "J-1032", text: "Review link to Mark E.", result: "Delivered · no score yet", undo: "sent", approvedBy: "owner" },
    { t: "4:21 PM", auto: "safety", job: "J-1046", text: "Safety word \"gas\" in Rachel T.'s email → urgent ping to you", result: "To you only. You called her at 4:24 PM. Nothing was sent to the customer", undo: "none", to: "owner" },
    { t: "4:38 PM", auto: "email", text: "Email from j.rivera@example.com → Needs you (72% confident)", result: "Waiting for you", undo: "none" }
  ],
  lastWeek: { medianReply: 22, quotesOpen: 24300, doneToday: 2, doneValue: 510, updated: 4 },
  trust: { consent: 41, texted: 43, optOuts: 0, reviewSent: 9, reviewDone: 9 },
  footer: "From Pretendwell Heating & Air. Reply STOP to opt out.",
  nudgeFooter: "Pretendwell Heating & Air. Reply STOP to opt out."
};

/* DTRT Job Desk demo v2: Tonight · Needs you · Jobs · Sent log & settings (approve-only). Static, no network calls, fictional data. */
(function () {
  "use strict";
  var S, view = { stage: "lead", editing: null };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var first = function (n) { return String(n).split(" ")[0]; };
  var I = {
    tonight: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    needs: '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="19" cy="17" r="3"/>',
    jobs: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    auto: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/>'
  };
  var icon = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + "</svg>"; };
  var ROUTES = [
    { id: "tonight", label: "Tonight", ic: "tonight" },
    { id: "needs", label: "Needs you", ic: "needs" },
    { id: "jobs", label: "Jobs", ic: "jobs" },
    { id: "autopilot", label: "Sent log & settings", ic: "auto" }
  ];
  var STAGES = [["lead", "Lead"], ["quoted", "Quoted"], ["scheduled", "Scheduled"], ["progress", "In progress"], ["done", "Done"]];

  function init() {
    S = JSON.parse(JSON.stringify(window.DEMO));
    S.clock = S.nowMin;
    S.textsExtra = 0;
  }
  function job(id) { return S.jobs.find(function (j) { return j.id === id; }); }
  function auto(id) { return S.automations.find(function (a) { return a.id === id; }); }
  function jname(j) { return j.id + " · " + j.customer + " · " + j.street + " · " + j.problem; }
  function chip() { return ""; } // renders no level chip on queue cards
  function stamp() { S.clock += 1; var h = Math.floor(S.clock / 60), m = S.clock % 60; return ((h + 11) % 12 + 1) + ":" + (m < 10 ? "0" : "") + m + (h >= 12 ? " PM" : " AM"); }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600); }
  function waitMin(j) { return j.replyMin == null ? S.nowMin - j.inMin : null; }

  /* ---------- queue + metrics ---------- */
  /* Queue order: safety, then urgent (a lead waiting over 15 min, or an unhappy customer), then money at stake, then due. */
  function waitingLead(q) { var j = q.kind === "reply" && q.job && job(q.job); var w = j ? waitMin(j) : null; return w != null && w > 15 ? w : 0; }
  function isRed(q) { return !!(q.safety || waitingLead(q) || q.red); }
  function rank(q) {
    var j = q.job && job(q.job), amt = (j && j.value) || 0;
    if (q.safety) return [0, 0];
    if (waitingLead(q)) return [1, 0, -waitingLead(q)];
    if (q.red) return [1, 1, 0];
    if (q.kind === "nudge" && amt) return [2, -amt];
    return [3, q.kind === "email" ? 0 : 1];
  }
  function queue() {
    return S.queue.filter(function (q) { return !q.done; }).sort(function (a, b) {
      var x = rank(a), y = rank(b);
      for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); }
      return 0;
    });
  }
  function qWho(q) { return q.customer || job(q.job).customer; }
  function qMoney(q) { var j = q.job && job(q.job); return j && j.value && q.kind === "nudge" ? money(j.value) : ""; }
  function qWhy(q) {
    var j = q.job && job(q.job);
    if (q.kind === "reply" && j) { var w = waitMin(j); return "Lead waiting " + w + " min. " + q.why; }
    return q.why;
  }
  function metrics() {
    var replies = S.jobs.filter(function (j) { return j.replyMin != null; }).map(function (j) { return j.replyMin; }).sort(function (a, b) { return a - b; });
    var n = replies.length, median = n ? (n % 2 ? replies[(n - 1) / 2] : Math.round((replies[n / 2 - 1] + replies[n / 2]) / 2)) : null;
    var quoted = S.jobs.filter(function (j) { return j.stage === "quoted"; });
    var doneToday = S.jobs.filter(function (j) { return j.stage === "done" && !j.earlier; });
    var log = S.log.filter(function (l) { return l.undo !== "undone"; });
    var SENDS = ["status", "reviewask", "nudge", "reply"]; // customer-facing message types
    var sent = log.filter(function (l) { return l.approvedBy === "owner" && SENDS.indexOf(l.auto) >= 0; });
    var count = function (a) { return sent.filter(function (l) { return l.auto === a; }).length; }; // owner-approved sends only
    var won = S.closed.filter(function (c) { return c.result === "won"; });
    return {
      median: median, waiting: S.jobs.filter(function (j) { return j.stage === "lead" && waitMin(j) != null; }),
      quotesOpen: quoted.reduce(function (a, j) { return a + j.value; }, 0), quotesN: quoted.length,
      stale: quoted.filter(function (j) { return j.quoteDay > 7; }),
      done: doneToday.length, doneValue: doneToday.reduce(function (a, j) { return a + j.value; }, 0),
      updated: count("status") + S.textsExtra, sortedCards: log.filter(function (l) { return l.auto === "email" && l.approvedBy === "owner"; }).length,
      texts: count("status"), asks: count("reviewask"),
      sent: sent.length, nudges: count("nudge"), replies: count("reply"), recovered: won.filter(function (c) { return c.afterNudge; }).reduce(function (a, c) { return a + c.value; }, 0),
      won: won, lost: S.closed.filter(function (c) { return c.result === "lost"; }),
      paused: S.automations.filter(function (a) { return !a.on && !a.locked; }).length
    };
  }
  function arrow(now, then, lowerIsBetter) {
    if (then == null || now === then) return '<i class="ar flat">→ same as last week</i>';
    var up = now > then, good = lowerIsBetter ? !up : up;
    return '<i class="ar ' + (good ? "good" : "bad") + '">' + (up ? "▲" : "▼") + " vs " + then + "</i>";
  }

  /* ---------- screens ---------- */
  var V = {};
  V.tonight = function () {
    var m = metrics(), q = queue(), lw = S.lastWeek, n = q.length;
    var sentence = (m.done + " jobs done (" + money(m.doneValue) + "). ") + (n ? (n === 1 ? "1 thing needs you" : n + " things need you") + (q.filter(isRed).length ? ", " + q.filter(isRed).length + " before 9 AM." : ".") : "Nothing needs you tonight.");
    var items = q.slice(0, 3).map(function (x) {
      return '<a class="rc-item' + (isRed(x) ? " red" : "") + '" href="#needs" data-focus="' + x.id + '"><b>' + esc(x.verb) + " " + esc(qWho(x)) + (waitingLead(x) ? '<em class="chip r wait" title="Lead waiting ' + waitingLead(x) + ' min">' + waitingLead(x) + " min</em>" : "") + "</b><span>" + esc(waitingLead(x) ? x.why : qWhy(x)) + (qMoney(x) ? " · " + qMoney(x) : "") + "</span></a>";
    }).join("");
    var more = n > 3 ? '<a class="rc-more" href="#needs">+' + (n - 3) + " more in Needs you</a>" : "";
    var kpi = function (label, val, sub, arr, cls) { return '<div class="kpi2 ' + (cls || "") + '"><span>' + label + "</span><b>" + val + "</b>" + arr + (sub ? "<small>" + sub + "</small>" : "") + "</div>"; };
    var card = '<div class="rc2" id="reportCard">' +
      '<div class="rc2-h"><div><small>REPORT CARD · ' + esc(S.today.toUpperCase()) + " · DEMO</small><h2>Pretendwell Heating &amp; Air Co.</h2></div>" +
      '<span class="status ' + (n ? "need" : "clear") + '">' + (n ? n + " need you" : "All clear") + "</span></div>" +
      '<p class="rc2-s">' + esc(sentence) + "</p>" +
      (n ? '<div class="rc-items">' + items + more + "</div>" : '<div class="rc-clear">✓ All clear. Nothing is waiting for your OK.</div>') +
      '<div class="kpis2">' +
      kpi("First reply (median)", (m.median != null ? m.median + " min" : "—"), m.waiting.length ? '<em class="red-t">' + m.waiting.length + " lead waiting</em>" : "", arrow(m.median, lw.medianReply, true)) +
      kpi("Quotes open", money(m.quotesOpen), m.stale.length ? '<em class="red-t">' + money(m.stale.reduce(function (a, j) { return a + j.value; }, 0)) + " over 7 days</em>" : "", arrow(Math.round(m.quotesOpen / 1000), Math.round(lw.quotesOpen / 1000), false).replace(/vs (\d+)/, "vs $$$1k")) +
      kpi("Jobs done today", m.done + " · " + money(m.doneValue), "", arrow(m.done, lw.doneToday, false)) +
      kpi("Status texts you approved", m.updated, "0 opt-outs", arrow(m.updated, lw.updated, false)) +
      "</div>" +
      '<a class="rc2-auto" href="#autopilot">You approved ' + m.sent + " sends today: " + m.texts + " status texts, " + m.asks + " review asks, " + m.nudges + (m.nudges === 1 ? " quote nudge, " : " quote nudges, ") + m.replies + (m.replies === 1 ? " reply" : " replies") + " · Approved by owner · sent →</a>" +
      '<div class="rc2-f"><span>Autopilot (opt-in): OFF · every message waits for your OK' + (m.paused ? " · " + m.paused + " drafts paused" : "") + " · checked " + esc(S.nowLabel) + '</span><label>Sends <select id="sendAt" aria-label="Report Card send time">' + S.sendTimes.map(function (t) { return "<option" + (t === S.sendAt ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select></label></div></div>";
    var side = '<div class="side-info"><div class="card pad"><b>How the Report Card works</b><ul class="ul"><li>Leads with <b>All clear</b> or <b>N need you</b>, then 4 numbers vs last week.</li><li>At most 3 things that need you, sorted: safety, then urgent (a lead waiting over 15 minutes or an unhappy customer), then money at stake, then what is due.</li><li>4 numbers, each compared with last week.</li><li>One line on what you approved and sent today, linked to the full log.</li></ul></div>' +
      '<div class="card pad"><b>Send time</b><p class="mut">8:00 PM by default. You pick the time at setup and can change it anytime. One text with a link, email as backup. Urgent pings only for safety words or a lead waiting over an hour, max 2 a day.</p></div>' +
      '<div class="card pad"><b>Try it</b><p class="mut">Approve something in Needs you, then come back. The card updates.</p><a class="btn n s" href="#needs">Open Needs you</a></div></div>';
    return '<div class="head tight"><div><span class="tag demo-tag">Demo · fictional data</span><h1>Tonight</h1><p class="hide-m">Preview of tonight\'s Report Card, live as of ' + esc(S.nowLabel) + ".</p></div></div>" +
      '<div class="tonight"><div class="rc-frame">' + card + "</div>" + side + "</div>";
  };

  V.needs = function () {
    var q = queue();
    var cards = q.map(function (x) {
      var j = x.job && job(x.job), a = auto(x.auto);
      var meta = '<div class="chips">' + chip(a.level) + (x.kind === "nudge" ? '<span class="mk">Marketing: consent on file</span>' : "") + (waitingLead(x) ? '<span class="chip r wait" title="Lead waiting ' + waitingLead(x) + ' min">' + waitingLead(x) + " min</span>" : x.red ? '<span class="chip r">Unhappy customer</span>' : "") + "" + (qMoney(x) ? '<span class="chip n">' + qMoney(x) + " quote</span>" : "") + "</div>";
      var body = "";
      if (x.draft) {
        body = view.editing === x.id ? '<textarea class="ed" id="ed-' + x.id + '" rows="3">' + esc(x.draft) + '</textarea><div class="row-btn"><button class="btn g s" data-save="' + x.id + '">Save draft</button></div>'
          : '<div class="draft">' + esc(x.draft) + (x.kind === "nudge" ? "<small>" + esc(S.nudgeFooter) + "</small>" : "") + "</div>";
      }
      if (x.guess) body = '<dl class="kv">' + Object.keys(x.guess).map(function (k) { return "<dt>" + k + "</dt><dd>" + esc(x.guess[k]) + "</dd>"; }).join("") + "</dl>";
      var ap = { reply: "Approve & send", nudge: "Approve & send", callback: "Approve: I called", email: "Approve: make job card" }[x.kind];
      return '<article class="card qcard' + (isRed(x) ? " red" : "") + '" id="' + x.id + '"><div class="qh"><div><b>' + esc(x.verb) + " " + esc(qWho(x)) + "</b>" + (j ? '<button class="lnk" data-job="' + j.id + '">' + esc(jname(j)) + "</button>" : "") + "</div></div>" +
        '<p class="why">' + esc(qWhy(x)) + "</p>" + meta + body +
        '<div class="row-btn"><button class="btn g s" data-ap="' + x.id + '">' + ap + "</button>" + (x.draft ? '<button class="btn l s" data-edit="' + x.id + '">Edit</button>' : (x.guess ? '<button class="btn l s" data-edit="' + x.id + '">Edit</button>' : '<button class="btn l s" data-edit="' + x.id + '">Edit note</button>')) + '<button class="btn l s" data-skip="' + x.id + '">Skip</button></div></article>';
    }).join("");
    return '<div class="head"><div><span class="tag demo-tag">Demo · fictional data</span><h1>Needs you <span class="badge">' + q.length + "</span></h1><p>Everything that needs a person, from every part of the system, in one list. Sorted: safety first, then urgent, then money at stake, then what is due.</p></div></div>" +
      (q.length ? '<div class="qlist">' + cards + "</div>" : '<div class="card pad clear-big">✓ All clear. Nothing needs you. <a href="#tonight">See tonight\'s Report Card</a></div>');
  };

  V.jobs = function () {
    var m = metrics();
    var cols = STAGES.map(function (s) {
      var js = S.jobs.filter(function (j) { return j.stage === s[0] && !(j.earlier); });
      return '<section class="col' + (s[0] === view.stage ? " on" : "") + '" aria-label="' + s[1] + '"><h2>' + s[1] + "<span>" + js.length + "</span></h2>" + (js.length ? js.map(card).join("") : '<div class="empty">Nothing here</div>') + "</section>";
    }).join("");
    var seg = '<div class="seg" role="tablist" aria-label="Stage">' + STAGES.map(function (s) {
      var n = S.jobs.filter(function (j) { return j.stage === s[0] && !j.earlier; }).length;
      return '<button role="tab" data-seg="' + s[0] + '" class="' + (s[0] === view.stage ? "on" : "") + '" aria-selected="' + (s[0] === view.stage) + '">' + s[1] + " (" + n + ")</button>";
    }).join("") + "</div>";
    var outcome = '<div class="card pad outcomes"><div><b>Quotes this week</b><span class="mut">Won ' + m.won.length + " · Lost " + m.lost.length + " · Open " + m.quotesN + '</span></div><div class="oc">' +
      m.won.map(function (c) { return '<span class="chip g">Won ' + money(c.value) + " · " + esc(c.customer) + (c.afterNudge ? " · after nudge " + c.afterNudge : "") + "</span>"; }).join("") +
      m.lost.map(function (c) { return '<span class="chip l">Lost ' + money(c.value) + " · " + esc(c.customer) + "</span>"; }).join("") +
      '</div><div class="rec"><b>' + money(m.recovered) + '</b><span>won after a follow-up nudge this week</span></div></div>';
    return '<div class="head"><div><span class="tag demo-tag">Demo · fictional data</span><h1>Jobs</h1><p>One board, every job named the same way. Tap a job for its full timeline. Green on track · amber waiting · red needs you.</p></div></div>' + outcome + seg + '<div class="board">' + cols + "</div>";
  };
  // reply chip label comes only from the lead's repliedBy field; no label is shown without it
  var REPLIED = { "owner-approved": "Approved and sent in ", "owner-manual": "You replied yourself in " };
  function replyChip(j) { var l = REPLIED[j.repliedBy]; return l ? '<span class="chip g">' + l + j.replyMin + " min</span>" : ""; }
  function card(j) {
    var c = "";
    if (j.stage === "lead") { var w = waitMin(j); c += w != null ? '<span class="chip ' + (w > 15 ? "r" : "a") + '">Waiting ' + w + " min</span>" : replyChip(j); if (j.id === "J-1046") c += '<span class="chip r">Safety ping</span>'; }
    if (j.stage === "quoted") c += '<span class="chip ' + (j.quoteDay > 7 ? "r" : j.quoteDay >= 5 ? "a" : "n") + '">Day ' + j.quoteDay + " · nudge " + Math.min(j.nudge + (j.nudge < 3 ? 1 : 0), 3) + " of 3" + (j.nudge >= 3 ? " approved &amp; sent" : "") + "</span>";
    if (j.when) c += '<span class="chip n">' + esc(j.when) + "</span>";
    if (j.partDays) c += '<span class="chip a">Part waiting ' + j.partDays + " days</span>";
    if (j.stage === "done") c += '<span class="chip g">Review link approved &amp; sent</span>';
    var dot = j.stage === "lead" && waitMin(j) > 15 || (j.stage === "quoted" && j.quoteDay > 7) ? "r" : (j.partDays || (j.stage === "quoted" && j.quoteDay >= 5)) ? "a" : "g";
    return '<button class="job" data-job="' + j.id + '"><div class="top"><span><i class="dot ' + dot + '"></i>' + j.id + "</span><span>" + (j.value ? money(j.value) : esc(j.source || "")) + "</span></div><b>" + esc(j.customer) + '</b><div class="meta">' + esc(j.street) + " · " + esc(j.problem) + (j.tech ? " · " + esc(j.tech) : "") + "</div>" + c + "</button>";
  }

  V.autopilot = function () {
    var m = metrics();
    var autos = S.automations.map(function (a) {
      return '<div class="arow' + (a.on || a.locked ? "" : " paused") + '"><div class="amain"><div class="at"><b>' + esc(a.name) + "</b>" + chip(a.level) + (a.marketing ? '<span class="mk">Marketing: consent on file</span>' : "") + "" + (a.urgent ? '<span class="chip r">Urgent ping</span>' : "") + "</div><p>" + esc(a.what) + '</p><p class="never">Never: ' + esc(a.never) + "</p></div>" +
        (a.locked ? '<span class="lockd">Always you</span>' : '<button class="switch" role="switch" aria-checked="' + a.on + '" aria-label="' + esc(a.name) + ' on or off" data-sw="' + a.id + '"></button>') + "</div>";
    }).join("");
    var log = S.log.slice().reverse().map(function (l, i) {
      var a = auto(l.auto), idx = S.log.length - 1 - i;
      var u = l.undo === "open" ? '<button class="btn l s" data-undo="' + idx + '">Undo</button>' : l.undo === "undone" ? '<span class="chip l">Undone</span>' : l.undo === "sent" ? '<span class="mut sm" title="Texts and emails can\'t be unsent">Sent</span>' : "";
      var appr = l.approvedBy === "owner" ? (l.undo === "sent" ? "Approved by owner · sent · " : "Approved by owner · ") : (l.to === "owner" ? "To you only · " : "");
      return '<div class="lrow' + (l.undo === "undone" ? " undone" : "") + '"><span class="lt">' + l.t + '</span><div class="lm"><b>' + esc(l.text) + "</b><span>" + appr + esc(a.name) + " · " + esc(l.result) + (l.job ? ' · <button class="lnk" data-job="' + l.job + '">' + l.job + "</button>" : "") + "</span></div>" + u + "</div>";
    }).join("");
    var t = S.trust;
    var trust = '<div class="card pad trust"><h2>Trust panel</h2><div class="tgrid">' +
      '<div><b>' + t.consent + " of " + t.texted + "</b><span>customers texted have consent on file. The other 2 get email only.</span></div>" +
      "<div><b>" + t.optOuts + "</b><span>opt-outs (STOP) this week. STOP is honored instantly, for every message type.</span></div>" +
      "<div><b>" + t.reviewSent + " of " + t.reviewDone + "</b><span>finished jobs got the same review link this week, each approved by you. No one is skipped for a low score.</span></div>" +
      "<div><b>Consent</b><span>Quote nudges are treated as marketing: written consent on file, STOP honored, and each one approved by you. New job cards wait for your OK too.</span></div></div>" +
      '<p><b>Nothing goes to a customer without your OK.</b> Never drafted: prices, discounts, refunds, invoices, payments, diagnosis, safety advice, and replies to upset customers. Phone answering is not part of the Job Desk.</p>' +
      '<p class="mut">Approved messages go only from your own business number. Access only by your invite, never a password. A weekly review by DTRT Lab checks every log; anything about money or a customer complaint goes to you.</p></div>';
    var ladder = '<div class="card pad"><b>How it works</b><p class="mut">Every customer message is drafted and waits for your OK: Approve &amp; send, Edit or Skip. Nothing ever switches to sending by itself.</p></div>' +
      '<div class="card pad apopt"><b>Autopilot (opt-in setting)</b><p class="mut">Would send drafts without asking you. Opt-in only; it is OFF, and this demo never turns it on.</p><div style="display:flex;gap:10px;align-items:center"><button class="switch" role="switch" aria-checked="false" aria-label="Autopilot, opt-in, currently off" id="apOptIn"></button><b>OFF</b></div></div>';
    var allPaused = S.automations.filter(function (a) { return !a.locked; }).every(function (a) { return !a.on; });
    return '<div class="head"><div><span class="tag demo-tag">Demo · fictional data</span><h1>Sent log &amp; settings</h1><p>Everything that went out today, each one approved by you first. Texts and emails can\'t be unsent; Undo only reverses a job card made from an email. Every message type shows how it works and has a pause switch for its drafts. Autopilot is an opt-in setting, and it is off.</p></div>' +
      '<div class="card pause-all"><span>Pause all drafts</span><button class="switch" role="switch" aria-checked="' + allPaused + '" aria-label="Pause all drafts" id="pauseAll"></button></div></div>' +
      '<div class="ap-grid"><div><h2 class="sec-t">Today\'s log · ' + S.log.length + ' entries · 0 errors</h2><div class="card list" id="aplog">' + log + "</div>" + trust + "</div>" +
      '<div><h2 class="sec-t">Message types (you approve every send)</h2><div class="card list">' + autos + "</div>" + ladder +
      '<div class="card pad links-m"><a href="/#job-desk">Back to dtrtlab.com</a></div></div></div>';
  };

  /* ---------- job drawer ---------- */
  function openJob(id) {
    var j = job(id); if (!j) return;
    var tl = j.events.map(function (e) { return '<li class="ev ' + e[1].toLowerCase() + '"><span class="et">' + esc(e[0]) + " · " + esc(e[1]) + "</span>" + esc(e[2]) + "</li>"; }).join("");
    var acts = "";
    if (j.stage === "quoted") acts = '<div class="row-btn"><button class="btn g s" data-won="' + j.id + '">Mark won</button><button class="btn l s" data-lost="' + j.id + '">Mark lost</button></div>';
    var d = $("#drawer");
    d.innerHTML = '<button class="x" data-close aria-label="Close">×</button><span class="tag demo-tag">Demo · fictional</span><h2 id="drawerTitle">' + esc(j.customer) + '</h2><div class="mut">' + esc(jname(j)) + (j.value ? " · " + money(j.value) : "") + '</div><h3 class="sec-t">Timeline</h3><ol class="tl">' + tl + "</ol>" + acts;
    d.hidden = false; $("#drawerBg").hidden = false; d.querySelector("[data-close]").focus();
  }
  function closeJob() { $("#drawer").hidden = true; $("#drawerBg").hidden = true; }

  /* ---------- actions ---------- */
  function approve(id) {
    var x = S.queue.find(function (q) { return q.id === id; }); if (!x || x.done) return;
    var t = stamp(), j = x.job && job(x.job);
    x.done = true;
    if (x.kind === "reply") { j.replyMin = S.clock - j.inMin; j.repliedBy = "owner-approved"; j.events.push([t, "You", "Approved the first reply (" + j.replyMin + " min after the request)"]); S.log.push({ t: t, auto: "reply", job: j.id, text: "First reply to " + j.customer, result: "Delivered", undo: "sent", approvedBy: "owner" }); toast("Approved by owner. Reply sent to " + j.customer + " (demo, nothing really sent)."); }
    if (x.kind === "nudge") { j.nudge += 1; j.events.push([t, "You", "Approved by owner · nudge " + j.nudge + " of 3 sent"]); S.log.push({ t: t, auto: "nudge", job: j.id, text: "Nudge " + j.nudge + " of 3 to " + j.customer, result: "Delivered", undo: "sent", approvedBy: "owner" }); toast("Approved by owner. Nudge " + j.nudge + " of 3 sent to " + j.customer + " (demo, nothing really sent)."); }
    if (x.kind === "callback") { j.events.push([t, "You", "Called back"]); toast("Callback logged for " + j.customer + "."); }
    if (x.kind === "email") {
      var g = x.guess, nid = "J-1047";
      S.jobs.unshift({ id: nid, customer: "June R.", street: "Street not given", problem: "Water under indoor unit", stage: "lead", source: "Email", inMin: 16 * 60 + 38, replyMin: null, events: [["4:38 PM", "Customer", "Email: water pooling under the indoor unit"], [t, "You", "Checked the guessed fields and made the job card"]] });
      S.log.push({ t: t, auto: "email", job: nid, text: "Job card " + nid + " from j.rivera@example.com", result: "You checked the fields", undo: "open", approvedBy: "owner" });
      toast("Job card " + nid + " created for " + g.Customer + ".");
    }
    render();
  }
  function undo(i) {
    var l = S.log[i]; if (!l || l.undo !== "open") return;
    l.undo = "undone";
    if (l.job && l.auto === "email") {
      var j = job(l.job);
      if (j && j.id === "J-1047") { S.jobs = S.jobs.filter(function (x) { return x.id !== "J-1047"; }); var q = S.queue.find(function (x) { return x.id === "q-june"; }); q.done = false; }
      else if (j) { j.events.push([stamp(), "You", "Undid the job card (kept as an email)"]); j.stage = "lead"; j.undone = true; S.jobs = S.jobs.filter(function (x) { return x !== j; }); }
    }
    toast("Undone. Nothing was deleted; the email stays in the inbox.");
    render();
  }

  /* ---------- router ---------- */
  function navHtml(tab) {
    var r = route(), n = queue().length;
    return ROUTES.map(function (x) {
      return '<a class="' + (tab ? "" : "navlink ") + (x.id === r ? "on" : "") + '" href="#' + x.id + '"' + (x.id === r ? ' aria-current="page"' : "") + ">" + icon(x.ic) + "<span>" + x.label + "</span>" + (x.id === "needs" && n ? '<span class="count">' + n + "</span>" : "") + "</a>";
    }).join("");
  }
  function route() { var r = (location.hash || "#tonight").slice(1); return V[r] ? r : "tonight"; }
  function render() {
    var r = route();
    $("#main").innerHTML = V[r]();
    $("#nav").innerHTML = navHtml(false);
    $("#tabbar").innerHTML = navHtml(true);
    document.title = ROUTES.find(function (x) { return x.id === r; }).label + " · Job Desk demo (fictional data)";
  }
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-job],[data-seg],[data-ap],[data-edit],[data-save],[data-skip],[data-undo],[data-sw],[data-won],[data-lost],[data-close],[data-focus],#pauseAll,#apOptIn,#reset,#drawerBg");
    if (!t) return;
    if (t.id === "drawerBg" || t.hasAttribute("data-close")) return closeJob();
    if (t.id === "reset") { init(); render(); return toast("Demo reset."); }
    if (t.dataset.focus) { S.focus = t.dataset.focus; return; }
    if (t.dataset.job) return openJob(t.dataset.job);
    if (t.dataset.seg) { view.stage = t.dataset.seg; return render(); }
    if (t.dataset.ap) return approve(t.dataset.ap);
    if (t.dataset.edit) {
      var qx = S.queue.find(function (q) { return q.id === t.dataset.edit; });
      if (qx.draft) { view.editing = qx.id; render(); var e = $("#ed-" + qx.id); if (e) e.focus(); return; }
      return toast(qx.guess ? "In the real system you'd fix any guessed field here." : "Add a note for the job timeline (demo).");
    }
    if (t.dataset.save) { var q2 = S.queue.find(function (q) { return q.id === t.dataset.save; }); q2.draft = $("#ed-" + q2.id).value; view.editing = null; render(); return toast("Draft saved. Approve to send."); }
    if (t.dataset.skip) { var q3 = S.queue.find(function (q) { return q.id === t.dataset.skip; }); q3.done = true; render(); return toast("Skipped. It won't come back tonight."); }
    if (t.dataset.undo) return undo(+t.dataset.undo);
    if (t.dataset.won || t.dataset.lost) {
      var j = job(t.dataset.won || t.dataset.lost), won = !!t.dataset.won;
      S.closed.unshift({ id: j.id, customer: j.customer, problem: j.problem, value: j.value, result: won ? "won" : "lost", afterNudge: won && j.nudge ? j.nudge : 0 });
      j.events.push([stamp(), "You", won ? "Marked won" : "Marked lost"]);
      if (won) { j.stage = "scheduled"; j.when = "To book"; } else { S.jobs = S.jobs.filter(function (x) { return x !== j; }); }
      S.queue.forEach(function (q) { if (q.job === j.id && q.kind === "nudge") q.done = true; });
      closeJob(); render(); return toast(won ? "Won. Remaining nudges stopped." : "Lost. Nudges stopped.");
    }
    if (t.dataset.sw) { var a = auto(t.dataset.sw); a.on = !a.on; render(); return toast(a.name + (a.on ? ": drafts back on. Each still waits for your OK." : ": drafts paused.")); }
    if (t.id === "apOptIn") return toast("Autopilot is an opt-in setting and stays OFF in this demo. Every message waits for your OK.");
    if (t.id === "pauseAll") {
      var anyOn = S.automations.some(function (x) { return x.on && !x.locked; });
      S.automations.forEach(function (x) { if (!x.locked) x.on = !anyOn; }); render();
      return toast(anyOn ? "All drafts paused." : "All drafts back on. Each still waits for your OK.");
    }
  });
  document.addEventListener("change", function (ev) {
    if (ev.target.id === "sendAt") { S.sendAt = ev.target.value; toast("Report Card will send at " + S.sendAt + " (demo setting)."); }
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeJob(); });
  window.addEventListener("hashchange", function () {
    closeJob(); render(); window.scrollTo(0, 0);
    if (S.focus) { var el = document.getElementById(S.focus); S.focus = null; if (el) { el.classList.add("focus"); el.scrollIntoView({ block: "center" }); } }
  });
  window.__jobDeskReset = function () { init(); view.stage = "lead"; view.editing = null; closeJob(); render(); };
  window.__jobDeskOpen = openJob;
  init(); render();
})();

/* Guided auto-play for screen recording: ?tour=1 (&loop=1 repeats, &delay=ms waits). About 30 seconds:
   Tonight -> Needs you (approve) -> approve a quote nudge -> job timeline -> sent log (every send approved) + undo a job card -> trust panel -> Tonight. */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  if (q.get("tour") !== "1") return;
  document.body.classList.add("touring");
  var badge = document.createElement("div"); badge.className = "tour-badge"; badge.textContent = "Demo, not a real client";
  var cap = document.createElement("div"); cap.className = "tour-cap"; cap.setAttribute("aria-live", "polite");
  var cur = document.createElement("div"); cur.className = "tour-cursor";
  var prog = document.createElement("div"); prog.className = "tour-prog"; prog.innerHTML = "<i></i>";
  document.body.append(cap, cur, prog);
  if (innerWidth < 760) {
    var rb = document.querySelector(".ribbon");
    rb.innerHTML = '<span class="pill">DEMO</span><span>Demo, fictional data</span>';
    badge.classList.add("in-ribbon"); rb.appendChild(badge);
  } else document.body.appendChild(badge);
  var $ = function (s) { return document.querySelector(s); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function say(n, title, sub) {
    cap.classList.remove("show");
    return wait(160).then(function () { cap.innerHTML = '<span class="n">' + n + "</span><div><b>" + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>"; cap.classList.add("show"); });
  }
  function go(h) { location.hash = h; return wait(350); }
  function center(sel, block) { var el = $(sel); if (el) el.scrollIntoView({ behavior: "smooth", block: block || "center" }); return wait(650); }
  function point(sel) {
    var el = $(sel); if (!el) return wait(10);
    var r = el.getBoundingClientRect();
    cur.style.transform = "translate(" + (r.left + r.width / 2) + "px," + (r.top + r.height / 2) + "px)"; cur.classList.add("on");
    return wait(600);
  }
  function tap(sel) { return point(sel).then(function () { var el = $(sel); cur.classList.add("tap"); return wait(200).then(function () { cur.classList.remove("tap"); if (el) el.click(); return wait(250); }); }); }
  function glow(sel) { var el = $(sel); if (el) el.classList.add("tour-glow"); }
  function hide() { cur.classList.remove("on"); }
  var t0;
  function run() {
    window.__tourDone = false; window.__jobDeskReset(); location.hash = "tonight"; window.scrollTo(0, 0);
    var mobile = innerWidth < 760;
    t0 = performance.now(); prog.firstChild.style.transition = "none"; prog.firstChild.style.width = "0";
    requestAnimationFrame(function () { prog.firstChild.style.transition = "width 27s linear"; prog.firstChild.style.width = "100%"; });
    return wait(300)
      .then(function () { return say(1, "Tonight: what needs you, in one screen", "All clear or N need you. 3 items max, 4 numbers vs last week"); })
      .then(function () { glow(".status"); return wait(1800); })
      .then(function () { glow(".kpis2"); return wait(1500); })
      .then(function () { return tap('[data-focus="q-maria"]'); })
      .then(function () { return wait(400); })
      .then(function () { return say(2, "Needs you: one queue", "Waiting lead first: 48 min. Approve, edit or skip"); })
      .then(function () { glow("#q-maria"); return wait(1400); })
      .then(function () { return tap('[data-ap="q-maria"]'); })
      .then(function () { hide(); return center("#q-tom"); })
      .then(function () { return say(3, "Quote nudge 1 of 3, $9,800: you approve it", "Nothing sends without your OK. Consent on file, STOP honored"); })
      .then(function () { glow("#q-tom"); return wait(1600); })
      .then(function () { return tap('[data-ap="q-tom"]'); })
      .then(function () { hide(); return go("jobs"); })
      .then(function () { return say(4, "Jobs: one timeline per job", "Day count, nudge 2 of 3, won/lost, $ recovered"); })
      .then(function () { return mobile ? tap('[data-seg="quoted"]') : wait(900); })
      .then(function () { return tap('[data-job="J-1029"]'); })
      .then(function () { return wait(2300); })
      .then(function () { $("[data-close]") && $("[data-close]").click(); hide(); return go("autopilot"); })
      .then(function () { return say(5, "Sent log: every send approved by you", "Autopilot is opt-in and OFF. Undo works on job cards, not sent texts"); })
      .then(function () { return wait(900); })
      .then(function () { return mobile ? center('[data-undo]') : wait(10); })
      .then(function () { return tap("[data-undo]"); })
      .then(function () { return wait(1300); })
      .then(function () { hide(); return center(".trust", mobile ? "start" : "center"); })
      .then(function () { return say(6, "Trust panel", "Consent, opt-outs, the same review link for everyone, never-drafted list"); })
      .then(function () { glow(".trust"); return wait(2600); })
      .then(function () { return go("tonight"); })
      .then(function () { window.scrollTo(0, 0); return say("✓", "Fewer things need you tonight", "Answer 3 short questions and you'll get a free one-page office map within 3 business days."); })
      .then(function () { glow(".status"); return wait(2600); })
      .then(function () { window.__tourDone = true; window.__tourMs = Math.round(performance.now() - t0); if (q.get("loop") === "1") return wait(800).then(run); });
  }
  window.addEventListener("load", function () { wait(q.get("delay") ? +q.get("delay") : 600).then(run); });
})();
