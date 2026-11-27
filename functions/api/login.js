import { handleLogin } from "../_lib/accounts.mjs";

export function onRequestPost(context) {
  return handleLogin(context);
}
