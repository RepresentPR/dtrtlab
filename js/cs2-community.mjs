import {
  createAccount,
  unlockAccount,
  lockAccount,
  eraseAccount,
  storedAccount,
  currentAccount,
  signText,
  attachProvider,
  attachedProviders,
} from "./cs2-account.mjs";
import {
  decodeShareCode,
  paintCrosshair,
  describeCrosshair,
  commandsFor,
  rotationIndex,
  nextRotationAt,
} from "./cs2-crosshair.mjs";

const cs2 = await fetch("content/cs2.json", { cache: "no-store" }).then(function (res) {
  if (!res.ok) throw new Error("content/cs2.json");
  return res.json();
});
const pack = await fetch("content/crosshairs.json", { cache: "no-store" }).then(function (res) {
  if (!res.ok) throw new Error("content/crosshairs.json");
  return res.json();
});

const bench = pack.bench.map(function (item) {
  return Object.assign({}, item, { decoded: decodeShareCode(item.code) });
});

let board = null;
let live = false;
let skew = 0;
let previewId = bench[0].id;

const els = {
  mode: document.getElementById("board-mode"),
  stageName: document.getElementById("xh-name"),
  stageNote: document.getElementById("xh-note"),
  stageMeta: document.getElementById("xh-meta"),
  stageCode: document.getElementById("xh-code"),
  stageCmds: document.getElementById("xh-cmds"),
  stageCanvas: document.getElementById("xh-canvas"),
  stageBadge: document.getElementById("xh-badge"),
  countdown: document.getElementById("xh-countdown"),
  gallery: document.getElementById("xh-gallery"),
  submitStatus: document.getElementById("xh-submit-status"),
  polls: document.getElementById("polls"),
  maps: document.getElementById("map-board"),
  utility: document.getElementById("utility-board"),
  wants: document.getElementById("wants"),
  account: document.getElementById("account-panel"),
  accountStatus: document.getElementById("account-status"),
  feed: document.getElementById("feed"),
  feedStatus: document.getElementById("feed-status"),
  edpiOut: document.getElementById("edpi-out"),
  tabs: document.getElementById("tab-board"),
  tabStatus: document.getElementById("tab-status"),
  agentStatus: document.getElementById("agent-status"),
  agentList: document.getElementById("agent-list"),
  approveStatus: document.getElementById("approve-status"),
};

boot().catch(function (err) {
  if (els.mode) els.mode.textContent = err.message || "The CS2 room failed to load.";
});

async function boot() {
  await refreshBoard();
  setCommunityAvailability();
  await renderStored();
  previewId = onStage().id;
  renderStage();
  renderGallery();
  renderPolls();
  renderReference();
  renderFeed();
  renderTabs();
  await renderAgents();
  requestAnimationFrame(function () {
    renderStage();
    renderGallery();
  });
  document.getElementById("xh-copy").addEventListener("click", copyCode);
  document.getElementById("xh-copy-cmds").addEventListener("click", copyCommands);
  document.getElementById("xh-form").addEventListener("submit", onSubmitCode);
  document.getElementById("account-create").addEventListener("submit", onCreate);
  document.getElementById("account-unlock").addEventListener("submit", onUnlock);
  document.getElementById("take-form").addEventListener("submit", onTake);
  document.getElementById("agent-form").addEventListener("submit", onAttach);
  document.getElementById("tab-form").addEventListener("submit", onProposeTab);
  document.getElementById("approve-form").addEventListener("submit", onApprove);
  document.getElementById("tab-board").addEventListener("click", onTabVote);
  document.getElementById("edpi-form").addEventListener("input", onEdpi);
  document.getElementById("polls").addEventListener("click", onVoteClick);
  document.getElementById("xh-gallery").addEventListener("click", onGalleryClick);
  setInterval(tick, 1000);
  tick();
  onEdpi();
}

