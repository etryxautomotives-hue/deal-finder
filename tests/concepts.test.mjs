// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const K = req("../site/concepts.js");
const S = req("../site/search.js");

const type = (n, b = "", l = "nl") => K.analyse(n, b, l).type;
test("a product is what it is, not what it tastes of", () => {
  assert.equal(type("Kipfiletreepjes"), "chicken");
  assert.equal(type("Santa Maria Kruiden, Kip, Mix", "Santa Maria"), "spices");
  assert.equal(type("Friskies Kattenvoeding, Adult, Brokjes, Kip", "Friskies"), "pet");
  assert.equal(type("Brothway Kip, Thai, Bouillon, Bio", "Brothway"), "stock");
  assert.equal(type("Knorr Soep in brik, Kip en vermicelli, 1 L", "Knorr"), "soup");
  assert.equal(type("Liebig Cubes - Bouillon de poulet", "Liebig", "fr"), "stock");
  assert.equal(type("Poulet de Wallonie Filet de poulet", "Poulet de Wallonie", "fr"), "chicken");
  assert.equal(type("Greenway Just like chicken, Vegan", "Greenway"), "meat_sub");
  assert.equal(type("Melkchocolade"), "chocolate");
  assert.equal(type("Halfvolle melk"), "milk");
  assert.equal(type("Pommes de terre", "", "fr"), "potato");
  assert.equal(type("Contrefilet de bœuf", "", "fr"), "beef");
  assert.equal(type("Groentenfrieten, Kruiden"), "fries");
  assert.equal(type("Champignons"), "mushroom");          // not ham
  assert.equal(type("Vanille-ijs, Doos"), "icecream");
});

const mk = (id, name, extra = {}) => ({ id, name, store: "Delhaize", price: 2, ...extra });
const deals = [
  mk("spice", "Santa Maria Kruiden, Kip, Mix", { brand: "Santa Maria", price: 1 }),
  mk("cat", "Friskies Kattenvoeding, Adult, Brokjes, Kip", { brand: "Friskies", price: 0.5 }),
  mk("fil", "Kipfiletreepjes", { price: 5 }),
  mk("pou", "Filet de poulet", { language: "fr", price: 6 }),
  mk("gou", "Gouda, Jong, Blok"),
  mk("brie", "Brie de Meaux", { language: "fr" }),
  mk("choc", "Melkchocolade"),
  mk("milk", "Halfvolle melk"),
  mk("tom1", "Tomaatjes cherry"),
  mk("tom2", "Tomaten tros"),
  mk("whey", "Proteinen, Whey, Chocolade"),
  mk("coke", "Coca-Cola Zero", { brand: "Coca-Cola" }),
  mk("zalm", "Gerookte zalm"),
];
const order = q => { const r = S.search(deals, q); return deals.filter(d => r.hits.has(d.id)).sort((a, b) => r.hits.get(b.id) - r.hits.get(a.id)).map(d => d.id); };
test("kip: real chicken first, then what contains it, cat food last", () => {
  const o = order("kip");
  assert.deepEqual(o.slice(0, 2).sort(), ["fil", "pou"]);
  assert.equal(o[o.length - 1], "cat");
  assert.ok(o.indexOf("spice") < o.indexOf("cat"));
});
test("kipkruiden and kruiden put the spice mix first", () => {
  assert.equal(order("kipkruiden")[0], "spice");
  assert.equal(order("kruiden")[0], "spice");
});
test("the same idea in every language", () => {
  assert.deepEqual(order("chicken").slice(0, 2).sort(), ["fil", "pou"]);
  assert.deepEqual(order("poulet").slice(0, 2).sort(), ["fil", "pou"]);
  assert.deepEqual(order("fromage").sort(), ["brie", "gou"]);
  assert.deepEqual(order("vis"), ["zalm"]);
});
test("a kind of product: the ones with that name first, then the same kind", () => {
  assert.deepEqual(order("gouda"), ["gou", "brie"]);
});
test("close matches show with exact ones: tomaat finds tomaten too", () => {
  assert.deepEqual(order("tomaat").sort(), ["tom1", "tom2"]);
});
test("food words don't hide inside other words", () => {
  assert.deepEqual(order("melk")[0], "milk");
  assert.ok(!order("cola").includes("whey"));          // "cola" is not in "chocolade"
  assert.deepEqual(order("cola"), ["coke"]);
});
test("typos still find the idea", () => {
  assert.deepEqual(order("chiken").slice(0, 2).sort(), ["fil", "pou"]);
  assert.equal(S.search(deals, "chiken").mode, 2);       // the site says it shows close matches
});
