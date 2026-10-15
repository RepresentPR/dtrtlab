/* DTRT Job Desk demo. Every name, number and job below is invented.
   "Sample Heating & Air Co." is a fictional company. */
window.DEMO = {
  company: "Sample Heating & Air Co. (demo)",
  shortName: "Sample Heating & Air",
  owner: "Dana (demo owner)",
  area: "DMV Area",
  today: "Thu, Oct 15",
  techs: ["Andre", "Jess", "Sam"],
  stages: [
    { id: "lead", label: "Lead" },
    { id: "quoted", label: "Quoted" },
    { id: "scheduled", label: "Scheduled" },
    { id: "progress", label: "In progress" },
    { id: "done", label: "Done" }
  ],
  jobs: [
    { id: "J-1041", customer: "Maria L.", town: "Bowie", type: "No heat, furnace clicks", stage: "lead", source: "Web form", value: null, age: "18 min", firstReplyMin: 4 },
    { id: "J-1042", customer: "Kevin O.", town: "Laurel", type: "Thermostat swap", stage: "lead", source: "Email", value: null, age: "1 hr", firstReplyMin: 6 },
    { id: "J-1043", customer: "Priya S.", town: "Silver Spring", type: "Second-floor room too hot", stage: "lead", source: "Missed call", value: null, age: "2 hr", firstReplyMin: 2 },
    { id: "J-1031", customer: "Tom B.", town: "Greenbelt", type: "Heat pump replacement", stage: "quoted", value: 9800, quoteDay: 2, age: "2 days" },
    { id: "J-1029", customer: "Alicia R.", town: "Beltsville", type: "Ductless mini-split, 2 zones", stage: "quoted", value: 7400, quoteDay: 5, age: "5 days" },
    { id: "J-1024", customer: "Grace H.", town: "Waldorf", type: "Furnace + AC combo", stage: "quoted", value: 12600, quoteDay: 10, age: "10 days" },
    { id: "J-1035", customer: "Luis M.", town: "Hyattsville", type: "Duct cleaning + sealing", stage: "quoted", value: 1150, quoteDay: 1, age: "1 day" },
    { id: "J-1037", customer: "Nina P.", town: "Bowie", type: "Fall heating tune-up", stage: "scheduled", value: 149, when: "Fri 8-10 AM", tech: "Jess" },
    { id: "J-1038", customer: "Omar F.", town: "College Park", type: "Water heater flush", stage: "scheduled", value: 189, when: "Fri 1-3 PM", tech: "Sam" },
    { id: "J-1033", customer: "Beth C.", town: "Crofton", type: "Heat pump install", stage: "scheduled", value: 8900, when: "Mon all day", tech: "Andre", note: "Part ordered, arrives Fri" },
    { id: "J-1039", customer: "Carlos D.", town: "Laurel", type: "Blower motor repair", stage: "progress", value: 640, tech: "Andre", note: "Tech on site 2:10 PM" },
    { id: "J-1040", customer: "Helen W.", town: "Glenn Dale", type: "AC shutdown for winter", stage: "progress", value: 129, tech: "Jess", note: "Tech on the way, ETA 3:30 PM" },
    { id: "J-1034", customer: "Rob T.", town: "Bowie", type: "Furnace ignitor replaced", stage: "done", value: 385, tech: "Sam" },
    { id: "J-1036", customer: "Sofia K.", town: "Largo", type: "Fall heating tune-up", stage: "done", value: 149, tech: "Jess" },
    { id: "J-1032", customer: "Mark E.", town: "Mitchellville", type: "Condensate line clog", stage: "done", value: 210, tech: "Andre" }
  ],
  /* Status-update texts. Each is triggered by a job event and sent through the
     owner's own field-service app (its registered business texting). */
  textTemplates: [
    { id: "booked", trigger: "Job moves to Scheduled", title: "Booked", body: "Hi {first}, you're booked with Sample Heating & Air for {when}. {tech} will be your tech. Reply here to change the time." },
    { id: "ontheway", trigger: "Tech taps 'On my way'", title: "Tech on the way", body: "Hi {first}, {tech} is on the way and should arrive around {eta}. Reply here if anything changed." },
    { id: "part", trigger: "Part marked 'Ordered'", title: "Part ordered", body: "Hi {first}, the part for your {type} is ordered and should arrive {partEta}. We'll text you as soon as it's in to book the install." },
    { id: "done", trigger: "Job moves to Done", title: "Job done", body: "Hi {first}, your {type} is done. Thanks for choosing Sample Heating & Air. Your invoice is on the way by email. Questions? Just reply." }
  ],
  footer: "Automated update from Sample Heating & Air. Reply STOP to opt out.",
  followFooter: "Automated reminder from Sample Heating & Air. Reply STOP to opt out.",
  sentTexts: [
    { job: "J-1040", tpl: "ontheway", time: "2:58 PM", vars: { eta: "3:30 PM" } },
    { job: "J-1033", tpl: "part", time: "11:20 AM", vars: { partEta: "Friday" } },
    { job: "J-1037", tpl: "booked", time: "10:05 AM", vars: {} },
    { job: "J-1034", tpl: "done", time: "9:40 AM", vars: {} },
    { job: "J-1036", tpl: "done", time: "12:15 PM", vars: {} },
    { job: "J-1032", tpl: "done", time: "4:05 PM", vars: {} }
  ],
  /* Quote follow-up: day 2, day 5 and day 10 nudges. Stops the moment the customer replies. */
  followups: [
    { job: "J-1031", day: 2, status: "due", channel: "Text", draft: "Hi Tom, it's Dana at Sample Heating & Air. Any questions on the heat pump quote? Happy to walk through the two options by text." },
    { job: "J-1029", day: 5, status: "due", channel: "Email", draft: "Hi Alicia, just checking in on the 2-zone mini-split quote. If timing is the issue, we have install openings the week of Oct 26." },
    { job: "J-1024", day: 10, status: "due", channel: "Text", draft: "Hi Grace, last check-in from me on the furnace + AC quote. If you went another way, no problem at all. Just reply 'pass' and we'll close it out." },
    { job: "J-1029", day: 2, status: "sent", channel: "Text", sentAt: "Mon 9:00 AM", draft: "Hi Alicia, it's Dana. Any questions on the mini-split quote?" },
    { job: "J-1024", day: 2, status: "sent", channel: "Text", sentAt: "Wed 10/7 9:00 AM", draft: "Hi Grace, it's Dana. Any questions on the furnace + AC quote?" },
    { job: "J-1024", day: 5, status: "sent", channel: "Email", sentAt: "Sat 9:00 AM", draft: "Hi Grace, checking in on the furnace + AC quote." },
    { job: "J-1035", day: 2, status: "upcoming", channel: "Text", due: "Fri 9:00 AM", draft: "Hi Luis, any questions on the duct cleaning quote?" },
    { job: "J-1022", customer: "Dave N.", day: 5, status: "stopped", channel: "Text", stoppedNote: "Customer replied 'yes, book it' on Mon. Follow-ups stopped, job booked.", draft: "" }
  ],
  /* Email-to-task intake. Fake addresses on example.com. */
  emails: [
    { id: "E1", from: "kevin.o@example.com", name: "Kevin O.", time: "1:12 PM", subject: "thermostat", body: "Hi, my thermostat screen went blank this morning. New batteries didn't help. I'm in Laurel. Can someone come Friday or Monday? Call or text 555-0143.", task: { customer: "Kevin O.", town: "Laurel", issue: "Thermostat screen blank, new batteries tried", urgency: "Normal", preferred: "Fri or Mon", contact: "555-0143 (text OK)" }, converted: true, jobId: "J-1042" },
    { id: "E2", from: "j.rivera@example.com", name: "June R.", time: "2:40 PM", subject: "Water dripping from the AC closet!!", body: "There's water pooling under the unit in our hall closet, maybe a cup an hour. AC is off for the season. Glenarden. Home after 4 today. 555-0177", task: { customer: "June R.", town: "Glenarden", issue: "Water pooling under indoor unit (AC off)", urgency: "Today", preferred: "After 4 PM today", contact: "555-0177" }, converted: false },
    { id: "E3", from: "pm.desk@example.com", name: "Ridge Court Rentals (demo)", time: "3:05 PM", subject: "Unit 4B no heat - tenant request", body: "Tenant in 4B reports no heat since last night. Gas furnace, about 12 years old. Access through the leasing office, 9-5 weekdays. Please send a quote before any repair over $500.", task: { customer: "Ridge Court Rentals (demo)", town: "Bowie", issue: "No heat in unit 4B, 12-yr gas furnace", urgency: "Today", preferred: "Weekdays 9-5 via office", contact: "Reply by email. Quote needed over $500" }, converted: false },
    { id: "E4", from: "newsletter@example.com", name: "Supply Weekly", time: "3:30 PM", subject: "Fall promo on filters", body: "Save 10% on bulk filter orders this week...", task: null, converted: false, skipped: "Not a customer request. Left in inbox, no task made." }
  ],
  /* Review requests. EVERY finished job gets the same review link. A score of 6 or
     below never blocks the link; it also flags the owner to call. */
  reviews: [
    { job: "J-1034", score: 10, comment: "Sam was on time and explained everything.", requested: "9:45 AM", posted: true },
    { job: "J-1036", score: 9, comment: "Quick and tidy.", requested: "12:20 PM", posted: false },
    { job: "J-1032", score: null, comment: "", requested: "4:10 PM", posted: false },
    { job: "J-1027", customer: "Ann V.", type: "AC repair", score: 6, comment: "Fixed, but had to call twice to get a time.", requested: "Wed 3:15 PM", posted: false },
    { job: "J-1025", customer: "Paul G.", type: "Furnace tune-up", score: 3, comment: "Tech left a mess by the unit.", requested: "Wed 11:00 AM", posted: false },
    { job: "J-1023", customer: "Rita J.", type: "Duct repair", score: 8, comment: "Good price.", requested: "Tue 2:30 PM", posted: true }
  ],
  reportExtras: { newReviewsGoogle: 2, avgRatingWeek: "4.8", missedCallsTexted: 3, revenueDone: null }
};

