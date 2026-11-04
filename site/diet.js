/* deal'ke diet and allergy filters: organic, vegetarian, vegan, gluten-free, no milk, halal, no nuts.
   Stores don't give us ingredient lists, so this reads the product name (NL, FR, EN), brand and aisle.
   It is careful: when a product might not fit, it is left out. The site always says to check the label.
   Runs in the browser (window.DKDiet) and in Node for tests (tests/diet.test.mjs). */
(function (root) {
  const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const toks = s => fold(s).split(/[^a-z0-9]+/).filter(Boolean);
  // a word counts when it is a whole word, or the start or end of a compound ("kipreepjes", "varkensgehakt");
  // "=word" only counts whole ("=lait" is milk, "laitue" is lettuce); short words only at the start ("kip" in "kipfilet")
  const has = (ts, words) => ts.some(t => words.some(w => w[0] === "=" ? t === w.slice(1)
    : t === w || (t.length > w.length && (t.startsWith(w) || (w.length > 3 && t.endsWith(w))))));
  const W = s => s.split(" ");

  const PORK = W("varken varkens ham beenham hesp spek bacon lard lardons jambon porc pork chorizo salami pancetta prosciutto serrano gyros");
  const MEAT = [...PORK, ...W("kip kippen kalkoen rund rundvlees gehakt vlees worst worstjes saucisse saucisson steak biefstuk burger hamburger kebab =lam lams eend konijn paard cordon bleu balletjes americain poulet dinde boeuf viande veau agneau canard chicken beef turkey sausage meat stoofvlees carbonnade schnitzel nuggets frikandel bitterbal pate pastei wild bolognese bolognaise gelatine")];
  const FISH = W("vis koolvis witvis zeevruchten seafood zalm tonijn kabeljauw pangasius tilapia forel makreel haring sardine sardines ansjovis garnaal garnalen scampi mosselen inktvis surimi poisson saumon thon cabillaud crevette crevettes moules fish salmon tuna shrimp prawn");
  const MILK = W("melk kaas boter room slagroom yoghurt yogurt kwark platte roomijs =ijs mozzarella parmezan parmigiano brie camembert gouda emmental feta mascarpone ricotta =lait fromage beurre creme yaourt cheese butter cream milk eclair eclairs =nata danio danone chocolade chocolat chocolate pudding latte cappuccino gratin");
  const EGG = W("=ei eieren oeuf oeufs egg eggs mayonaise mayonnaise pannenkoek pannenkoeken crepe crepes");
  const HONEY = W("honing miel honey");
  const GLUTEN = W("brood broodjes stokbrood pistolet pistolets toast beschuit pasta spaghetti penne macaroni lasagne noedels bloem meel koek koekjes speculoos peperkoek taart wafel wafels croissant croissants pizza bier biere beer couscous bulgur paneermeel =pane gepaneerd panko krokant cake cakes gebak pain farine biscuit biscuits gaufre gaufres tarte bread flour cookies wafer eclair eclairs =nata bami nasi burger burgers balletjes worst worstjes saucisse soep soupe crumbel tastino");
  const ALCOHOL = W("bier biere beer wijn wein =vin wine cava prosecco champagne whisky vodka =rum =gin jenever porto aperitief leffe duvel jupiler stella");
  const NUTS = W("noot noten nuts amandel amandelen hazelnoot hazelnoten pinda pindas cashew pistache walnoot pecan noisette noisettes amande amandes cacahuete cacahuetes peanut almond hazelnut nutella praline frangipane marsepein massepain");

  const VEG_YES = W("vegetarisch vegetarische veggie vegan vegetarien vegetarian vemondo plantaardig vegetal falafel");
  const VEGAN_YES = W("vegan vegetalien plantaardig plantaardige vemondo alpro oatly");
  const LF_YES = W("lactosevrij lactosevrije lactose zuivelvrij alpro oatly plantaardig vegan");
  const GF_YES = W("glutenvrij glutenvrije gluten");

  // aisles where a product is gluten-free unless its name says otherwise
  const GF_AISLES = new Set(["fruit_veg", "meat_fish", "dairy", "drinks"]);
  // ...and where it has no milk unless its name says so (sweets, biscuits and bread often do: left out)
  const NOMILK_AISLES = new Set(["fruit_veg", "meat_fish", "drinks", "pantry"]);

  const PET = W("sheba whiskas felix pedigree kattenvoer hondenvoer kattensnoepjes friskies");
  function info(d) {
    const ts = toks(`${d.name || ""} ${d.brand || ""}`);
    return { ts, cat: has(ts, PET) ? "household" : d.cat || d.category || "", store: d.store || "" };  // pet food is not for people
  }
  const meaty = x => x.cat === "meat_fish" || has(x.ts, MEAT) || has(x.ts, FISH);
  const RULES = {
    bio: x => x.cat !== "household" && has(x.ts, W("bio biologisch biologische organic biologique")) || /^(Bio-Planet|Ekoplaza)$/.test(x.store),
    veg: x => x.cat !== "household" && has(x.ts, VEG_YES) || (!meaty(x) && x.cat !== "household"),
    vegan: x => x.cat !== "household" && has(x.ts, VEGAN_YES) || (x.cat === "fruit_veg" && !meaty(x) && !has(x.ts, MILK) && !has(x.ts, EGG) && !has(x.ts, HONEY)),
    nomilk: x => x.cat !== "household" && has(x.ts, LF_YES) || (NOMILK_AISLES.has(x.cat) && !has(x.ts, MILK)),
    gf: x => x.cat !== "household" && ( (has(x.ts, GF_YES) && x.ts.some(t => t.startsWith("glutenvrij") || t === "sans" || t === "free"))
      || (GF_AISLES.has(x.cat) && !has(x.ts, GLUTEN) && !has(x.ts, ALCOHOL))),
    halal: x => has(x.ts, W("halal")) || (!has(x.ts, PORK) && !has(x.ts, ALCOHOL) && x.cat !== "household" &&
      (!meaty(x) || (has(x.ts, FISH) && !has(x.ts, MEAT)))),
    nonuts: x => x.cat !== "household" && !has(x.ts, NUTS),
  };
  const KEYS = Object.keys(RULES);
  // every chosen diet must fit
  const fits = (d, keys) => { const x = info(d); for (const k of keys) if (RULES[k] && !RULES[k](x)) return false; return true; };

  // A recipe ingredient ("Bloem", "Uien", "Zout") has no aisle to trust, so here only the words count:
  // it fits unless its name says it doesn't. Organic is up to the shopper.
  const AVOID = {
    bio: () => true,
    veg: x => !meaty(x),
    vegan: x => !meaty(x) && !has(x.ts, MILK) && !has(x.ts, EGG) && !has(x.ts, HONEY),
    nomilk: x => !has(x.ts, MILK),
    gf: x => !has(x.ts, GLUTEN) && !has(x.ts, W("bloem farine flour")) && !has(x.ts, ALCOHOL),
    halal: x => !has(x.ts, PORK) && !has(x.ts, ALCOHOL) && !meaty(x) || (has(x.ts, FISH) && !has(x.ts, MEAT)),
    nonuts: x => !has(x.ts, NUTS),
  };
  const ingredientFits = (ing, keys) => { const x = info(ing); for (const k of keys) if (AVOID[k] && !AVOID[k](x)) return false; return true; };

  const api = { KEYS, fits, ingredientFits, fold };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKDiet = api;
})(typeof window !== "undefined" ? window : globalThis);
