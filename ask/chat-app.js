import { replyFor, CRISIS_REPLY, OTHER_HELP_LINE, REDIRECT, RESOURCE_NOTE, SUGGESTIONS, ERROR_REPLY } from "./safety.mjs?v=20261127-ask51";
import { classifyCrisis } from "../js/safety-core.mjs?v=20261127-ask51";
import { normalizeEmail, ownedChat, syncOnLogin, applyDelete, keepAfterExpiredSession, deleteStatus, recordDeleteResult, readStore, logoutStore, STORE_KEY } from "./chat-store.mjs?v=20261127-ask51";

const STORE = STORE_KEY;
const NOTICE = "dtrt.early-notice";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const side = document.getElementById("side");
const list = document.getElementById("chat-list");
const sideLabel = document.getElementById("side-label");
const thread = document.getElementById("thread");
const stage = document.getElementById("stage");
const form = document.getElementById("composer-form");
const composer = document.getElementById("composer");
const send = document.getElementById("send");
const status = document.getElementById("chat-status");
const accountOpen = document.getElementById("account-open");
const accountDialog = document.getElementById("account-dialog");
const earlyNotice = document.getElementById("early-notice");
const authStatus = document.getElementById("auth-status");
const accountMode = document.getElementById("account-mode");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const sessionBox = document.getElementById("session-box");
const displayName = document.getElementById("display-name");

const state = {
  chats: [],
  activeId: "",
  user: null,
  accounts: "unknown",
  sending: false,
  stop: false,
  held: [],
  tombstones: [],
  accountOwner: ""
};

function snapshot() {
  return {
    chats: state.chats,
    held: state.held,
    tombstones: state.tombstones,
    activeId: state.activeId,
    owner: state.accountOwner
  };
}

function applySnapshot(next) {
  state.chats = next.chats || [];
  state.held = next.held || [];
  state.tombstones = next.tombstones || [];
  if (next.activeId != null) state.activeId = next.activeId;
  if (next.owner != null) state.accountOwner = next.owner;
}

function loadLocal() {
  try {
    const data = readStore(localStorage.getItem(STORE));
    if (!data.chats.length && !data.held.length && !data.tombstones.length) return;
    applySnapshot(data);
  } catch (err) { /* ignore a broken local copy */ }
}

function saveLocal() {
  const data = JSON.stringify({
    chats: state.chats,
    held: state.held,
    tombstones: state.tombstones,
    activeId: state.activeId,
    owner: state.user ? normalizeEmail(state.user.email) : ""
  });
  try { localStorage.setItem(STORE, data); }
  catch (err) { /* private mode can refuse storage */ }
}

function activeChat() {
  return state.chats.find((chat) => chat.id === state.activeId) || null;
}

function setStatus(text) {
  status.textContent = text || "";
}