/* DTRT Job Desk demo app. Static, no backend, no network calls. Fictional data only. */
(function () {
  "use strict";
  var D, S; // D = original data, S = working state
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return n == null ? "" : "$" + n.toLocaleString("en-US"); };
  var first = function (name) { return String(name).split(" ")[0]; };
  var initials = function (name) { return String(name).split(" ").map(function (p) { return p[0]; }).join("").slice(0, 2).toUpperCase(); };

  var I = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    text: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    follow: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
    report: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M9 15v2M12 12v5M15 9v8"/>'
  };
  var icon = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + "</svg>"; };

  var ROUTES = [
    { id: "overview", label: "Overview", short: "Home", ic: "home" },
    { id: "board", label: "Job board", short: "Jobs", ic: "board" },
    { id: "texts", label: "Status texts", short: "Texts", ic: "text" },
    { id: "followups", label: "Quote follow-ups", short: "Quotes", ic: "follow" },
    { id: "inbox", label: "Email to task", short: "Inbox", ic: "inbox" },
    { id: "reviews", label: "Reviews", short: "Reviews", ic: "star" },
    { id: "report", label: "Nightly Report Card", short: "Report", ic: "report" }
  ];
  var NEXT = { lead: "quoted", quoted: "scheduled", scheduled: "progress", progress: "done" };
  var MOVE_TEXT = { quoted: null, scheduled: "booked", progress: "ontheway", done: "done" };
  var boardStage = "lead";
  var selText = 0, selMail = "E2";

  function init() {
    D = window.DEMO;
    S = JSON.parse(JSON.stringify(D));
    S.callbacksDone = {};
    S.sessionSends = 0;
  }
  function job(id) { return S.jobs.find(function (j) { return j.id === id; }); }
  function custOf(o) { var j = job(o.job); return o.customer || (j && j.customer) || ""; }
  function typeOf(o) { var j = job(o.job); return o.type || (j && j.type) || ""; }
  function fill(tplId, j, vars) {
    var t = S.textTemplates.find(function (x) { return x.id === tplId; });
    var v = Object.assign({ first: first(j.customer), when: j.when || "Fri 8-10 AM", tech: j.tech || "Andre", eta: "4:30 PM", type: j.type.toLowerCase(), partEta: "Friday" }, vars || {});
    return t.body.replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ""; });
  }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600); }
  function head(title, sub, extra) {
    return '<div class="head"><div><span class="tag demo-tag">Demo · fictional data</span><h1>' + esc(title) + "</h1><p>" + sub + "</p></div>" + (extra || "") + "</div>";
  }

  /* ---------- metrics (Report Card + KPI strip use the same numbers) ---------- */
  function metrics() {
    var by = function (st) { return S.jobs.filter(function (j) { return j.stage === st; }); };
    var leads = by("lead"), quoted = by("quoted");
    var rt = S.jobs.filter(function (j) { return j.firstReplyMin != null; }).map(function (j) { return j.firstReplyMin; }).sort(function (a, b) { return a - b; });
    var median = rt.length ? (rt.length % 2 ? rt[(rt.length - 1) / 2] : Math.round((rt[rt.length / 2 - 1] + rt[rt.length / 2]) / 2)) : null;
    var scored = S.reviews.filter(function (r) { return r.score != null; });
    var low = scored.filter(function (r) { return r.score <= 6; });
    var openCallbacks = low.filter(function (r) { return !S.callbacksDone[r.job]; });
    var fuSent = S.followups.filter(function (f) { return f.status === "sent"; }).length;
    var fuDue = S.followups.filter(function (f) { return f.status === "due"; }).length;
    var mails = S.emails.filter(function (e) { return e.task; });
    var mailsOpen = mails.filter(function (e) { return !e.converted; }).length;
    var m = {
      newLeads: leads.length, quotesOpen: quoted.length,
      quotesValue: quoted.reduce(function (a, j) { return a + (j.value || 0); }, 0),
      quotesStale: quoted.filter(function (j) { return j.quoteDay > 3; }).length,
      scheduled: by("scheduled").length, inProgress: by("progress").length, done: by("done").length,
      doneValue: by("done").reduce(function (a, j) { return a + (j.value || 0); }, 0),
      textsSent: S.sentTexts.length, fuSent: fuSent, fuDue: fuDue,
      reviewsAsked: S.reviews.length, reviewsIn: scored.length,
      avgScore: scored.length ? (scored.reduce(function (a, r) { return a + r.score; }, 0) / scored.length) : null,
      lowCount: low.length, openCallbacks: openCallbacks,
      medianReply: median, mailsToTasks: mails.filter(function (e) { return e.converted; }).length, mailsOpen: mailsOpen
    };
    // Grade: start at 100 and subtract for things left undone. Rules are shown on the card.
    var pts = 100 - 3 * openCallbacks.length - 3 * m.fuDue - 3 * mailsOpen - (median != null && median > 60 ? 10 : 0);
    m.points = Math.max(0, pts);
    m.grade = pts >= 95 ? "A" : pts >= 88 ? "B+" : pts >= 75 ? "B" : pts >= 60 ? "C" : "D";
    return m;
  }

  /* ---------- screens ---------- */
  var V = {};
  V.overview = function () {
    return '<section class="hero"><div><span class="tag">DTRT Job Desk · demo</span><h1>An AI office manager for a busy HVAC company. <em>You do the work. The system does the follow-up.</em></h1>' +
      '<p>This is a clickable demo built on a fictional company, Sample Heating &amp; Air Co. Every job tracked, every customer updated, every quote followed up, and a report card on the owner\'s phone each night.</p>' +
      '<a class="btn g" href="#board">Open the job board</a> <a class="btn o" href="#report" style="margin-left:6px">See tonight\'s Report Card</a> <a class="btn o" href="sample-map.pdf" download style="margin-left:6px">Sample map (PDF)</a></div>' +
      '<div class="flow" aria-label="How a job flows">' +
      ["Request comes in by email, web form or missed call", "It becomes a job card in seconds", "Customer gets a status text at each step", "Open quotes get a polite day 2, 5 and 10 nudge", "Every finished job gets a review request", "Owner gets one Report Card each night"].map(function (t, i) { return "<div><i>" + (i + 1) + "</i>" + t + "</div>"; }).join("") +
      "</div></section>" +
      '<div class="grid mods">' + [
        ["board", "board", "Job board", "Lead, quoted, scheduled, in progress, done. Click any job to move it and see the text the customer gets."],
        ["texts", "text", "Status texts", "\"Booked\", \"tech on the way\", \"part ordered\", \"job done\". Sent through the owner's own field-service app."],
        ["followups", "follow", "Quote follow-ups", "Day 2, day 5 and day 10 nudges in the owner's voice. They stop the moment the customer replies."],
        ["inbox", "inbox", "Email to task", "A customer email turns into a job card with the name, town, problem and best time pulled out."],
        ["reviews", "star", "Reviews", "Every customer gets the same review link. A score of 6 or below also flags a callback for the owner."],
        ["report", "report", "Nightly Report Card", "Jobs, open quotes, follow-ups, reviews and reply time on one phone screen at 8 PM."]
      ].map(function (m) { return '<a class="card mod" href="#' + m[0] + '"><div class="ic">' + icon(m[1]) + "</div><h3>" + m[2] + "</h3><p>" + m[3] + "</p></a>"; }).join("") + "</div>" +
      '<div class="card" style="padding:16px;margin-top:14px"><b>What always stays human</b><p style="margin:6px 0 0;color:var(--muted);font-size:13.5px">Pricing, judgment calls, complaints and anything personal. The owner can switch any automation off, and holds every new message type for approval until it has run clean for a week.</p></div>' +
      '<p class="note">Demo only. Sample Heating &amp; Air Co., its owner, staff, customers, phone numbers and emails are all invented. Numbers on these screens come from the demo data, not from a real business.</p>';
  };

  V.board = function () {
    var m = metrics();
    var kpis = '<div class="kpis">' + [
      [m.newLeads, "New leads"], [m.quotesOpen, "Quotes open · " + money(m.quotesValue)], [m.scheduled, "Scheduled"], [m.inProgress, "In progress"], [m.done, "Done today · " + money(m.doneValue)]
    ].map(function (k) { return '<div class="card kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("") + "</div>";
    var seg = '<div class="seg" role="tablist" aria-label="Stage">' + S.stages.map(function (s) {
      var n = S.jobs.filter(function (j) { return j.stage === s.id; }).length;
      return '<button role="tab" data-seg="' + s.id + '" class="' + (s.id === boardStage ? "on" : "") + '" aria-selected="' + (s.id === boardStage) + '">' + s.label + " (" + n + ")</button>";
    }).join("") + "</div>";
    var cols = S.stages.map(function (s) {
      var js = S.jobs.filter(function (j) { return j.stage === s.id; });
      return '<section class="col' + (s.id === boardStage ? " on" : "") + '" aria-label="' + s.label + '"><h2>' + s.label + "<span>" + js.length + "</span></h2>" +
        (js.length ? js.map(card).join("") : '<div class="empty">Nothing here</div>') + "</section>";
    }).join("");
    return head("Job board", "Every job in one place. Click a card to see its history and move it forward; the customer's text is shown before anything goes out.") + kpis + seg + '<div class="board">' + cols + "</div>";
  };
  function card(j) {
    var chips = "";
    if (j.stage === "lead") chips += '<span class="chip g">Replied in ' + j.firstReplyMin + " min</span>";
    if (j.stage === "quoted") chips += '<span class="chip ' + (j.quoteDay >= 10 ? "b" : j.quoteDay >= 5 ? "w" : "n") + '">Quote day ' + j.quoteDay + "</span>";
    if (j.when) chips += '<span class="chip n">' + esc(j.when) + "</span>";
    if (j.note) chips += '<span class="chip w">' + esc(j.note) + "</span>";
    if (j.stage === "done") { var r = S.reviews.find(function (x) { return x.job === j.id; }); if (r) chips += '<span class="chip ' + (r.score != null && r.score <= 6 ? "b" : "g") + '">' + (r.score == null ? "Review asked" : "Score " + r.score + "/10") + "</span>"; }
    return '<button class="job" data-job="' + j.id + '"><div class="top"><span>' + j.id + "</span><span>" + (j.value ? money(j.value) : esc(j.source || "")) + "</span></div><b>" + esc(j.customer) + '</b><div class="meta">' + esc(j.type) + " · " + esc(j.town) + (j.tech ? " · " + esc(j.tech) : "") + "</div>" + chips + "</button>";
  }

  V.texts = function () {
    var list = S.sentTexts.map(function (t, i) {
      var j = job(t.job), tp = S.textTemplates.find(function (x) { return x.id === t.tpl; });
      return '<button class="row' + (i === selText ? " on" : "") + '" data-text="' + i + '"><span class="av">' + initials(j.customer) + '</span><span class="main"><b>' + esc(j.customer) + " · " + tp.title + "</b><p>" + esc(fill(t.tpl, j, t.vars)) + '</p></span><span class="side-t">' + t.time + "</span></button>";
    }).join("");
    var t = S.sentTexts[selText] || S.sentTexts[0], j = job(t.job), tp = S.textTemplates.find(function (x) { return x.id === t.tpl; });
    var phone = '<div class="phone" aria-label="Text message preview"><div class="screen"><div class="sbar"><span>' + t.time.replace(/ (AM|PM)/, "") + '</span><span>5G ▮▮▮</span></div><div class="thead"><div class="av">SH</div><b>Sample Heating &amp; Air</b><br><span style="color:var(--muted)">(demo) business line</span></div>' +
      '<div class="msgs"><span class="when">Today ' + t.time + '</span><div class="bub">' + esc(fill(t.tpl, j, t.vars)) + "<small>" + esc(S.footer) + "</small></div>" +
      (t.tpl === "ontheway" ? '<div class="bub me">ok thanks!</div>' : "") + "</div></div></div>" +
      '<p class="note" style="text-align:center">Preview. ' + esc(j.customer) + " is a fictional customer.</p>";
    var trig = '<div class="card trig" style="margin-top:16px"><h3>When texts go out</h3>' + S.textTemplates.map(function (x, i) {
      return '<div class="trow"><span>' + esc(x.trigger) + '</span><span class="arrow">→</span><b>' + esc(x.title) + '</b><button class="switch" role="switch" aria-checked="true" aria-label="' + esc(x.title) + ' text on or off" data-switch="' + i + '"></button></div>';
    }).join("") + '<p class="note" style="margin-top:8px">Texts go through the owner\'s own field-service app and its registered business number, only to customers who agreed to texts. Every text says it\'s automated and includes STOP to opt out. Customer replies land with the owner, not a bot.</p></div>';
    return head("Status texts", "Customers stop calling to ask \"where are we?\". Each job event sends a short update. " + S.sentTexts.length + " sent today.") +
      '<div class="two texts-two"><div><div class="card list">' + list + "</div>" + trig + "</div><div>" + phone + "</div></div>";
  };

  V.followups = function () {
    var ladder = function (f) {
      return '<div class="ladder">' + [2, 5, 10].map(function (d) {
        var c = d < f.day ? "d" : d === f.day ? "c" : "";
        return '<span class="' + c + '">Day ' + d + "</span>";
      }).join("") + "</div>";
    };
    var due = S.followups.filter(function (f) { return f.status === "due"; });
    var dueHtml = due.length ? due.map(function (f) {
      var j = job(f.job), idx = S.followups.indexOf(f);
      return '<div class="card fu"><div class="daybadge"><span><b>' + f.day + "</b>day</span></div><div><b>" + esc(j.customer) + "</b> · " + esc(j.type) + " · " + money(j.value) + '<div class="meta" style="font-size:12.5px;color:var(--muted)">Quote sent ' + j.age + " ago · via " + f.channel + "</div>" + ladder(f) + '<div class="draft">' + esc(f.draft) + (f.channel === "Text" ? '<small style="display:block;color:var(--muted);font-size:11px;margin-top:4px">' + esc(S.followFooter) + "</small>" : "") + '</div></div><div class="acts"><button class="btn g s" data-fu="send" data-i="' + idx + '">Approve &amp; send</button><button class="btn l s" data-fu="skip" data-i="' + idx + '">Skip</button></div></div>';
    }).join('<div style="height:10px"></div>') : '<div class="card empty">All caught up. No follow-ups waiting.</div>';
    var rows = function (st, label) {
      var fs = S.followups.filter(function (f) { return f.status === st; });
      if (!fs.length) return "";
      return '<h2 class="sec-t">' + label + " (" + fs.length + ')</h2><div class="card list">' + fs.map(function (f) {
        return '<div class="row"><span class="av">D' + f.day + '</span><span class="main"><b>' + esc(custOf(f)) + "</b> · day " + f.day + " · " + f.channel + "<p>" + esc(f.stoppedNote || f.draft) + '</p></span><span class="side-t">' + esc(f.sentAt || f.due || (st === "skipped" ? "Skipped" : "Stopped")) + "</span></div>";
      }).join("") + "</div>";
    };
    var toggle = '<div class="card" style="padding:10px 14px;display:flex;gap:10px;align-items:center;font-size:13.5px"><span>Send automatically at 9 AM</span><button class="switch" role="switch" aria-checked="false" aria-label="Send follow-ups automatically" id="autoFu"></button><span style="color:var(--muted)">Off: hold for my OK</span></div>';
    return head("Quote follow-ups", "Open quotes get a friendly nudge on day 2, day 5 and day 10, written in the owner's voice. Any reply from the customer stops the sequence.", toggle) +
      '<h2 class="sec-t" style="margin-top:0">Waiting for your OK (' + due.length + ")</h2>" + dueHtml + rows("upcoming", "Coming up") + rows("sent", "Sent") + rows("skipped", "Skipped") + rows("stopped", "Stopped because the customer replied");
  };

  V.inbox = function () {
    var list = S.emails.map(function (e) {
      var st = e.skipped ? '<span class="chip n">Not a request</span>' : e.converted ? '<span class="chip g">Job ' + (e.jobId || "") + "</span>" : '<span class="chip w">Task drafted</span>';
      return '<button class="row' + (e.id === selMail ? " on" : "") + '" data-mail="' + e.id + '"><span class="av">' + initials(e.name) + '</span><span class="main"><b>' + esc(e.name) + "</b><p>" + esc(e.subject) + "</p>" + st + '</span><span class="side-t">' + e.time + "</span></button>";
    }).join("");
    var e = S.emails.find(function (x) { return x.id === selMail; }) || S.emails[0];
    var det = '<div class="card mail"><div class="from">From ' + esc(e.name) + " &lt;" + esc(e.from) + "&gt; · " + e.time + "</div><h3>" + esc(e.subject) + '</h3><div class="body">' + esc(e.body) + "</div>";
    if (e.task) {
      det += '<div class="extract"><h4>Pulled out automatically</h4><dl class="kv">' + [["Customer", e.task.customer], ["Town", e.task.town], ["Problem", e.task.issue], ["Urgency", e.task.urgency], ["Best time", e.task.preferred], ["Contact", e.task.contact]].map(function (kv) {
        return "<dt>" + kv[0] + "</dt><dd>" + (kv[0] === "Urgency" && kv[1] === "Today" ? '<span class="chip b" style="margin:0">Today</span>' : esc(kv[1])) + "</dd>";
      }).join("") + "</dl>" +
        (e.converted ? '<p style="margin:12px 0 0;font-size:13.5px"><span class="chip g" style="margin:0">Done</span> Job card <b>' + e.jobId + '</b> is on the board as a lead. <a href="#board">Open board</a></p>' : '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn g s" data-mk="' + e.id + '">Add to job board</button><button class="btn l s" data-ack="' + e.id + '">Preview reply</button></div><div id="ackBox"></div>') + "</div>";
    } else {
      det += '<p class="note"><span class="chip n" style="margin:0">Skipped</span> ' + esc(e.skipped) + "</p>";
    }
    det += "</div>";
    return head("Email to task", "Requests that arrive by email or web form become job cards with the details pulled out, so nothing sits unread in an inbox.") + '<div class="two"><div class="card list">' + list + "</div><div>" + det + "</div></div>";
  };

  V.reviews = function () {
    var rows = S.reviews.map(function (r) {
      var low = r.score != null && r.score <= 6, called = S.callbacksDone[r.job];
      var sc = r.score == null ? '<span class="score none">—</span>' : '<span class="score' + (low ? " low" : "") + '">' + r.score + "</span>";
      var status = r.score == null ? "Asked " + r.requested + ". No answer yet." : (r.posted ? "Posted a Google review" : "Review link sent " + r.requested);
      var extra = low ? (called ? '<span class="chip g">Owner called back</span>' : '<span class="chip b">Callback flagged for Dana</span><br><button class="btn n s" style="margin-top:8px" data-cb="' + r.job + '">Mark as called</button>') : "";
      return '<div class="row' + (low && !called ? " flag" : "") + '">' + sc + '<span class="main"><b>' + esc(custOf(r)) + "</b> · " + esc(typeOf(r)) + (r.comment ? "<p>\"" + esc(r.comment) + "\"</p>" : "") + '<p style="font-size:12px">' + status + "</p>" + extra + "</span></div>";
    }).join("");
    var m = metrics();
    return head("Reviews", "After every finished job the customer gets one short question (0 to 10) and the same Google review link. " + m.reviewsIn + " scored, average " + (m.avgScore ? m.avgScore.toFixed(1) : "-") + ".") +
      '<div class="rule"><span style="font-size:18px">✓</span><span><b>Every customer gets the review link, whatever they score.</b> Low scores are never hidden or held back. A score of 6 or below also flags a callback, so the owner can make it right. Replies to reviews are written by a person.</span></div>' +
      '<div class="two"><div class="card list">' + rows + '</div><div class="card" style="padding:14px"><b>Sample request (text)</b><div class="preview">Hi Rob, thanks for having us out today. How did Sam do, from 0 to 10? If you have a minute, a Google review helps a small local company a lot: [review link]<small style="display:block;color:var(--muted);font-size:11px;margin-top:6px">' + esc(S.footer) + '</small></div><p class="note">Low-score flags this week: <b>' + m.lowCount + "</b>. Open callbacks: <b>" + m.openCallbacks.length + "</b>.</p></div></div>";
  };

  V.report = function () {
    var m = metrics();
    var tiles = [
      [m.done, "Jobs done today", ""], [m.scheduled + m.inProgress, "Booked or in progress", ""],
      [m.quotesOpen, "Quotes open · " + money(m.quotesValue), m.quotesStale ? "alert" : ""], [m.fuSent, "Follow-ups sent this week", ""],
      [m.textsSent, "Customers updated today", ""], [m.medianReply + " min", "Median first reply", ""],
      [m.reviewsAsked, "Review requests this week", ""], [m.openCallbacks.length, "Low scores to call", m.openCallbacks.length ? "alert" : ""]
    ].map(function (t) { return '<div class="rc-t ' + t[2] + '"><b>' + t[0] + "</b><span>" + t[1] + "</span></div>"; }).join("");
    var todo = [];
    m.openCallbacks.forEach(function (r) { todo.push("Call " + custOf(r) + " (scored " + r.score + "/10)"); });
    if (m.fuDue) todo.push(m.fuDue + " quote follow-up" + (m.fuDue > 1 ? "s" : "") + " waiting for your OK");
    S.emails.filter(function (e) { return e.task && !e.converted; }).forEach(function (e) { todo.push("New request: " + e.task.customer + " · " + e.task.issue); });
    S.jobs.filter(function (j) { return j.stage === "scheduled" && j.note; }).forEach(function (j) { todo.push(j.customer + ": " + j.note); });
    var card = '<div class="phone" id="reportPhone"><div class="screen rc"><div class="sbar"><span>8:00</span><span>5G ▮▮▮</span></div>' +
      '<div class="rc-h"><small>DEMO · FICTIONAL DATA · ' + esc(S.today).toUpperCase() + '</small><h2>Tonight\'s Report Card</h2><small>Sample Heating &amp; Air Co. (demo)</small></div>' +
      '<div class="rc-grade"><div class="g">' + m.grade + "</div><div><b>" + m.points + ' / 100 today</b><p>Loses points for callbacks, follow-ups and requests still waiting.</p><div class="bar"><i style="width:' + m.points + '%"></i></div></div></div>' +
      '<div class="rc-tiles">' + tiles + "</div>" +
      '<div class="rc-list"><h4>For tomorrow</h4>' + (todo.length ? "<ul>" + todo.slice(0, 5).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "<p>Nothing waiting. Nice day.</p>") + "</div>" +
      '<div class="rc-foot">DTRT Job Desk · demo · every number comes from the demo data</div></div></div>';
    var side = '<div><div class="card" style="padding:16px"><b>How the Report Card works</b><ul style="margin:8px 0 0;padding-left:18px;color:var(--muted);font-size:13.5px"><li>Arrives on the owner\'s phone at 8 PM as one image or email.</li><li>Every number is counted from the day\'s own job, text, quote and review records.</li><li>Score starts at 100: minus 3 for each open callback, follow-up waiting or request not on the board yet, and minus 10 if the median first reply takes over an hour.</li><li>"For tomorrow" lists the few things that need a person.</li></ul></div>' +
      '<div class="card" style="padding:16px;margin-top:14px"><b>Try it</b><p style="margin:6px 0 10px;color:var(--muted);font-size:13.5px">Approve a follow-up, mark a callback done or turn an email into a job, then come back. The card updates.</p><a class="btn n s" href="#followups">Quote follow-ups</a> <a class="btn l s" href="#reviews">Reviews</a> <a class="btn l s" href="#inbox">Inbox</a></div></div>';
    return head("Nightly Report Card", "One screen the owner reads at night: what got done, what's waiting, and what needs a person tomorrow.") + '<div class="rc-wrap"><div>' + card + "</div>" + side + "</div>";
  };

  /* ---------- drawer (job detail) ---------- */
  function openJob(id) {
    var j = job(id), idx = S.stages.findIndex(function (s) { return s.id === j.stage; });
    var tl = S.stages.map(function (s, i) { return '<li class="' + (i > idx ? "todo" : "") + '"><b>' + s.label + "</b>" + (i === idx ? " · now" : "") + "</li>"; }).join("");
    var nx = NEXT[j.stage], prev = "";
    if (nx) {
      var tpl = MOVE_TEXT[nx], nlabel = S.stages.find(function (s) { return s.id === nx; }).label;
      var pj = Object.assign({}, j, { when: j.when || "Fri 8-10 AM", tech: j.tech || "Andre" });
      prev = '<h3 style="font-size:15px;margin:16px 0 4px">Move to ' + nlabel + "</h3>" +
        (tpl ? '<div class="preview"><small style="color:var(--muted)">Text the customer will get</small><div class="bub" style="margin-top:6px;max-width:100%">' + esc(fill(tpl, pj)) + "<small>" + esc(S.footer) + "</small></div>" + (nx === "done" ? '<p style="margin:8px 0 0;font-size:12.5px;color:var(--muted)">A review request goes out 5 minutes later.</p>' : "") + "</div>" :
          '<div class="preview" style="font-size:13.5px">The quote goes out by email and the day 2, 5 and 10 follow-ups are lined up.</div>') +
        '<button class="btn g" style="margin-top:12px;width:100%;justify-content:center" data-move="' + j.id + '">Move to ' + nlabel + (tpl ? " and send" : "") + "</button>";
    } else prev = '<div class="preview" style="font-size:13.5px">Finished. The customer got a "job done" text and a review request.</div>';
    var d = $("#drawer");
    d.innerHTML = '<button class="x" data-close aria-label="Close">×</button><span class="tag demo-tag">Demo · fictional</span><h2 id="drawerTitle">' + esc(j.customer) + '</h2><div style="color:var(--muted)">' + j.id + " · " + esc(j.type) + " · " + esc(j.town) + (j.value ? " · " + money(j.value) : "") + "</div><ul class=\"tl\">" + tl + "</ul>" + prev;
    d.hidden = false; $("#drawerBg").hidden = false; d.querySelector("[data-close]").focus();
  }
  function closeJob() { $("#drawer").hidden = true; $("#drawerBg").hidden = true; }
  function moveJob(id) {
    var j = job(id), nx = NEXT[j.stage]; if (!nx) return;
    if (j.stage === "quoted") S.followups.forEach(function (f) { if (f.job === j.id && (f.status === "due" || f.status === "upcoming")) { f.status = "stopped"; f.stoppedNote = "Job booked today. Follow-ups stopped automatically."; } });
    j.stage = nx;
    if (nx === "quoted") { j.value = j.value || 480; j.quoteDay = 0; j.age = "today"; }
    if (nx === "scheduled") { j.when = j.when || "Fri 8-10 AM"; j.tech = j.tech || "Andre"; }
    if (nx === "progress") { j.note = "Tech on the way"; }
    if (nx === "done") { j.note = null; S.reviews.unshift({ job: j.id, score: null, comment: "", requested: "just now", posted: false }); }
    var tpl = MOVE_TEXT[nx];
    if (tpl) S.sentTexts.unshift({ job: j.id, tpl: tpl, time: "4:52 PM", vars: {} });
    boardStage = nx; closeJob(); render();
    toast(tpl ? "Moved. Preview text logged for " + j.customer + " (demo, nothing sent)." : "Moved to Quoted. Follow-ups lined up.");
  }

  /* ---------- router + events ---------- */
  function navHtml(cls) {
    var r = (location.hash || "#overview").slice(1), m = metrics();
    var counts = { followups: m.fuDue, inbox: m.mailsOpen, reviews: m.openCallbacks.length };
    return ROUTES.filter(function (x) { return cls !== "tab" || x.id !== "overview"; }).map(function (x) {
      return '<a class="' + (cls === "tab" ? "" : "navlink ") + (x.id === r ? "on" : "") + '" href="#' + x.id + '"' + (x.id === r ? ' aria-current="page"' : "") + ">" + icon(x.ic) + "<span>" + (cls === "tab" ? x.short : x.label) + "</span>" + (cls !== "tab" && counts[x.id] ? '<span class="count">' + counts[x.id] + "</span>" : "") + "</a>";
    }).join("");
  }
  function render() {
    var r = (location.hash || "#overview").slice(1);
    if (!V[r]) r = "overview";
    $("#main").innerHTML = V[r]();
    $("#nav").innerHTML = navHtml("side");
    $("#tabbar").innerHTML = navHtml("tab");
    document.title = ROUTES.find(function (x) { return x.id === r; }).label + " · Job Desk demo (fictional data)";
  }
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-job],[data-seg],[data-text],[data-fu],[data-mail],[data-mk],[data-ack],[data-cb],[data-move],[data-close],[data-switch],#autoFu,#reset,#drawerBg");
    if (!t) return;
    if (t.id === "drawerBg" || t.hasAttribute("data-close")) return closeJob();
    if (t.id === "reset") { init(); render(); return toast("Demo reset."); }
    if (t.dataset.job) return openJob(t.dataset.job);
    if (t.dataset.move) return moveJob(t.dataset.move);
    if (t.dataset.seg) { boardStage = t.dataset.seg; return render(); }
    if (t.dataset.text) { selText = +t.dataset.text; render(); if (innerWidth < 980) $(".phone").scrollIntoView({ behavior: "smooth" }); return; }
    if (t.dataset.mail) { selMail = t.dataset.mail; render(); if (innerWidth < 980) $(".mail").scrollIntoView({ behavior: "smooth" }); return; }
    if (t.dataset.fu) {
      var f = S.followups[+t.dataset.i], j = job(f.job);
      if (t.dataset.fu === "send") { f.status = "sent"; f.sentAt = "Today 4:52 PM"; toast("Day " + f.day + " follow-up approved for " + j.customer + " (demo, nothing sent)."); }
      else { f.status = "skipped"; toast("Skipped. " + j.customer + "'s quote stays open."); }
      return render();
    }
    if (t.dataset.mk) {
      var e = S.emails.find(function (x) { return x.id === t.dataset.mk; });
      var id = "J-10" + (44 + S.jobs.length - 15);
      S.jobs.unshift({ id: id, customer: e.task.customer, town: e.task.town, type: e.task.issue, stage: "lead", source: "Email", age: "now", firstReplyMin: 3 });
      e.converted = true; e.jobId = id; boardStage = "lead"; render();
      return toast("Job card " + id + " created for " + e.task.customer + ".");
    }
    if (t.dataset.ack) {
      var e2 = S.emails.find(function (x) { return x.id === t.dataset.ack; });
      var hi = /\(demo\)/.test(e2.task.customer) ? "Hi there" : "Hi " + first(e2.task.customer);
      $("#ackBox").innerHTML = '<div class="preview" style="font-size:13.5px"><small style="color:var(--muted)">Reply draft (owner approves before it goes)</small><p style="margin:6px 0 0">' + esc(hi) + ", thanks for reaching out to Sample Heating &amp; Air. We got your note and we'll get back to you shortly to set a time. Dana</p></div>";
      return;
    }
    if (t.dataset.cb) { S.callbacksDone[t.dataset.cb] = true; render(); return toast("Callback marked done."); }
    if (t.dataset.switch != null || t.id === "autoFu") {
      var on = t.getAttribute("aria-checked") === "true"; t.setAttribute("aria-checked", String(!on));
      return toast(t.id === "autoFu" ? (on ? "Follow-ups held for your OK." : "Follow-ups will send at 9 AM (demo).") : "Text " + (on ? "paused" : "turned on") + " (demo).");
    }
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeJob(); });
  window.addEventListener("hashchange", function () { closeJob(); render(); window.scrollTo(0, 0); });
  window.__jobDeskReset = function () { init(); boardStage = "lead"; selText = 0; selMail = "E2"; closeJob(); render(); };
  init(); render();
})();

