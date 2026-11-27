#!/usr/bin/env python3
"""copy_lint.py - copy gate for DTRTLab DRAFTS (captions, posts, page copy).

rules.md 8.4: copy_lint.py must pass on every DRAFTS file before QA, with
--ai-voice whenever a clip has an AI voice. A FAIL (exit 1) blocks the draft
from reaching Ian. Fix the copy, never the term lists.

Rebuilt 2026-11-27 and committed to the repo (scripts/gates/) so a box refresh
cannot wipe it again. The 11/17 original was lost in the 11/26 refresh; this
version follows the rules it enforced, not a byte copy of it.

The repo is public, so banned terms are stored only as truncated SHA-256
hashes, the same scheme as scripts/private-terms.test.cjs. That file's lists
(SINGLE, PAIRS, PLACE_PAIRS) are read at run time so there is one source of
truth; the extra lists below add caption-only rules (personal places,
legal-hold employer, family and health, gambling, investor-claim phrases,
engagement bait, waitlist, retired handle, MOTION paraphrase, AI-is-live
claims, generic kids phrases). The fiction-file allowlist does NOT apply to
drafts, except the island-name tokens, which follow Brain §3: allowed only on
marketplace pages (mercado and store pages, the home store section, their ES
versions) and on fiction pages. Personal town names and addresses stay banned.

Checks per file:
  TERM        a banned word (hash match on folded, accent-stripped tokens)
  PAIR        a banned two-word phrase
  DISCLOSURE  mentions the Candles referral without the exact line
              "Referral link. We earn from fees. Trading is risky, not financial advice."
              or mentions the MOTION official wording or affiliate link without
              the exact opener "Affiliate link. We earn a commission."
  AI-VOICE    --ai-voice given but no "AI voice" disclosure in the copy
Output names the hash and line number, never the matched word.
Exit 0 = PASS, 1 = FAIL, 2 = usage error. Read-only.
"""
import argparse, hashlib, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_TERMS = os.path.join(HERE, "..", "private-terms.test.cjs")

