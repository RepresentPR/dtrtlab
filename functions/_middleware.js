import { gateDecision } from "./_lib/gate.mjs";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const blocked = gateDecision(url.pathname);
  if (blocked) return blocked;
  return context.next();
}
