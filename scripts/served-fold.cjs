// Shared text fold for served-file guards.
// loosen() is the matcher scripts/retired-copy.test.cjs uses for slugs,
// underscores, quotes, and collapsed whitespace. Pass 'name' to also treat
// a dot inside a filename as a separator (Silver.Spring.jpg).
function loosen(text, foldUnderscore) {
  let body = String(text)
    .replace(/[\u201c\u201d\u2018\u2019"'`]/g, '')
    .replace(/[-–—]/g, ' ');
  if (foldUnderscore) body = body.replace(/_/g, ' ');
  if (foldUnderscore === 'name') body = body.replace(/\./g, ' ');
  return body.replace(/\s+/g, ' ');
}

function joinedKey(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Joined filename stems with no separator (reviewdesk.png, silverspring.jpg).
// Short needles such as somd match the whole stem only, so they do not fire
// inside a longer word (ransomdemand).
function joinedNameHits(rel, phrases) {
  const hits = [];
  for (const segment of String(rel).split('/')) {
    const folded = joinedKey(segment.replace(/\.[^.]+$/, ''));
    for (const phrase of phrases) {
      const needle = joinedKey(phrase);
      const short = needle.length < 8;
      if (needle.length >= 4 && (short ? folded === needle : folded.includes(needle))) {
        hits.push(rel + ': ' + needle);
      }
    }
  }
  return hits;
}

function decodeEntities(text) {
  let body = String(text);
  for (let i = 0; i < 3; i++) {
    const next = body.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z]+));/g, (all, hex, dec, name) => {
      if (name) {
        const n = name.toLowerCase();
        if (n === 'amp') return '&';
        if (n === 'nbsp' || n === 'ensp' || n === 'emsp' || n === 'thinsp' || n === 'zwsp') return ' ';
        return all;
      }
      const code = parseInt(hex || dec, hex ? 16 : 10);
      if (code === 38) return '&';
      if (code <= 32 || code === 160) return ' ';
      if (code > 0 && code < 0x110000) return String.fromCodePoint(code);
      return ' ';
    });
    if (next === body) break;
    body = next;
  }
  return body;
}

// Case folding is left to the caller's /i pattern. This prepares entities,
// tags, simple JS string joins, hyphens, and underscores.
function foldBanned(text) {
  let body = decodeEntities(text);
  body = body.replace(/<[^>]*>/g, ' ');
  body = body.replace(/['"`]\s*\+\s*['"`]/g, '');
  body = body.replace(/&/g, ' ');
  return loosen(body, true);
}

module.exports = { loosen, foldBanned, joinedNameHits };
