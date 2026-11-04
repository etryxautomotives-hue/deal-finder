// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const D = createRequire(import.meta.url)("../site/diet.js");
const d = (name, category, extra = {}) => ({ name, category, ...extra });
const ok = (x, k) => D.fits(x, [k]);

test("vegetarian leaves out meat and fish, keeps the rest", () => {
  assert.equal(ok(d("Kipreepjes wok XXL", "meat_fish"), "veg"), false);
  assert.equal(ok(d("HERTA Superieur ham", null), "veg"), false);
  assert.equal(ok(d("Champignons", "fruit_veg"), "veg"), true);    // "ham" in the middle is not ham
  assert.equal(ok(d("VEMONDO Falafel", "meat_fish"), "veg"), true); // said so on the pack
  assert.equal(ok(d("Wasmiddel", "household"), "veg"), false);      // not food
});

test("no milk: dairy and milky names out, lettuce stays", () => {
  assert.equal(ok(d("Halfvolle melk", "dairy"), "nomilk"), false);
  assert.equal(ok(d("Melkchocolade", "snacks"), "nomilk"), false);
  assert.equal(ok(d("Laitue iceberg", "fruit_veg"), "nomilk"), true);
  assert.equal(ok(d("ALPRO Soja", "dairy"), "nomilk"), true);
});

test("gluten-free only where we can be sure", () => {
  assert.equal(ok(d("Broccoli", "fruit_veg"), "gf"), true);
  assert.equal(ok(d("Kippenhaasjes XXL", "meat_fish"), "gf"), true);
  assert.equal(ok(d("Cordon bleu krokant", "meat_fish"), "gf"), false);
  assert.equal(ok(d("Spaghetti", "pantry"), "gf"), false);
  assert.equal(ok(d("Chips paprika", "snacks"), "gf"), false);      // unsure aisle: left out
  assert.equal(ok(d("Glutenvrije pasta", "pantry"), "gf"), true);
});

test("halal: no pork or alcohol, meat only when labelled", () => {
  assert.equal(ok(d("Varkenshaasje", "meat_fish"), "halal"), false);
  assert.equal(ok(d("Kipfilet", "meat_fish"), "halal"), false);
  assert.equal(ok(d("Kipfilet halal", "meat_fish"), "halal"), true);
  assert.equal(ok(d("Zalmfilet", "meat_fish"), "halal"), true);
  assert.equal(ok(d("Leffe blond", "drinks"), "halal"), false);
  assert.equal(ok(d("Appelsap", "drinks"), "halal"), true);
});

test("nuts, vegan, organic", () => {
  assert.equal(ok(d("KINDER, NUTELLA B-ready", "snacks"), "nonuts"), false);
  assert.equal(ok(d("Hazelnootpasta", "pantry"), "nonuts"), false);
  assert.equal(ok(d("Bananen", "fruit_veg"), "vegan"), true);
  assert.equal(ok(d("Prei", "fruit_veg"), "vegan"), true);           // "ei" only as a whole word
  assert.equal(ok(d("Volle yoghurt", "dairy"), "vegan"), false);
  assert.equal(ok(d("Bio wortelen", "fruit_veg"), "bio"), true);
  assert.equal(ok(d("Wortelen", "fruit_veg"), "bio"), false);
  assert.equal(D.fits(d("Bio volle melk", "dairy"), ["bio", "nomilk"]), false);  // every choice must fit
});

test("pet food and paté never pass as people food or vegetarian", () => {
  assert.equal(ok(d("Delicatessen in gelei, 40 st. Sheba", "pantry"), "veg"), false);
  assert.equal(ok(d("Wildpaté Gourmet Finest Cuisine", "pantry"), "veg"), false);
  assert.equal(ok(d("Bolognesesaus Manna", "pantry"), "halal"), false);
  assert.equal(ok(d("Kaasburger met spek", "meat_fish"), "gf"), false);
});

test("recipe ingredients: only their words count", () => {
  assert.equal(D.ingredientFits({ name: "Bloem farine", category: "" }, ["gf"]), false);
  assert.equal(D.ingredientFits({ name: "Zout", category: "" }, ["gf", "veg", "halal"]), true);
  assert.equal(D.ingredientFits({ name: "Stoofvlees rundvlees", category: "meat_fish" }, ["veg"]), false);
  assert.equal(D.ingredientFits({ name: "Bruin bier", category: "drinks" }, ["halal"]), false);
});