EXTRA_SINGLE = {
    "5072f198bd5e3aab", "4f80902c333e7bd9", "383188966c792ce3",  # personal-location tokens
    "72b978cf9608f1ed", "f0cd63a491438eb0",                      # personal towns
    "682a4851da0c4e36",                                          # island demonym (Brain §3 path-scoped)
    "e424dce6bf0bec35",                                          # legal hold
    "008f13c4ba9cf25d", "c4c6dfa746694877", "61fb51e57b258404", "4358ccfc6d227afb",  # gambling
    "a03ea09072d789ad", "8afe3c83decffdf6", "16ccff8bb1fe4285",  # family, health
    "49e749acca3f9f8b", "eab43dbcec358b32", "8c838ec774566f41", "6924b10173731b06",  # waitlist (+ plural/forms)
    "3c1b8f9f9ebe1a15",                                          # retired handle
    "4ed28f82ca96c334",                                          # bare child-word
}
EXTRA_PAIRS = {
    "45f4e17b3f02ee1f", "211be92b4add74dc", "afeacc461eaa9436",  # personal places
    "43b1301526a5f924", "2696ade4f3b116d3", "abcdf9ba5ebbd320", "6e5d5d5d68599e0f",  # shop work
    "d651e202e22d5041",                                          # gambling
    "d63dba796421ec85", "a23f6a233621bd96", "44c9c6ce50391755",  # engagement bait
    "79dc9a35d42db0aa", "b28699be298743ee",                      # investor-claim phrases
    "38c3baac1ce59618", "0ba1aba94e672060", "8433bd1e712eb083",  # generic kids phrases
    "7e2faed68eeab2d1", "fd4c6689d5e97d23",                      # generic kids phrases
    "04548b1dcbe9b7d0",                                          # generic "the kids"
    "29f20e8e14d01617",                                          # hyphenated / split wait-list
    "3753d200556d4ceb",                                          # singular "my kid"
}
# n-gram hashes (3+ tokens), same scheme. "live ai" is a special case in lint_text
# so a negation only exempts the pair when it denies the liveness claim itself.
EXTRA_PHRASES = {
    "25091ef1f29cac39",  # MOTION paraphrase
    "76254501fcfadf99", "ab90ae9f487e0e3f", "f577150ae719f46b", "189d2a10daac1298",  # AI-is-live claims
    "989ac231168b9387", "492235eba8c93212", "63960f909b13fe4c",  # Spanish AI-is-live claims
}
AI_LIVE_PHRASES = {
    "76254501fcfadf99", "ab90ae9f487e0e3f", "f577150ae719f46b", "189d2a10daac1298",
}
ES_LIVE_PHRASES = {
    "989ac231168b9387", "492235eba8c93212", "63960f909b13fe4c",
}
# Island-name tokens restored for Brain §3 path-scoping (marketplace / home store / fiction only).
ISLAND_SINGLE = {
    "cf6f0c3063e089ac", "c45b25cebbfe88b1", "682a4851da0c4e36",
}
ISLAND_PAIRS = {
    "f50b92b29527bc02", "76fe6138e7cacf54",
}
NEG = {"not", "no", "never", "nt"}
NEG_HEADS = {"isn", "aren", "wasn", "weren", "don", "doesn", "didn", "won", "couldn", "wouldn", "can", "ain"}
FILLER = {
    "is", "are", "was", "were", "be", "been", "being",
    "the", "a", "an", "our", "my", "their", "its", "this", "that", "any", "some",
    "does", "do", "did", "can", "could", "will", "would", "has", "have", "had",
    "just", "currently", "officially", "still", "yet", "even", "also", "to", "of", "for",
}
DENY_VERBS = {
    "activate", "activates", "activated", "activating",
    "enable", "enables", "enabled", "enabling",
    "launch", "launches", "launched", "launching",
    "offer", "offers", "offered", "offering",
    "connect", "connects", "connected", "connecting",
    "run", "runs", "running",
    "start", "starts", "started", "starting",
    "turn", "turns", "turned",
    "use", "uses", "used", "using",
    "show", "shows", "shown", "showing",
    "present", "presents", "presented",
}
DENY_PREDICATES = {
    "connected", "connect", "connects", "connecting",
    "activated", "activate", "activates", "activating", "activation",
    "active", "available", "online", "ready", "enabled", "enable", "enables",
    "offered", "launched", "running", "live",
}
LIVE_AI = ("live", "ai")
DISCLOSURE = "Referral link. We earn from fees. Trading is risky, not financial advice."
MOTION_OPENER = "Affiliate link. We earn a commission."
MOTION_OPENER_ES = "Enlace de afiliado. Ganamos una comisión."
MOTION_OFFICIAL = "Zero nicotine and zero tobacco, too."
MOTION_OFFICIAL_ES = "Cero nicotina y cero tabaco, también."
MOTION_LINK = re.compile(r"motionpouches\.com", re.I)
HTML_BREAK = re.compile(
    r"</?(?:li|ul|ol|tr|td|th|p|br|h[1-6]|div|section|article|blockquote)\b",
    re.I,
)
LINE_LIST_MARK = re.compile(r"[\n\r][ \t]*(?:[-*+]|\d+\.)[ \t]")
BOS_LIST_MARK = re.compile(r"[ \t]*(?:[-*+]|\d+\.)[ \t]")
MIDLINE_LIST_GAP = re.compile(r"^[ \t]*(?:[-*+]|\d+\.)[ \t]*$")
DASH_BREAK = {"\N{EM DASH}", "\N{EN DASH}", "\N{HORIZONTAL BAR}", "\N{MINUS SIGN}"}
SENTENCE_CHARS = set(".!?:;·•|\n\r")
HARD_BREAK = re.compile(
    r"[.!?:;\n\r|·•\u2014\u2013]|</?(?:li|ul|ol|tr|td|th|p|br|h[1-6]|div|section|article|blockquote)\b",
    re.I,
)
MARKETPLACE_PATH = re.compile(
    r"(?:^|/)(?:es|en)/(?:mercado|store|tienda)(?:/|$|\.)"
    r"|(?:^|/)(?:mercado|store|tienda)(?:/|$|\.)",
    re.I,
)
HOME_PATH = re.compile(r"^(?:es/|en/)?(?:index|home)(?:\.es)?\.html$", re.I)
FICTION_PATHS = (
    re.compile(r"^afterlight\.html$"),
    re.compile(r"^story\.html$"),
    re.compile(r"^game\.html$"),
    re.compile(r"^worlds\.html$"),
    re.compile(r"^stories/afterlight/"),
    re.compile(r"^content/afterlight\.json$"),
    re.compile(r"^content/product\.json$"),
    re.compile(r"^media\.html$"),
    re.compile(r"^tools/build_afterlight\.py$"),
)
DRAFT_PREFIX = re.compile(r"^(?:DRAFTS|drafts|captions)/")
STORE_CLASS = re.compile(
    r"\b(?:storefront|store-page|store-hero|store-grid|store-card|store-top|"
    r"store-nav|store-cats|store-section|store-helper|shop-grid|mercado|tienda)\b",
    re.I,
)
STORE_ID = re.compile(r"\b(?:store|shop|mercado|tienda|store-title)\b", re.I)
BODY_TAG = re.compile(r"<body\b[^>]*>", re.I)
OPEN_TAG = re.compile(r"<(section|div|main|article|ul|ol|nav|header|aside)(\s[^>]*)?>", re.I)
TEXT_EXT = (".md", ".txt", ".json", ".srt", ".vtt", ".html", ".csv", ".yml", ".yaml")