function safePath(url) {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

async function reveal(node, text) {
  if (reduce) {
    node.textContent = text;
    return;
  }
  node.textContent = "";
  const parts = String(text).split(/(\s+)/);
  for (const part of parts) {
    if (state.stop) {
      node.textContent = text;
      return;
    }
    node.textContent += part;
    thread.scrollTop = thread.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
}

function viewOf(message) {
  if (message.kind === "crisis" || message.kind === "sheet") return "crisis";
  if (message.kind === "closed") return "closed";
  const text = message.text || "";
  if (text.indexOf(REDIRECT) === 0 && text.indexOf("call or text 988") !== -1) return "closed";
  if (text === CRISIS_REPLY) return "crisis";
  return "text";
}

function appendChips(item, labels) {
  const row = el("div", "help-chips");
  labels.forEach((label) => {
    const button = el("button", "chip", label);
    button.type = "button";
    button.addEventListener("click", () => {
      composer.value = label;
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
    row.append(button);
  });
  item.append(row);
}

function appendAnswer(item, message) {
  const view = viewOf(message);
  if (view === "text") {
    item.append(el("p", "", message.text));
    return;
  }
  if (view === "closed") {
    item.append(el("p", "help-redirect", message.line || REDIRECT));
    const block = el("div", "help-compact");
    block.append(el("p", "", message.sheet || RESOURCE_NOTE));
    item.append(block);
    appendChips(item, message.suggestions && message.suggestions.length ? message.suggestions : SUGGESTIONS);
    return;
  }
  const card = el("div", "help-card");
  card.append(el("p", "", message.text));
  item.append(card);
}

function renderThread() {
  thread.replaceChildren();
  const chat = activeChat();
  const messages = chat ? chat.messages : [];
  stage.hidden = messages.length > 0;
  messages.forEach((message) => {
    const item = el("article", "msg " + (message.role === "user" ? "user" : "bot"));
    if (message.role === "user") item.append(el("p", "", message.text));
    else appendAnswer(item, message);
    thread.append(item);
  });
  thread.scrollTop = thread.scrollHeight;
}

function renderList() {
  list.replaceChildren();
  sideLabel.textContent = state.user ? "Saved to your account" : "On this device";
  state.chats.forEach((chat) => {
    const row = el("div", "chat-row");
    const button = el("button", "chat-open", chat.title || "Chat");
    button.type = "button";
    if (chat.id === state.activeId) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      state.activeId = chat.id;
      saveLocal();
      renderList();
      renderThread();
      closeSide();
    });
    const remove = el("button", "chat-delete", "Delete");
    remove.type = "button";
    remove.addEventListener("click", () => deleteChat(chat.id));
    row.append(button, remove);
    list.append(row);
  });
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "chat-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function ensureChat(question) {
  let chat = activeChat();
  const me = state.user ? normalizeEmail(state.user.email) : "";
  if (chat && normalizeEmail(chat.owner) !== me) chat = null;
  if (!chat) {
    chat = ownedChat({
      id: newId(),
      title: question.replace(/\s+/g, " ").trim().slice(0, 80),
      messages: [],
      updatedAt: new Date().toISOString()
    }, state.user ? state.user.email : "");
    state.chats.unshift(chat);
    state.activeId = chat.id;
  }
  return chat;
}

async function persist(chat) {
  saveLocal();
  renderList();
  if (!state.user) return;
  if (normalizeEmail(chat.owner) !== normalizeEmail(state.user.email)) return;
  const response = await fetch("/api/chats", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ id: chat.id, title: chat.title, messages: chat.messages })
  });
  if (!response.ok) {
    const body = await readJson(response);
    setStatus(body.error || "Could not save to your account. A copy is in this browser.");
    return;
  }
  const body = await readJson(response);
  if (body.warn) setStatus(body.warn);
}

async function retryDeletes() {
  const pending = (state.tombstones || []).slice();
  let tombstones = state.tombstones || [];
  for (const item of pending) {
    let ok = false;
    try {
      const response = await fetch("/api/chats?id=" + encodeURIComponent(item.id), { method: "DELETE", credentials: "same-origin" });
      ok = response.ok || response.status === 404;
    } catch (err) {
      ok = false;
    }
    tombstones = recordDeleteResult(tombstones, item.id, ok);
  }
  state.tombstones = tombstones;
  saveLocal();
  const message = deleteStatus(state.tombstones);
  if (message) setStatus(message);
}

async function deleteChat(id) {
  const hidden = applyDelete(snapshot(), id, null);
  applySnapshot(hidden.store);
  saveLocal();
  renderList();
  renderThread();
  if (!state.user) return;
  let statusCode = 0;
  try {
    const response = await fetch("/api/chats?id=" + encodeURIComponent(id), { method: "DELETE", credentials: "same-origin" });
    statusCode = response.status;
  } catch (err) {
    statusCode = 0;
  }
  const result = applyDelete(snapshot(), id, statusCode);
  applySnapshot(result.store);
  saveLocal();
  renderList();
  renderThread();
  if (result.error) setStatus(result.error);
}

function addSources(sources) {
  const links = (sources || []).map((item) => item.passage || item).filter((passage) => passage && passage.url);
  if (!links.length) return;
  const nav = el("nav", "sources");
  nav.setAttribute("aria-label", "Public pages used");
  links.slice(0, 3).forEach((passage) => {
    const link = el("a", "", passage.title || passage.url);
    link.href = safePath(passage.url);
    nav.append(link);
  });
  const last = thread.lastElementChild;
  if (last) last.append(nav);
}

