/* In-browser retrieval over DTRT Lab's public pages.
   window.DTRT_ASK_PROVIDER may later be { id, answer(question, corpus) }.
   This file does not call a model or send the question anywhere. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DTRTAsk = api;
})(typeof window === "undefined" ? null : window, function () {
  var STOP = new Set("a an the and or of to for in on at by with from is are was were be this that it as if you your we our".split(" "));

  function tokens(text) {
    var found = String(text || "").toLowerCase().match(/[a-z0-9]+/g) || [];
    return found.filter(function (word) { return word.length > 1 && !STOP.has(word); });
  }

  function indexCorpus(corpus) {
    var passages = (corpus && corpus.passages) || [];
    var docs = passages.map(function (passage) {
      return {
        passage: passage,
        tokens: tokens((passage.title || "") + " " + (passage.text || ""))
      };
    });
    var df = new Map();
    docs.forEach(function (doc) {
      var seen = new Set(doc.tokens);
      seen.forEach(function (token) { df.set(token, (df.get(token) || 0) + 1); });
    });
    var total = docs.reduce(function (sum, doc) { return sum + doc.tokens.length; }, 0);
    return { docs: docs, df: df, count: docs.length, average: total / (docs.length || 1) };
  }

  function search(question, corpus, limit) {
    var indexed = indexCorpus(corpus);
    var query = tokens(question);
    var k1 = 1.2;
    var b = 0.75;
    if (!query.length || !indexed.count) return [];
    var scored = indexed.docs.map(function (doc) {
      var tf = new Map();
      doc.tokens.forEach(function (token) { tf.set(token, (tf.get(token) || 0) + 1); });
      var score = 0;
      query.forEach(function (token) {
        var freq = tf.get(token) || 0;
        if (!freq) return;
        var docsWith = indexed.df.get(token) || 0;
        var idf = Math.log(1 + (indexed.count - docsWith + 0.5) / (docsWith + 0.5));
        var denom = freq + k1 * (1 - b + b * (doc.tokens.length / indexed.average));
        score += idf * ((freq * (k1 + 1)) / denom);
      });
      return { passage: doc.passage, score: score };
    });
    return scored
      .filter(function (item) { return item.score > 0; })
      .sort(function (left, right) { return right.score - left.score || left.passage.url.localeCompare(right.passage.url); })
      .slice(0, limit || 4);
  }

  function answer(question, corpus) {
    var custom = typeof window !== "undefined" ? window.DTRT_ASK_PROVIDER : null;
    if (custom && custom.id && custom.id !== "local-bm25" && typeof custom.answer === "function") {
      return Promise.resolve(custom.answer(question, corpus)).then(function (result) {
        return result || { provider: custom.id, matches: [] };
      });
    }
    return Promise.resolve({ provider: "local-bm25", matches: search(question, corpus, 4) });
  }

  return { tokens: tokens, search: search, answer: answer, provider: "local-bm25" };
});