def h(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def fold(text):
    return "".join(c for c in unicodedata.normalize("NFD", str(text)) if not unicodedata.combining(c)).lower()


def tokens(text):
    return [t for t in re.split(r"[^a-z0-9]+", fold(text)) if t]


def repo_sets(path=REPO_TERMS):
    """SINGLE / PAIRS / PLACE_PAIRS hash sets from private-terms.test.cjs (empty if missing)."""
    out = {"SINGLE": set(), "PAIRS": set(), "PLACE_PAIRS": set()}
    try:
        with open(path, encoding="utf-8") as fh:
            src = fh.read()
    except OSError:
        return out
    for name in out:
        m = re.search(r"const %s = new Set\(\[([^\]]*)\]\)" % name, src)
        if m:
            out[name] = set(re.findall(r"'([0-9a-f]{16})'", m.group(1)))
    return out


def term_sets(path=REPO_TERMS):
    r = repo_sets(path)
    return r["SINGLE"] | EXTRA_SINGLE, r["PAIRS"] | r["PLACE_PAIRS"] | EXTRA_PAIRS


def rel_path(path):
    if not path:
        return ""
    rel = str(path).replace("\\", "/")
    return rel.lstrip("./")


def site_rel(path):
    """Strip a leading drafts/ folder so marketplace and fiction path rules still apply."""
    return DRAFT_PREFIX.sub("", rel_path(path))


def is_marketplace_path(path):
    return bool(path) and bool(MARKETPLACE_PATH.search(site_rel(path)))


def is_fiction_path(path):
    if not path:
        return False
    rel = site_rel(path)
    return any(rx.search(rel) for rx in FICTION_PATHS)


def is_home_path(path):
    return bool(path) and bool(HOME_PATH.match(site_rel(path)))


def _matching_end(text, start, tag):
    """Return the index after the matching close tag, or len(text) if unclosed."""
    open_rx = re.compile(r"<%s\b" % re.escape(tag), re.I)
    close_rx = re.compile(r"</%s\s*>" % re.escape(tag), re.I)
    i, depth = start, 0
    while i < len(text):
        m_open, m_close = open_rx.search(text, i), close_rx.search(text, i)
        if m_close and (not m_open or m_close.start() < m_open.start()):
            depth -= 1
            i = m_close.end()
            if depth == 0:
                return i
            continue
        if not m_open:
            return len(text)
        if depth == 0 and m_open.start() == start:
            depth = 1
            gt = text.find(">", m_open.end() - 1)
            i = gt + 1 if gt != -1 else m_open.end()
            continue
        depth += 1
        gt = text.find(">", m_open.end() - 1)
        i = gt + 1 if gt != -1 else m_open.end()
    return len(text)


def store_regions(text):
    """Inclusive-start, exclusive-end ranges of the home store section (or the whole storefront page)."""
    body = BODY_TAG.search(text or "")
    if body:
        cls = re.search(r'\bclass="([^"]*)"', body.group(0), re.I)
        if cls and STORE_CLASS.search(cls.group(1)):
            return [(0, len(text))]
    regions = []
    for m in OPEN_TAG.finditer(text or ""):
        attrs = m.group(2) or ""
        cls = re.search(r'\bclass="([^"]*)"', attrs, re.I)
        iid = re.search(r'\bid="([^"]*)"', attrs, re.I)
        if not ((cls and STORE_CLASS.search(cls.group(1))) or (iid and STORE_ID.search(iid.group(1)))):
            continue
        regions.append((m.start(), _matching_end(text, m.start(), m.group(1))))
    merged = []
    for lo, hi in sorted(regions):
        if merged and lo <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], hi))
        else:
            merged.append((lo, hi))
    return merged


