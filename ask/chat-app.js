import { replyFor } from "./safety.mjs?v=20261122-ai8";
import { deviceCanRunModel, tryLocalModel } from "./model.js?v=20261122-ai1";

const STORE = "dtrt.chat.v1";
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
  stop: false
};

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!data || !Array.isArray(data.chats)) return;
    state.chats = data.chats;
    state.activeId = data.activeId || "";
  } catch (err) { /* ignore a broken local copy */ }
}

function saveLocal() {
  const data = JSON.stringify({ chats: state.chats, activeId: state.activeId });
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

function renderThread() {
  thread.replaceChildren();
  const chat = activeChat();
  const messages = chat ? chat.messages : [];
  stage.hidden = messages.length > 0;
  messages.forEach((message) => {
    const item = el("article", "msg " + (message.role === "user" ? "user" : "bot"));
    item.append(el("p", "", message.text));
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
  if (!chat) {
    chat = { id: newId(), title: question.replace(/\s+/g, " ").trim().slice(0, 80), messages: [], updatedAt: new Date().toISOString() };
    state.chats.unshift(chat);
    state.activeId = chat.id;
  }
  return chat;
}

async function persist(chat) {
  saveLocal();
  renderList();
  if (!state.user) return;
  const response = await fetch("/api/chats", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ id: chat.id, title: chat.title, messages: chat.messages })
  });
  if (!response.ok) setStatus("Could not save to your account. A copy is in this browser.");
}

async function deleteChat(id) {
  state.chats = state.chats.filter((chat) => chat.id !== id);
  if (state.activeId === id) state.activeId = state.chats[0] ? state.chats[0].id : "";
  saveLocal();
  renderList();
  renderThread();
  if (!state.user) return;
  await fetch("/api/chats?id=" + encodeURIComponent(id), { method: "DELETE", credentials: "same-origin" });
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
  chat.messages.push({ role: "user", text: question });
  renderThread();
  state.sending = true;
  state.stop = false;
  send.textContent = "Stop";
  send.setAttribute("aria-label", "Stop");
  const canModel = deviceCanRunModel();
  setStatus(canModel ? "Running a small open model in this browser." : "This device is using the public pages. No paid model is connected.");
  const item = el("article", "msg bot");
  const paragraph = el("p", "");
  item.append(paragraph);
  thread.append(item);
  let result;
  try {
    result = await replyFor(question, window.DTRT_ASK_CORPUS || { passages: [] }, {
      search: (q, corpus) => window.DTRTAsk ? window.DTRTAsk.search(q, corpus, 4) : [],
      tryModel: canModel ? tryLocalModel : null
    });
  } catch (err) {
    result = { text: "The search on this page did not finish. The public pages are still linked from the home page.", sources: [] };
  }
  if (result.action === "pages" && result.modelCalled) {
    setStatus("A small open model did not finish. This answer is from the public pages.");
  } else if (result.action === "pages") {
    setStatus("From the public pages. A small open model did not run. No paid model is connected.");
  } else if (result.action === "model") {
    setStatus("Ran in this browser. Very early AI test: answers can be wrong.");
  } else {
    setStatus("Very early AI test: answers can be wrong.");
  }
  await reveal(paragraph, result.text);
  addSources(result.sources);
  chat.messages.push({ role: "assistant", text: result.text });
  chat.updatedAt = new Date().toISOString();
  state.sending = false;
  send.textContent = "Send";
  send.setAttribute("aria-label", "Send");
  await persist(chat);
  renderThread();
  const saved = thread.querySelector(".msg.bot:last-of-type p");
  if (saved) saved.textContent = result.text;
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
    state.accounts = "guest";
    setStatus("Accounts are not connected on this host yet. This chat stays in this browser.");
    return;
  }
  if (response.status === 503) {
    state.accounts = "guest";
    const data = await readJson(response);
    if (data.guest) setStatus(data.error);
    return;
  }
  state.accounts = "ready";
  const data = await readJson(response);
  if (!response.ok || !data.ok) {
    state.user = null;
    accountOpen.textContent = "Sign up";
    renderList();
    if (response.status === 404 || data.guest) {
      state.accounts = "guest";
    }
    return;
  }
  state.user = { email: data.email, displayName: data.displayName || "" };
  accountOpen.textContent = state.user.displayName || state.user.email;
  const chats = await fetch("/api/chats", { credentials: "same-origin" });
  if (chats.ok) {
    const body = await readJson(chats);
    if (Array.isArray(body.chats) && body.chats.length) {
      state.chats = body.chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        messages: chat.messages || [],
        updatedAt: chat.updatedAt
      }));
      if (!state.chats.some((chat) => chat.id === state.activeId)) state.activeId = state.chats[0].id;
    } else if (state.chats.length) {
      for (const chat of state.chats) {
        if (chat.messages && chat.messages.length) await persist(chat);
      }
    }
  }
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

async function submitAuth(url, email, password) {
  authStatus.textContent = "";
  if (state.accounts === "guest") {
    authStatus.textContent = "Accounts are not connected on this host yet. The chat still works in this browser.";
    return;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password })
  });
  const data = await readJson(response);
  if (response.status === 503 && data.guest) {
    state.accounts = "guest";
    authMessage(data, "Accounts are not connected on this host yet.");
    return;
  }
  if (!response.ok) {
    authMessage(data, "That did not work.");
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
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  state.user = null;
  accountOpen.textContent = "Sign up";
  accountDialog.close();
  renderList();
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
