import { handleSettings } from "../_lib/accounts.mjs";

export function onRequest(context) {
  return handleSettings(context);
}
