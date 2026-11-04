/* deal'ke shopping list maths: which deal fits each product on your list, and which nearby shop is cheapest.
   Runs in the browser only. app.js uses window.DKBasket; tests/basket.test.mjs runs it in Node.

   A list item is what you need, in your own words ("koffie", "kipfilet"), not one specific promo, so it keeps
   working when next week's deals come in. For every item we look at this week's deals near you:
   - only exact matches count (no typo guesses: a wrong match on a shopping list costs money),
   - the word must be a whole word or the end of a compound ("melk" finds "Halfvolle melk", "koffie" finds
     "Oploskoffie", but "melk" never finds "Melkchocolade"); the product found is always shown,
   - then the lowest price you pay at the till.
   Shops are ranked by how many of your items they have on promo, then by the total for those items.
   Your preferred shop comes first, and we say when another shop is cheaper for the same items or has more. */
(function (root) {
  const S = root.DKSearch || (typeof require === "function" ? require("./search.js") : null);
  const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const toks = s => fold(s).split(/[^a-z0-9%]+/).filter(Boolean);

  // ...unless the rest only says how it is cut: "kipfiletreepjes" is still kipfilet, "kaasblokjes" still kaas
  const CUTS = /^(s|en|reepjes|blokjes|stukjes|plakjes|schijfjes|sneetjes|tranches|des|en tranches)$/;
  // how well one deal fits one item: 2 = every word is a whole word of the name or ends one, 1 = otherwise
  function fit(item, d) {
    const ws = S.qwords(item), name = toks(`${d.name} ${d.brand || ""}`);
    return ws.every(w => name.includes(w) || name.some(t => t.length > w.length &&
      (t.endsWith(w) || (t.startsWith(w) && CUTS.test(t.slice(w.length)))))) ? 2 : 1;
  }

  // every matching deal per shop for one item, best first
  function matchesFor(item, deals) {
    const res = S.search(deals, item);
    if (res.mode < 3) return [];
    const out = [];
    // In Dutch the last part of a compound word says what it is: "kipfilet" is a filet, "oploskoffie" is coffee,
    // but "melkchocolade" is chocolate. So the word must be a whole word or the end of one.
    for (const d of deals) if (res.hits.has(d.id) && fit(item, d) === 2) out.push({ d, fit: 2 });
    out.sort((a, b) => a.d.price - b.d.price);
    return out;
  }

  /* items: [{ id, q }]; deals: this week's deals near you; preferred: chain name or "".
     Returns { items: [{ item, best, byShop: {chain: deal} }], shops: [{ chain, deals: {itemId: deal}, n, total }],
               pick: the shop to show first, tip: { chain, cheaper, more } or null } */
  function compare(items, deals, preferred) {
    const rows = items.map(item => {
      const byShop = {};
      const all = matchesFor(item.q, deals);
      for (const { d } of all) if (!byShop[d.store]) byShop[d.store] = d;  // sorted, so each shop gets its best fit
      const best = Object.values(byShop).sort((a, b) => a.price - b.price)[0] || null;
      return { item, best, byShop };
    });
    const shops = {};
    for (const r of rows) for (const [chain, d] of Object.entries(r.byShop)) {
      const s = (shops[chain] ||= { chain, deals: {}, n: 0, total: 0 });
      s.deals[r.item.id] = d; s.n++; s.total += d.price;
    }
    const ranked = Object.values(shops).sort((a, b) => b.n - a.n || a.total - b.total || a.chain.localeCompare(b.chain));
    const mine = preferred && shops[preferred];
    const pick = mine || ranked[0] || null;
    let tip = null;
    if (pick) {
      for (const s of ranked) {
        if (s === pick) continue;
        // compare on the items both shops have, so a shop with fewer promos never looks cheaper by accident
        const both = Object.keys(pick.deals).filter(id => s.deals[id]);
        const diff = both.reduce((a, id) => a + pick.deals[id].price - s.deals[id].price, 0);
        const more = s.n - pick.n;
        if ((diff > 0.5 && more >= 0) || more > 0) { tip = { chain: s.chain, cheaper: diff > 0.5 ? Math.round(diff * 100) / 100 : 0, more: Math.max(more, 0), on: both.length }; break; }
      }
    }
    if (preferred && !mine) tip = null;
    return { items: rows, shops: ranked, pick, tip, preferredMissing: !!preferred && !mine };
  }

  const api = { compare, matchesFor, fit };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKBasket = api;
})(typeof window !== "undefined" ? window : globalThis);