function setCommunityAvailability() {
  if (live) return;
  ["votes", "tabs", "account", "notes"].forEach(function (id) {
    document.getElementById(id).hidden = true;
  });
  document.querySelectorAll("[data-community-link]").forEach(function (link) {
    link.hidden = true;
  });
  document.getElementById("xh-form-title").textContent = "Preview a code from a clip";
  document.getElementById("xh-submit").textContent = "Preview on this device";
}

async function refreshBoard() {
  try {
    const res = await fetch("/api/community", { cache: "no-store" });
    if (!res.ok) throw new Error("board");
    board = await res.json();
    live = true;
    skew = board.serverNow - Date.now();
    els.mode.textContent = "Live board. Votes are public. Passwords stay in this browser.";
  } catch (err) {
    live = false;
    board = localBoard();
    skew = 0;
    els.mode.textContent = "The community board is offline. Crosshair previews and copying still work here.";
  }
}

function clock() {
  return Date.now() + skew;
}

function onStage() {
  return bench[rotationIndex(bench.length, clock())];
}

function findCrosshair(id) {
  const local = bench.find(function (item) {
    return item.id === id;
  });
  if (local) return local;
  const sub = (board.submissions || []).find(function (item) {
    return item.id === id;
  });
  if (!sub) return null;
  return {
    id: sub.id,
    name: sub.label,
    note: "Pasted by " + sub.name + ".",
    code: sub.code,
    decoded: decodeShareCode(sub.code),
  };
}

function renderStage() {
  const item = findCrosshair(previewId) || onStage();
  const featured = onStage();
  els.stageName.textContent = item.name;
  els.stageNote.textContent = item.note;
  els.stageMeta.textContent = describeCrosshair(item.decoded);
  els.stageCode.textContent = item.code;
  els.stageCmds.textContent = commandsFor(item.decoded);
  els.stageBadge.hidden = item.id !== featured.id;
  paintCrosshair(els.stageCanvas, item.decoded);
}

function renderGallery() {
  const featured = onStage();
  els.gallery.innerHTML = "";
  bench.concat(submissionCards()).forEach(function (item) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "xh-card" + (item.id === previewId ? " is-on" : "");
    card.dataset.id = item.id;
    const canvas = document.createElement("canvas");
    canvas.className = "xh-mini";
    canvas.width = 120;
    canvas.height = 120;
    const title = document.createElement("strong");
    title.textContent = item.name;
    const meta = document.createElement("span");
    meta.textContent = item.id === featured.id ? "On stage" : item.note;
    card.append(canvas, title, meta);
    els.gallery.append(card);
    paintCrosshair(canvas, item.decoded);
  });
}

function submissionCards() {
  return (board.submissions || []).map(function (item) {
    return {
      id: item.id,
      name: item.label,
      note: "From " + item.name,
      code: item.code,
      decoded: decodeShareCode(item.code),
    };
  });
}

function renderPolls() {
  els.polls.innerHTML = "";
  (board.polls || []).forEach(function (poll) {
    const section = document.createElement("article");
    section.className = "poll";
    const title = document.createElement("h3");
    title.textContent = poll.question;
    section.append(title);
    const total = poll.choices.reduce(function (sum, choice) {
      return sum + choice.votes;
    }, 0);
    const me = currentAccount();
    poll.choices.forEach(function (choice) {
      const row = document.createElement("div");
      row.className = "poll-row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vote";
      button.dataset.poll = poll.id;
      button.dataset.choice = choice.id;
      button.textContent = me ? "Vote" : "Sign in";
      const label = document.createElement("span");
      label.className = "poll-label";
      label.textContent = choice.label;
      const count = document.createElement("span");
      count.className = "poll-count";
      count.textContent = String(choice.votes);
      const bar = document.createElement("span");
      bar.className = "poll-bar";
      const fill = document.createElement("span");
      fill.style.width = (total ? Math.round((choice.votes / total) * 100) : 0) + "%";
      bar.append(fill);
      const who = document.createElement("span");
      who.className = "poll-who";
      who.textContent = choice.voters && choice.voters.length ? choice.voters.join(", ") : "No votes yet";
      row.append(button, label, count, bar, who);
      section.append(row);
    });
    els.polls.append(section);
  });
}

