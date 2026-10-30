// Shared text fold for served-file guards.
// loosen() is the matcher scripts/retired-copy.test.cjs uses for slugs,
// underscores, quotes, and collapsed whitespace.
function decodeEscapes(text) {
  let body = String(text).replace(/%20/gi, ' ');
  body = body.replace(/\\u([0-9a-fA-F]{4})/g, (all, hex) => String.fromCharCode(parseInt(hex, 16)));
  body = body.replace(/\\x([0-9a-fA-F]{2})/g, (all, hex) => String.fromCharCode(parseInt(hex, 16)));
  return body;
}

// Keep the values the name guard must see. Tag stripping would otherwise
// drop og:title / meta content, alt, title, href, src, and the text a reader
// or screen reader gets from aria-label, aria-description and placeholder.
function attributeValues(text) {
  const parts = [];
  const re = /(?<![\w-])(?:content|alt|title|href|src|aria-label|aria-description|aria-placeholder|placeholder)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  for (const m of String(text).matchAll(re)) parts.push(m[1] ?? m[2] ?? m[3] ?? '');
  return parts.join(' ');
}

function loosen(text, foldUnderscore) {
  let body = decodeEscapes(text)
    .replace(/[\u201c\u201d\u2018\u2019"'`]/g, '')
    .replace(/[-–—]/g, ' ');
  // File-name folds (the name guard, and retired-copy filename scans)
  // also split on underscores and dots: Sample.Heating.jpg, sample_heating.
  if (foldUnderscore) body = body.replace(/[_.]/g, ' ');
  return body.replace(/\s+/g, ' ');
}

function joinedKey(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Joined filename stems with no separator (reviewdesk.png, silverspring.jpg).
// Short needles such as somd match the whole stem only, so they do not fire
// inside a longer word (ransomdemand). Dots are already separators in loosen().
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
// attribute values, tags, simple JS string joins, hyphens, and underscores.
function foldBanned(text) {
  let body = decodeEscapes(text);
  body = decodeEntities(body);
  const attrs = attributeValues(body);
  body = body.replace(/<[^>]*>/g, ' ');
  body = body + ' ' + attrs;
  body = body.replace(/['"`]\s*\+\s*['"`]/g, '');
  body = body.replace(/&/g, ' ');
  return loosen(body, true);
}

const JOINED_NAME = /^sampleheating$/i;

function containsRetiredDemoName(text) {
  const folded = foldBanned(text);
  if (/sample heating/i.test(folded)) return true;
  for (const token of folded.split(/[\s/]+/)) {
    if (JOINED_NAME.test(token)) return true;
  }
  return false;
}

module.exports = { loosen, foldBanned, containsRetiredDemoName, joinedNameHits };
