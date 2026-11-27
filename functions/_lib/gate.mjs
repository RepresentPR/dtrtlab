// Public launch gate. Pages are reachable. /private stays a 404.
// This does not set a sitewide noindex header.

export function isPrivatePath(pathname) {
  const path = String(pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  return path === "/private" || path.startsWith("/private/");
}

export function gateDecision(pathname) {
  if (!isPrivatePath(pathname)) return null;
  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}
