// Account store for the public chat.
// Passwords are hashed with PBKDF2-SHA-256 and a per-user salt.
// Session cookies hold a random token. Only the token hash is stored.
// Nothing in this file writes a password to a log.

export const ITERATIONS = 210000;
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
export const ATTEMPT_LIMIT = 8;
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const COOKIE = "dtrt_session";

function json(data, status, headers) {
  const head = new Headers(headers || {});
  head.set("content-type", "application/json; charset=utf-8");
  head.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { status, headers: head });
}

export function accountsOffline() {
  return json({
    ok: false,
    guest: true,
    error: "Accounts are not connected on this host yet. The chat still works in this browser."
  }, 503);
}

function bytesToB64(bytes) {
  let raw = "";
  for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
  return btoa(raw);
}

function b64ToBytes(text) {
  const raw = atob(text);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function hex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(left, right) {
  const a = String(left);
  const b = String(right);
  const length = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function hashPassword(password, salt, iterations) {
  const subtle = crypto.subtle;
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt,
    iterations: iterations || ITERATIONS
  }, key, 256);
  return bytesToB64(new Uint8Array(bits));
}

export async function verifyPassword(password, saltB64, expected, iterations) {
  const actual = await hashPassword(password, b64ToBytes(saltB64), iterations || ITERATIONS);
  return safeEqual(actual, expected);
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text)));
  return hex(new Uint8Array(digest));
}

function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

export function readCookie(header, name) {
  const parts = String(header || "").split(";");
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); }
      catch (err) { return ""; }
    }
  }
  return "";
}

function cookie(token, request, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return COOKIE + "=" + encodeURIComponent(token) + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + maxAge + secure;
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "0";
}

async function readJson(request, limit) {
  const text = await request.text();
  if (text.length > limit) return { error: "too-large" };
  try { return { value: JSON.parse(text) }; }
  catch (err) { return { error: "bad-json" }; }
}

function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

function cleanName(value) {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
}

export async function rateLimited(db, bucket, now) {
  const row = await db.prepare(
    "SELECT count, window_start FROM login_attempts WHERE bucket = ?"
  ).bind(bucket).first();
  if (!row || now - Number(row.window_start) > ATTEMPT_WINDOW_MS) {
    await db.prepare(
      "INSERT INTO login_attempts (bucket, count, window_start) VALUES (?, ?, ?) ON CONFLICT(bucket) DO UPDATE SET count = 1, window_start = excluded.window_start"
    ).bind(bucket, 1, now).run();
    return false;
  }
  if (Number(row.count) >= ATTEMPT_LIMIT) return true;
  await db.prepare(
    "UPDATE login_attempts SET count = ? WHERE bucket = ?"
  ).bind(Number(row.count) + 1, bucket).run();
  return false;
}

async function attemptBucket(request, email, action) {
  return sha256([action, clientIp(request).split(",")[0].trim(), email].join("\n"));
}

async function issueSession(db, request, userId) {
  const token = newToken();
  const tokenHash = await sha256(token);
  const expires = Date.now() + SESSION_MS;
  await db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  ).bind(tokenHash, userId, expires).run();
  return { token, expires };
}

export async function userFromRequest(db, request) {
  const token = readCookie(request.headers.get("cookie"), COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await db.prepare(
    "SELECT s.user_id, s.expires_at, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?"
  ).bind(tokenHash).first();
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }
  return { id: row.user_id, email: row.email, tokenHash };
}

function withSession(request, token) {
  return { "set-cookie": cookie(token, request, Math.floor(SESSION_MS / 1000)) };
}

function cleared(request) {
  return { "set-cookie": cookie("", request, 0) };
}