function renderReference() {
  els.wants.innerHTML = "";
  cs2.wants.forEach(function (item) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const copy = document.createElement("p");
    copy.textContent = item.detail;
    card.append(title, copy);
    els.wants.append(card);
  });
  els.maps.innerHTML = "";
  cs2.maps.concat(cs2.reserve).forEach(function (map) {
    const card = document.createElement("article");
    const kicker = document.createElement("p");
    kicker.className = "hud";
    kicker.textContent = map.pool === "active" ? "Active" : "Reserve";
    const title = document.createElement("h3");
    title.textContent = map.name;
    const copy = document.createElement("p");
    copy.textContent = map.blurb;
    card.append(kicker, title, copy);
    els.maps.append(card);
  });
  els.utility.innerHTML = "";
  cs2.utility.forEach(function (item) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    title.textContent = item.map + " — " + item.throw;
    const copy = document.createElement("p");
    copy.textContent = item.why;
    card.append(title, copy);
    els.utility.append(card);
  });
  const queueHost = document.getElementById("queue-board");
  queueHost.innerHTML = "";
  cs2.queues.forEach(function (item) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const copy = document.createElement("p");
    copy.textContent = item.why;
    card.append(title, copy);
    queueHost.append(card);
  });
}

function renderAccount() {
  const me = currentAccount();
  const stored = els.account.dataset.stored || "";
  els.account.querySelector("[data-signed-in]").hidden = !me;
  els.account.querySelector("[data-signed-out]").hidden = !!me;
  els.account.querySelector("[data-has-vault]").hidden = !stored || !!me;
  if (me) {
    els.account.querySelector("[data-you]").textContent = me.name + " · " + me.thumb;
  }
}

async function renderStored() {
  const stored = await storedAccount();
  els.account.dataset.stored = stored ? stored.name : "";
  const hint = els.account.querySelector("[data-vault-name]");
  if (hint) hint.textContent = stored ? stored.name : "";
  renderAccount();
}

function renderFeed() {
  els.feed.innerHTML = "";
  const takes = board.takes || [];
  if (!takes.length) {
    const empty = document.createElement("p");
    empty.textContent = "No notes yet. The first one sets the tone.";
    els.feed.append(empty);
    return;
  }
  takes.forEach(function (take) {
    const item = document.createElement("article");
    const who = document.createElement("p");
    who.className = "hud";
    who.textContent = take.name;
    const text = document.createElement("p");
    text.textContent = take.text;
    item.append(who, text);
    els.feed.append(item);
  });
}

let shownStage = "";

function tick() {
  const featured = onStage();
  const remain = Math.max(0, nextRotationAt(clock()) - clock());
  const hours = Math.floor(remain / 3600000);
  const mins = Math.floor((remain % 3600000) / 60000);
  const secs = Math.floor((remain % 60000) / 1000);
  els.countdown.textContent =
    "On stage: " + featured.name + ". Next crosshair in " + hours + "h " + pad(mins) + "m " + pad(secs) + "s.";
  if (featured.id !== shownStage) {
    shownStage = featured.id;
    renderGallery();
    renderStage();
  }
}

function onGalleryClick(event) {
  const card = event.target.closest(".xh-card");
  if (!card) return;
  previewId = card.dataset.id;
  renderStage();
  renderGallery();
}

