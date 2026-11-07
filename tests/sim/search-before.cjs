/* deal'ke search: typo-tolerant product matching and a personal ranking from your own searches and clicks.
   Runs in the browser only (no server, no AI). app.js uses window.DKSearch; tests/search.test.mjs runs it in Node.

   Matching, per word of the query:
   - exact:  the word appears in the product's name, brand or store ("filet" finds "Kipfilet"), as before
   - fuzzy:  only when nothing matches exactly. Words of 4+ letters may have 1 typo, words of 8+ letters 2
             (a typo = a wrong, missing, extra or swapped letter), so "kipfillet", "yoghurth", "mkel" still work.
   Personal ranking: every search you make and every product you open or add to your list is counted, and older
   counts fade (half-life 30 days). Products you open often, and products matching what you often search, come first. */
(function (root) {
  const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const words = s => fold(s).split(/[^a-z0-9%]+/).filter(Boolean);
  const qwords = q => fold(q).split(/\s+/).map(w => w.replace(/^[^a-z0-9%]+|[^a-z0-9%]+$/g, "")).filter(Boolean);
  const allowed = w => w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0;

  // Edit distance (with swapped letters) between word w and the best-matching part of text.
  // anywhere=false: the part must be the start of text (prefix match); true: any part (Sellers' algorithm).
  function editIn(w, text, anywhere, cap) {
    const m = w.length, n = text.length;
    let p2 = null, p1 = new Array(n + 1), cur;
    for (let j = 0; j <= n; j++) p1[j] = anywhere ? 0 : j;
    for (let i = 1; i <= m; i++) {
      cur = new Array(n + 1); cur[0] = i;
      let rowMin = cur[0];
      for (let j = 1; j <= n; j++) {
        let v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + (w[i - 1] === text[j - 1] ? 0 : 1));
        if (p2 && j > 1 && w[i - 1] === text[j - 2] && w[i - 2] === text[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        cur[j] = v; if (v < rowMin) rowMin = v;
      }
      if (rowMin > cap) return cap + 1;   // can't get better further down
      p2 = p1; p1 = cur;
    }
    let best = Infinity; for (let j = anywhere ? 1 : 0; j <= n; j++) if (p1[j] < best) best = p1[j];
    return best;
  }

  function prep(d) {
    if (!d._sx) {
      const name = fold(d.name);
      d._sx = { name, toks: words(`${d.name} ${d.brand || ""}`), hay: d.hay || fold(`${d.name} ${d.brand || ""} ${d.store}`) };
    }
    return d._sx;
  }

  // One word against one product: [level, score]. Levels: 3 exact; 2 one typo away from the start of a word, first
  // letter right (people rarely miss the first letter: "kass" means "kaas", not "passata"); 1 any other close match; 0 none
  function wordMatch(w, x) {
    if (x.hay.includes(w)) {
      if (x.toks.some(t => t.startsWith(w))) return [3, 1];
      return [3, x.name.includes(w) ? 0.8 : 0.6];
    }
    const k = allowed(w); if (!k) return [0, 0];
    let best = k + 1, first = false;
    for (const t of x.toks) {
      const e = editIn(w, t, false, k);
      if (e <= k && (e < best || (e === best && t[0] === w[0]))) { best = e; first = t[0] === w[0]; }
    }
    if (best <= k) return first ? [2, 0.5 - 0.1 * best] : [1, 0.4 - 0.1 * best];
    if (w.length >= 5 && editIn(w, x.name.replace(/[^a-z0-9%]+/g, ""), true, k) <= k) return [1, 0.3]; // typo inside a compound word
    return [0, 0];
  }
  function dealMatch(ws, d) {
    const x = prep(d); let level = 3, sum = 0;
    for (const w of ws) { const [l, s] = wordMatch(w, x); if (!l) return [0, 0]; if (l < level) level = l; sum += s; }
    return [level, sum / ws.length];
  }

  // The whole catalogue against a query. Exact matches win; close matches only show when nothing matches exactly.
  let cache = { q: null, deals: null, res: null };
  function search(deals, q) {
    if (cache.q === q && cache.deals === deals) return cache.res;
    const ws = qwords(q), hits = new Map();
    let mode = 0;
    if (ws.length) {
      const all = [];
      for (const d of deals) { const [l, s] = dealMatch(ws, d); if (l) { all.push([d, l, s]); if (l > mode) mode = l; } }
      for (const [d, l, s] of all) if (l === mode) hits.set(d.id, s);
    }
    const res = { q, words: ws, mode, hits };
    cache = { q, deals, res };
    return res;
  }

  // ---------- personal history ----------
  // { q: { "kipfilet": [count, lastSeenMs] }, p: { "<product name>": [count, ms] }, c: { "<category>": [count, ms] } }
  const DAY = 864e5, HALF = 30;
  const empty = () => ({ q: {}, p: {}, c: {} });
  const clean = h => ({ q: { ...(h && h.q) }, p: { ...(h && h.p) }, c: { ...(h && h.c) } });
  const weight = (e, now) => !e ? 0 : e[0] * Math.pow(0.5, Math.max(0, now - e[1]) / DAY / HALF);
  const productKey = d => fold(d.name).replace(/\s+/g, " ").trim();

  function bump(h, kind, key, by, now) {
    if (!key) return false;
    const e = h[kind][key];
    if (e && now - e[1] < 10e3) return false;            // the same thing twice within 10 s counts once
    h[kind][key] = [(e ? e[0] : 0) + by, now];
    return true;
  }
  function prune(h, now) {
    const keep = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => weight(b[1], now) - weight(a[1], now)).slice(0, n));
    return { q: keep(h.q, 60), p: keep(h.p, 200), c: keep(h.c, 30) };
  }
  // Two devices: keep the higher count and the latest time per item (so merging twice never double counts)
  function merge(a, b) {
    const out = empty();
    for (const k of ["q", "p", "c"]) for (const src of [a && a[k], b && b[k]]) for (const [key, e] of Object.entries(src || {})) {
      if (!Array.isArray(e) || e.length < 2) continue;
      const o = out[k][key]; out[k][key] = o ? [Math.max(o[0], e[0]), Math.max(o[1], e[1])] : [+e[0], +e[1]];
    }
    return out;
  }
  // Past searches, most relevant first; with a prefix only the ones that start with it
  function recent(h, now, prefix, n) {
    const p = fold(prefix || "").trim();
    return Object.entries(h.q).filter(([k]) => !p || (k.startsWith(p) && k !== p))
      .sort((a, b) => (p ? weight(b[1], now) - weight(a[1], now) : b[1][1] - a[1][1])).slice(0, n).map(([k]) => k);
  }
  // How much this person likes this deal: products they open or add, and what they usually search for
  function personal(h, d, now, topQ) {
    const lg = v => Math.log2(1 + v);
    let s = lg(weight(h.p[productKey(d)], now)) * 1.5;
    if (topQ) { const x = prep(d); let qb = 0; for (const [ws, w] of topQ) if (ws.every(t => x.hay.includes(t)) && w > qb) qb = w; s += lg(qb) * 0.6; }
    s += lg(weight(h.c[d.cat || d.category], now)) * 0.2;
    return s;
  }
  const topQueries = (h, now, n = 20) => Object.entries(h.q).map(([k, e]) => [qwords(k), weight(e, now)])
    .filter(([ws]) => ws.length).sort((a, b) => b[1] - a[1]).slice(0, n);

  // Suggestions while typing: one row per product (cheapest store first), best match + your favourites on top
  function suggest(deals, q, h, now, opts = {}) {
    const n = opts.n || 6, ok = opts.filter || (() => true);
    const res = search(deals, q), topQ = topQueries(h, now);
    const rows = [];
    for (const d of deals) {
      if (!res.hits.has(d.id) || !ok(d)) continue;
      rows.push({ d, score: res.hits.get(d.id) * 3 + personal(h, d, now, topQ) });
    }
    rows.sort((a, b) => b.score - a.score || (a.d.unit_price || a.d.price || 0) - (b.d.unit_price || b.d.price || 0));
    const seen = new Set(), out = [];
    for (const r of rows) { const k = productKey(r.d) + "|" + r.d.store; if (seen.has(k)) continue; seen.add(k); out.push(r.d); if (out.length >= n) break; }
    return { deals: out, fuzzy: res.mode < 3, total: res.hits.size };
  }
  // With an empty search box: deals on promo now for the products you open and search most
  function favourites(deals, h, now, opts = {}) {
    const n = opts.n || 4, ok = opts.filter || (() => true), topQ = topQueries(h, now, 10);
    if (!Object.keys(h.p).length && !topQ.length) return [];
    const seen = new Set();
    return deals.filter(ok).map(d => ({ d, s: personal(h, d, now, topQ) })).filter(r => r.s >= 1)
      .sort((a, b) => b.s - a.s).filter(r => { const k = productKey(r.d); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, n).map(r => r.d);
  }

  const api = { fold, qwords, editIn, search, suggest, favourites, recent, bump, prune, merge, empty, clean, weight, productKey, personal };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