def in_regions(pos, regions):
    return any(lo <= pos < hi for lo, hi in regions)


def island_ok_at(path, text, pos):
    """Brain §3: island-name tokens are allowed only on marketplace, fiction, or the home store section."""
    if is_marketplace_path(path) or is_fiction_path(path):
        return True
    if is_home_path(path) and in_regions(pos, store_regions(text)):
        return True
    return False


def tokens_with_spans(text):
    """(token, line, start, end) over the original text, so phrase breaks can be read back."""
    out, line, i, n = [], 1, 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "\n":
            line += 1
            i += 1
            continue
        base = "".join(c for c in unicodedata.normalize("NFD", ch) if not unicodedata.combining(c)).lower()
        if base and re.match(r"[a-z0-9]", base[0]):
            start, tok, tok_line = i, base, line
            i += 1
            while i < n:
                ch2 = text[i]
                if ch2 == "\n":
                    break
                base2 = "".join(c for c in unicodedata.normalize("NFD", ch2) if not unicodedata.combining(c)).lower()
                if base2 and re.match(r"[a-z0-9]", base2[0]):
                    tok += base2
                    i += 1
                    continue
                if base2:
                    break
                i += 1  # combining marks already stripped from this code point
            out.append((tok, tok_line, start, i))
            continue
        i += 1
    return out


def tokens_with_lines(text):
    """(token, line) pairs. Kept for callers; prefers the span tokenizer."""
    return [(t, n) for t, n, _a, _b in tokens_with_spans(text)]


def phrase_hash(toks):
    return h(" ".join(toks))


def _is_emoji(ch):
    o = ord(ch)
    return (
        0x1F000 <= o <= 0x1FAFF
        or 0x1F1E6 <= o <= 0x1F1FF
        or 0x2600 <= o <= 0x27BF
        or 0x2300 <= o <= 0x23FF
        or 0x2B00 <= o <= 0x2BFF
        or o in (0x00A9, 0x00AE, 0x2122, 0x3030, 0x303D)
    )


def _at_line_start(text, pos):
    return pos == 0 or text[pos - 1] in "\n\r"


def _midline_list_gap(text, end_a, start_b):
    """True when the gap is only a mid-line list marker (hyphen, asterisk, plus, or 1.)."""
    gap = text[end_a:start_b]
    if "\n" in gap or "\r" in gap:
        return False
    if not MIDLINE_LIST_GAP.match(gap):
        return False
    return not _at_line_start(text, end_a)


