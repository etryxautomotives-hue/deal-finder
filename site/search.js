/* deal'ke search: finds what people mean, forgives typos, and puts your own favourites first.
   Runs in the browser only (no server, no AI). app.js uses window.DKSearch; tests/search.test.mjs runs it in Node.

   1. What the product IS (concepts.js): every product gets a type ("Santa Maria Kruiden, Kip" is a spice mix
      that contains chicken; "Kipfiletreepjes" is chicken). A search for "kip" shows real chicken first, then
      products that only contain or taste of chicken (spice mixes, soup, pizza), and things that are not food
      for people (cat food) last. "kipkruiden" or "kruiden" puts the spice mixes first instead.
   2. Words in any language: "chicken", "poulet" and "kip" are the same idea, "vis" finds zalm and kabeljauw,
      "kaas" finds "fromage". A word we know as a food only counts at the start of a word in the name, so "ei"
      finds eggs, not every name with "ei" inside it.
   3. Typos: words of 4+ letters may have 1 typo, words of 8+ letters 2 (a wrong, missing, extra or swapped
      letter), so "kipfillet", "yoghurth", "mkel" still work. Close matches of longer words ("tomaat" for
      "Tomaten") show even when there are exact ones, just below them.
   4. Personal ranking: every search you make and every product you open or add to your list is counted, and
      older counts fade (half-life 30 days). Within each group above, your favourites come first. */
(function (root) {
  const K = root.DKConcepts || (typeof require === "function" ? require("./concepts.js") : null);
  const fold = s => String(s || "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").normalize("NFD").replace(/[̀-ͯ]/g, "");
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
      d._sx = { name, toks: words(`${d.name} ${d.brand || ""}`), hay: d.hay || fold(`${d.name} ${d.brand || ""} ${d.store}`),
        k: d.pk || (K ? K.analyse(d.name, d.brand, d.language) : { type: null, all: [], marks: [] }) };
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
  // Which ideas each query word stands for. "kipkruiden" needs both chicken and spices; "vis" any fish.
  const wordCache = new Map();
  function wordConcepts(w) {
    if (!K) return null;
    if (!wordCache.has(w)) {
      const cs = K.conceptsOfWord(w);
      const a = !known(w) ? K.analyse(w, "", "nl").all.filter(c => !K.C[c].marker) : [];
      const kind = !cs.length ? K.kindOf(w) : [];
      const typo = !cs.length && !known(w) && w.length >= 4 ? K.conceptsOfWord(w, editIn) : [];
      wordCache.set(w, a.length > 1 ? { all: a } : cs.length ? { any: cs } : kind.length ? { any: kind, kind: true }
        : typo.length ? { any: typo, typo: true } : null);
    }
    return wordCache.get(w);
  }
  const known = w => !!K && K.WORD_SET.has(w);
  const has = (x, c) => x.k.all.some(a => K.isA(a, c)) || (K.C[c].marker && x.k.marks && x.k.marks.includes(c));
  // One product against the query: [level, score] or [0, 0]. Level 3 = exact or same idea, 2/1 = close (typo).
  function dealMatch(ws, wc, d) {
    const x = prep(d); let level = 3, sum = 0;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i], cw = wc[i];
      if (cw && (cw.all ? cw.all.every(c => has(x, c)) : cw.any.some(c => has(x, c)))) {
        // "chiken" is chicken but was a typo; "gouda" finds other cheese too, after the products called gouda
        if (cw.typo || (cw.kind && !x.toks.some(t => t === w || t.startsWith(w) || (w.length > 3 && t.endsWith(w))))) {
          if (level > 2) level = 2; sum += 0.5;
        } else sum += 1;
        continue;
      }
      let [l, s] = wordMatch(w, x);
      if (l === 3 && (cw || known(w)) && !x.toks.some(t => t === w || (w.length > 3 && t.startsWith(w)))) l = 0;  // "ei" is not in "eiwit", "cola" not in "chocolade"
      if (!l) return [0, 0];
      if (l < level) level = l; sum += s;
    }
    return [level, sum / ws.length];
  }
  // Group of a product for this query: 3 it IS what you look for, 2 it contains it or no idea known, 1 not food
  function tierOf(head, d) {
    if (!head || !K) return 2;
    const t = prep(d).k.type;
    if (t && K.isA(t, head)) return 3;
    if (t && K.C[t].strong) return 1;
    return 2;
  }

  // The whole catalogue against a query. hits: id -> rank (higher first): group, then exact before close.
  let cache = { q: null, deals: null, res: null };
  function search(deals, q) {
    if (cache.q === q && cache.deals === deals) return cache.res;
    let ws = qwords(q); const hits = new Map();
    if (ws.length > 1 && known(ws.join(" "))) ws = [ws.join(" ")];             // "pommes de terre", "cat food": one idea
    // a word with a typo-guessed idea that is spelled exactly like this in some product name is no typo ("filet")
    const wc = ws.map(w => { const c = wordConcepts(w); return c && c.typo && deals.some(d => prep(d).hay.includes(w)) ? null : c; });
    const head = K && ws.length ? K.queryHead(ws.join(" "), wc.map(c => c ? (c.all || c.any) : [])) : null;
    let mode = 0;
    if (ws.length) {
      const all = [];
      for (const d of deals) { const [l, s] = dealMatch(ws, wc, d); if (l) { all.push([d, l, s]); if (l > mode) mode = l; } }
      // close matches join the exact ones when every unsure word is long enough to be clear ("tomaat" ~ "tomaten")
      // products of the same kind ("gouda" -> other cheese) always stay, below the exact ones
      const related = wc.some(c => c && c.kind);
      const minKeep = related ? Math.min(2, mode) : mode === 3 ? (ws.every((w, i) => w.length >= 6 && !wc[i] && !known(w)) ? 2 : 3) : mode;
      for (const [d, l, s] of all) if (l >= minKeep) hits.set(d.id, tierOf(head, d) * 10 + l * 2 + s);
    }
    const res = { q, words: ws, mode, hits, head };
    cache = { q, deals, res };
    return res;
  }
  // The group a hit belongs to (same group = same kind of match); the list sorts by price within a group
  const group = (res, d) => Math.floor((res.hits.get(d.id) || 0) / 2) * 2;

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
      rows.push({ d, score: res.hits.get(d.id) * 10 + personal(h, d, now, topQ) });
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

  const api = { fold, qwords, editIn, search, group, tierOf, topQueries, suggest, favourites, recent, bump, prune, merge, empty, clean, weight, productKey, personal };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