async function onVoteClick(event) {
  const button = event.target.closest(".vote");
  if (!button) return;
  if (!currentAccount()) {
    document.getElementById("account").scrollIntoView({ behavior: "smooth" });
    setStatus(els.accountStatus, "Create an account or sign in, then vote. The password never leaves this browser.");
    return;
  }
  button.disabled = true;
  try {
    if (!live) throw new Error("The live board is not running.");
    const poll = button.dataset.poll;
    const choice = button.dataset.choice;
    await post("/api/community/vote", {
      poll: poll,
      choice: choice,
      publicJwk: currentAccount().publicJwk,
      signature: await signText("vote\n" + poll + "\n" + choice),
    });
    await refreshBoard();
    renderPolls();
  } catch (err) {
    setStatus(els.accountStatus, err.message);
  } finally {
    button.disabled = false;
  }
}

async function onCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.namedItem("name").value;
  const password = form.elements.namedItem("password").value;
  const again = form.elements.namedItem("again").value;
  if (password !== again) {
    setStatus(els.accountStatus, "Those passwords do not match.");
    return;
  }
  setStatus(els.accountStatus, "Creating the key on this device…");
  try {
    const me = await createAccount(name, password);
    form.reset();
    if (live) await publishIdentity(me);
    await renderStored();
    renderPolls();
    setStatus(els.accountStatus, "Account ready. DTRT Lab cannot open it. If you forget the password, it is gone.");
  } catch (err) {
    setStatus(els.accountStatus, err.message);
  }
}

async function onUnlock(event) {
  event.preventDefault();
  const password = event.currentTarget.elements.namedItem("password").value;
  setStatus(els.accountStatus, "Opening the key…");
  try {
    const me = await unlockAccount(password);
    event.currentTarget.reset();
    if (live) await publishIdentity(me);
    await renderStored();
    renderPolls();
    setStatus(els.accountStatus, "Signed in as " + me.name + ".");
  } catch (err) {
    setStatus(els.accountStatus, err.message);
  }
}

async function publishIdentity(me) {
  await post("/api/community/register", {
    name: me.name,
    publicJwk: me.publicJwk,
    signature: await signText("register\n" + me.name + "\n" + me.thumb),
  });
}

async function onSubmitCode(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const label = form.elements.namedItem("label").value.trim();
  const code = form.elements.namedItem("code").value.trim();
  try {
    decodeShareCode(code);
  } catch (err) {
    setStatus(els.submitStatus, err.message);
    return;
  }
  if (!live) {
    const id = "local-preview";
    board.submissions = [{ id: id, label: label, name: "you", code: code }];
    previewId = id;
    renderStage();
    renderGallery();
    setStatus(els.submitStatus, "Previewed on this device. Copy the code to import it in CS2. It was not sent to a vote.");
    return;
  }
  if (!currentAccount()) {
    setStatus(els.submitStatus, "Sign in first. The code is public. The account key is not.");
    return;
  }
  setStatus(els.submitStatus, "Checking the code…");
  try {
    const signature = await signText("submit\n" + label + "\n" + code);
    await post("/api/community/crosshair", {
      label: label,
      code: code,
      publicJwk: currentAccount().publicJwk,
      signature: signature,
    });
    form.reset();
    await refreshBoard();
    renderGallery();
    renderPolls();
    setStatus(els.submitStatus, "It is on the board. The four-hour clock still walks the original bench.");
  } catch (err) {
    setStatus(els.submitStatus, err.message);
  }
}

function renderTabs() {
  if (!els.tabs) return;
  els.tabs.innerHTML = "";
  const tabs = board.tabs || [];
  if (!tabs.length) {
    const empty = document.createElement("p");
    empty.textContent = "No community tabs yet.";
    els.tabs.append(empty);
    return;
  }
  tabs.forEach(function (tab) {
    const card = document.createElement("article");
    card.className = "tab-card";
    const kicker = document.createElement("p");
    kicker.className = "hud";
    kicker.textContent = tab.providerLabel + (tab.id === board.leaderId ? " · ahead" : "");
    const title = document.createElement("h3");
    title.textContent = tab.title;
    const blurb = document.createElement("p");
    blurb.textContent = tab.blurb;
    const meta = document.createElement("p");
    meta.className = "status";
    meta.textContent = tabStatusLine(tab) + " · " + tab.votes + " vote" + (tab.votes === 1 ? "" : "s");
    const preview = document.createElement("a");
    preview.href = "tab.html?id=" + encodeURIComponent(tab.id);
    preview.textContent = "Preview";
    card.append(kicker, title, blurb, meta, preview);
    if (tab.status === "preview") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vote";
      button.dataset.choice = tab.id;
      button.textContent = currentAccount() ? "Vote" : "Sign in";
      card.append(button);
    }
    els.tabs.append(card);
  });
}