def hard_break_between(text, end_a, start_b):
    """True if the live+AI bigram (or an AI-is-live n-gram) crosses a sentence, bullet, or list break.

    List-marker breaks (-, *, +, 1.) count only at a real line start (after a newline
    plus optional indent, or the start of the text), never mid-line. A mid-line
    period that is only an ordered-list marker is not a sentence end. Em dashes,
    colons, semicolons, and emoji are sentence-level breaks.
    """
    if start_b < end_a:
        return True
    gap = text[end_a:start_b]
    if not gap:
        return False
    if _midline_list_gap(text, end_a, start_b):
        return False
    if any(ch in SENTENCE_CHARS or ch in DASH_BREAK or _is_emoji(ch) for ch in gap):
        return True
    if HTML_BREAK.search(gap):
        return True
    if LINE_LIST_MARK.search(gap):
        return True
    if _at_line_start(text, end_a) and BOS_LIST_MARK.match(gap):
        return True
    return False


def live_ai_partner(toks, i, text):
    """Index of a following 'ai' that forms a live+AI bigram, skipping a mid-line '1.' marker."""
    if i + 1 < len(toks) and toks[i + 1][0] == "ai":
        return i + 1
    if i + 2 < len(toks) and toks[i + 1][0].isdigit() and toks[i + 2][0] == "ai":
        if _midline_list_gap(text, toks[i][3], toks[i + 2][2]):
            return i + 2
    return None


def is_neg_at(words, j):
    if j < 0 or j >= len(words):
        return False
    if words[j] in NEG:
        return True
    if words[j] == "t" and j > 0 and words[j - 1] in NEG_HEADS:
        return True
    if words[j] in NEG_HEADS and j + 1 < len(words) and words[j + 1] == "t":
        return True
    return False


def after_neg(words, j):
    """Index just after a negation token (or n't contraction) at j."""
    if words[j] in NEG_HEADS and j + 1 < len(words) and words[j + 1] == "t":
        return j + 2
    return j + 1


def liveness_denied(toks, start, end, text):
    """True only when a negation in the same sentence denies the liveness claim itself.

    A nearby no/not/never that talks about something else (never goes offline, not a gimmick,
    not a rumor) does not exempt the claim, and a denial in the next sentence does not either.
    """
    words = [t[0] for t in toks]
    lo, hi = _same_sentence_range(toks, start, end, text)
    live_i = start
    for k in range(start, end):
        if words[k] == "live":
            live_i = k
            break
    j = live_i - 1
    while j >= lo and words[j] in FILLER:
        j -= 1
    if j >= lo and is_neg_at(words, j):
        return True
    if j >= lo and words[j] in DENY_VERBS:
        j -= 1
        while j >= lo and words[j] in FILLER:
            j -= 1
        if j >= lo and is_neg_at(words, j):
            return True
    return _en_post_claim_denied(words, end, hi)


EN_COPULA = {"is", "are", "was", "were", "be", "been", "being", "s"}
EN_SUBJECT = {"it"}
EN_POST_SKIP = FILLER | EN_SUBJECT | {"now"}


def _en_post_claim_denied(words, end, hi):
    """True when a same-clause negation after the claim has AI or 'it' as its subject.

    'The live AI is not available' and '..., it is not ready' count. A trailing
    'not available in red' / 'not ready for merch' / 'not online shopping' does
    not, because that complement is not a clause with AI or 'it' as the subject.
    Contractions (isn't, aren't) count as a copula plus a negation.
    """
    saw_it = False
    saw_copula = False
    j = end
    while j < hi and words[j] in EN_POST_SKIP:
        if words[j] in EN_SUBJECT:
            saw_it = True
        if words[j] in EN_COPULA:
            saw_copula = True
        j += 1
    if j >= hi or not is_neg_at(words, j):
        return False
    # isn't / aren't / wasn't / ain't are copula+negation in one contraction.
    if words[j] in NEG_HEADS or (words[j] == "t" and j > 0 and words[j - 1] in NEG_HEADS):
        saw_copula = True
    if not (saw_it or saw_copula):
        return False
    k = after_neg(words, j)
    while k < hi and words[k] in (FILLER | {"now"}):
        k += 1
    return k < hi and words[k] in DENY_PREDICATES


