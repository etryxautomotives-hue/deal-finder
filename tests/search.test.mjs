// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const S = createRequire(import.meta.url)("../site/search.js");

const mk = (id, name, store = "ALDI", extra = {}) => ({ id, name, store, price: 2, ...extra });
const deals = [
  mk("a", "Kipfilet natuur", "ALDI", { cat: "meat" }),
  mk("b", "Halfvolle melk", "Lidl", { cat: "dairy" }),
  mk("c", "Griekse yoghurt", "Delhaize", { cat: "dairy" }),
  mk("d", "Coca-Cola Zero", "Lidl", { brand: "Coca-Cola", cat: "drinks" }),
  mk("e", "Biefstuk", "ALDI", { cat: "meat" }),
  mk("f", "Volle melk", "ALDI", { cat: "dairy" }),
];
const ids = (q, list = deals) => [...S.search(list, q).hits.keys()].sort().join("");

test("exact words still match like before", () => {
  assert.equal(ids("melk"), "bf");
  assert.equal(ids("filet"), "a");            // inside a compound word
  assert.equal(ids("aldi melk"), "f");
});
test("typos find the product when nothing matches exactly", () => {
  assert.equal(ids("kipfillet"), "a");
  assert.equal(ids("mkel"), "bf");            // swapped letters
  assert.equal(ids("yoghurth"), "c");
  assert.equal(ids("yogurt"), "c");
  assert.equal(ids("cocacola"), "d");
  assert.equal(ids("biefstukk"), "e");
});
test("short words are never fuzzy, and exact beats close", () => {
  assert.equal(ids("mel"), "bf");
  assert.equal(ids("xyz"), "");
  assert.equal(S.search(deals, "melk").mode, 3);
  assert.ok(S.search(deals, "mlek").mode < 3);
});
test("a typo with the right first letter beats one without", () => {
  const list = [mk("k", "Jonge kaas"), mk("p", "Passata")];
  assert.equal(ids("kass", list), "k");
});
test("history ranks what you open and search first", () => {
  const now = Date.now();
  let h = S.empty();
  assert.deepEqual(S.suggest(deals, "melk", h, now).deals.map(d => d.id).sort(), ["b", "f"]);
  S.bump(h, "p", S.productKey(deals[5]), 1, now - 60e3);
  S.bump(h, "p", S.productKey(deals[5]), 1, now);
  assert.equal(S.suggest(deals, "melk", h, now).deals[0].id, "f");
  assert.equal(S.favourites(deals, h, now)[0].id, "f");
});
test("old clicks fade and repeated clicks within 10 s count once", () => {
  const now = Date.now(), h = S.empty();
  assert.equal(S.bump(h, "q", "melk", 1, now), true);
  assert.equal(S.bump(h, "q", "melk", 1, now + 1000), false);
  assert.ok(Math.abs(S.weight([4, now - 30 * 864e5], now) - 2) < 1e-9);
});
test("merging two devices never double counts", () => {
  const a = { q: { melk: [3, 10] }, p: {}, c: {} }, b = { q: { melk: [2, 20], kaas: [1, 5] }, p: {}, c: {} };
  const m = S.merge(a, b);
  assert.deepEqual(m.q, { melk: [3, 20], kaas: [1, 5] });
  assert.deepEqual(S.merge(m, b).q, m.q);
});
test("recent searches complete what you type", () => {
  const now = Date.now(), h = { q: { kipfilet: [5, now], kippenbouten: [1, now - 1e5], melk: [1, now] }, p: {}, c: {} };
  assert.deepEqual(S.recent(h, now, "kip", 3), ["kipfilet", "kippenbouten"]);
  assert.equal(S.recent(h, now, "", 5)[0] !== undefined, true);
});