export async function handleSignup(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  const db = context.env.DB;
  const parsed = await readJson(context.request, 4000);
  if (parsed.error) return json({ ok: false, error: "Enter an email and a password." }, 400);
  const email = cleanEmail(parsed.value.email);
  const password = String(parsed.value.password || "");
  if (!email || password.length < 10 || password.length > 200) {
    return json({ ok: false, error: "Use a valid email and a password of at least 10 characters." }, 400);
  }
  try {
    const bucket = await attemptBucket(context.request, email, "signup");
    if (await rateLimited(db, bucket, Date.now())) {
      return json({ ok: false, error: "Too many tries. Wait a few minutes and try again." }, 429);
    }
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return json({ ok: false, error: "That email already has an account. Log in instead." }, 409);
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const hash = await hashPassword(password, salt, ITERATIONS);
    const id = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO users (id, email, salt, hash, iterations, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, email, bytesToB64(salt), hash, ITERATIONS, new Date().toISOString()).run();
    const session = await issueSession(db, context.request, id);
    return json({ ok: true, email }, 201, withSession(context.request, session.token));
  } catch (err) {
    return accountsOffline();
  }
}

export async function handleLogin(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  const db = context.env.DB;
  const parsed = await readJson(context.request, 4000);
  if (parsed.error) return json({ ok: false, error: "Email or password is wrong." }, 400);
  const email = cleanEmail(parsed.value.email);
  const password = String(parsed.value.password || "");
  if (!email || !password) return json({ ok: false, error: "Email or password is wrong." }, 401);
  try {
    const bucket = await attemptBucket(context.request, email, "login");
    if (await rateLimited(db, bucket, Date.now())) {
      return json({ ok: false, error: "Too many tries. Wait a few minutes and try again." }, 429);
    }
    const user = await db.prepare(
      "SELECT id, email, salt, hash, iterations FROM users WHERE email = ?"
    ).bind(email).first();
    const salt = user ? user.salt : bytesToB64(new Uint8Array(16));
    const iterations = user ? Number(user.iterations) : ITERATIONS;
    const hash = user ? user.hash : bytesToB64(new Uint8Array(32));
    const match = await verifyPassword(password, salt, hash, iterations);
    if (!user || !match) return json({ ok: false, error: "Email or password is wrong." }, 401);
    const session = await issueSession(db, context.request, user.id);
    return json({ ok: true, email: user.email }, 200, withSession(context.request, session.token));
  } catch (err) {
    return accountsOffline();
  }
}

export async function handleLogout(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  try {
    const user = await userFromRequest(context.env.DB, context.request);
    if (user) {
      await context.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(user.tokenHash).run();
    }
    return json({ ok: true }, 200, cleared(context.request));
  } catch (err) {
    return accountsOffline();
  }
}

export async function handleSession(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  try {
    const user = await userFromRequest(context.env.DB, context.request);
    if (!user) return json({ ok: false }, 401);
    const settings = await context.env.DB.prepare(
      "SELECT prefs FROM settings WHERE user_id = ?"
    ).bind(user.id).first();
    let displayName = "";
    if (settings && settings.prefs) {
      try { displayName = cleanName(JSON.parse(settings.prefs).displayName); }
      catch (err) { displayName = ""; }
    }
    return json({ ok: true, email: user.email, displayName }, 200);
  } catch (err) {
    return accountsOffline();
  }
}

export async function handleDeleteAccount(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  const db = context.env.DB;
  try {
    const user = await userFromRequest(db, context.request);
    if (!user) return json({ ok: false, error: "Log in again before deleting the account." }, 401);
    await db.batch([
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
      db.prepare("DELETE FROM chats WHERE user_id = ?").bind(user.id),
      db.prepare("DELETE FROM settings WHERE user_id = ?").bind(user.id),
      db.prepare("DELETE FROM users WHERE id = ?").bind(user.id)
    ]);
    return json({ ok: true }, 200, cleared(context.request));
  } catch (err) {
    return accountsOffline();
  }
}

function cleanMessages(list) {
  if (!Array.isArray(list) || list.length > 40) return null;
  const messages = [];
  for (const item of list) {
    if (!item || (item.role !== "user" && item.role !== "assistant")) return null;
    const text = String(item.text || "").slice(0, 4000);
    if (!text) return null;
    messages.push({ role: item.role, text });
  }
  return messages;
}

