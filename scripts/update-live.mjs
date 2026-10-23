// Appends one 4-hour DIS candle + new changelog entries to live/board/live.json.
// Usage: node scripts/update-live.mjs --scorecard <csv> [--changelog <jsonl>] [--story <jsonl>] [--now ISO]
// scorecard.csv: header row with at least `date` and `dis` (numeric; blank = not measured -> no candle).
// changelog.jsonl: {"date":"YYYY-MM-DD","title":"...","pos":int|null,"neg":int|null} per line.
// story.jsonl: {"date":"YYYY-MM-DD","title":"..."} per line. No network, no paid APIs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '../live/board/live.json');
// Place names, employer and other private terms are caught by the repo's hashed guard
// (scripts/private-terms.test.cjs), which scans live/board/live.json on every PR.
const BANNED = /password|secret|token|api[_ -]?key|https?:|@[a-z0-9.-]+\.[a-z]{2,}|\$\s?\d/i;

export function parseCsv(text) {
  const [head, ...rows] = text.trim().split(/\r?\n/);
  const cols = head.split(',').map((s) => s.trim().toLowerCase());
  return rows.filter(Boolean).map((r) => Object.fromEntries(r.split(',').map((v, i) => [cols[i], v.trim()])));
}
const jsonl = (f) => (f && fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)) : []);
const clean = (s) => { s = String(s).slice(0, 80); if (BANNED.test(s)) throw new Error(`blocked public text: ${s}`); return s; };
const intOrNull = (v) => (Number.isInteger(v) && v >= 0 ? v : null);

export function bucket(now) {
  const d = new Date(now); d.setUTCMinutes(0, 0, 0); d.setUTCHours(d.getUTCHours() - (d.getUTCHours() % 4)); return d.toISOString();
}

export function update(data, { scores = [], changes = [], story = [], now = new Date().toISOString() }) {
  const out = structuredClone(data);
  const last = [...scores].reverse().find((r) => r.dis !== undefined && r.dis !== '' && Number.isFinite(Number(r.dis)));
  if (last) {
    const v = Number(last.dis), t = bucket(now), prev = out.candles.at(-1);
    if (prev && prev.t === t) { prev.c = v; prev.h = Math.max(prev.h, v); prev.l = Math.min(prev.l, v); }
    else { const o = prev ? prev.c : v; out.candles.push({ t, o, h: Math.max(o, v), l: Math.min(o, v), c: v }); }
    out.candles = out.candles.slice(-540); // ~90 days of 4h candles
    const back = out.candles.at(-43); // 42 candles = 7 days
    out.headline.growthPct7d = back && back.c ? Math.round(((v / back.c) - 1) * 1000) / 10 : null;
  }
  const key = (e) => e.date + '|' + e.title;
  const seen = new Map(out.log.map((e) => [key(e), e]));
  for (const c of changes) {
    const e = { date: clean(c.date), title: clean(c.title), pos: intOrNull(c.pos), neg: intOrNull(c.neg) };
    if (seen.has(key(e))) Object.assign(seen.get(key(e)), e); else { out.log.push(e); seen.set(key(e), e); }
  }
  const sk = new Set(out.story.map(key));
  for (const s of story) { const e = { date: clean(s.date), title: clean(s.title) }; if (!sk.has(key(e))) { out.story.push(e); sk.add(key(e)); } }
  out.story.sort((a, b) => a.date.localeCompare(b.date));
  out.updated = now;
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const a = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => s.trim().split(/\s+/)));
  const scores = a.scorecard && fs.existsSync(a.scorecard) ? parseCsv(fs.readFileSync(a.scorecard, 'utf8')) : [];
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const next = update(data, { scores, changes: jsonl(a.changelog), story: jsonl(a.story), now: a.now || new Date().toISOString() });
  fs.writeFileSync(DATA, JSON.stringify(next, null, 2) + '\n');
  console.log(`live.json: ${next.candles.length} candles, ${next.log.length} log entries, ${next.story.length} story items`);
}
