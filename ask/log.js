/* Opt-in Ask log. Nothing leaves the browser unless the visitor checks the box
   and content/site.json has a Google Form formResponse address. No keys. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DTRTAskLog = api;
  if (root && root.document) {
    var start = function () { api.mount(root.document, root); };
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})(typeof window === "undefined" ? null : window, function () {
  var KEEP_KEY = "dtrt-ask-keep";
  var SESSION_KEY = "dtrt-ask-session";
  var LIMIT = 500;

  function scrub(text) {
    var value = String(text == null ? "" : text);
    value = value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[removed]");
    value = value.replace(/\+\d{1,3}(?:[\s.-]?\d){7,14}\b/g, "[removed]");
    value = value.replace(/(?:\+\d{1,3}[\s.-])?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g, "[removed]");
    value = value.replace(/\b\d(?:[ -]?\d){12,18}\b/g, "[removed]");
    value = value.replace(/\b\d{8,}\b/g, "[removed]");
    if (value.length > LIMIT) value = value.slice(0, LIMIT);
    return value;
  }

  function endpointOf(config) {
    var raw = config && config.ask_log && config.ask_log.endpoint;
    var value = String(raw == null ? "" : raw).trim();
    if (!value) return "";
    try {
      var url = new URL(value);
      if (url.protocol !== "https:") return "";
      if (url.username || url.password) return "";
      if (url.hostname !== "docs.google.com") return "";
      if (!url.pathname.endsWith("/formResponse")) return "";
      return url.origin + url.pathname;
    } catch (err) {
      return "";
    }
  }

  function fieldId(config, name) {
    var fields = config && config.ask_log && config.ask_log.fields;
    var id = String(fields && fields[name] != null ? fields[name] : "").trim();
    if (/^entry\.\d{1,20}$/.test(id)) id = id.slice(6);
    return /^\d{1,20}$/.test(id) ? id : "";
  }

  function randomId() {
    var cryptoApi = typeof crypto !== "undefined" ? crypto : null;
    if (cryptoApi && cryptoApi.randomUUID) return cryptoApi.randomUUID();
    var bytes = new Uint8Array(16);
    if (cryptoApi && cryptoApi.getRandomValues) cryptoApi.getRandomValues(bytes);
    else {
      for (var i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = "";
    for (var j = 0; j < bytes.length; j++) hex += bytes[j].toString(16).padStart(2, "0");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  function sessionId(storage, makeId) {
    var existing = "";
    try { existing = storage.getItem(SESSION_KEY) || ""; } catch (err) { existing = ""; }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing)) return existing;
    var id = (makeId || randomId)();
    try { storage.setItem(SESSION_KEY, id); } catch (err) { /* private mode */ }
    return id;
  }

  function readKeep(storage) {
    try { return storage.getItem(KEEP_KEY) === "1"; } catch (err) { return false; }
  }

  function writeKeep(storage, on) {
    try {
      if (on) storage.setItem(KEEP_KEY, "1");
      else storage.removeItem(KEEP_KEY);
    } catch (err) { /* private mode */ }
  }

  function formBody(config, record) {
    var values = {
      question: record.question,
      urls: (record.urls || []).join(" "),
      count: String(record.count),
      page: record.page,
      timestamp: record.timestamp,
      session: record.sessionId
    };
    var params = new URLSearchParams();
    var used = 0;
    Object.keys(values).forEach(function (name) {
      var id = fieldId(config, name);
      if (!id) return;
      params.append("entry." + id, values[name]);
      used += 1;
    });
    return { params: params, used: used, hasQuestion: Boolean(fieldId(config, "question")) };
  }

  function deliver(opts) {
    var endpoint = endpointOf(opts && opts.config);
    if (!opts || opts.keep !== true || !endpoint) return Promise.resolve({ sent: false });
    var body = formBody(opts.config, {
      question: scrub(opts.question),
      urls: opts.urls || [],
      count: Number(opts.count) || 0,
      page: String(opts.page || "/").slice(0, 200),
      timestamp: opts.now || new Date().toISOString(),
      sessionId: opts.sessionId || ""
    });
    if (!body.hasQuestion || !body.used) return Promise.resolve({ sent: false });
    if (typeof opts.fetch !== "function") return Promise.resolve({ sent: false });
    return Promise.resolve(opts.fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      credentials: "omit",
      cache: "no-store",
      redirect: "follow",
      referrerPolicy: "no-referrer",
      keepalive: true,
      body: body.params
    })).then(function () {
      return { sent: true };
    }, function () {
      return { sent: false };
    });
  }

  var state = {
    config: { ask_log: { endpoint: "", fields: {} } },
    wrap: null,
    box: null,
    sessionStorage: null,
    fetch: null
  };

  function mount(doc, win) {
    var wrap = doc.getElementById("ask-keep-wrap");
    var box = doc.getElementById("ask-keep");
    if (!wrap || !box) return Promise.resolve();
    state.wrap = wrap;
    state.box = box;
    state.sessionStorage = win.sessionStorage;
    state.fetch = typeof win.fetch === "function" ? win.fetch.bind(win) : null;
    wrap.hidden = true;
    box.checked = false;
    box.addEventListener("change", function () {
      writeKeep(win.localStorage, box.checked);
    });
    if (!state.fetch) return Promise.resolve();
    return state.fetch("/content/site.json", { credentials: "omit", cache: "no-store" }).then(function (res) {
      return res && res.ok ? res.json() : null;
    }).then(function (json) {
      state.config = json || state.config;
      if (!endpointOf(state.config)) {
        wrap.hidden = true;
        box.checked = false;
        return;
      }
      wrap.hidden = false;
      box.checked = readKeep(win.localStorage);
    }).catch(function () {
      wrap.hidden = true;
      box.checked = false;
    });
  }

  function note(record) {
    var box = state.box;
    return deliver({
      keep: Boolean(state.wrap && !state.wrap.hidden && box && box.checked),
      config: state.config,
      question: record && record.question,
      urls: record && record.urls,
      count: record && record.count,
      page: record && record.page,
      sessionId: state.sessionStorage ? sessionId(state.sessionStorage) : "",
      fetch: state.fetch
    });
  }

  return {
    scrub: scrub,
    endpointOf: endpointOf,
    deliver: deliver,
    mount: mount,
    note: note,
    sessionId: sessionId,
    KEEP_KEY: KEEP_KEY,
    SESSION_KEY: SESSION_KEY
  };
});
