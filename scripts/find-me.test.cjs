const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");

test("socials.js lists Lab, stream, and career surfaces with hub", () => {
  const src = fs.readFileSync(path.join(root, "content/socials.js"), "utf8");
  assert.match(src, /hub:\s*"\/find\.html"/);
  for (const id of ["x", "instagram", "youtube", "tiktok", "twitch", "kick", "linkedin", "github"]) {
    assert.match(src, new RegExp(`id:\\s*"${id}"`));
  }
  assert.match(src, /surface:\s*"lab"/);
  assert.match(src, /surface:\s*"stream"/);
  assert.match(src, /surface:\s*"career"/);
});

test("find.html is the digest page wired to find-me assets", () => {
  const html = fs.readFileSync(path.join(root, "find.html"), "utf8");
  assert.match(html, /data-find-page/);
  assert.match(html, /data-find-group="lab"/);
  assert.match(html, /js\/find-me\.js/);
  assert.match(html, /content\/socials\.js/);
  assert.ok(fs.existsSync(path.join(root, "js/find-me.js")));
  assert.ok(fs.existsSync(path.join(root, "css/find-me.css")));
});

test("company and site sameAs include career + stream links", () => {
  const company = JSON.parse(fs.readFileSync(path.join(root, "content/company.json"), "utf8"));
  const site = JSON.parse(fs.readFileSync(path.join(root, "content/site.json"), "utf8"));
  for (const bag of [company.sameAs, site.sameAs]) {
    assert.ok(bag.some((u) => u.includes("linkedin.com")));
    assert.ok(bag.some((u) => u.includes("github.com")));
    assert.ok(bag.some((u) => u.includes("kick.com")));
  }
  assert.equal(company.findMe, "https://dtrtlab.com/find.html");
  assert.equal(site.social.findMe, "https://dtrtlab.com/find.html");
});

test("sitemap lists find.html", () => {
  const xml = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert.match(xml, /https:\/\/dtrtlab\.com\/find\.html/);
});