/* Guided auto-play for screen recording. Turn on with ?tour=1 (add &loop=1 to repeat).
   About 30 seconds: board -> status text -> quote nudge -> review flag -> nightly Report Card. */
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
    return wait(180).then(function () {
      cap.innerHTML = '<span class="n">' + n + "</span><div><b>" + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>";
      cap.classList.add("show");
    });
  }
  function go(hash) { location.hash = hash; window.scrollTo(0, 0); return wait(350); }
  function scrollTo(sel, block) { var el = $(sel); if (el) el.scrollIntoView({ behavior: "smooth", block: block || "center" }); return wait(700); }
  function point(sel) {
    var el = $(sel); if (!el) return wait(10);
    var r = el.getBoundingClientRect();
    cur.style.transform = "translate(" + (r.left + r.width / 2) + "px," + (r.top + r.height / 2) + "px)";
    cur.classList.add("on");
    return wait(650);
  }
  function tap(sel) {
    return point(sel).then(function () {
      var el = $(sel); cur.classList.add("tap");
      return wait(220).then(function () { cur.classList.remove("tap"); if (el) el.click(); return wait(250); });
    });
  }
  function glow(sel) { var el = $(sel); if (el) el.classList.add("tour-glow"); }
  var t0;
  function run() {
    window.__tourDone = false;
    window.__jobDeskReset();
    var mobile = innerWidth < 760;
    t0 = performance.now(); prog.firstChild.style.transition = "none"; prog.firstChild.style.width = "0";
    requestAnimationFrame(function () { prog.firstChild.style.transition = "width 30s linear"; prog.firstChild.style.width = "100%"; });
    return go("board")
      .then(function () { return say(1, "Every job in one place", "Lead, quoted, scheduled, in progress, done"); })
      .then(function () { return wait(1600); })
      .then(function () { return mobile ? tap('[data-seg="quoted"]') : point('[data-job="J-1031"]'); })
      .then(function () { return say(2, "Book a job. The customer gets a text.", "Sent from the owner's own field-service app"); })
      .then(function () { return tap('[data-job="J-1031"]'); })
      .then(function () { return wait(1400); })
      .then(function () { return tap('[data-move="J-1031"]'); })
      .then(function () { cur.classList.remove("on"); return go("texts"); })
      .then(function () { return wait(10); })
      .then(function () { glow(".phone .bub"); return wait(2300); })
      .then(function () { return go("followups"); })
      .then(function () { return say(3, "Every quote gets followed up", "Day 2, 5 and 10. Stops when the customer replies"); })
      .then(function () { glow(".fu"); return wait(1500); })
      .then(function () { return tap('[data-fu="send"]'); })
      .then(function () { return wait(1600); })
      .then(function () { cur.classList.remove("on"); return go("reviews"); })
      .then(function () { return say(4, "Score of 6 or below? Call them back.", "Every customer still gets the same review link"); })
      .then(function () { return scrollTo(".row.flag"); })
      .then(function () { glow(".row.flag"); return wait(2000); })
      .then(function () { return tap('[data-cb="J-1025"]'); })
      .then(function () { return wait(900); })
      .then(function () { cur.classList.remove("on"); return go("report"); })
      .then(function () { return say(5, "A Report Card on your phone every night", "Jobs, quotes, follow-ups, reviews, reply time"); })
      .then(function () { return mobile ? scrollTo("#reportPhone", "start") : wait(10); })
      .then(function () { return wait(mobile ? 2200 : 3000); })
      .then(function () { return mobile ? scrollTo(".rc-list", "center") : wait(10); })
      .then(function () { return wait(1600); })
      .then(function () { return say("✓", "DTRT Job Desk", "Reply SYSTEM for a free map · dtrtlab.com"); })
      .then(function () { return wait(2400); })
      .then(function () { window.__tourDone = true; window.__tourMs = Math.round(performance.now() - t0); if (q.get("loop") === "1") return wait(800).then(run); });
  }
  window.addEventListener("load", function () { wait(q.get("delay") ? +q.get("delay") : 600).then(run); });
})();
