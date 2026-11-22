import { tryLocalModel } from "./model.js?v=20261122-ai1";

const ALLOWED = /^https:\/\/(www\.)?dtrtlab\.com$|^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;

window.addEventListener("message", async (event) => {
  const data = event.data || {};
  if (data.type !== "dtrt-model" || !data.id || !event.source) return;
  if (!ALLOWED.test(event.origin)) return;
  try {
    const text = await tryLocalModel(String(data.question || ""), data.passages || []);
    event.source.postMessage({ type: "dtrt-model-result", id: data.id, text }, event.origin);
  } catch (err) {
    event.source.postMessage({ type: "dtrt-model-result", id: data.id, error: "model" }, event.origin);
  }
});