ES_NEG = {"no", "nunca"}
ES_YET = {"aun", "todavia"}
ES_FILLER = {
    "la", "el", "las", "los", "lo", "un", "una", "unos", "unas",
    "nuestra", "nuestro", "nuestras", "nuestros", "su", "sus",
    "esta", "estan", "este", "estos", "estas", "estoy", "estamos",
    "es", "son", "era", "eran", "fue", "fueron", "sido",
    "ha", "han", "habia", "habian", "he", "hemos", "haya",
    "ya", "todavia", "aun", "siquiera", "tampoco",
    "de", "a", "en", "por", "para", "que", "se", "hay",
    "muy", "tan", "mas", "menos", "si", "o",
    "estado", "estando",
}
ES_DENY_VERBS = {
    "esta", "estan", "estar", "estuvo", "estuvieron", "estado",
    "funciona", "funcionan", "funcionar", "funcionando",
    "activa", "activar", "activan", "activado", "activada",
    "hay", "existe", "existen",
}
ES_DENY_PREDICATES = {
    "vivo", "directo", "disponible",
    "activa", "activo", "activas", "activos",
    "conectada", "conectado", "conectadas", "conectados",
    "lista", "listo", "listas", "listos",
    "operativa", "operativo", "online", "funcionando",
    "lanzada", "lanzado",
}


def _same_sentence_range(toks, start, end, text):
    """Inclusive lo, exclusive hi of tokens in the same sentence as toks[start:end]."""
    lo = start
    while lo > 0 and not hard_break_between(text, toks[lo - 1][3], toks[start][2]):
        lo -= 1
    hi = end
    while hi < len(toks) and not hard_break_between(text, toks[end - 1][3], toks[hi][2]):
        hi += 1
    return lo, hi


def _es_is_deny_word(w):
    return w in ES_DENY_PREDICATES or w in ES_DENY_VERBS


ES_AI_NOUNS = {"ia", "ias", "ai", "ais"}
ES_TIME_WORDS = {"ya", "ahora"}
ES_COPULA_WORDS = {
    "esta", "estan", "estara", "estaran",
    "es", "son", "sera", "seran",
}
ES_PRED_SINGLE = {
    "disponible", "disponibles",
    "activa", "activo", "activas", "activos",
    "funcionando",
    "lista", "listo", "listas", "listos",
}
ES_PRED_EN = {"vivo", "directo"}
EN_AI_NOUNS = {"ai", "ais"}
EN_TIME_WORDS = {"now"}
EN_PRED_WORDS = {"live", "available", "active", "ready", "online"}
EN_CLAIM_COPULA = {"is", "are", "was", "were", "s"}


def _unbroken(toks, start, last, text):
    return not hard_break_between(text, toks[start][3], toks[last][2])


def es_copula_live_end(toks, i, text):
    """End index of an ES copula live claim starting at IA / la IA / nuestra IA / AI.

    Pattern: IA or AI (gender and number variants) + optional ya/ahora +
    está/es/estará (and number/future variants) + optional ya/ahora +
    en vivo / en directo / disponible / activa / funcionando / lista
    (and gender/number variants).
    """
    words = [t[0] for t in toks]
    n = len(toks)
    if words[i] not in ES_AI_NOUNS:
        return None
    j = i + 1
    if j < n and words[j] in ES_TIME_WORDS and _unbroken(toks, i, j, text):
        j += 1
    if j >= n or words[j] not in ES_COPULA_WORDS or not _unbroken(toks, i, j, text):
        return None
    j += 1
    if j < n and words[j] in ES_TIME_WORDS and _unbroken(toks, i, j, text):
        j += 1
    if j >= n or not _unbroken(toks, i, j, text):
        return None
    if words[j] == "en" and j + 1 < n and words[j + 1] in ES_PRED_EN and _unbroken(toks, i, j + 1, text):
        return j + 2
    if words[j] in ES_PRED_SINGLE:
        return j + 1
    return None


