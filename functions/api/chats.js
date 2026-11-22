import { handleChats } from "../_lib/accounts.mjs";

export function onRequest(context) {
  return handleChats(context);
}
