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
  if (worst >= 3) return "That chat is hidden here, but the account copy could not be deleted. Try again.";
  return "That chat is hidden here. The delete will be tried again.";
}

export function quarantineStatus(held) {
  const foreign = (held || []).filter((chat) => normalizeEmail(chat && chat.owner));
  if (!foreign.length) return "";
  return "Chats from another account on this browser were not added to this login.";
}