async function ask(question) {
  const chat = ensureChat(question);
  const history = chat.messages.filter((message) => message.role === "user").map((message) => message.text);
  chat.messages.push({ role: "user", text: question });
  renderThread();
  state.sending = true;
  state.stop = false;
  send.textContent = "Stop";
  send.setAttribute("aria-label", "Stop");
  setStatus("From DTRT Lab's public pages.");
  const item = el("article", "msg bot");
  thread.append(item);
  let result;
  try {
    const tier = classifyCrisis(question, history);
    if (tier === "tier1") {
      result = {
        action: "crisis",
        text: CRISIS_REPLY + "\n\n" + OTHER_HELP_LINE,
        modelCalled: false,
        sources: []
      };
    } else {
      result = await replyFor(question, window.DTRT_ASK_CORPUS || { passages: [] }, {
        history,
        search: (q, corpus) => window.DTRTAsk ? window.DTRTAsk.search(q, corpus, 4) : []
      });
    }
  } catch (err) {
    result = { action: "error", text: ERROR_REPLY, sources: [] };
  }
  if (result.action === "pages") setStatus("From DTRT Lab's public pages. Very early AI test: answers can be wrong.");
  else setStatus("Very early AI test: answers can be wrong.");
  const saved = {
    role: "assistant",
    text: result.text,
    kind: result.action || "",
    sheet: result.sheet || "",
    line: result.line || ""
  };
  if (viewOf(saved) === "text") {
    const paragraph = el("p", "");
    item.append(paragraph);
    await reveal(paragraph, result.text);
  } else appendAnswer(item, saved);
  addSources(result.sources);
  chat.messages.push(saved);
  chat.updatedAt = new Date().toISOString();
  state.sending = false;
  send.textContent = "Send";
  send.setAttribute("aria-label", "Send");
  await persist(chat);
  renderThread();
  addSources(result.sources);
}

function closeSide() {
  side.classList.remove("open");
  document.getElementById("side-toggle").setAttribute("aria-expanded", "false");
}

function showAccount(mode) {
  accountMode.hidden = false;
  signupForm.hidden = mode !== "signup";
  loginForm.hidden = mode !== "login";
  sessionBox.hidden = true;
  accountDialog.showModal();
}

function showSession() {
  accountMode.hidden = true;
  sessionBox.hidden = false;
  document.getElementById("session-email").textContent = state.user.email;
  displayName.value = state.user.displayName || "";
  accountOpen.textContent = state.user.displayName || state.user.email;
  accountDialog.showModal();
}

async function readJson(response) {
  try { return await response.json(); }
  catch (err) { return {}; }
}

function authMessage(data, fallback) {
  authStatus.textContent = data && data.error ? data.error : fallback;
}

async function refreshSession() {
  let response;
  try {
    response = await fetch("/api/session", { credentials: "same-origin" });
  } catch (err) {
    setStatus("Could not reach accounts. Try again. The chat still works in this browser.");
    return;
  }
  const data = await readJson(response);
  if (response.status === 503 && data.guest) {
    setStatus(data.error || "Accounts are not connected on this host yet. The chat still works in this browser.");
    return;
  }
  if (!response.ok || !data.ok) {
    if (state.user) {
      const email = normalizeEmail(state.user.email);
      state.accountOwner = email;
      state.chats = state.chats.map((chat) => chat && chat.owner ? chat : ownedChat(chat, email));
    }
    const kept = keepAfterExpiredSession(snapshot());
    state.user = null;
    applySnapshot(kept);
    saveLocal();
    accountOpen.textContent = "Sign up";
    renderList();
    renderThread();
    return;
  }
  let remote = [];
  let chatsOk = false;
  try {
    const chats = await fetch("/api/chats", { credentials: "same-origin" });
    chatsOk = chats.ok;
    if (chats.ok) {
      const body = await readJson(chats);
      remote = Array.isArray(body.chats) ? body.chats : [];
    }
  } catch (err) {
    chatsOk = false;
  }
  const synced = syncOnLogin(snapshot(), data.email, remote);
  state.user = { email: data.email, displayName: data.displayName || "" };
  state.accountOwner = normalizeEmail(data.email);
  accountOpen.textContent = state.user.displayName || state.user.email;
  state.chats = synced.visible;
  state.held = synced.held;
  state.tombstones = synced.tombstones;
  if (!state.chats.some((chat) => chat.id === state.activeId)) state.activeId = state.chats[0] ? state.chats[0].id : "";
  if (chatsOk) {
    for (const local of synced.puts) await persist(local);
    await retryDeletes();
  }
  if (!chatsOk) setStatus("Could not load saved chats. Threads already on this browser were not added to this login.");
  else if (synced.status && !deleteStatus(state.tombstones)) setStatus(synced.status);
  saveLocal();
  renderList();
  renderThread();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.sending) {
    state.stop = true;
    return;
  }
  const question = composer.value.trim();
  if (!question) {
    composer.focus();
    return;
  }
  composer.value = "";
  composer.style.height = "auto";
  ask(question);
});

