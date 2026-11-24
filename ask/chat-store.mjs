// Local chat ownership and delete tombstones. No network and no DOM.

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function ownedChat(chat, email) {
  const next = Object.assign({}, chat);
  const owner = normalizeEmail(email);
  if (owner) next.owner = owner;
  else if (!next.owner) next.owner = "";
  return next;
}

export function splitForAccount(chats, email) {
  const owner = normalizeEmail(email);
  const mine = [];
  const held = [];
  (chats || []).forEach((chat) => {
    if (!chat || !chat.id) return;
    const chatOwner = normalizeEmail(chat.owner);
    if (owner && chatOwner === owner) mine.push(chat);
    else held.push(chat);
  });
  return { mine, held };
}

export function chatsToUpload(mine, remoteIds) {
  const seen = remoteIds instanceof Set ? remoteIds : new Set(remoteIds || []);
  return (mine || []).filter((chat) => chat && chat.id && !seen.has(chat.id) && chat.messages && chat.messages.length);
}

export function hideDeleted(chats, tombstones) {
  const ids = new Set((tombstones || []).map((item) => item && item.id).filter(Boolean));
  return (chats || []).filter((chat) => chat && !ids.has(chat.id));
}

export function noteDelete(tombstones, id) {
  const list = Array.isArray(tombstones) ? tombstones.slice() : [];
  if (!list.some((item) => item && item.id === id)) list.push({ id: id, attempts: 0 });
  return list;
}

export function recordDeleteResult(tombstones, id, ok) {
  const list = Array.isArray(tombstones) ? tombstones : [];
  if (ok) return list.filter((item) => item && item.id !== id);
  return list.map((item) => {
    if (!item || item.id !== id) return item;
    return { id: id, attempts: (item.attempts || 0) + 1 };
  });
}

export function deleteStatus(tombstones) {
  const worst = (tombstones || []).reduce((count, item) => Math.max(count, item && item.attempts ? item.attempts : 0), 0);
  if (!worst) return "";
  return "That chat is hidden here, but the account copy could not be deleted. Try again.";
}

export function quarantineStatus(held) {
  const foreign = (held || []).filter((chat) => normalizeEmail(chat && chat.owner));
  if (!foreign.length) return "";
  return "Chats from another account on this browser were not added to this login.";
}

export const STORE_KEY = "dtrt.chat.v1";

export function readStore(raw) {
  let data = null;
  try { data = JSON.parse(raw || "null"); }
  catch (err) { data = null; }
  if (!data || !Array.isArray(data.chats)) {
    return { chats: [], held: [], tombstones: [], activeId: "", owner: "" };
  }
  const storedOwner = normalizeEmail(data.owner);
  const tombstones = Array.isArray(data.tombstones) ? data.tombstones : [];
  const chats = data.chats.map((chat) => {
    if (chat && !chat.owner && storedOwner) return ownedChat(chat, storedOwner);
    return chat;
  });
  return {
    chats: hideDeleted(chats, tombstones),
    held: Array.isArray(data.held) ? data.held : [],
    tombstones: tombstones,
    activeId: data.activeId || "",
    owner: storedOwner
  };
}

export function keepAfterExpiredSession(store) {
  return {
    chats: store.chats || [],
    held: store.held || [],
    tombstones: store.tombstones || [],
    activeId: store.activeId || "",
    owner: store.owner || "",
    user: null
  };
}

export function syncOnLogin(store, email, remoteChats) {
  const all = (store.chats || []).concat(store.held || []);
  const split = splitForAccount(all, email);
  const remote = hideDeleted(remoteChats || [], store.tombstones);
  const localById = new Map(split.mine.map((chat) => [chat.id, chat]));
  const seen = new Set();
  const visible = [];
  const puts = [];
  remote.forEach((chat) => {
    seen.add(chat.id);
    const local = localById.get(chat.id);
    const serverMessages = chat.messages || [];
    const localMessages = local && local.messages ? local.messages : [];
    const messages = localMessages.length > serverMessages.length ? localMessages : serverMessages;
    const next = ownedChat({
      id: chat.id,
      title: chat.title || (local && local.title) || "Chat",
      messages: messages,
      updatedAt: chat.updatedAt
    }, email);
    visible.push(next);
    if (messages.length > serverMessages.length) puts.push(next);
  });
  split.mine.forEach((local) => {
    if (!seen.has(local.id)) visible.push(ownedChat(local, email));
  });
  const shown = hideDeleted(visible, store.tombstones);
  const remoteIds = new Set(remote.map((chat) => chat.id));
  chatsToUpload(shown, remoteIds).forEach((chat) => {
    if (!puts.some((item) => item.id === chat.id)) puts.push(chat);
  });
  return {
    email: normalizeEmail(email),
    visible: shown,
    held: split.held,
    puts: puts,
    tombstones: store.tombstones || [],
    status: quarantineStatus(split.held)
  };
}

export function applyDelete(store, id, statusCode) {
  const chats = (store.chats || []).filter((chat) => chat.id !== id);
  const held = (store.held || []).filter((chat) => chat.id !== id);
  let tombstones = noteDelete(store.tombstones, id);
  let error = "";
  if (statusCode != null) {
    const ok = statusCode === 200 || statusCode === 204 || statusCode === 404;
    tombstones = recordDeleteResult(tombstones, id, ok);
    error = ok ? "" : deleteStatus(tombstones);
  }
  const visible = hideDeleted(chats, tombstones);
  const activeId = store.activeId === id ? (visible[0] ? visible[0].id : "") : (store.activeId || "");
  return {
    store: { chats: visible, held: held, tombstones: tombstones, activeId: activeId, owner: store.owner || "" },
    visible: visible,
    error: error
  };
}
