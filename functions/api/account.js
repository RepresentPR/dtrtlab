import { handleDeleteAccount } from "../_lib/accounts.mjs";

export function onRequestDelete(context) {
  return handleDeleteAccount(context);
}
