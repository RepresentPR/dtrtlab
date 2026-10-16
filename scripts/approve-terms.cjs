// Shared term lists for the approve-only copy guards (EN and ES).
// Every customer message is a draft until the owner approves it, so served
// copy must not say the Job Desk sends, replies or follows up by itself.
// ES patterns are matched against text with accents removed (deaccent()).

const AUTONOMY_EN = new RegExp([
  'job desk (handles|runs|does it)',
  'runs? (it )?on its own',
  'does it for you',
  'autopilot did',
  'automatically sends?',
  'sends? automatically',
  'auto[- ]?sends?\\b',
  'auto \\+ undo',
  '\\b(texts?|emails?|messages?|answers?|replies to|follows? up with) (all )?(of )?your customers for you',
  '\\bfollow(s|ed|ing)? ?up automatically',
  '\\bautomatically (follow(s|ed)? up|texts?|emails?|repl(y|ies|ied)|answers?|messages?)',
  '\\b(sends?|texts?|emails?|repl(y|ies)|answers?|messages?|follows? up)\\b[\\w ,]{0,30}\\bon its own',
  '\\breview (requests?|asks?|links?) (is |are |gets? )?sent (automatically |out )?after (each|every) job',
].join('|'), 'i');

const AUTONOMY_ES = new RegExp([
  '\\bautomatic(o|a|os|as|amente)\\b',
  '\\bpor su (propia )?cuenta\\b',
  '\\bpor si (sol[oa]s?|mism[oa]s?)\\b',
  '\\bsin (pedir|preguntar)(te|le)?\\b',
  '\\blo hace (todo )?(solo|sola|el|ella)\\b',
].join('|'), 'i');

const RETIRED_ES = new RegExp([
  '\\bescritur[ao]s?\\b',
  '\\bescrib(e|en|imos|o) para (negocios|operadores)',
  '\\bredaccion para negocios',
  '\\bplanes de (escritura|redaccion)',
  '\\breescri\\w* gratis',
  '\\bgarantia de 7 dias',
  '\\bentregables escritos',
  '\\bestudio (independiente )?de crecimiento',
].join('|'), 'i');

function deaccent(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Returns the first matching term for an ES string, or null.
function esHit(text) {
  const t = deaccent(text);
  const m = t.match(AUTONOMY_ES) || t.match(RETIRED_ES) || String(text).match(AUTONOMY_EN);
  return m ? m[0] : null;
}

module.exports = { AUTONOMY_EN, AUTONOMY_ES, RETIRED_ES, deaccent, esHit };
