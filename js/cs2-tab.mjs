const params = new URLSearchParams(location.search);
const id = params.get("id") || "";
const title = document.getElementById("tab-title");
const blurb = document.getElementById("tab-blurb");
const state = document.getElementById("tab-state");
const body = document.getElementById("tab-body");
const kicker = document.getElementById("tab-kicker");

const res = await fetch("/api/community", { cache: "no-store" });
if (!res.ok) {
  title.textContent = "The board is not running.";
} else {
  const board = await res.json();
  const tab = (board.tabs || []).find(function (item) {
    return item.id === id;
  });
  if (!tab) {
    title.textContent = "That tab is not on the board.";
  } else {
    document.title = tab.title + " — DTRTC";
    kicker.textContent = tab.providerLabel + " · " + tab.name;
    title.textContent = tab.title;
    blurb.textContent = tab.blurb;
    body.textContent = tab.body;
    if (tab.status === "live") {
      state.textContent = "This tab is on the site.";
    } else if (tab.status === "waiting") {
      const remain = Math.max(0, Date.parse(tab.liveAt) - board.serverNow);
      const hours = Math.floor(remain / 3600000);
      state.textContent = "Approved. It is added to the navigation in " + hours + " hours. This is still a preview.";
    } else {
      state.textContent = "Preview only. It joins the site if it leads the vote, the owner approves it, and 72 hours pass.";
    }
  }
}
