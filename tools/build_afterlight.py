#!/usr/bin/env python3
"""Build the public Volume One reader. Does not touch the adaptation bible."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "stories/afterlight/volume-one/_source.html").read_text(encoding="utf-8")
data = json.loads((ROOT / "content/afterlight.json").read_text(encoding="utf-8"))
m = re.search(r"<article>(.*)</article>", src, re.S)
if not m:
    raise SystemExit("article not found")
article = m.group(1)
prefix = "../../../"

for ch in data["chapters"]:
    still = prefix + ch["still"]
    fig = (
        f'<figure class="al-cut">'
        f'<img src="{still}" alt="{ch["alt"]}" width="1920" height="1080">'
        f'<figcaption><span class="cut-label">Cut</span> {ch["cut"]}</figcaption>'
        f"</figure>\n"
        f'<aside class="al-insight"><p class="kicker">Insight</p><p>{ch["insight"]}</p></aside>\n'
    )
    needle = f'<h2 id="{ch["id"]}">'
    if needle not in article:
        raise SystemExit(f"missing {ch['id']}")
    article = article.replace(needle, fig + needle, 1)

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>DTRT Afterlight — La isla recuerda</title>
  <meta name="description" content="Volume One of DTRT Afterlight. A fictional Puerto Rican thriller about family, memory, and the lives behind the records.">
  <meta property="og:title" content="DTRT Afterlight — La isla recuerda">
  <meta property="og:image" content="https://dtrtlab.com/img/afterlight/shop-dawn.jpg">
  <link rel="canonical" href="https://dtrtlab.com/stories/afterlight/volume-one/">
  <link rel="stylesheet" href="../../../css/lab.css">
  <link rel="stylesheet" href="../../../css/afterlight.css">
  <link rel="icon" href="../../../img/icon.svg">
</head>
<body class="al-paper">
  <a class="skip" href="#story">Skip to the text</a>
  <div id="reading-progress" aria-hidden="true"></div>
  <header class="nav" id="site-nav"></header>
  <div class="al-reader">
    <p class="eyebrow">DTRT Lab · Volume One · Complete story</p>
    <h1>DTRT Afterlight</h1>
    <p class="subtitle">La isla recuerda</p>
    <p class="meta">9,489 words · Version 1.0 · <a href="../Afterlight.epub">EPUB</a> · <a href="../../../story.html">Hub</a></p>
    <div class="controls" hidden>
      <button id="smaller" type="button" aria-label="Decrease text size">A−</button>
      <button id="larger" type="button" aria-label="Increase text size">A+</button>
      <button id="theme" type="button">Light / dark</button>
      <button id="resume" type="button">Resume reading</button>
      <button id="print" type="button">Print</button>
    </div>
    <details>
      <summary>Contents</summary>
      <nav aria-label="Contents">
        <ol>
          <li><a href="#section-4">1 — The completed journey</a></li>
          <li><a href="#section-5">2 — Dead air</a></li>
          <li><a href="#section-6">3 — The blue door</a></li>
          <li><a href="#section-7">4 — The woman with the radio</a></li>
          <li><a href="#section-8">5 — The price of a familiar voice</a></li>
          <li><a href="#section-9">6 — The house with no address</a></li>
          <li><a href="#section-10">7 — The longer road</a></li>
          <li><a href="#section-11">8 — Observed and authorized</a></li>
          <li><a href="#section-12">9 — The people between entries</a></li>
          <li><a href="#section-13">10 — The rehearsal</a></li>
          <li><a href="#section-14">11 — A voice that would wait</a></li>
          <li><a href="#section-15">12 — What the fortifications could not hold</a></li>
          <li><a href="#section-16">13 — No one left in the truck</a></li>
          <li><a href="#section-17">14 — The living record</a></li>
          <li><a href="#section-18">Epilogue — Someone is here</a></li>
        </ol>
      </nav>
    </details>
    <main id="story"><article>{article}</article></main>
    <div class="al-endnote">
      <p>Fiction. Not a claim about real agencies, companies, or events.</p>
      <p><a href="../../../story.html">Story hub</a> · <a href="../Afterlight.epub">EPUB</a> · <a href="../../../game.html">Lab</a></p>
    </div>
  </div>
  <footer id="site-foot"></footer>
  <script src="../../../js/nav.js"></script>
  <script src="../../../js/afterlight.js"></script>
</body>
</html>
"""
out = ROOT / "stories/afterlight/volume-one/index.html"
out.write_text(html, encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")
