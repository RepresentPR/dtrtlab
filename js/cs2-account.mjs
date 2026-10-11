/**
 * Account vault. The password and private key never leave this browser.
 * The server only ever receives the public key, the display name, and signatures.
 */

const DB_NAME = "dtrt-cs2-vault";
const STORE = "vault";
const RECORD = "account";
const PROVIDER_STORE = "providers";
const KDF_ITERATIONS = 120000;
const PROVIDERS = ["grok", "chatgpt", "grok-bot", "cursor", "claude"];

let session = null;

export function currentAccount() {
  if (!session) return null;
  return { name: session.name, thumb: session.thumb, publicJwk: session.publicJwk };
}

export async function createAccount(name, password) {
  const clean = cleanName(name);
  if (password.length < 8) throw new Error("Use at least 8 characters. This password cannot be reset.");
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  delete publicJwk.key_ops;
  delete publicJwk.ext;
  const thumb = await thumbprint(publicJwk);
  const packed = await seal(pair.privateKey, password);
  await writeRecord({
    name: clean,
    publicJwk: publicOnly(publicJwk),
    thumb: thumb,
    salt: packed.salt,
    iv: packed.iv,
    ciphertext: packed.ciphertext,
  });
  session = {
    name: clean,
    thumb: thumb,
    publicJwk: publicOnly(publicJwk),
    privateKey: pair.privateKey,
    wrapping: packed.wrapping,
  };
  return currentAccount();
}

export async function unlockAccount(password) {
  const record = await readRecord();
  if (!record) throw new Error("No account on this browser yet.");
  let privateKey;
  try {
    privateKey = await open(record, password);
  } catch (err) {
    throw new Error("That password does not open this account.");
  }
  session = {
    name: record.name,
    thumb: record.thumb,
    publicJwk: record.publicJwk,
    privateKey: privateKey.privateKey,
    wrapping: privateKey.wrapping,
  };
  return currentAccount();
}

export async function storedAccount() {
  const record = await readRecord();
  if (!record) return null;
  return { name: record.name, thumb: record.thumb };
}

export function lockAccount() {
  session = null;
}

export async function attachProvider(provider, apiKey) {
  const id = String(provider || "").trim().toLowerCase();
  if (id.indexOf("local") !== -1 || PROVIDERS.indexOf(id) === -1) {
    throw new Error("Attach Grok, ChatGPT, Grok bot, Cursor, or Claude. Local agents are not allowed.");
  }
  if (!session || !session.wrapping) throw new Error("Sign in first.");
  const key = String(apiKey || "");
  if (key.length < 8) throw new Error("Paste the key from that provider. It stays on this device.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    session.wrapping,
    new TextEncoder().encode(key)
  );
  const db = await openDb();
  await new Promise(function (resolve, reject) {
    const tx = db.transaction(PROVIDER_STORE, "readwrite");
    tx.oncomplete = function () {
      resolve();
    };
    tx.onerror = function () {
      reject(tx.error);
    };
    tx.objectStore(PROVIDER_STORE).put(
      { iv: [...iv], ciphertext: [...new Uint8Array(ciphertext)] },
      id
    );
  });
  db.close();
  return id;
}

export async function attachedProviders() {
  const db = await openDb();
  const keys = await new Promise(function (resolve, reject) {
    const tx = db.transaction(PROVIDER_STORE, "readonly");
    const req = tx.objectStore(PROVIDER_STORE).getAllKeys();
    req.onsuccess = function () {
      resolve(req.result || []);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
  db.close();
  return keys.map(String);
}

export async function eraseAccount() {
  session = null;
  const db = await openDb();
  await new Promise(function (resolve, reject) {
    const tx = db.transaction([STORE, PROVIDER_STORE], "readwrite");
    tx.oncomplete = function () {
      resolve();
    };
    tx.onerror = function () {
      reject(tx.error);
    };
    tx.objectStore(STORE).delete(RECORD);
    tx.objectStore(PROVIDER_STORE).clear();
  });
  db.close();
}

export async function signText(text) {
  if (!session) throw new Error("Sign in first.");
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    session.privateKey,
    new TextEncoder().encode(text)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export function publicOnly(jwk) {
  return { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y };
}

export async function thumbprint(jwk) {
  const canonical = JSON.stringify({ crv: "P-256", kty: "EC", x: jwk.x, y: jwk.y });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map(hex).join("").slice(0, 16);
}

export function cleanName(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,22}$/.test(clean)) {
    throw new Error("Use 2–23 letters, numbers, spaces, dots, or hyphens.");
  }
  return clean;
}

async function seal(privateKey, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapping = await derive(password, salt);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, wrapping, pkcs8);
  return {
    salt: [...salt],
    iv: [...iv],
    ciphertext: [...new Uint8Array(ciphertext)],
    wrapping: wrapping,
  };
}

async function open(record, password) {
  const wrapping = await derive(password, new Uint8Array(record.salt));
  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(record.iv) },
    wrapping,
    new Uint8Array(record.ciphertext)
  );
  const privateKey = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  return { privateKey: privateKey, wrapping: wrapping };
}

async function derive(password, salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: KDF_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function openDb() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      if (!req.result.objectStoreNames.contains(PROVIDER_STORE)) req.result.createObjectStore(PROVIDER_STORE);
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function readRecord() {
  return openDb().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(RECORD);
      req.onsuccess = function () {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = function () {
        db.close();
        reject(req.error);
      };
    });
  });
}

function writeRecord(record) {
  return openDb().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = function () {
        db.close();
        resolve();
      };
      tx.onerror = function () {
        db.close();
        reject(tx.error);
      };
      tx.objectStore(STORE).put(record, RECORD);
    });
  });
}

function hex(n) {
  return n.toString(16).padStart(2, "0");
}