export async function handleChats(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  const db = context.env.DB;
  try {
    const user = await userFromRequest(db, context.request);
    if (!user) return json({ ok: false }, 401);
    if (context.request.method === "GET") {
      const rows = await db.prepare(
        "SELECT id, title, messages, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC"
      ).bind(user.id).all();
      const chats = (rows.results || []).map((row) => {
        let messages = [];
        try { messages = JSON.parse(row.messages); }
        catch (err) { messages = []; }
        return { id: row.id, title: row.title, messages, updatedAt: row.updated_at };
      });
      return json({ ok: true, chats }, 200);
    }
    if (context.request.method === "DELETE") {
      const url = new URL(context.request.url);
      const id = String(url.searchParams.get("id") || "");
      if (!/^[0-9a-zA-Z-]{8,80}$/.test(id)) return json({ ok: false, error: "Unknown chat." }, 400);
      await db.prepare("DELETE FROM chats WHERE id = ? AND user_id = ?").bind(id, user.id).run();
      return json({ ok: true }, 200);
    }
    const parsed = await readJson(context.request, 120000);
    if (parsed.error) return json({ ok: false, error: "That chat could not be saved." }, 400);
    const id = String(parsed.value.id || "");
    if (!/^[0-9a-zA-Z-]{8,80}$/.test(id)) return json({ ok: false, error: "That chat could not be saved." }, 400);
    const messages = cleanMessages(parsed.value.messages);
    if (!messages || !messages.length) return json({ ok: false, error: "That chat could not be saved." }, 400);
    const count = await db.prepare("SELECT COUNT(*) AS n FROM chats WHERE user_id = ?").bind(user.id).first();
    const owned = await db.prepare("SELECT id FROM chats WHERE id = ? AND user_id = ?").bind(id, user.id).first();
    if (!owned && count && Number(count.n) >= 30) {
      return json({ ok: false, error: "This account has 30 saved chats. Delete one first." }, 400);
    }
    const other = await db.prepare("SELECT id FROM chats WHERE id = ? AND user_id != ?").bind(id, user.id).first();
    if (other) return json({ ok: false, error: "That chat could not be saved." }, 409);
    const title = String(parsed.value.title || messages[0].text).replace(/\s+/g, " ").trim().slice(0, 80) || "Chat";
    const updated = new Date().toISOString();
    await db.prepare(
      "INSERT INTO chats (id, user_id, title, messages, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages = excluded.messages, updated_at = excluded.updated_at WHERE chats.user_id = excluded.user_id"
    ).bind(id, user.id, title, JSON.stringify(messages), updated).run();
    return json({ ok: true, id, title, updatedAt: updated }, 200);
  } catch (err) {
    return accountsOffline();
  }
}

export async function handleSettings(context) {
  if (!context.env || !context.env.DB) return accountsOffline();
  const db = context.env.DB;
  try {
    const user = await userFromRequest(db, context.request);
    if (!user) return json({ ok: false }, 401);
    if (context.request.method === "GET") {
      const row = await db.prepare("SELECT prefs FROM settings WHERE user_id = ?").bind(user.id).first();
      let prefs = {};
      if (row && row.prefs) {
        try { prefs = JSON.parse(row.prefs); }
        catch (err) { prefs = {}; }
      }
      return json({ ok: true, displayName: cleanName(prefs.displayName) }, 200);
    }
    const parsed = await readJson(context.request, 4000);
    if (parsed.error) return json({ ok: false, error: "Settings were not saved." }, 400);
    const displayName = cleanName(parsed.value.displayName);
    await db.prepare(
      "INSERT INTO settings (user_id, prefs) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET prefs = excluded.prefs"
    ).bind(user.id, JSON.stringify({ displayName })).run();
    return json({ ok: true, displayName }, 200);
  } catch (err) {
    return accountsOffline();
  }
}
