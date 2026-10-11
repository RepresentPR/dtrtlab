/**
 * Checks the crosshair codec and the public board.
 * The board file is COMMUNITY_DATA, so this does not touch a live room.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { decodeShareCode, encodeCs2, rotationIndex, nextRotationAt, slotMs } from "../js/cs2-crosshair.mjs";
import {
  catalog,
  registerIdentity,
  castVote,
  postTake,
  submitCrosshair,
  proposeTab,
  approveTab,
  publicBoard,
  saveState,
  emptyState,
} from "./community-store.mjs";

let failed = 0;
function check(name, cond) {
  if (!cond) {
    failed += 1;
    console.error("FAIL", name);
  } else {
    console.log("ok", name);
  }
}

const bench = JSON.parse(fs.readFileSync(new URL("../content/crosshairs.json", import.meta.url), "utf8")).bench;
bench.forEach(function (item) {
  const decoded = decodeShareCode(item.code);
  check(item.id + " decodes", decoded.format === "cs2-v1" && decoded.style === 4);
});

const sample = encodeCs2({
  style: 4,
  length: 4,
  thickness: 1,
  gap: -3,
  red: 0,
  green: 255,
  blue: 255,
  centerDotEnabled: false,
  tStyleEnabled: false,
});
const round = decodeShareCode(sample);
check("round trip gap", round.gap === -3 && round.length === 4 && round.green === 255);
let threw = false;
try {
  decodeShareCode(sample.slice(0, -1) + (sample.endsWith("A") ? "B" : "A"));
} catch (err) {
  threw = true;
}
check("bad code rejected", threw);

const slot = slotMs();
check("four hour slot", slot === 4 * 60 * 60 * 1000);
check("rotation wraps", rotationIndex(6, 0) === 0 && rotationIndex(6, slot) === 1 && rotationIndex(6, slot * 6) === 0);
check("next boundary", nextRotationAt(slot - 1) === slot);

const { choices } = catalog();
const clipFile = fs.readFileSync(new URL("../content/clips.js", import.meta.url), "utf8");
const slugs = [...clipFile.matchAll(/\{[^{}]*slug:\s*"([^"]+)"/g)].map(function (match) {
  return match[1];
});
const listed = JSON.parse(fs.readFileSync(new URL("../content/cs2.json", import.meta.url), "utf8")).clips.map(function (item) {
  return item.id;
});
check("clip list matches clips.js", slugs.join() === listed.join() && choices.clips.join() === slugs.join());

saveState(emptyState());
const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = publicKey.export({ format: "jwk" });
const pub = { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y };
const thumb = crypto.createHash("sha256").update(JSON.stringify({ crv: "P-256", kty: "EC", x: pub.x, y: pub.y })).digest("hex").slice(0, 16);

function signature(message) {
  return crypto.sign("sha256", Buffer.from(message), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64");
}

registerIdentity({
  name: "Skitz",
  publicJwk: pub,
  signature: signature("register\nSkitz\n" + thumb),
});
castVote({
  poll: "map",
  choice: "cache",
  publicJwk: pub,
  signature: signature("vote\nmap\ncache"),
});
castVote({
  poll: "map",
  choice: "mirage",
  publicJwk: pub,
  signature: signature("vote\nmap\nmirage"),
});
postTake({
  publicJwk: pub,
  text: "Cache mid is the round.",
  signature: signature("take\nCache mid is the round."),
});
const code = bench[0].code;
const added = submitCrosshair({
  label: "Clip cyan",
  code: code,
  publicJwk: pub,
  signature: signature("submit\nClip cyan\n" + code),
});
const board = publicBoard();
const mapPoll = board.polls.find(function (poll) {
  return poll.id === "map";
});
const mirage = mapPoll.choices.find(function (choice) {
  return choice.id === "mirage";
});
const cache = mapPoll.choices.find(function (choice) {
  return choice.id === "cache";
});
check("one vote replaced", mirage.votes === 1 && cache.votes === 0 && mirage.voters[0] === "Skitz");
check("note is public", board.takes[0].text === "Cache mid is the round." && board.takes[0].name === "Skitz");
check("submission can be voted", added.id && board.polls.find(function (poll) {
  return poll.id === "crosshair";
}).choices.some(function (choice) {
  return choice.id === added.id;
}));

let rejected = false;
try {
  castVote({ poll: "map", choice: "mirage", publicJwk: pub, signature: signature("vote\nmap\ndust2") });
} catch (err) {
  rejected = err.status === 401;
}
check("bad signature rejected", rejected);

let privateRejected = false;
try {
  registerIdentity({
    name: "Skitz",
    publicJwk: Object.assign({}, pub, { d: "secret-key-material" }),
    signature: signature("register\nSkitz\n" + thumb),
  });
} catch (err) {
  privateRejected = err.status === 400;
}
check("private key rejected", privateRejected);

const raw = JSON.parse(fs.readFileSync(process.env.COMMUNITY_DATA, "utf8"));
const dumped = JSON.stringify(raw);
check("no password stored", !dumped.includes("password") && !dumped.includes("secret-key-material"));
check("identity is public key only", raw.identities[thumb].publicJwk.d == null && raw.identities[thumb].name === "Skitz");

let localBlocked = false;
try {
  proposeTab({
    provider: "ollama",
    title: "Local desk",
    blurb: "A local agent tab.",
    body: "This should be refused.",
    publicJwk: pub,
    signature: signature("nope"),
  });
} catch (err) {
  localBlocked = err.status === 400 && /Local agents/.test(err.message);
}
check("local agent refused", localBlocked);

let keyBlocked = false;
try {
  proposeTab({
    provider: "grok",
    title: "Keyed desk",
    blurb: "Should not store a key.",
    body: "No key on the server.",
    apiKey: "sk-live-secret",
    publicJwk: pub,
    signature: signature("nope"),
  });
} catch (err) {
  keyBlocked = err.status === 400;
}
check("provider key refused", keyBlocked);

const tabTitle = "Retake desk";
const tabBlurb = "Community retake notes for the active pool.";
const tabBody = "One page for retake servers, site holds, and the utility that wins the post-plant.";
const proposed = proposeTab({
  provider: "claude",
  title: tabTitle,
  blurb: tabBlurb,
  body: tabBody,
  publicJwk: pub,
  signature: signature("tab\nclaude\n" + tabTitle + "\n" + tabBlurb + "\n" + tabBody),
});
castVote({
  poll: "tab",
  choice: proposed.id,
  publicJwk: pub,
  signature: signature("vote\ntab\n" + proposed.id),
});
const preview = publicBoard(1_000);
const previewTab = preview.tabs.find(function (tab) {
  return tab.id === proposed.id;
});
check("tab is preview and leading", preview.leaderId === proposed.id && previewTab.status === "preview" && previewTab.votes === 1);

process.env.DTRT_SITE_SECRET = "change-this-admin-token";
let placeholderBlocked = false;
try {
  approveTab(proposed.id, "change-this-admin-token", 1_000);
} catch (err) {
  placeholderBlocked = err.status === 403;
}
check("placeholder secret refused", placeholderBlocked);

process.env.DTRT_SITE_SECRET = "unit-test-site-secret";
const approved = approveTab(proposed.id, "unit-test-site-secret", 1_000);
const waiting = publicBoard(1_000).tabs.find(function (tab) {
  return tab.id === proposed.id;
});
const live = publicBoard(1_000 + 72 * 60 * 60 * 1000).tabs.find(function (tab) {
  return tab.id === proposed.id;
});
check(
  "72 hour window",
  Date.parse(approved.liveAt) - Date.parse(approved.approvedAt) === 72 * 60 * 60 * 1000 &&
    waiting.status === "waiting" &&
    live.status === "live"
);
const after = JSON.parse(fs.readFileSync(process.env.COMMUNITY_DATA, "utf8"));
check("stored tab has no key", !JSON.stringify(after).includes("sk-live-secret") && !JSON.stringify(after).includes("unit-test-site-secret"));

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all checks passed");