function tabStatusLine(tab) {
  if (tab.status === "live") return "On the site";
  if (tab.status === "waiting") {
    const remain = Math.max(0, Date.parse(tab.liveAt) - clock());
    const hours = Math.floor(remain / 3600000);
    return "Approved. Added in " + hours + "h";
  }
  return "Preview only";
}

async function renderAgents() {
  if (!els.agentList) return;
  try {
    const ids = await attachedProviders();
    const labels = { grok: "Grok", chatgpt: "ChatGPT", "grok-bot": "Grok bot", cursor: "Cursor", claude: "Claude" };
    els.agentList.textContent = ids.length
      ? "Saved on this device: " + ids.map(function (id) { return labels[id] || id; }).join(", ") + "."
      : "No provider key saved on this device.";
  } catch (err) {
    els.agentList.textContent = "";
  }
}

async function onAttach(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const id = await attachProvider(form.elements.namedItem("provider").value, form.elements.namedItem("key").value);
    form.elements.namedItem("key").value = "";
    await renderAgents();
    setStatus(els.agentStatus, "Saved " + id + " on this device. The key was not uploaded.");
  } catch (err) {
    setStatus(els.agentStatus, err.message);
  }
}

async function onProposeTab(event) {
  event.preventDefault();
  if (!currentAccount()) {
    setStatus(els.tabStatus, "Sign in first. The proposal is public. The provider key is not.");
    return;
  }
  const form = event.currentTarget;
  const provider = form.elements.namedItem("provider").value;
  const title = form.elements.namedItem("title").value.trim().replace(/\s+/g, " ");
  const blurb = oneLine(form.elements.namedItem("blurb").value);
  const copy = oneLine(form.elements.namedItem("body").value);
  try {
    await post("/api/community/tab", {
      provider: provider,
      title: title,
      blurb: blurb,
      body: copy,
      publicJwk: currentAccount().publicJwk,
      signature: await signText("tab\n" + provider + "\n" + title + "\n" + blurb + "\n" + copy),
    });
    form.reset();
    await refreshBoard();
    renderTabs();
    setStatus(els.tabStatus, "Up for preview. It is not in the navigation until it leads, you approve it, and 72 hours pass.");
  } catch (err) {
    setStatus(els.tabStatus, err.message);
  }
}

async function onTabVote(event) {
  const button = event.target.closest(".vote");
  if (!button) return;
  if (!currentAccount()) {
    document.getElementById("account").scrollIntoView({ behavior: "smooth" });
    setStatus(els.accountStatus, "Sign in to vote on a tab.");
    return;
  }
  button.disabled = true;
  try {
    const choice = button.dataset.choice;
    await post("/api/community/vote", {
      poll: "tab",
      choice: choice,
      publicJwk: currentAccount().publicJwk,
      signature: await signText("vote\ntab\n" + choice),
    });
    await refreshBoard();
    renderTabs();
    renderPolls();
  } catch (err) {
    setStatus(els.tabStatus, err.message);
  } finally {
    button.disabled = false;
  }
}

