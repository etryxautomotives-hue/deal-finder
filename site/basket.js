/* deal'ke shopping list maths: which deal fits each product on your list, and which nearby shop is cheapest.
   Runs in the browser only. app.js uses window.DKBasket; tests/basket.test.mjs runs it in Node.

   A list item is what you need, in your own words ("koffie", "kipfilet"), not one specific promo, so it keeps
   working when next week's deals come in. For every item we look at this week's deals near you:
   - only exact matches count (no typo guesses: a wrong match on a shopping list costs money),
   - the word must be a whole word or the end of a compound ("melk" finds "Halfvolle melk", "koffie" finds
     "Oploskoffie", but "melk" never finds "Melkchocolade"); the product found is always shown,
   - when we know what the item is ("kip" is chicken), the product must be that thing, not a spice mix or soup
     that only contains it, in any language ("chicken" finds "Filet de poulet"),
   - then the lowest price you pay at the till.
   Shops are ranked by how many of your items they have on promo, then by the total for those items.
   Your preferred shop comes first, and we say when another shop is cheaper for the same items or has more.
   Money saved: only items ticked as bought count (normal price minus deal price), per week and month. */
(function (root) {
  const S = root.DKSearch || (typeof require === "function" ? require("./search.js") : null);
  const fold = s => String(s || "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").normalize("NFD").replace(/[̀-ͯ]/g, "");
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
    // When we know what the item is (concepts.js), the product must BE that: "kip" on your list is chicken, not
    // "Santa Maria Kruiden, Kip"; "chicken" also finds "Filet de poulet". Otherwise the word rule above.
    for (const d of deals) if (res.hits.has(d.id) && (res.head ? S.tierOf(res.head, d) === 3 : fit(item, d) === 2)) out.push({ d, fit: 2 });
    out.sort((a, b) => a.d.price - b.d.price);
    return out;
  }

  // Going to a second shop costs time, so we only suggest it when it saves a lot (Miro: €30 or more).
  const SPLIT_MIN = 30;
  // Best second shop to add to `pick`: each item goes to whichever of the two is cheaper.
  function splitFor(rows, pick, ranked) {
    if (!pick) return null;
    let best = null;
    for (const s of ranked) {
      if (s === pick) continue;
      let save = 0; const moved = [];
      for (const r of rows) {
        const a = r.byShop[pick.chain], b = r.byShop[s.chain];
        if (a && b && b.price < a.price) { save += a.price - b.price; moved.push(r.item.id); }
      }
      save = Math.round(save * 100) / 100;
      if (save >= SPLIT_MIN && (!best || save > best.save)) best = { chain: s.chain, save, moved };
    }
    return best;
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
    return { items: rows, shops: ranked, pick, tip, split: splitFor(rows, pick, ranked), preferredMissing: !!preferred && !mine };
  }

  // ---------- money saved ----------
  // What you save on one deal: the store's normal price minus the deal price. Without a normal price we only count
  // deals whose saving follows from the deal itself: 1+1 saves one pack, 2+1 half a pack per pack paid, etc.
  function saveOf(d) {
    if (!d) return 0;
    if (d.old_price > d.price) return Math.round((d.old_price - d.price) * 100) / 100;
    const m = /^(\d+)\+(\d+)$/.exec(d.deal_kind || d.kind || "");
    if (m) return Math.round(d.price * (+m[2] / +m[1]) * 100) / 100;
    if ((d.deal_kind || d.kind) === "2nd_half") return Math.round(d.price * 0.5 * 100) / 100;
    return 0;
  }
  const dayOf = t => new Date(t).toISOString().slice(0, 10);
  /* bought: [{ k, day: "YYYY-MM-DD", name, store, paid, save }]. Only what people tick as bought counts, so the
     number is honest. Returns this month, this week (Mon-Sun), last month, and the shop where you saved most. */
  function savings(bought, now) {
    const d = new Date(now), ym = dayOf(now).slice(0, 7);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
    const mon = new Date(now - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
    let month = 0, week = 0, lastMonth = 0, n = 0; const byShop = {};
    for (const b of bought || []) {
      const v = +b.save || 0;
      if (b.day.slice(0, 7) === ym) { month += v; n++; byShop[b.store] = (byShop[b.store] || 0) + v; }
      if (b.day.slice(0, 7) === last) lastMonth += v;
      if (b.day >= mon) week += v;
    }
    const top = Object.entries(byShop).sort((a, b) => b[1] - a[1])[0];
    const r = x => Math.round(x * 100) / 100;
    return { month: r(month), week: r(week), lastMonth: r(lastMonth), items: n, topShop: top && top[1] > 0 ? top[0] : null };
  }
  // keep a year, at most 500 ticks, so the account row stays small
  const pruneBought = (bought, now) => (bought || []).filter(b => b.day >= dayOf(now - 366 * 864e5)).slice(-500);

  const api = { SPLIT_MIN, compare, matchesFor, fit, saveOf, savings, pruneBought, dayOf };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKBasket = api;
})(typeof window !== "undefined" ? window : globalThis);
