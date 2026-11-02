/* Starter recipes. Each ingredient: n = name per language, a = amount, k = words to find it in deals
   (Dutch and French, matched at the start of a word), c = aisle it must be in (so "melk" never matches
   milk chocolate), basic = most kitchens have it (ticked as "I have this" by default). */
window.DK_RECIPES = [
  { id: "stoofvlees", t: { nl: "Stoofvlees met frietjes", fr: "Carbonnade flamande et frites", en: "Flemish beef stew with fries" }, serves: 4, min: 180,
    i: [
      { n: { nl: "Stoofvlees", fr: "Viande à braiser", en: "Stewing beef" }, a: "1 kg", k: ["stoofvlees", "rundvlees", "carbonnade", "boeuf"], c: "meat_fish" },
      { n: { nl: "Uien", fr: "Oignons", en: "Onions" }, a: "3", k: ["uien", "oignon"], c: "fruit_veg" },
      { n: { nl: "Bruin bier", fr: "Bière brune", en: "Brown beer" }, a: "2 × 33 cl", k: ["bier", "bière", "leffe", "westmalle", "karmeliet", "grimbergen"], c: "drinks" },
      { n: { nl: "Bruin brood", fr: "Pain gris", en: "Brown bread" }, a: "2 sneden", k: ["brood", "pain"], c: "bread" },
      { n: { nl: "Mosterd", fr: "Moutarde", en: "Mustard" }, a: "2 el", k: ["mosterd", "moutarde"], c: "pantry", basic: true },
      { n: { nl: "Aardappelen of frieten", fr: "Pommes de terre ou frites", en: "Potatoes or fries" }, a: "1,5 kg", k: ["aardappel", "frieten", "frites", "pommes de terre"] },
      { n: { nl: "Boter", fr: "Beurre", en: "Butter" }, a: "50 g", k: ["boter", "beurre"], c: "dairy", basic: true },
    ] },
  { id: "bolognese", t: { nl: "Spaghetti bolognese", fr: "Spaghetti bolognaise", en: "Spaghetti bolognese" }, serves: 4, min: 45,
    i: [
      { n: { nl: "Spaghetti", fr: "Spaghetti", en: "Spaghetti" }, a: "500 g", k: ["spaghetti", "pasta", "pâtes"], c: "pantry" },
      { n: { nl: "Gehakt", fr: "Haché", en: "Minced meat" }, a: "500 g", k: ["gehakt", "haché"], c: "meat_fish" },
      { n: { nl: "Tomatensaus of passata", fr: "Sauce tomate", en: "Tomato sauce" }, a: "700 g", k: ["bolognese", "tomatensaus", "passata", "sauce tomate"] },
      { n: { nl: "Uien", fr: "Oignons", en: "Onions" }, a: "1", k: ["uien", "oignon"], c: "fruit_veg" },
      { n: { nl: "Wortelen", fr: "Carottes", en: "Carrots" }, a: "2", k: ["wortel", "carotte"], c: "fruit_veg" },
      { n: { nl: "Geraspte kaas", fr: "Fromage râpé", en: "Grated cheese" }, a: "100 g", k: ["gemalen kaas", "geraspte", "emmental", "parmezaan", "râpé"], c: "dairy" },
    ] },
  { id: "groentesoep", t: { nl: "Groentesoep met balletjes", fr: "Soupe aux légumes et boulettes", en: "Vegetable soup with meatballs" }, serves: 6, min: 60,
    i: [
      { n: { nl: "Soepgroenten", fr: "Légumes à potage", en: "Soup vegetables" }, a: "1 kg", k: ["soepgroent", "groentemix", "prei", "poireau", "légumes"], c: "fruit_veg" },
      { n: { nl: "Gehakt", fr: "Haché", en: "Minced meat" }, a: "300 g", k: ["gehakt", "haché"], c: "meat_fish" },
      { n: { nl: "Aardappelen", fr: "Pommes de terre", en: "Potatoes" }, a: "500 g", k: ["aardappel", "pommes de terre"], c: "fruit_veg" },
      { n: { nl: "Bouillon", fr: "Bouillon", en: "Stock" }, a: "2 blokjes", k: ["bouillon", "fond"], c: "pantry", basic: true },
      { n: { nl: "Brood", fr: "Pain", en: "Bread" }, a: "1", k: ["brood", "pain", "baguette"], c: "bread" },
    ] },
  { id: "kip-appelmoes", t: { nl: "Kip met appelmoes en kroketten", fr: "Poulet compote et croquettes", en: "Chicken, apple sauce and croquettes" }, serves: 4, min: 40,
    i: [
      { n: { nl: "Kip (filet of bout)", fr: "Poulet", en: "Chicken" }, a: "800 g", k: ["kip", "poulet"], c: "meat_fish" },
      { n: { nl: "Appels of appelmoes", fr: "Pommes ou compote", en: "Apples or apple sauce" }, a: "1 kg", k: ["appelmoes", "appels", "compote", "pomme"], c: "fruit_veg" },
      { n: { nl: "Kroketten", fr: "Croquettes", en: "Croquettes" }, a: "1 zak", k: ["kroket", "croquette"] },
      { n: { nl: "Boter", fr: "Beurre", en: "Butter" }, a: "50 g", k: ["boter", "beurre"], c: "dairy", basic: true },
    ] },
  { id: "vol-au-vent", t: { nl: "Vol-au-vent", fr: "Vol-au-vent", en: "Vol-au-vent" }, serves: 4, min: 75,
    i: [
      { n: { nl: "Kip", fr: "Poulet", en: "Chicken" }, a: "1 kg", k: ["kip", "poulet"], c: "meat_fish" },
      { n: { nl: "Champignons", fr: "Champignons", en: "Mushrooms" }, a: "250 g", k: ["champignon"], c: "fruit_veg" },
      { n: { nl: "Gehaktballetjes", fr: "Boulettes", en: "Meatballs" }, a: "300 g", k: ["balletjes", "gehakt", "boulettes", "haché"], c: "meat_fish" },
      { n: { nl: "Room", fr: "Crème", en: "Cream" }, a: "20 cl", k: ["room", "crème", "kookroom"], c: "dairy" },
      { n: { nl: "Bladerdeeg pasteitjes of frietjes", fr: "Bouchées ou frites", en: "Puff pastry cases or fries" }, a: "4", k: ["pasteitjes", "bladerdeeg", "frieten", "frites"] },
    ] },
  { id: "zalm-broccoli", t: { nl: "Zalm met broccoli en rijst", fr: "Saumon, brocoli et riz", en: "Salmon with broccoli and rice" }, serves: 2, min: 25,
    i: [
      { n: { nl: "Zalmfilet", fr: "Filet de saumon", en: "Salmon fillet" }, a: "2 × 125 g", k: ["zalm", "saumon"], c: "meat_fish" },
      { n: { nl: "Broccoli", fr: "Brocoli", en: "Broccoli" }, a: "500 g", k: ["broccoli", "brocoli"], c: "fruit_veg" },
      { n: { nl: "Rijst", fr: "Riz", en: "Rice" }, a: "200 g", k: ["rijst", "riz"], c: "pantry" },
      { n: { nl: "Citroen", fr: "Citron", en: "Lemon" }, a: "1", k: ["citroen", "citron"], c: "fruit_veg", basic: true },
    ] },
  { id: "pannenkoeken", t: { nl: "Pannenkoeken", fr: "Crêpes", en: "Pancakes" }, serves: 4, min: 30,
    i: [
      { n: { nl: "Bloem", fr: "Farine", en: "Flour" }, a: "250 g", k: ["bloem", "farine"], c: "pantry", basic: true },
      { n: { nl: "Melk", fr: "Lait", en: "Milk" }, a: "500 ml", k: ["melk", "lait"], c: "dairy" },
      { n: { nl: "Eieren", fr: "Œufs", en: "Eggs" }, a: "3", k: ["eieren", "oeufs", "œufs"], c: "dairy" },
      { n: { nl: "Boter", fr: "Beurre", en: "Butter" }, a: "50 g", k: ["boter", "beurre"], c: "dairy", basic: true },
      { n: { nl: "Suiker", fr: "Sucre", en: "Sugar" }, a: "naar smaak", k: ["suiker", "sucre"], c: "pantry", basic: true },
    ] },
  { id: "croque", t: { nl: "Croque monsieur met slaatje", fr: "Croque-monsieur et salade", en: "Croque monsieur with salad" }, serves: 2, min: 15,
    i: [
      { n: { nl: "Toastbrood", fr: "Pain de mie", en: "Sandwich bread" }, a: "8 sneden", k: ["toast", "brood", "pain de mie"], c: "bread" },
      { n: { nl: "Ham", fr: "Jambon", en: "Ham" }, a: "4 sneden", k: ["ham", "jambon"], c: "meat_fish" },
      { n: { nl: "Kaas in plakken", fr: "Fromage en tranches", en: "Sliced cheese" }, a: "4 sneden", k: ["kaas", "gouda", "fromage", "brugge"], c: "dairy" },
      { n: { nl: "Sla en tomaten", fr: "Salade et tomates", en: "Lettuce and tomatoes" }, a: "1", k: ["sla", "tomaten", "tomates", "salade"], c: "fruit_veg" },
    ] },
];
