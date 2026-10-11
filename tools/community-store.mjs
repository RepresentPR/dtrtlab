/**
 * Public community board. Stores display names, votes, notes, and submitted
 * crosshair codes. Never accepts a password or a private key.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { decodeShareCode } from "../js/cs2-crosshair.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = process.env.COMMUNITY_DATA || path.join(ROOT, "data", "community.json");
const CS2_PATH = path.join(ROOT, "content", "cs2.json");
const CROSSHAIR_PATH = path.join(ROOT, "content", "crosshairs.json");
const CLIPS_PATH = path.join(ROOT, "content", "clips.js");

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _.-]{1,22}$/;
const TITLE_RE = /^[A-Za-z0-9][A-Za-z0-9 .'-]{1,39}$/;
const WINDOW_MS = 72 * 60 * 60 * 1000;
const PROVIDERS = {
  grok: "Grok",
  chatgpt: "ChatGPT",
  "grok-bot": "Grok bot",
  cursor: "Cursor",
  claude: "Claude",
};
const LOCAL_AGENTS = ["local", "ollama", "lmstudio", "llama", "openclaw", "localhost", "self-hosted"];

export function catalog() {
  const cs2 = JSON.parse(fs.readFileSync(CS2_PATH, "utf8"));
  const crosshairs = JSON.parse(fs.readFileSync(CROSSHAIR_PATH, "utf8"));
  const clipText = fs.readFileSync(CLIPS_PATH, "utf8");
  const clipIds = [...clipText.matchAll(/\{[^{}]*slug:\s*"([^"]+)"/g)].map(function (match) {
    return match[1];
  });
  const choices = {
    crosshairs: crosshairs.bench.map(function (item) {
      return item.id;
    }),
    maps: cs2.maps.map(function (item) {
      return item.id;
    }),
    queues: cs2.queues.map(function (item) {
      return item.id;
    }),
    clips: clipIds,
  };
  return { cs2, crosshairs, choices };
}

export function emptyState() {
  return { identities: {}, votes: {}, takes: [], submissions: [], tabs: [] };
}

export function loadState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    return {
      identities: parsed.identities || {},
      votes: parsed.votes || {},
      takes: Array.isArray(parsed.takes) ? parsed.takes : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      tabs: Array.isArray(parsed.tabs) ? parsed.tabs : [],
    };
  } catch (err) {
    if (err.code === "ENOENT") return emptyState();
    throw err;
  }
}

export function saveState(state) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const tmp = DATA_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_PATH);
}

export function publicBoard(now = Date.now()) {
  const { cs2, crosshairs, choices } = catalog();
  const state = loadState();
  const extra = state.submissions.map(function (item) {
    return item.id;
  });
  const allowed = {
    crosshair: choices.crosshairs.concat(extra),
    map: choices.maps,
    queue: choices.queues,
    clip: choices.clips,
  };
  const polls = cs2.polls.map(function (poll) {
    return {
      id: poll.id,
      question: poll.question,
      choices: (allowed[poll.id] || []).map(function (id) {
        return { id: id, label: labelFor(id, cs2, crosshairs, state), votes: 0, voters: [] };
      }),
    };
  });
  const byId = {};
  polls.forEach(function (poll) {
    byId[poll.id] = {};
    poll.choices.forEach(function (choice) {
      byId[poll.id][choice.id] = choice;
    });
  });
  Object.keys(state.votes).forEach(function (pollId) {
    const bucket = state.votes[pollId] || {};
    Object.keys(bucket).forEach(function (thumb) {
      const vote = bucket[thumb];
      const choice = byId[pollId] && byId[pollId][vote.choice];
      if (!choice) return;
      const person = state.identities[thumb];
      choice.votes += 1;
      if (person) choice.voters.push(person.name);
    });
  });
  const tabVotes = state.votes.tab || {};
  const tabs = state.tabs.map(function (tab) {
    const voters = [];
    let votes = 0;
    Object.keys(tabVotes).forEach(function (thumb) {
      if (tabVotes[thumb].choice !== tab.id) return;
      votes += 1;
      const person = state.identities[thumb];
      if (person) voters.push(person.name);
    });
    return {
      id: tab.id,
      title: tab.title,
      blurb: tab.blurb,
      body: tab.body,
      provider: tab.provider,
      providerLabel: PROVIDERS[tab.provider] || tab.provider,
      name: tab.name,
      at: tab.at,
      approvedAt: tab.approvedAt || null,
      liveAt: tab.liveAt || null,
      votes: votes,
      voters: voters,
      status: tabStatus(tab, now),
    };
  });
  const openTabs = tabs.filter(function (tab) {
    return tab.status !== "live";
  });
  if (openTabs.length) {
    polls.push({
      id: "tab",
      question: "Which community tab should be added?",
      choices: openTabs.map(function (tab) {
        return { id: tab.id, label: tab.title, votes: tab.votes, voters: tab.voters };
      }),
    });
  }
  const leader = topOpenTab(tabs);
  return {
    serverNow: now,
    identities: Object.keys(state.identities).length,
    providers: Object.keys(PROVIDERS).map(function (id) {
      return { id: id, label: PROVIDERS[id] };
    }),
    polls: polls,
    takes: state.takes.slice(-40).reverse(),
    submissions: state.submissions.slice(-30),
    tabs: tabs,
    leaderId: leader ? leader.id : null,
    windowHours: 72,
  };
}

export function registerIdentity(body) {
  const jwk = requirePublicJwk(body.publicJwk);
  const name = requireName(body.name);
  const thumb = thumbprint(jwk);
  assertSig(jwk, "register\n" + name + "\n" + thumb, body.signature);
  const state = loadState();
  state.identities[thumb] = { name: name, publicJwk: jwk, at: new Date().toISOString() };
  saveState(state);
  return { thumb: thumb, name: name };
}

export function castVote(body) {
  const jwk = requirePublicJwk(body.publicJwk);
  const thumb = thumbprint(jwk);
  const poll = String(body.poll || "");
  const choice = String(body.choice || "");
  const board = publicBoard();
  const found = board.polls.find(function (item) {
    return item.id === poll;
  });
  if (!found || !found.choices.some(function (item) {
    return item.id === choice;
  })) {
    throw httpError(400, "That vote is not on the board.");
  }
  assertSig(jwk, "vote\n" + poll + "\n" + choice, body.signature);
  const state = loadState();
  if (!state.identities[thumb]) throw httpError(401, "Register the public key before voting.");
  if (!state.votes[poll]) state.votes[poll] = {};
  state.votes[poll][thumb] = { choice: choice, at: new Date().toISOString() };
  saveState(state);
  return { poll: poll, choice: choice };
}

export function postTake(body) {
  const jwk = requirePublicJwk(body.publicJwk);
  const thumb = thumbprint(jwk);
  const text = cleanText(body.text, 180);
  assertSig(jwk, "take\n" + text, body.signature);
  const state = loadState();
  const person = state.identities[thumb];
  if (!person) throw httpError(401, "Register the public key before posting.");
  state.takes.push({ thumb: thumb, name: person.name, text: text, at: new Date().toISOString() });
  if (state.takes.length > 200) state.takes = state.takes.slice(-200);
  saveState(state);
  return { name: person.name, text: text };
}

export function submitCrosshair(body) {
  const jwk = requirePublicJwk(body.publicJwk);
  const thumb = thumbprint(jwk);
  const label = requireName(body.label);
  const code = String(body.code || "").trim();
  let decoded;
  try {
    decoded = decodeShareCode(code);
  } catch (err) {
    throw httpError(400, err.message || "That crosshair code does not decode.");
  }
  assertSig(jwk, "submit\n" + label + "\n" + code, body.signature);
  const state = loadState();
  const person = state.identities[thumb];
  if (!person) throw httpError(401, "Register the public key before submitting a code.");
  const id = "sub-" + thumb.slice(0, 8) + "-" + (state.submissions.length + 1);
  state.submissions.push({
    id: id,
    label: label,
    code: code,
    format: decoded.format,
    name: person.name,
    thumb: thumb,
    at: new Date().toISOString(),
  });
  if (state.submissions.length > 100) state.submissions = state.submissions.slice(-100);
  saveState(state);
  return { id: id, label: label, code: code };
}

export function proposeTab(body) {
  refuseSecrets(body);
  const jwk = requirePublicJwk(body.publicJwk);
  const thumb = thumbprint(jwk);
  const provider = String(body.provider || "").trim().toLowerCase();
  if (LOCAL_AGENTS.indexOf(provider) !== -1 || provider.indexOf("local") !== -1) {
    throw httpError(400, "Local agents are not allowed.");
  }
  if (!PROVIDERS[provider]) throw httpError(400, "Attach Grok, ChatGPT, Grok bot, Cursor, or Claude.");
  const title = requireTitle(body.title);
  const blurb = cleanText(body.blurb, 180);
  const copy = cleanText(body.body, 800);
  assertSig(jwk, "tab\n" + provider + "\n" + title + "\n" + blurb + "\n" + copy, body.signature);
  const state = loadState();
  const person = state.identities[thumb];
  if (!person) throw httpError(401, "Register the public key before proposing a tab.");
  const id = slug(title) + "-" + thumb.slice(0, 4);
  if (state.tabs.some(function (tab) {
    return tab.id === id;
  })) {
    throw httpError(400, "You already proposed that tab.");
  }
  state.tabs.push({
    id: id,
    title: title,
    blurb: blurb,
    body: copy,
    provider: provider,
    name: person.name,
    thumb: thumb,
    at: new Date().toISOString(),
    approvedAt: null,
    liveAt: null,
  });
  if (state.tabs.length > 40) state.tabs = state.tabs.slice(-40);
  saveState(state);
  return { id: id, title: title, provider: provider };
}

export function approveTab(id, secret, now = Date.now()) {
  assertOwner(secret);
  const state = loadState();
  const tab = state.tabs.find(function (item) {
    return item.id === id;
  });
  if (!tab) throw httpError(404, "That tab is not on the board.");
  if (tab.approvedAt) throw httpError(400, "That tab is already approved.");
  const board = publicBoard(now);
  if (board.leaderId !== id) throw httpError(400, "Approve the tab that is currently ahead.");
  const waiting = state.tabs.some(function (item) {
    return item.approvedAt && Date.parse(item.liveAt) > now;
  });
  if (waiting) throw httpError(400, "A tab is already in the 72-hour window.");
  tab.approvedAt = new Date(now).toISOString();
  tab.liveAt = new Date(now + WINDOW_MS).toISOString();
  saveState(state);
  return { id: tab.id, approvedAt: tab.approvedAt, liveAt: tab.liveAt };
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function labelFor(id, cs2, crosshairs, state) {
  const lists = [crosshairs.bench, cs2.maps, cs2.queues, cs2.clips, state.submissions];
  for (let i = 0; i < lists.length; i++) {
    const found = lists[i].find(function (item) {
      return item.id === id;
    });
    if (found) return found.name || found.label;
  }
  return id;
}

function tabStatus(tab, now) {
  if (tab.liveAt && Date.parse(tab.liveAt) <= now) return "live";
  if (tab.approvedAt) return "waiting";
  return "preview";
}

function topOpenTab(tabs) {
  const open = tabs.filter(function (tab) {
    return tab.status === "preview";
  });
  open.sort(function (a, b) {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return String(a.at).localeCompare(String(b.at));
  });
  return open[0] || null;
}

function refuseSecrets(body) {
  const banned = ["apikey", "api_key", "token", "password", "secret", "authorization", "key"];
  Object.keys(body || {}).forEach(function (key) {
    if (banned.indexOf(String(key).toLowerCase()) !== -1) {
      throw httpError(400, "Do not send provider keys to the server.");
    }
  });
}

function assertOwner(secret) {
  const expected = process.env.DTRT_SITE_SECRET || "";
  if (!expected || expected === "change-this-admin-token") {
    throw httpError(403, "Set DTRT_SITE_SECRET before approving a tab. The placeholder is refused.");
  }
  const given = Buffer.from(String(secret || ""));
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    throw httpError(403, "That approval secret is not the site secret.");
  }
}

function requireTitle(value) {
  const title = String(value || "").trim().replace(/\s+/g, " ");
  if (!TITLE_RE.test(title)) throw httpError(400, "Use a short tab title, letters and numbers.");
  return title;
}

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
}

function requireName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!NAME_RE.test(name)) throw httpError(400, "That display name is not allowed.");
  return name;
}

function cleanText(value, max) {
  const text = String(value || "").replace(/[\u0000-\u001F]/g, "").trim();
  if (!text || text.length > max) throw httpError(400, "Keep the note between 1 and " + max + " characters.");
  return text;
}

function requirePublicJwk(jwk) {
  if (!jwk || typeof jwk !== "object") throw httpError(400, "Missing public key.");
  if (jwk.d || jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y) {
    throw httpError(400, "Send only a P-256 public key.");
  }
  if (String(jwk.x).length > 128 || String(jwk.y).length > 128) throw httpError(400, "That public key is the wrong size.");
  return { kty: "EC", crv: "P-256", x: String(jwk.x), y: String(jwk.y) };
}

function thumbprint(jwk) {
  const canonical = JSON.stringify({ crv: "P-256", kty: "EC", x: jwk.x, y: jwk.y });
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

function assertSig(jwk, message, signature) {
  let sig;
  try {
    sig = Buffer.from(String(signature || ""), "base64");
  } catch (err) {
    throw httpError(401, "Missing signature.");
  }
  if (sig.length !== 64) throw httpError(401, "Missing signature.");
  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const ok = crypto.verify("sha256", Buffer.from(message), { key: key, dsaEncoding: "ieee-p1363" }, sig);
  if (!ok) throw httpError(401, "That signature does not match the public key.");
}
