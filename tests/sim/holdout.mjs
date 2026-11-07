// Holdout check: product names the word list was NOT built from (written as typical Belgian/Dutch shop names),
// each with what the product is. Measures how well product types work on new products.
// Run: node tests/sim/holdout.mjs
import { createRequire } from "node:module";
const K = createRequire(import.meta.url)("../../site/concepts.js");
const CASES = [
  ["Boni Selection Kippenbrochettes, 4 st.", "chicken"], ["Everyday Kippenvleugels pikant 1 kg", "chicken"], ["Ailes de poulet marinées", "chicken"],
  ["Kipburgers, 4 x 100 g", "minced"], ["Kipnuggets, Krokant", "chicken"], ["Knorr Kippenbouillon, 12 blokjes", "stock"],
  ["Kippensoep met balletjes, 1 L", "soup"], ["Maggi Kruidenmix voor kip", "spices"], ["Ducros Épices pour poulet rôti", "spices"],
  ["Royal Canin Kitten, Kip, 2 kg", "pet"], ["Gourmet Gold Mousse au poulet", "pet"], ["Pedigree Dentastix, 7 st.", "pet"],
  ["Varkenskotelet, Gemarineerd", "pork"], ["Spek in blokjes", "bacon"], ["Lardons fumés", "bacon"], ["Gerookte ham, 10 sneden", "ham"],
  ["Jambon cuit Supérieur, 8 tranches", "ham"], ["Salami, Italiaanse, Sneden", "cold_cuts"], ["Gemengd gehakt, 500 g", "minced"],
  ["Haché pur bœuf 5% MG", "minced"], ["Entrecôte, Ierse, ± 250 g", "beef"], ["Steak haché", "minced"], ["Rosbief, Gekookt", "beef"],
  ["Zalmfilet, Noorse, 2 st.", "salmon"], ["Pavé de saumon atlantique", "salmon"], ["Tonijn in olijfolie, 3 x 80 g", "tuna"],
  ["Gepelde garnalen, 200 g", "seafood"], ["Moules de Zélande, 2 kg", "seafood"], ["Visburgers, Kabeljauw", "fish"],
  ["Jonge Gouda, Plakken", "cheese"], ["Brie de Meaux AOP", "cheese"], ["Geraspte kaas, Emmental, 200 g", "cheese"],
  ["Kaassaus, Vier kazen", "sauce"], ["Kaaskroketten, 6 st.", "fries"], ["Lait demi-écrémé, 6 x 1 L", "milk"], ["Halfvolle melk, 1 L, Brik", "milk"],
  ["Volle yoghurt, Natuur, 1 kg", "yoghurt"], ["Yaourt à la grecque, Miel", "yoghurt"], ["Vla, Vanille, 1 L", null], ["Roomboter, Ongezouten, 250 g", "butter"],
  ["Scharreleieren, 12 st.", "egg"], ["Oeufs de poules élevées en plein air", "egg"], ["Kookroom, 20 cl", "cream"],
  ["Jonagold appelen, 2 kg", "apple"], ["Pommes Pink Lady, 6 pièces", "apple"], ["Appelsap, 1 L", "juice"], ["Appelmoes, Pot 720 ml", null],
  ["Bananen, Fairtrade, per kg", "banana"], ["Trostomaten, 500 g", "tomato"], ["Tomatensoep, Pak", "soup"], ["Ketchup, Tomato, 500 ml", "sauce"],
  ["Vastkokende aardappelen, 5 kg", "potato"], ["Frieten, Diepvries, 1 kg", "fries"], ["Pommes frites au four", "fries"], ["Chips, Paprika, 200 g", "chips"],
  ["Wortelen, Gesneden, 500 g", "carrot"], ["Broccoli, Per stuk", "broccoli"], ["Champignons de Paris, 250 g", "mushroom"], ["Rode ui, Net 1 kg", "onion"],
  ["Spaghetti, Volkoren, 500 g", "pasta"], ["Penne Rigate n°73", "pasta"], ["Pastasaus, Basilico", "sauce"], ["Pesto alla Genovese", "sauce"],
  ["Basmatirijst, 1 kg", "rice"], ["Witte bonen in tomatensaus", "legumes"], ["Bruin brood, Gesneden, 800 g", "bread"], ["Pain de mie complet", "bread"],
  ["Croissants, 6 st.", "pastry"], ["Koffiebonen, Espresso, 1 kg", "coffee"], ["Café moulu, Classique, 500 g", "coffee"], ["Groene thee, 20 zakjes", "tea"],
  ["Cola Zero, 6 x 33 cl", "soda"], ["Spuitwater, 6 x 1,5 L", "water"], ["Sinaasappelsap, Vers geperst", "juice"], ["Pils, Bak 24 x 25 cl", "beer"],
  ["Rode wijn, Merlot, Frankrijk", "wine"], ["Vin blanc, Chardonnay", "wine"], ["Melkchocolade, Hazelnoot, 200 g", "chocolate"], ["Chocoladekoekjes", "biscuits"],
  ["Speculoospasta, 400 g", "spread"], ["Aardbeienconfituur, Extra", "spread"], ["Roomijs, Vanille, 1 L", "icecream"], ["Vanille-ijs, Doos", "icecream"],
  ["Pizza Margherita, Diepvries", "pizza"], ["Lasagne bolognese, 400 g", "ready_meal"], ["Vloeibaar wasmiddel, 40 wasbeurten", "laundry"],
  ["Lessive liquide, Fraîcheur", "laundry"], ["Vaatwastabletten, All in 1", "dishes"], ["Toiletpapier, 3-laags, 12 rollen", "paper"],
  ["Shampoo, Anti-roos", "care"], ["Tandpasta, Whitening", "care"], ["Luiers, Maat 4, Jumbo pack", "baby"], ["Hondenbrokken, Rund", "pet"],
  ["Vegetarische burger, 2 st.", "meat_sub"], ["Tofu, Naturel, 375 g", "meat_sub"], ["Veggie gehaktballetjes", "meat_sub"],
];
let ok = 0; const bad = [];
for (const [name, want] of CASES) { const got = K.analyse(name, "", /[éèàç]|\b(de|du|au|aux|des)\b/i.test(name) ? "fr" : "nl").type;
  const good = want === null ? true : got && (got === want || K.isA(got, want)); if (good) ok++; else bad.push(`${name}: wanted ${want}, got ${got}`); }
console.log(`${ok}/${CASES.length} right (${Math.round(100 * ok / CASES.length)}%)`); for (const b of bad) console.log(" ✗", b);
