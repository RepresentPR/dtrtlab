/**
 * Static site plus the public CS2 board.
 * Run from the repo root: node tools/community-server.mjs
 * Passwords never reach this process. It checks signatures and stores public votes.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  publicBoard,
  registerIdentity,
  castVote,
  postTake,
  submitCrosshair,
  proposeTab,
  approveTab,
} from "./community-store.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.DTRT_SITE_PORT || 8787);
const HOST = process.env.DTRT_SITE_HOST || "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

const hits = new Map();

const server = http.createServer(function (req, res) {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname.startsWith("/api/community")) {
    return handleApi(req, res, url);
  }
  return serveStatic(res, url.pathname);
});

server.listen(PORT, HOST, function () {
  console.log("DTRT Lab CS2 board at http://127.0.0.1:" + PORT);
});

function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/community") {
    return send(res, 200, publicBoard());
  }
  if (req.method !== "POST") return send(res, 405, { error: "Use GET or POST." });
  if (!allow(req)) return send(res, 429, { error: "Slow down a moment, then try again." });
  readBody(req)
    .then(function (body) {
      const pathName = url.pathname;
      if (pathName === "/api/community/register") return registerIdentity(body);
      if (pathName === "/api/community/vote") return castVote(body);
      if (pathName === "/api/community/take") return postTake(body);
      if (pathName === "/api/community/crosshair") return submitCrosshair(body);
      if (pathName === "/api/community/tab") return proposeTab(body);
      if (pathName === "/api/community/approve") {
        return approveTab(body.id, req.headers["x-dtrt-secret"]);
      }
      throw Object.assign(new Error("No such board action."), { status: 404 });
    })
    .then(function (result) {
      send(res, 200, result);
    })
    .catch(function (err) {
      send(res, err.status || 400, { error: err.message || "Could not save that." });
    });
}

function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith("/")) rel += "index.html";
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res, 403, { error: "Forbidden." });
  const blocked = ["/.git", "/data", "/.env", "/node_modules"];
  const relPosix = file.slice(ROOT.length).replace(/\\/g, "/");
  if (blocked.some(function (prefix) {
    return relPosix === prefix || relPosix.startsWith(prefix + "/");
  })) {
    return send(res, 404, { error: "Not found." });
  }
  fs.stat(file, function (err, stat) {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > 8000) {
        reject(Object.assign(new Error("That request is too large."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", function () {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(Object.assign(new Error("Send JSON."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function allow(req) {
  const ip = req.socket.remoteAddress || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (at) {
    return now - at < 60000;
  });
  if (recent.length >= 40) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}