def en_copula_live_end(toks, i, text):
    """End index of an EN copula live claim: AI + is/'s/now + live/available/active/ready/online."""
    words = [t[0] for t in toks]
    n = len(toks)
    if words[i] not in EN_AI_NOUNS:
        return None
    j = i + 1
    if j >= n or not _unbroken(toks, i, j, text):
        return None
    if words[j] in EN_TIME_WORDS:
        j += 1
        if j < n and words[j] in EN_CLAIM_COPULA and _unbroken(toks, i, j, text):
            j += 1
            if j < n and words[j] in EN_TIME_WORDS and _unbroken(toks, i, j, text):
                j += 1
    elif words[j] in EN_CLAIM_COPULA:
        j += 1
        if j < n and words[j] in EN_TIME_WORDS and _unbroken(toks, i, j, text):
            j += 1
    else:
        return None
    if j >= n or words[j] not in EN_PRED_WORDS or not _unbroken(toks, i, j, text):
        return None
    return j + 1


def es_liveness_denied(toks, start, end, text):
    """True only when a Spanish negation in the same sentence denies liveness itself.

    Bare nearby no/nunca (no un truco, no es un rumor, no voy in the next sentence)
    does not exempt. todavia/aún no, no está en vivo, no está activa, no funciona
    todavía, and nunca ha estado en vivo do.
    """
    words = [t[0] for t in toks]
    lo, hi = _same_sentence_range(toks, start, end, text)

    j = start - 1
    while j >= lo and words[j] in ES_FILLER and words[j] not in ES_NEG:
        j -= 1
    if j >= lo and words[j] in ES_NEG:
        return True
    if j >= lo and words[j] in ES_DENY_VERBS:
        j -= 1
        while j >= lo and words[j] in ES_FILLER and words[j] not in ES_NEG:
            j -= 1
        if j >= lo and words[j] in ES_NEG:
            return True

    j = end
    while j < hi and words[j] in ES_FILLER and words[j] not in ES_NEG and words[j] not in ES_YET:
        j += 1
    if j >= hi:
        return False
    if words[j] in ES_YET:
        k = j + 1
        while k < hi and words[k] in ES_FILLER and words[k] not in ES_NEG:
            k += 1
        return k < hi and words[k] in ES_NEG
    if words[j] in ES_NEG:
        k = j + 1
        found_yet = False
        while k < hi and words[k] in ES_FILLER:
            if words[k] in ES_YET:
                found_yet = True
            k += 1
        if k < hi and _es_is_deny_word(words[k]):
            return True
        if found_yet or (k < hi and words[k] in ES_YET):
            return True
    return False


def _norm_official(text):
    """Case-fold and collapse whitespace, including spaces around punctuation, for official wording."""
    t = re.sub(r"\s+", " ", fold(text)).strip()
    return re.sub(r"\s*([,.;:!?])\s*", r"\1", t)


def has_motion_official(text):
    n = _norm_official(text)
    return _norm_official(MOTION_OFFICIAL) in n or _norm_official(MOTION_OFFICIAL_ES) in n


def motion_needs_opener(text):
    raw = str(text)
    triggered = has_motion_official(raw) or bool(MOTION_LINK.search(raw))
    if not triggered:
        return False
    return MOTION_OPENER not in raw and MOTION_OPENER_ES not in raw


