import { handleSession } from "../_lib/accounts.mjs";

export function onRequestGet(context) {
  return handleSession(context);
}
