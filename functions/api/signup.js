import { handleSignup } from "../_lib/accounts.mjs";

export function onRequestPost(context) {
  return handleSignup(context);
}