composer.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

composer.addEventListener("input", () => {
  composer.style.height = "auto";
  composer.style.height = Math.min(composer.scrollHeight, 140) + "px";
});

document.getElementById("new-chat").addEventListener("click", () => {
  state.activeId = "";
  saveLocal();
  renderList();
  renderThread();
  closeSide();
  composer.focus();
});

document.getElementById("side-toggle").addEventListener("click", () => {
  const open = side.classList.toggle("open");
  document.getElementById("side-toggle").setAttribute("aria-expanded", open ? "true" : "false");
});

accountOpen.addEventListener("click", () => {
  authStatus.textContent = "";
  if (state.user) showSession();
  else showAccount("signup");
});

document.getElementById("show-login").addEventListener("click", () => showAccount("login"));
document.getElementById("show-signup").addEventListener("click", () => showAccount("signup"));

function clearLocalChats() {
  const loggedOut = logoutStore(snapshot());
  state.user = null;
  state.accountOwner = "";
  applySnapshot(loggedOut);
  saveLocal();
  accountOpen.textContent = "Sign up";
  renderList();
  renderThread();
}

async function submitAuth(url, email, password) {
  authStatus.textContent = "";
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password })
    });
  } catch (err) {
    authStatus.textContent = "Could not reach accounts. Try again. The chat still works in this browser.";
    return;
  }
  const data = await readJson(response);
  if (response.status === 503 && data.guest) {
    authMessage(data, "Accounts are not connected on this host yet. Try again later.");
    return;
  }
  if (!response.ok) {
    authMessage(data, "That did not work.");
    return;
  }
  if (data.message && !data.email) {
    authStatus.textContent = data.message;
    showAccount("login");
    return;
  }
  accountDialog.close();
  await refreshSession();
}

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const again = document.getElementById("signup-again").value;
  if (password !== again) {
    authStatus.textContent = "Those passwords do not match.";
    return;
  }
  submitAuth("/api/signup", email, password);
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth("/api/login", document.getElementById("login-email").value, document.getElementById("login-password").value);
});

document.getElementById("logout").addEventListener("click", async () => {
  try { await fetch("/api/logout", { method: "POST", credentials: "same-origin" }); }
  catch (err) { /* still clear this browser */ }
  clearLocalChats();
  accountDialog.close();
});

document.getElementById("save-name").addEventListener("click", async () => {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ displayName: displayName.value })
  });
  const data = await readJson(response);
  if (response.ok && state.user) {
    state.user.displayName = data.displayName || "";
    accountOpen.textContent = state.user.displayName || state.user.email;
    authStatus.textContent = "Saved.";
  } else authMessage(data, "Settings were not saved.");
});

document.getElementById("delete-account").addEventListener("click", async () => {
  const yes = document.getElementById("delete-confirm");
  if (!yes.checked) {
    authStatus.textContent = "Tick the box to delete the account and its chats.";
    return;
  }
  const response = await fetch("/api/account", { method: "DELETE", credentials: "same-origin" });
  if (response.ok) {
    state.user = null;
    state.chats = [];
    state.tombstones = [];
    state.activeId = "";
    saveLocal();
    accountOpen.textContent = "Sign up";
    accountDialog.close();
    renderList();
    renderThread();
    setStatus("The account and its saved chats were deleted.");
  } else {
    const data = await readJson(response);
    authMessage(data, "The account was not deleted.");
  }
});

document.getElementById("close-account").addEventListener("click", () => accountDialog.close());
document.getElementById("close-notice").addEventListener("click", () => {
  try { localStorage.setItem(NOTICE, "1"); }
  catch (err) { /* still hide the notice */ }
  if (earlyNotice) earlyNotice.hidden = true;
  composer.focus();
});

loadLocal();
renderList();
renderThread();

const seenNotice = (() => {
  try { return localStorage.getItem(NOTICE) === "1"; }
  catch (err) { return false; }
})();
if (earlyNotice && seenNotice && location.hash !== "#notice") earlyNotice.hidden = true;
if (location.hash === "#signup") showAccount("signup");

refreshSession();
