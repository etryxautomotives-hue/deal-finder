// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const B = createRequire(import.meta.url)("../site/basket.js");

const mk = (id, name, store, price) => ({ id, name, store, price });
const deals = [
  mk("1", "Halfvolle melk 1 L", "Lidl", 0.99),
  mk("2", "Melkchocolade", "Lidl", 0.79),
  mk("3", "Volle melk 1 L", "Aldi", 1.09),
  mk("4", "Filterkoffie 1 kg", "Aldi", 9.99),
  mk("5", "Kipfilet 600 g", "Aldi", 5.49),
  mk("6", "Kipfilet 500 g", "Lidl", 5.99),
  mk("7", "Koffie gemalen", "Delhaize", 4.5),
];
const items = qs => qs.map((q, i) => ({ id: "i" + i, q }));

test("a whole word beats part of a word, then the lowest price", () => {
  const [r] = B.compare(items(["melk"]), deals).items;
  assert.equal(r.byShop.Lidl.id, "1");   // not the chocolate, although it is cheaper
  assert.equal(r.best.id, "1");
});

test("compound words still count: filet finds kipfilet", () => {
  const [r] = B.compare(items(["filet"]), deals).items;
  assert.deepEqual(Object.keys(r.byShop).sort(), ["Aldi", "Lidl"]);
});

test("the end of a compound counts, the start doesn't: melkchocolade is not milk", () => {
  const more = [...deals, mk("8", "Melkchocolade", "Delhaize", 1.2), mk("9", "Oploskoffie", "Lidl", 3.2), mk("10", "Koffiebonen", "Lidl", 2)];
  const [melk, koffie] = B.compare(items(["melk", "koffie"]), more).items;
  assert.equal(melk.byShop.Delhaize, undefined);
  assert.equal(koffie.byShop.Lidl.id, "9");
  const [kip] = B.compare(items(["kipfilet"]), [mk("k", "Kipfiletreepjes", "Aldi", 3)]).items;
  assert.equal(kip.best.id, "k");   // only says how it is cut
});

test("typos don't put the wrong thing on a shopping list", () => {
  const [r] = B.compare(items(["mlek"]), deals).items;
  assert.equal(r.best, null);
});

test("shops rank on how many items are on promo, then on total", () => {
  const c = B.compare(items(["melk", "kipfilet", "koffie"]), deals);
  assert.equal(c.shops[0].chain, "Aldi");           // all three
  assert.equal(c.shops[0].n, 3);
  assert.equal(c.pick.chain, "Aldi");
});

test("the preferred shop comes first, with a tip when another is cheaper for the same items", () => {
  const c = B.compare(items(["melk", "kipfilet"]), deals, "Lidl");
  assert.equal(c.pick.chain, "Lidl");
  // Aldi: 1.09 + 5.49 = 6.58, Lidl: 0.99 + 5.99 = 6.98 -> only 0.40 cheaper, below the 0.50 we bother people with
  assert.equal(c.tip, null);
  const c2 = B.compare(items(["melk", "kipfilet", "koffie"]), deals, "Lidl");
  assert.equal(c2.tip.chain, "Aldi");
  assert.equal(c2.tip.more, 1);
});

test("a preferred shop without any of the items is said, not hidden", () => {
  const c = B.compare(items(["koffie"]), deals, "Colruyt");
  assert.equal(c.preferredMissing, true);
  assert.equal(c.pick.chain, "Delhaize");   // both have coffee, Delhaize's is cheaper
});