async function onApprove(event) {
  event.preventDefault();
  const secret = event.currentTarget.elements.namedItem("secret").value;
  const leader = (board.tabs || []).find(function (tab) {
    return tab.id === board.leaderId;
  });
  if (!leader) {
    setStatus(els.approveStatus, "Nothing is ahead yet.");
    return;
  }
  try {
    const res = await fetch("/api/community/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DTRT-Secret": secret },
      body: JSON.stringify({ id: leader.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Approval was refused.");
    event.currentTarget.reset();
    await refreshBoard();
    renderTabs();
    setStatus(els.approveStatus, leader.title + " is approved. It joins the site 72 hours after " + data.approvedAt + ".");
  } catch (err) {
    setStatus(els.approveStatus, err.message);
  }
}

async function onTake(event) {
  event.preventDefault();
  if (!currentAccount()) {
    setStatus(els.feedStatus, "Sign in to post. People see the name, not the key.");
    return;
  }
  const form = event.currentTarget;
  const text = form.elements.namedItem("text").value.trim();
  try {
    await post("/api/community/take", {
      text: text,
      publicJwk: currentAccount().publicJwk,
      signature: await signText("take\n" + text),
    });
    form.reset();
    await refreshBoard();
    renderFeed();
    setStatus(els.feedStatus, "Posted.");
  } catch (err) {
    setStatus(els.feedStatus, err.message);
  }
}

function onEdpi() {
  const form = document.getElementById("edpi-form");
  const dpi = Number(form.elements.namedItem("dpi").value);
  const sens = Number(form.elements.namedItem("sens").value);
  if (!dpi || !sens || dpi < 1 || sens <= 0) {
    els.edpiOut.textContent = "Enter a DPI and an in-game sensitivity.";
    return;
  }
  const edpi = Math.round(dpi * sens * 100) / 100;
  els.edpiOut.textContent =
    edpi + " eDPI. People who post their CS2 settings often land somewhere between 600 and 1200. That is a comparison, not a rule.";
}

async function copyCode() {
  const item = findCrosshair(previewId);
  await navigator.clipboard.writeText(item.code);
  flash(document.getElementById("xh-copy"), "Copied");
}

async function copyCommands() {
  const item = findCrosshair(previewId);
  await navigator.clipboard.writeText(commandsFor(item.decoded).replace(/\n/g, "; "));
  flash(document.getElementById("xh-copy-cmds"), "Copied");
}

function flash(button, text) {
  const previous = button.textContent;
  button.textContent = text;
  setTimeout(function () {
    button.textContent = previous;
  }, 1200);
}

function localBoard() {
  return {
    serverNow: Date.now(),
    polls: cs2.polls.map(function (poll) {
      const source = {
        crosshairs: bench.map(function (item) {
          return { id: item.id, label: item.name };
        }),
        maps: cs2.maps.map(function (item) {
          return { id: item.id, label: item.name };
        }),
        queues: cs2.queues.map(function (item) {
          return { id: item.id, label: item.name };
        }),
        clips: cs2.clips.map(function (item) {
          return { id: item.id, label: item.name };
        }),
      }[poll.source];
      return {
        id: poll.id,
        question: poll.question,
        choices: source.map(function (item) {
          return { id: item.id, label: item.label, votes: 0, voters: [] };
        }),
      };
    }),
    takes: [],
    submissions: [],
    tabs: [],
    leaderId: null,
  };
}

function post(path, body) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) throw new Error(data.error || "The board refused that.");
      return data;
    });
  });
}

function setStatus(el, text) {
  if (el) el.textContent = text;
}

function oneLine(value) {
  return String(value || "").replace(/[\u0000-\u001F]/g, "").trim();
}

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

document.getElementById("account-lock").addEventListener("click", function () {
  lockAccount();
  renderAccount();
  renderPolls();
  setStatus(els.accountStatus, "Locked on this device. The key stays encrypted.");
});

document.getElementById("account-erase").addEventListener("click", async function () {
  if (!window.confirm("Erase the account on this browser? DTRT Lab cannot restore it.")) return;
  await eraseAccount();
  await renderStored();
  renderPolls();
  setStatus(els.accountStatus, "Erased from this browser.");
});