def lint_text(text, ai_voice=False, sets=None, path=None):
    single, pairs = sets or term_sets()
    issues = []
    raw = str(text)
    toks = tokens_with_spans(raw)
    words = [t for t, _n, _a, _b in toks]
    for i, (t, n, start, _end) in enumerate(toks):
        hid = h(t)
        if hid in single:
            if not (hid in ISLAND_SINGLE and island_ok_at(path, raw, start)):
                issues.append(("TERM", n, "term#" + hid))
        if i + 1 < len(toks):
            pair = h(t + " " + toks[i + 1][0])
            if pair in pairs:
                if not (pair in ISLAND_PAIRS and island_ok_at(path, raw, start)):
                    issues.append(("PAIR", n, "pair#" + pair))
            if t == "live":
                j = live_ai_partner(toks, i, raw)
                if j is not None and not hard_break_between(raw, toks[i][3], toks[j][2]) and not liveness_denied(toks, i, j + 1, raw):
                    issues.append(("TERM", n, "term#" + h("live ai")))
        if t in ES_AI_NOUNS or t in EN_AI_NOUNS:
            for ender, denier in (
                (en_copula_live_end, liveness_denied),
                (es_copula_live_end, es_liveness_denied),
            ):
                end = ender(toks, i, raw)
                if end is None:
                    continue
                if hard_break_between(raw, toks[i][3], toks[end - 1][2]):
                    continue
                if denier(toks, i, end, raw):
                    continue
                issues.append(("TERM", n, "term#" + phrase_hash(toks[j][0] for j in range(i, end))))
                break
        for ngram in range(3, 7):
            if i + ngram > len(toks):
                continue
            ph = phrase_hash(toks[j][0] for j in range(i, i + ngram))
            if ph not in EXTRA_PHRASES:
                continue
            if ph in AI_LIVE_PHRASES:
                if hard_break_between(raw, toks[i][3], toks[i + ngram - 1][2]):
                    continue
                if liveness_denied(toks, i, i + ngram, raw):
                    continue
            if ph in ES_LIVE_PHRASES:
                if hard_break_between(raw, toks[i][3], toks[i + ngram - 1][2]):
                    continue
                if es_liveness_denied(toks, i, i + ngram, raw):
                    continue
            issues.append(("TERM", n, "term#" + ph))
    if "candles" in tokens(text) and DISCLOSURE not in raw:  # exact case and wording
        issues.append(("DISCLOSURE", 0, "Candles mentioned without the exact line: " + DISCLOSURE))
    if motion_needs_opener(raw):
        issues.append(("DISCLOSURE", 0, "MOTION official wording or affiliate link without the exact opener: " + MOTION_OPENER))
    folded = fold(text)
    if ai_voice and not re.search(r"\bai[- ]?(generated )?voice\b", folded):
        issues.append(("AI-VOICE", 0, "--ai-voice set but the copy has no 'AI voice' disclosure"))
    return issues


def collect(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for root, _dirs, names in os.walk(p):
                files += [os.path.join(root, f) for f in sorted(names) if f.lower().endswith(TEXT_EXT)]
        else:
            files.append(p)
    return files


def main(argv=None):
    ap = argparse.ArgumentParser(description="DTRTLab copy gate (rules.md 8.4)")
    ap.add_argument("paths", nargs="+", help="draft files or folders")
    ap.add_argument("--ai-voice", action="store_true", help="the clip uses an AI voice; require a disclosure")
    ap.add_argument("--terms", default=REPO_TERMS,
                    help="path to scripts/private-terms.test.cjs (needed when this file runs outside the repo)")
    args = ap.parse_args(argv)
    if not repo_sets(args.terms)["SINGLE"]:
        # Without the repo lists only the extras would run, and drafts could pass on half the rules.
        print(f"FAIL: could not load the repo term lists from {args.terms}. Run from a repo checkout "
              "or pass --terms <repo>/scripts/private-terms.test.cjs", file=sys.stderr)
        return 2
    sets = term_sets(args.terms)
    files = collect(args.paths)
    if not files:
        print("FAIL: no draft files found in " + " ".join(args.paths), file=sys.stderr)
        return 2
    bad = 0
    for f in files:
        try:
            with open(f, encoding="utf-8", errors="replace") as fh:
                text = fh.read()
        except OSError as exc:
            print(f"FAIL {f}: unreadable ({type(exc).__name__})")
            bad += 1
            continue
        issues = lint_text(text, args.ai_voice, sets, path=f)
        bad += bool(issues)
        print(f"{'FAIL' if issues else 'PASS'} {f}: {len(issues)} issue(s)")
        for kind, n, detail in issues[:12]:
            print(f"   {kind:10} L{n}: {detail}")
        if len(issues) > 12:
            print(f"   ... {len(issues) - 12} more")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
