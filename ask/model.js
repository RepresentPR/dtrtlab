// Optional in-browser model. A paid server is not called.
// If the import or the device fails, the caller uses the public-page search.

const MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";
const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/+esm";

const SYSTEM = "You are a small open model running in the visitor's browser on DTRT Lab. You are a very early test. You are not a human and not a doctor. If you are unsure, say so. Do not invent counts, clients, or prices. Keep the answer short.";

let generatorPromise = null;

export function deviceCanRunModel() {
  if (typeof navigator === "undefined" || !navigator.gpu) return false;
  const connection = navigator.connection;
  if (connection && (connection.saveData || connection.effectiveType === "slow-2g" || connection.effectiveType === "2g")) return false;
  return true;
}

function textFrom(output) {
  const first = Array.isArray(output) ? output[0] : output;
  if (!first) return "";
  const generated = first.generated_text != null ? first.generated_text : first;
  if (typeof generated === "string") return generated;
  if (Array.isArray(generated)) {
    const last = generated.filter((item) => item && item.role === "assistant").pop();
    return last && last.content ? String(last.content) : "";
  }
  return "";
}

function pageContext(matches) {
  return (matches || []).slice(0, 2).map((item) => {
    const passage = item.passage || item;
    const bit = String(passage.text || "").replace(/\s+/g, " ").trim().slice(0, 400);
    return (passage.title || "Page") + ": " + bit;
  }).join("\n");
}

async function generator() {
  if (!generatorPromise) {
    generatorPromise = (async () => {
      const mod = await import(LIB);
      if (mod.env) {
        mod.env.allowLocalModels = false;
        mod.env.useBrowserCache = true;
      }
      return mod.pipeline("text-generation", MODEL, { dtype: "q4", device: "webgpu" });
    })();
  }
  return generatorPromise;
}

export async function tryLocalModel(question, matches) {
  if (!deviceCanRunModel()) {
    const error = new Error("device");
    error.code = "device";
    throw error;
  }
  const pipe = await generator();
  const context = pageContext(matches);
  const user = context
    ? "Public pages say:\n" + context + "\n\nQuestion: " + question + "\nAnswer from those pages when they cover it. Say if they do not."
    : String(question || "");
  const output = await pipe([
    { role: "system", content: SYSTEM },
    { role: "user", content: user }
  ], { max_new_tokens: 160, do_sample: false });
  const text = textFrom(output).trim();
  if (!text) throw new Error("empty");
  return text;
}
