import { handleLogout } from "../_lib/accounts.mjs";

export function onRequestPost(context) {
  return handleLogout(context);
}
