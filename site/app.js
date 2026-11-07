/* deal'ke front end. Plain JavaScript, no build step.
   Reads data/deals.json (written every morning by the collector), data/stores.json (shop locations from
   OpenStreetMap) and data/postcodes.json (Belgian postal code centres). Everything runs in the browser. */
(() => {
"use strict";

// ---------- text ----------
const T = {
  nl: {
    navDeals: "Promo's", navRecipes: "Recepten", recipesTitle: "Recepten",
    recipesSub: "Vink aan wat je al in huis hebt. Wat ontbreekt, zoeken we in de promo's van deze week.",
    newRecipe: "Eigen recept", rName: "Naam", rServes: "Personen", rIngr: "Ingrediënten, één per lijn (bv. 500 g gehakt)", save: "Bewaar",
    persons: n => `${n} pers.`, minutes: n => n >= 60 ? `${Math.floor(n / 60)} u${n % 60 ? " " + (n % 60) : ""}` : `${n} min`,
    onPromo: (a, b) => `${a} van ${b} ingrediënten in promo`, toBuy: n => `${n} te kopen`, haveIt: "Heb ik",
    noDeal: "Geen promo deze week", addMissing: "Zet ontbrekende op mijn lijst", addedMissing: n => `${n} promo's op je lijst gezet`,
    plan: "Plan deze week", planned: "Gepland", planTitle: "Deze week koken", planSum: (r, n, e) => `${r} ${r === 1 ? "recept" : "recepten"} · ${n} ingrediënten in promo · ongeveer ${e}`,
    planAdd: "Alles op mijn lijst", deleteRecipe: "Verwijder recept", mine: "Eigen recept", allHave: "Je hebt alles in huis.",
    skip: "Naar de promoties", search: "Wat zoek je? Bv. melk, gehakt, Coca-Cola", myList: "Mijn lijst",
    heroH: "Goed eten,<br><em>voor minder.</em>",
    heroSub: "Alle promoties van de Belgische supermarkten in je buurt, vergeleken op de echte prijs per kilo. Elke ochtend vernieuwd.",
    postcode: "Postcode of adres", showDeals: "Toon mijn promo's", badPc: "Die postcode of dat adres vinden we niet. Probeer bv. 9000 of Veldstraat 1, Gent.",
    pcPh: "9000 of straat + nr", addrBusy: "Adres zoeken…", addrCredit: "Adressen: © OpenStreetMap",
    trust: (n, c) => `<b>${n}</b> promo's van <b>${c}</b> ketens, vanochtend gecheckt`,
    sample: "Voorbeeldpromo's: de echte promo's verschijnen na de eerste automatische ronde van de verzamelaar.",
    dealType: "Soort promo", stores: "Winkels", sortBy: "Sorteer", clearAll: "Wis filters", showMore: "Toon meer",
    all: "Alles", allDeals: "Alle promo's",
    secTitle: "Promo's van deze week", searchTitle: q => `Resultaten voor “${q}”`,
    secSub: (n, pc, r) => `${n} promo's${pc ? ` binnen ${r} km van ${pc}` : ""}`,
    sorts: { value: "Beste prijs per kg/L", price: "Laagste prijs", discount: "Grootste korting", near: "Dichtstbij", ending: "Eindigt binnenkort" },
    dietT: "Dieet", diets: { bio: "Bio", veg: "Vegetarisch", vegan: "Vegan", gf: "Glutenvrij", nomilk: "Zonder melk", halal: "Halal", nonuts: "Zonder noten" },
    dietNote: "Gekozen op basis van de productnaam: check altijd het etiket als het om een allergie gaat.",
    dietAcc: "Mijn dieet en allergieën", dietAccWhy: "Geldt voor de promo's, je lijst en het weekmenu. Het zijn dezelfde knoppen als in de filters.",
    kinds: { "1+1": "1+1 (2 voor 1)", "2+1": "2+1 (3 voor 2)", multi: "Meer kopen", "2nd_half": "2de halve prijs", "2nd_pct": "2de met korting", percent: "% korting", bundle: "Bundelprijs", price_drop: "Prijsdaling", other: "Andere" },
    tag: { free: n => `${n} gratis`, "2nd_half": "2de halve prijs", price_drop: "Prijsdaling", promo: "Promo" },
    cats: { fruit_veg: "Groenten & fruit", meat_fish: "Vlees & vis", dairy: "Zuivel & eieren", bread: "Brood", pantry: "Voorraad & maaltijden", snacks: "Snacks & snoep", drinks: "Dranken", household: "Huishouden", other: "Andere" },
    perUnit: { kg: "kg", L: "L", piece: "stuk" }, effective: "als je de promo neemt",
    emptyT: "Niets gevonden", emptyP: "Probeer een ander woord of wis een filter.",
    add: "Zet op mijn lijst", added: "Op je lijst", remove: "Verwijder", addedToast: "Op je lijst gezet",
    facts: { unit: "Prijs per", save: "Je bespaart", store: "Winkel", near: "Dichtste winkel", pack: "Verpakking", brand: "Merk", until: "Geldig tot", promo: "Promo" },
    directions: "Route", seeStore: "Bekijk bij de winkel", sameElse: "Vergelijkbaar elders",
    listTitle: "Mijn lijst", listEmpty: "Je lijst is leeg. Tik op + bij een promo om hem toe te voegen.",
    total: "Totaal", saved: "Je bespaart", share: "Deel lijst", clearList: "Leeg lijst", copied: "Lijst gekopieerd",
    whereShop: "Waar doe je boodschappen?", radius: "Afstand", cancel: "Annuleer", apply: "Toon promo's",
    setPc: "Postcode", close: "Sluit",
    updated: d => `Laatst bijgewerkt: ${d}.`, footNote: "Prijzen en voorwaarden komen van de websites van de winkels. Controleer in de winkel.",
    km: "km",
  },
  fr: {
    navDeals: "Promos", navRecipes: "Recettes", recipesTitle: "Recettes",
    recipesSub: "Cochez ce que vous avez déjà. Pour le reste, on cherche dans les promos de la semaine.",
    newRecipe: "Ma recette", rName: "Nom", rServes: "Personnes", rIngr: "Ingrédients, un par ligne (ex. 500 g de haché)", save: "Enregistrer",
    persons: n => `${n} pers.`, minutes: n => n >= 60 ? `${Math.floor(n / 60)} h${n % 60 ? " " + (n % 60) : ""}` : `${n} min`,
    onPromo: (a, b) => `${a} ingrédients sur ${b} en promo`, toBuy: n => `${n} à acheter`, haveIt: "Je l’ai",
    noDeal: "Pas de promo cette semaine", addMissing: "Ajouter ce qui manque à ma liste", addedMissing: n => `${n} promos ajoutées à votre liste`,
    plan: "Au menu cette semaine", planned: "Au menu", planTitle: "Au menu cette semaine", planSum: (r, n, e) => `${r} ${r === 1 ? "recette" : "recettes"} · ${n} ingrédients en promo · environ ${e}`,
    planAdd: "Tout ajouter à ma liste", deleteRecipe: "Supprimer la recette", mine: "Ma recette", allHave: "Vous avez tout.",
    skip: "Aller aux promos", search: "Que cherchez-vous ? Ex. lait, haché, Coca-Cola", myList: "Ma liste",
    heroH: "Bien manger,<br><em>pour moins.</em>",
    heroSub: "Toutes les promotions des supermarchés belges près de chez vous, comparées au vrai prix au kilo. Mises à jour chaque matin.",
    postcode: "Code postal ou adresse", showDeals: "Voir mes promos", badPc: "Code postal ou adresse introuvable. Essayez par ex. 1000 ou Rue Neuve 1, Bruxelles.",
    pcPh: "1000 ou rue + n°", addrBusy: "Recherche de l’adresse…", addrCredit: "Adresses : © OpenStreetMap",
    trust: (n, c) => `<b>${n}</b> promos de <b>${c}</b> enseignes vérifiées ce matin`,
    sample: "Promos d’exemple : les vraies promos apparaissent après le premier passage automatique du collecteur.",
    dealType: "Type de promo", stores: "Magasins", sortBy: "Trier", clearAll: "Effacer les filtres", showMore: "Voir plus",
    all: "Tout", allDeals: "Toutes les promos",
    secTitle: "Les promos de la semaine", searchTitle: q => `Résultats pour « ${q} »`,
    secSub: (n, pc, r) => `${n} promos${pc ? ` à moins de ${r} km de ${pc}` : ""}`,
    sorts: { value: "Meilleur prix au kg/L", price: "Prix le plus bas", discount: "Plus grosse remise", near: "Le plus proche", ending: "Se termine bientôt" },
    dietT: "Régime", diets: { bio: "Bio", veg: "Végétarien", vegan: "Vegan", gf: "Sans gluten", nomilk: "Sans lait", halal: "Halal", nonuts: "Sans noix" },
    dietNote: "Choisi d’après le nom du produit : vérifiez toujours l’étiquette en cas d’allergie.",
    dietAcc: "Mon régime et mes allergies", dietAccWhy: "S’applique aux promos, à votre liste et au menu de la semaine. Ce sont les mêmes boutons que dans les filtres.",
    kinds: { "1+1": "1+1 (2 pour 1)", "2+1": "2+1 (3 pour 2)", multi: "Achat groupé", "2nd_half": "2e à moitié prix", "2nd_pct": "2e en promo", percent: "% de remise", bundle: "Prix lot", price_drop: "Baisse de prix", other: "Autres" },
    tag: { free: n => `${n} offert`, "2nd_half": "2e à moitié prix", price_drop: "Baisse de prix", promo: "Promo" },
    cats: { fruit_veg: "Fruits & légumes", meat_fish: "Viande & poisson", dairy: "Produits laitiers", bread: "Pain", pantry: "Épicerie & plats", snacks: "Snacks & bonbons", drinks: "Boissons", household: "Maison", other: "Autres" },
    perUnit: { kg: "kg", L: "L", piece: "pièce" }, effective: "avec la promo",
    emptyT: "Rien trouvé", emptyP: "Essayez un autre mot ou retirez un filtre.",
    add: "Ajouter à ma liste", added: "Dans votre liste", remove: "Retirer", addedToast: "Ajouté à votre liste",
    facts: { unit: "Prix par", save: "Vous économisez", store: "Magasin", near: "Magasin le plus proche", pack: "Conditionnement", brand: "Marque", until: "Valable jusqu’au", promo: "Promo" },
    directions: "Itinéraire", seeStore: "Voir sur le site du magasin", sameElse: "Comparable ailleurs",
    listTitle: "Ma liste", listEmpty: "Votre liste est vide. Touchez + sur une promo pour l’ajouter.",
    total: "Total", saved: "Vous économisez", share: "Partager", clearList: "Vider", copied: "Liste copiée",
    whereShop: "Où faites-vous vos courses ?", radius: "Distance", cancel: "Annuler", apply: "Voir les promos",
    setPc: "Code postal", close: "Fermer",
    updated: d => `Dernière mise à jour : ${d}.`, footNote: "Prix et conditions repris des sites des magasins. Vérifiez en magasin.",
    km: "km",
  },
  en: {
    navDeals: "Deals", navRecipes: "Recipes", recipesTitle: "Recipes",
    recipesSub: "Tick what you already have. We find the rest in this week's deals.",
    newRecipe: "Add a recipe", rName: "Name", rServes: "Servings", rIngr: "Ingredients, one per line (e.g. 500 g minced beef)", save: "Save",
    persons: n => `serves ${n}`, minutes: n => n >= 60 ? `${Math.floor(n / 60)} h${n % 60 ? " " + (n % 60) : ""}` : `${n} min`,
    onPromo: (a, b) => `${a} of ${b} ingredients on offer`, toBuy: n => `${n} to buy`, haveIt: "Have it",
    noDeal: "No deal this week", addMissing: "Add missing to my list", addedMissing: n => `${n} deals added to your list`,
    plan: "Cook this week", planned: "Planned", planTitle: "Cooking this week", planSum: (r, n, e) => `${r} ${r === 1 ? "recipe" : "recipes"} · ${n} ingredients on offer · about ${e}`,
    planAdd: "Add all to my list", deleteRecipe: "Delete recipe", mine: "My recipe", allHave: "You have everything.",
    skip: "Skip to deals", search: "What are you looking for? E.g. milk, mince, Coca-Cola", myList: "My list",
    heroH: "Good food,<br><em>for less.</em>",
    heroSub: "Every promotion from Belgian supermarkets near you, compared on the real price per kilo. Fresh every morning.",
    postcode: "Postal code or address", showDeals: "Show my deals", badPc: "We can't find that postal code or address. Try 9000 or Veldstraat 1, Gent, for example.",
    pcPh: "9000 or street + no.", addrBusy: "Looking up the address…", addrCredit: "Addresses: © OpenStreetMap",
    trust: (n, c) => `<b>${n}</b> deals from <b>${c}</b> chains checked this morning`,
    sample: "Example deals: the real deals appear after the collector's first automatic run.",
    dealType: "Deal type", stores: "Stores", sortBy: "Sort", clearAll: "Clear filters", showMore: "Show more",
    all: "All", allDeals: "All deals",
    secTitle: "This week's deals", searchTitle: q => `Results for “${q}”`,
    secSub: (n, pc, r) => `${n} deals${pc ? ` within ${r} km of ${pc}` : ""}`,
    sorts: { value: "Best price per kg/L", price: "Lowest price", discount: "Biggest discount", near: "Nearest", ending: "Ending soon" },
    dietT: "Diet", diets: { bio: "Organic", veg: "Vegetarian", vegan: "Vegan", gf: "Gluten-free", nomilk: "No milk", halal: "Halal", nonuts: "No nuts" },
    dietNote: "Picked from the product name: always check the label for allergies.",
    dietAcc: "My diet and allergies", dietAccWhy: "Applies to the deals, your list and the week menu. These are the same buttons as in the filters.",
    kinds: { "1+1": "1+1 (2 for 1)", "2+1": "2+1 (3 for 2)", multi: "Buy more", "2nd_half": "2nd half price", "2nd_pct": "2nd discounted", percent: "% off", bundle: "Bundle price", price_drop: "Price drop", other: "Other" },
    tag: { free: n => `${n} free`, "2nd_half": "2nd half price", price_drop: "Price drop", promo: "Deal" },
    cats: { fruit_veg: "Fruit & veg", meat_fish: "Meat & fish", dairy: "Dairy & eggs", bread: "Bread", pantry: "Pantry & meals", snacks: "Snacks & sweets", drinks: "Drinks", household: "Household", other: "Other" },
    perUnit: { kg: "kg", L: "L", piece: "piece" }, effective: "with the deal",
    emptyT: "Nothing found", emptyP: "Try another word or remove a filter.",
    add: "Add to my list", added: "On your list", remove: "Remove", addedToast: "Added to your list",
    facts: { unit: "Price per", save: "You save", store: "Store", near: "Nearest store", pack: "Pack", brand: "Brand", until: "Valid until", promo: "Deal" },
    directions: "Directions", seeStore: "See at the store", sameElse: "Similar elsewhere",
    listTitle: "My list", listEmpty: "Your list is empty. Tap + on a deal to add it.",
    total: "Total", saved: "You save", share: "Share list", clearList: "Clear list", copied: "List copied",
    whereShop: "Where do you shop?", radius: "Distance", cancel: "Cancel", apply: "Show deals",
    setPc: "Postal code", close: "Close",
    updated: d => `Last updated: ${d}.`, footNote: "Prices and conditions come from the stores' websites. Check in store.",
    km: "km",
  },
};
// Text for the Base44-style layout (hero, week band, store lists, pricing)
Object.assign(T.nl, {
  accAlerts: "Ook per e-mail", accAlertsWhy: "Dezelfde samenvatting in je mailbox.",
  accNotify: "Dagelijkse melding op dit toestel", accNotifyWhy: "Eén melding per dag, alleen als iets van je lijst nieuw in promo is in je buurt.",
  pushIos: "Op iPhone of iPad: tik op Deel en dan op ‘Zet op beginscherm’. Open deal'ke daarna via het icoon en zet dit aan.",
  pushDenied: "Meldingen staan uit voor deze site. Zet ze aan in de instellingen van je browser en probeer opnieuw.",
  pushNo: "Deze browser kan geen meldingen tonen.", pushOn: "Melding staat aan. Je hoort het morgenochtend als er iets is.", pushOff: "Melding staat uit op dit toestel.",
  promoNote: n => n === 1 ? "1 ding van je lijst in promo" : `${n} dingen van je lijst in promo`, promoSee: "Bekijk", promoWhat: (q, s) => `${q} bij ${s}`,
  menuT: "Weekmenu", menuSub: "Wij kiezen je avondeten uit wat deze week in promo is. Je eigen recepten doen mee.",
  menuMake: "Maak mijn weekmenu", menuRedo: "Opnieuw", menuSwap: "Ander recept", menuToList: "Wat ontbreekt op mijn lijst",
  menuDays: ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"], menuSaves: v => `bespaart ≈ ${v}`, menuN: "Avonden",
  menuNoDiet: "Geen enkel recept past bij je dieet. Voeg je eigen recepten toe, dan kiezen we daaruit.",
  homeAdults: "Volwassenen", homeKids: "Kinderen", homeFor: "Voor", forN: (n, r) => `voor ${n} pers.${r ? ` (recept: ${r})` : ""}`,
  wantsAdded: n => n ? `${n} op je lijst gezet` : "Staat al op je lijst",
  splitTip: (c, v, n) => `Haal ${n} ${n === 1 ? "product" : "producten"} bij ${c} en bespaar ${v} extra`,
  savedMonth: v => `${v} bespaard deze maand`, savedWeek: v => `${v} deze week`, savedTop: c => `meest bij ${c}`,
  savedVs: v => `al ${v} meer dan heel vorige maand`, bought: "Gekocht", notBought: "Nog niet gekocht",
  tickHint: "Vink af wat je koopt: we tellen alleen wat je echt bespaart.", youSaved: v => `Jij bespaarde ${v} deze maand`,
  wantPh: "Voeg toe: koffie, melk, kipfilet…", wantAdd: "Voeg toe", wantsT: "Wat je nodig hebt",
  wantNone: "deze week geen promo in de buurt", wantAt: (c, p) => `${c} · ${p}`,
  cheapT: "Goedkoopste winkel voor je lijst", myShopT: "Jouw winkel", myShop: "Mijn winkel", myShopAny: "Geen voorkeur", myShopWhy: "Komt eerst op je lijst en in je dagelijkse melding. We zeggen het altijd als een andere winkel goedkoper is.", myShopSaved: s => s ? `${s} is nu je winkel` : "Geen voorkeurswinkel meer",
  covers: (a, b) => `${a} van ${b} in promo`, tipCheaper: (c, v, n) => `${c} is ${v} goedkoper voor dezelfde ${n}`,
  tipMore: (c, n) => `${c} heeft er ${n} meer in promo`, prefMissing: c => `${c} heeft niets van je lijst in promo deze week`, fromFav: (k, c) => `${k} van je ${c}`,
  otherShops: "Andere winkels", dealsT: "Bewaarde promo's",
  listSub2: "Typ wat je nodig hebt. Elke dag zoeken we de beste promo in de buurt.",
  checked: (n, here, time) => `<b>${n}</b> promo's${here ? ` bij ${here}` : ""} · gecontroleerd ${time}`, today: t => `vandaag om ${t}`,
  navHome: "Home", navPricing: "Tarieven",
  eyebrow: c => `België · ${c} ketens · één eerlijke prijs per kg`,
  heroH: "Betaal minder voor <em>dezelfde</em> boodschappen.",
  heroSub: (c, r) => `Elke promo van ${c} Belgische supermarkten binnen ${r} km, gesorteerd op de echte prijs per kg. Elke ochtend bijgewerkt, nog voor de winkels opengaan.`,
  heroGo: pc => pc ? `Toon deals van deze week bij ${pc}` : "Toon deals van deze week",
  trial: "Start mijn gratis proefperiode van 14 dagen", trialNote: "14 dagen gratis, geen kaart nodig.",
  biggest: (p, n, pr) => `Grootste korting nu: <b>−${p}%</b> op ${n} bij ${pr}.`,
  pvTitle: "Deals van deze week", previewCap: "Dit is de echte app, live met de deals van deze week.",
  trustbar: (n, c) => `<b>${n}</b> deals vanochtend gecontroleerd bij <b>${c}</b> ketens`,
  avgSave: v => `${v} gemiddelde besparing per deal`,
  week: n => `Deals van week ${n}`, bandSub: (n, c) => `${n} deals · ${c} ketens · elke ochtend vernieuwd`, upTo: "tot",
  allStores: "Alle winkels", youSave: v => `Je bespaart ${v}`, promo: "Promo",
  recipesTitle: "Kook voor minder", recipesSub: "Kies wat je deze week wil koken en vink af wat je thuis hebt. Wij zoeken de rest enkel in de deals van deze week.",
  startHere: "Begin hier", bestStore: "Beste winkel", ofItems: (a, b) => `${a} van ${b} producten`, totalSave: v => `Totale besparing: ${v}`,
  listSub: "Eén lijst per winkel. Begin bij de winkel waar je het meest bespaart.",
  prTitle: "Probeer alles 14 dagen gratis",
  prSub: (c, r) => `Elke promo van ${c} Belgische ketens binnen ${r} km, vergeleken op de echte prijs per kg, met recepten en één boodschappenlijst per winkel.`,
  free: "Gratis", freeSub: "Bekijk en vergelijk alle deals.", plus: "Plus", plusSub: "€ 4,99 per maand na je proefperiode. Altijd opzegbaar.",
  perMonth: "/ maand", trialBadge: "14 dagen gratis",
  freeList: c => [`Alle deals van de week van ${c} ketens`, "Echte prijs per kg of liter vergeleken", "Mijn lijst, per winkel", "1 eigen recept"],
  plusList: c => [`Alles uit Gratis`, "Eigen recepten, onbeperkt", "Je week plannen: alle recepten in één keer op je lijst", "Je lijst en recepten op al je toestellen", "Altijd opzegbaar, met één klik"],
  freeBtn: "Gratis deals bekijken", soon: "Accounts en betalen komen binnenkort. Tot dan is alles gratis.",
});
Object.assign(T.nl, { nearT: (n, r) => `${n} winkels binnen ${r} km`, nearSub: (n, pc) => `${n} ketens rond ${pc}. Tik op een winkel om hem op de kaart te zien.`, nearNo: "nog geen promo's online", nearRoute: "Route",
  nearNL: "in Nederland, nog geen promo's online", country: "Land", cc: { BE: "België", NL: "Nederland" },
  accPc: "Je postcode of adres", accPcWhy: "Zo tonen we meteen de promo's bij jou in de buurt. Je kunt dit altijd aanpassen.", accChange: "Wijzig" });
Object.assign(T.fr, { nearT: (n, r) => `${n} magasins à moins de ${r} km`, nearSub: (n, pc) => `${n} enseignes autour de ${pc}. Touchez un magasin pour le voir sur la carte.`, nearNo: "pas encore de promos en ligne", nearRoute: "Itinéraire",
  nearNL: "aux Pays-Bas, pas encore de promos en ligne", country: "Pays", cc: { BE: "Belgique", NL: "Pays-Bas" },
  accPc: "Votre code postal ou adresse", accPcWhy: "Pour voir directement les promos près de chez vous. Modifiable à tout moment.", accChange: "Modifier" });
Object.assign(T.en, { nearT: (n, r) => `${n} shops within ${r} km`, nearSub: (n, pc) => `${n} chains around ${pc}. Tap a shop to see it on the map.`, nearNo: "no promos online yet", nearRoute: "Directions",
  nearNL: "in the Netherlands, no promos online yet", country: "Country", cc: { BE: "Belgium", NL: "Netherlands" },
  accPc: "Your postal code or address", accPcWhy: "So we show the promos near you straight away. You can change it any time.", accChange: "Change" });
Object.assign(T.nl, { accSignIn: "Inloggen", accTitle: "Mijn account", accEmail: "E-mail", accSend: "Stuur me een inloglink", accWhy: "Geen wachtwoord nodig: je krijgt een link per e-mail. Je lijst en recepten staan dan op al je toestellen.", accSent: e => `Kijk in je mailbox (${e}) en klik op de link.`, accPlan: "Abonnement", accFree: "Gratis", accTrial: d => `Plus, gratis proefperiode tot ${d}`, accActive: d => `Plus, verlengt op ${d}`, accEnds: d => `Plus, stopt op ${d}`, accPastDue: "Plus, betaling mislukt: werk je betaalgegevens bij", accManage: "Beheer abonnement", accSubscribe: "Neem Plus, € 4,99 per maand", accLogout: "Uitloggen", accOut: "Je bent uitgelogd", accErr: "Dat lukte niet. Probeer het zo opnieuw.", accRedirect: "Even geduld, we openen de betaalpagina…", accSynced: "Je lijst en recepten worden bewaard in je account.", accNeed: { plan: "Je week plannen zit in Plus. Probeer het 14 dagen gratis.", recipes: "Meer dan één eigen recept zit in Plus. Probeer het 14 dagen gratis." } });
Object.assign(T.nl, { meT: "Mijn profiel", meName: "Je naam", meNamePh: "Bv. Mama of Jonas", avChange: "Kies een foto", avUpload: "Foto van je toestel", avErr: "Die foto lukte niet. Probeer een andere.",
  famT: "Mijn huis", famNone: "Deel je lijst met je gezin of vrienden: iedereen ziet dezelfde lijst en vinkt af wat gekocht is.", famSome: n => `${n} mensen delen deze lijst`,
  famInvite: "Nodig iemand uit", famShareText: "Kom bij ons huis op deal'ke, dan delen we één boodschappenlijst.", famCopied: "Link gekopieerd: stuur hem door", famLink: "Of stuur deze link (14 dagen geldig):",
  famLeave: "Verlaat het huis", famRemove: "Verwijder", famYou: "jij", famJoined: h => `Welkom in ${h}! Jullie delen nu één lijst.`, famJoinErr: "Die uitnodiging is verlopen. Vraag een nieuwe link.",
  famJoinSign: "Je bent uitgenodigd voor een gedeelde lijst. Log in om erbij te komen.", famLeft: "Je hebt het huis verlaten", famClear: "Wis wat gekocht is", famShared: n => `Gedeeld met ${n}`, homeName: "Thuis",
  famOff: "Samen een lijst delen staat nog niet aan.", famBought: n => `afgevinkt door ${n}` });
T.nl.sorts.value = "Goedkoopst per kg / L";
Object.assign(T.nl, { rPick: "Ingrediënten", rPickPh: "Zoek een product, bv. gehakt, pasta, ui", rFree: q => `“${q}” toevoegen als eigen ingrediënt`,
  rSteps: "Zo maak je het (mag leeg)", rAmount: "Hoeveelheid", rNone: "Voeg minstens één ingrediënt toe.", editRecipe: "Bewerk recept",
  stepsTitle: "Zo maak je het", rHint: "Kies uit de producten van alle winkels. Elke week zoeken we de beste promo voor elk ingrediënt.", rSaved: "Recept bewaard" });
Object.assign(T.fr, {
  accAlerts: "Aussi par e-mail", accAlertsWhy: "Le même résumé dans votre boîte mail.",
  accNotify: "Notification quotidienne sur cet appareil", accNotifyWhy: "Une notification par jour, seulement si un produit de votre liste passe en promo près de chez vous.",
  pushIos: "Sur iPhone ou iPad : touchez Partager puis « Sur l’écran d’accueil ». Ouvrez ensuite deal'ke depuis l’icône et activez ceci.",
  pushDenied: "Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur et réessayez.",
  pushNo: "Ce navigateur ne peut pas afficher de notifications.", pushOn: "Notification activée. On vous prévient demain matin s’il y a du nouveau.", pushOff: "Notification désactivée sur cet appareil.",
  promoNote: n => n === 1 ? "1 produit de votre liste en promo" : `${n} produits de votre liste en promo`, promoSee: "Voir", promoWhat: (q, s) => `${q} chez ${s}`,
  menuT: "Menu de la semaine", menuSub: "On choisit vos dîners parmi les promos de la semaine. Vos recettes en font partie.",
  menuMake: "Créer mon menu", menuRedo: "Refaire", menuSwap: "Autre recette", menuToList: "Ce qui manque dans ma liste",
  menuDays: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"], menuSaves: v => `économise ≈ ${v}`, menuN: "Soirs",
  menuNoDiet: "Aucune recette ne correspond à votre régime. Ajoutez vos recettes, on choisira parmi elles.",
  homeAdults: "Adultes", homeKids: "Enfants", homeFor: "Pour", forN: (n, r) => `pour ${n} pers.${r ? ` (recette : ${r})` : ""}`,
  wantsAdded: n => n ? `${n} ajoutés à votre liste` : "Déjà dans votre liste",
  splitTip: (c, v, n) => `Prenez ${n} produit${n === 1 ? "" : "s"} chez ${c} et économisez ${v} de plus`,
  savedMonth: v => `${v} économisés ce mois-ci`, savedWeek: v => `${v} cette semaine`, savedTop: c => `surtout chez ${c}`,
  savedVs: v => `déjà ${v} de plus que tout le mois passé`, bought: "Acheté", notBought: "Pas encore acheté",
  tickHint: "Cochez ce que vous achetez : on ne compte que ce que vous économisez vraiment.", youSaved: v => `Vous avez économisé ${v} ce mois-ci`,
  wantPh: "Ajoutez : café, lait, filet de poulet…", wantAdd: "Ajouter", wantsT: "Ce qu’il vous faut",
  wantNone: "pas de promo près de chez vous cette semaine", wantAt: (c, p) => `${c} · ${p}`,
  cheapT: "Magasin le moins cher pour votre liste", myShopT: "Votre magasin", myShop: "Mon magasin", myShopAny: "Pas de préférence", myShopWhy: "Il passe en premier dans votre liste et votre notification quotidienne. On vous dit toujours quand un autre magasin est moins cher.", myShopSaved: s => s ? `${s} est maintenant votre magasin` : "Plus de magasin préféré",
  covers: (a, b) => `${a} sur ${b} en promo`, tipCheaper: (c, v, n) => `${c} est ${v} moins cher pour les mêmes ${n}`,
  tipMore: (c, n) => `${c} en a ${n} de plus en promo`, prefMissing: c => `${c} n’a rien de votre liste en promo cette semaine`, fromFav: (k, c) => `à ${k} de votre ${c}`,
  otherShops: "Autres magasins", dealsT: "Promos gardées",
  listSub2: "Tapez ce qu’il vous faut. Chaque jour, on cherche la meilleure promo près de chez vous.",
  checked: (n, here, time) => `<b>${n}</b> promos${here ? ` près de ${here}` : ""} · vérifiées ${time}`, today: t => `aujourd’hui à ${t}`,
  navHome: "Accueil", navPricing: "Tarifs",
  eyebrow: c => `Belgique · ${c} enseignes · un prix honnête au kilo`,
  heroH: "Payez moins pour <em>les mêmes</em> courses.",
  heroSub: (c, r) => `Toutes les promos de ${c} supermarchés belges à moins de ${r} km, triées sur le vrai prix au kilo. Mises à jour chaque matin, avant l’ouverture des magasins.`,
  heroGo: pc => pc ? `Voir les promos de la semaine à ${pc}` : "Voir les promos de la semaine",
  trial: "Commencer mon essai gratuit de 14 jours", trialNote: "14 jours gratuits, sans carte.",
  biggest: (p, n, pr) => `Plus grosse remise : <b>−${p} %</b> sur ${n} chez ${pr}.`,
  pvTitle: "Promos de la semaine", previewCap: "C’est la vraie application, avec les promos de cette semaine.",
  trustbar: (n, c) => `<b>${n}</b> promos vérifiées ce matin dans <b>${c}</b> enseignes`,
  avgSave: v => `${v} d’économie moyenne par promo`,
  week: n => `Promos de la semaine ${n}`, bandSub: (n, c) => `${n} promos · ${c} enseignes · mises à jour chaque matin`, upTo: "jusqu’à",
  allStores: "Tous les magasins", youSave: v => `Vous économisez ${v}`, promo: "Promo",
  recipesTitle: "Cuisiner pour moins", recipesSub: "Choisissez ce que vous cuisinez cette semaine et cochez ce que vous avez. On cherche le reste uniquement dans les promos de la semaine.",
  startHere: "Commencez ici", bestStore: "Meilleur magasin", ofItems: (a, b) => `${a} produits sur ${b}`, totalSave: v => `Économie totale : ${v}`,
  listSub: "Une liste par magasin. Commencez là où vous économisez le plus.",
  prTitle: "Essayez tout gratuitement pendant 14 jours",
  prSub: (c, r) => `Toutes les promos de ${c} enseignes belges à moins de ${r} km, comparées au vrai prix au kilo, avec des recettes et une liste de courses par magasin.`,
  free: "Gratuit", freeSub: "Voir et comparer toutes les promos.", plus: "Plus", plusSub: "4,99 € par mois après l’essai. Résiliable à tout moment.",
  perMonth: "/ mois", trialBadge: "14 jours gratuits",
  freeList: c => [`Toutes les promos de la semaine de ${c} enseignes`, "Vrai prix au kilo ou au litre comparé", "Ma liste, par magasin", "1 recette perso"],
  plusList: c => ["Tout ce qui est gratuit", "Recettes perso illimitées", "Planifier la semaine : toutes les recettes d’un coup sur ma liste", "Liste et recettes sur tous vos appareils", "Résiliable à tout moment, en un clic"],
  freeBtn: "Voir les promos gratuites", soon: "Les comptes et le paiement arrivent bientôt. D’ici là, tout est gratuit.",
});
Object.assign(T.fr, { accSignIn: "Se connecter", accTitle: "Mon compte", accEmail: "E-mail", accSend: "Recevoir un lien de connexion", accWhy: "Pas de mot de passe : vous recevez un lien par e-mail. Votre liste et vos recettes vous suivent sur tous vos appareils.", accSent: e => `Regardez votre boîte mail (${e}) et cliquez sur le lien.`, accPlan: "Abonnement", accFree: "Gratuit", accTrial: d => `Plus, essai gratuit jusqu’au ${d}`, accActive: d => `Plus, renouvelé le ${d}`, accEnds: d => `Plus, se termine le ${d}`, accPastDue: "Plus, paiement échoué : mettez à jour votre moyen de paiement", accManage: "Gérer l’abonnement", accSubscribe: "Prendre Plus, 4,99 € par mois", accLogout: "Se déconnecter", accOut: "Vous êtes déconnecté", accErr: "Ça n’a pas marché. Réessayez dans un instant.", accRedirect: "Un instant, on ouvre la page de paiement…", accSynced: "Votre liste et vos recettes sont enregistrées dans votre compte.", accNeed: { plan: "Planifier la semaine fait partie de Plus. Essayez 14 jours gratuitement.", recipes: "Plus d’une recette perso fait partie de Plus. Essayez 14 jours gratuitement." } });
Object.assign(T.fr, { meT: "Mon profil", meName: "Votre prénom", meNamePh: "P. ex. Maman ou Lucas", avChange: "Choisir une photo", avUpload: "Photo de l’appareil", avErr: "Cette photo n’a pas marché. Essayez-en une autre.",
  famT: "Ma maison", famNone: "Partagez votre liste avec votre famille ou vos amis : tout le monde voit la même liste et coche ce qui est acheté.", famSome: n => `${n} personnes partagent cette liste`,
  famInvite: "Inviter quelqu’un", famShareText: "Rejoins notre maison sur deal'ke pour partager une seule liste de courses.", famCopied: "Lien copié : envoyez-le", famLink: "Ou envoyez ce lien (valable 14 jours) :",
  famLeave: "Quitter la maison", famRemove: "Retirer", famYou: "vous", famJoined: h => `Bienvenue dans ${h} ! Vous partagez maintenant une liste.`, famJoinErr: "Cette invitation a expiré. Demandez un nouveau lien.",
  famJoinSign: "Vous êtes invité à une liste partagée. Connectez-vous pour la rejoindre.", famLeft: "Vous avez quitté la maison", famClear: "Effacer ce qui est acheté", famShared: n => `Partagée avec ${n}`, homeName: "Maison",
  famOff: "Le partage de liste n’est pas encore activé.", famBought: n => `coché par ${n}` });
T.fr.sorts.value = "Moins cher au kg / L";
Object.assign(T.fr, { rPick: "Ingrédients", rPickPh: "Cherchez un produit, ex. haché, pâtes, oignon", rFree: q => `Ajouter « ${q} » comme ingrédient`,
  rSteps: "Préparation (facultatif)", rAmount: "Quantité", rNone: "Ajoutez au moins un ingrédient.", editRecipe: "Modifier la recette",
  stepsTitle: "Préparation", rHint: "Choisissez parmi les produits de tous les magasins. Chaque semaine, on cherche la meilleure promo pour chaque ingrédient.", rSaved: "Recette enregistrée" });
Object.assign(T.en, {
  accAlerts: "Also by email", accAlertsWhy: "The same summary in your inbox.",
  accNotify: "Daily notification on this device", accNotifyWhy: "One notification a day, only when something on your list is newly on promo near you.",
  pushIos: "On iPhone or iPad: tap Share, then ‘Add to Home Screen’. Then open deal'ke from the icon and switch this on.",
  pushDenied: "Notifications are blocked for this site. Allow them in your browser settings and try again.",
  pushNo: "This browser can't show notifications.", pushOn: "Notification is on. You'll hear from us tomorrow morning if there's something new.", pushOff: "Notification is off on this device.",
  promoNote: n => n === 1 ? "1 thing from your list on promo" : `${n} things from your list on promo`, promoSee: "View", promoWhat: (q, s) => `${q} at ${s}`,
  menuT: "Week menu", menuSub: "We pick your dinners from this week's deals. Your own recipes take part.",
  menuMake: "Make my week menu", menuRedo: "Again", menuSwap: "Other recipe", menuToList: "Put what's missing on my list",
  menuDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], menuSaves: v => `saves ≈ ${v}`, menuN: "Evenings",
  menuNoDiet: "No recipe fits your diet. Add your own recipes and we'll pick from those.",
  homeAdults: "Adults", homeKids: "Children", homeFor: "For", forN: (n, r) => `for ${n}${r ? ` (recipe: ${r})` : ""}`,
  wantsAdded: n => n ? `${n} added to your list` : "Already on your list",
  splitTip: (c, v, n) => `Get ${n} item${n === 1 ? "" : "s"} at ${c} and save ${v} more`,
  savedMonth: v => `${v} saved this month`, savedWeek: v => `${v} this week`, savedTop: c => `most at ${c}`,
  savedVs: v => `already ${v} more than all of last month`, bought: "Bought", notBought: "Not bought yet",
  tickHint: "Tick what you buy: we only count what you really save.", youSaved: v => `You saved ${v} this month`,
  wantPh: "Add: coffee, milk, chicken…", wantAdd: "Add", wantsT: "What you need",
  wantNone: "no deal nearby this week", wantAt: (c, p) => `${c} · ${p}`,
  cheapT: "Cheapest shop for your list", myShopT: "Your shop", myShop: "My shop", myShopAny: "No preference", myShopWhy: "Comes first on your list and in your daily notification. We always say when another shop is cheaper.", myShopSaved: s => s ? `${s} is now your shop` : "No favourite shop any more",
  covers: (a, b) => `${a} of ${b} on promo`, tipCheaper: (c, v, n) => `${c} is ${v} cheaper for the same ${n}`,
  tipMore: (c, n) => `${c} has ${n} more on promo`, prefMissing: c => `${c} has nothing from your list on promo this week`, fromFav: (k, c) => `${k} from your ${c}`,
  otherShops: "Other shops", dealsT: "Saved deals",
  listSub2: "Type what you need. Every day we find the best deal nearby.",
  checked: (n, here, time) => `<b>${n}</b> deals${here ? ` near ${here}` : ""} · checked ${time}`, today: t => `today at ${t}`,
  navHome: "Home", navPricing: "Pricing",
  eyebrow: c => `Belgium · ${c} chains · one honest price per kg`,
  heroH: "Pay less for <em>the same</em> groceries.",
  heroSub: (c, r) => `Every deal from ${c} Belgian supermarkets within ${r} km, sorted on the real price per kg. Updated every morning before the shops open.`,
  heroGo: pc => pc ? `Show this week's deals near ${pc}` : "Show this week's deals",
  trial: "Start my free 14-day trial", trialNote: "14 days free, no card needed.",
  biggest: (p, n, pr) => `Biggest discount now: <b>−${p}%</b> on ${n} at ${pr}.`,
  pvTitle: "This week's deals", previewCap: "This is the real app, live with this week's deals.",
  trustbar: (n, c) => `<b>${n}</b> deals checked this morning at <b>${c}</b> chains`,
  avgSave: v => `${v} average saving per deal`,
  week: n => `Deals of week ${n}`, bandSub: (n, c) => `${n} deals · ${c} chains · fresh every morning`, upTo: "up to",
  allStores: "All stores", youSave: v => `You save ${v}`, promo: "Deal",
  recipesTitle: "Cook for less", recipesSub: "Pick what you'll cook this week and tick what you have. We look for the rest in this week's deals only.",
  startHere: "Start here", bestStore: "Best store", ofItems: (a, b) => `${a} of ${b} items`, totalSave: v => `Total saving: ${v}`,
  listSub: "One list per store. Start where you save the most.",
  prTitle: "Try everything free for 14 days",
  prSub: (c, r) => `Every deal from ${c} Belgian chains within ${r} km, compared on the real price per kg, with recipes and one shopping list per store.`,
  free: "Free", freeSub: "See and compare every deal.", plus: "Plus", plusSub: "€4.99 a month after your trial. Cancel any time.",
  perMonth: "/ month", trialBadge: "14 days free",
  freeList: c => [`Every deal of the week from ${c} chains`, "Real price per kg or litre compared", "My list, per store", "1 recipe of your own"],
  plusList: c => ["Everything in Free", "Unlimited recipes of your own", "Plan your week: every recipe onto your list at once", "Your list and recipes on all your devices", "Cancel any time, in one click"],
  freeBtn: "See the free deals", soon: "Accounts and payment are coming soon. Until then everything is free.",
});
Object.assign(T.en, { accSignIn: "Sign in", accTitle: "My account", accEmail: "Email", accSend: "Email me a sign-in link", accWhy: "No password: we email you a link. Your list and recipes then follow you on every device.", accSent: e => `Check your inbox (${e}) and click the link.`, accPlan: "Plan", accFree: "Free", accTrial: d => `Plus, free trial until ${d}`, accActive: d => `Plus, renews on ${d}`, accEnds: d => `Plus, ends on ${d}`, accPastDue: "Plus, payment failed: please update your payment details", accManage: "Manage subscription", accSubscribe: "Get Plus, €4.99 a month", accLogout: "Sign out", accOut: "You're signed out", accErr: "That didn't work. Please try again in a moment.", accRedirect: "One moment, opening the payment page…", accSynced: "Your list and recipes are saved to your account.", accNeed: { plan: "Planning your week is part of Plus. Try it free for 14 days.", recipes: "More than one recipe of your own is part of Plus. Try it free for 14 days." } });
Object.assign(T.en, { meT: "My profile", meName: "Your name", meNamePh: "E.g. Mum or Jonas", avChange: "Pick a picture", avUpload: "Photo from your device", avErr: "That photo didn't work. Try another one.",
  famT: "My home", famNone: "Share your list with family or friends: everyone sees the same list and ticks off what's bought.", famSome: n => `${n} people share this list`,
  famInvite: "Invite someone", famShareText: "Join our home on deal'ke so we share one shopping list.", famCopied: "Link copied: send it on", famLink: "Or send this link (valid 14 days):",
  famLeave: "Leave this home", famRemove: "Remove", famYou: "you", famJoined: h => `Welcome to ${h}! You now share one list.`, famJoinErr: "That invite has expired. Ask for a new link.",
  famJoinSign: "You've been invited to a shared list. Sign in to join.", famLeft: "You left the home", famClear: "Clear what's bought", famShared: n => `Shared with ${n}`, homeName: "Home",
  famOff: "Sharing a list isn't switched on yet.", famBought: n => `ticked by ${n}` });
T.en.sorts.value = "Cheapest per kg / L";
Object.assign(T.nl, { sgRecent: "Recent gezocht", sgFav: "Jouw favorieten in promo", sgAll: q => `Alle promo's voor “${q}”`, sgDel: q => `“${q}” uit je zoekgeschiedenis halen`, qFuzzy: "Geen exacte treffers, dit lijkt er het meest op." });
Object.assign(T.fr, { sgRecent: "Recherches récentes", sgFav: "Vos favoris en promo", sgAll: q => `Toutes les promos pour « ${q} »`, sgDel: q => `Retirer « ${q} » de l’historique`, qFuzzy: "Pas de résultat exact, voici les plus proches." });
Object.assign(T.en, { sgRecent: "Recent searches", sgFav: "Your favourites on promo", sgAll: q => `All deals for “${q}”`, sgDel: q => `Remove “${q}” from your history`, qFuzzy: "No exact matches, these are the closest." });
Object.assign(T.en, { rPick: "Ingredients", rPickPh: "Search a product, e.g. mince, pasta, onion", rFree: q => `Add “${q}” as your own ingredient`,
  rSteps: "How to make it (optional)", rAmount: "Amount", rNone: "Add at least one ingredient.", editRecipe: "Edit recipe",
  stepsTitle: "How to make it", rHint: "Pick from every store's products. Each week we find the best deal for each ingredient.", rSaved: "Recipe saved" });
// the email list: only with a yes from the person (unticked by default, can be switched off in the account)
Object.assign(T.nl, { mkt: "Stuur me af en toe deal’ke-nieuws en tips per e-mail", mktWhy: "Hooguit een paar keer per maand. Afmelden kan altijd, hier in je account.", mktOn: "Je krijgt deal’ke-nieuws per e-mail", mktOff: "Je krijgt geen deal’ke-nieuws meer" });
Object.assign(T.fr, { mkt: "Envoyez-moi de temps en temps les nouvelles et astuces de deal’ke par e-mail", mktWhy: "Quelques fois par mois au maximum. Désinscription possible à tout moment, ici dans votre compte.", mktOn: "Vous recevrez les nouvelles de deal’ke par e-mail", mktOff: "Vous ne recevrez plus les nouvelles de deal’ke" });
Object.assign(T.en, { mkt: "Send me deal’ke news and tips by email now and then", mktWhy: "A few times a month at most. Unsubscribe any time, here in your account.", mktOn: "You'll get deal’ke news by email", mktOff: "You won't get deal’ke news any more" });
const LOCALE = { nl: "nl-BE", fr: "fr-BE", en: "en-GB" };
const KIND_ORDER = ["1+1", "2+1", "multi", "2nd_half", "2nd_pct", "percent", "bundle", "price_drop", "other"];
// ---------- Premium: Single and Family (strings) ----------
Object.assign(T.nl, {
  prTitle: "Kies je plan", single: "Single", family: "Family", bestValue: "Beste waarde", perMonth: "per maand",
  singleSub: "Voor jou alleen. Eén account, niet te delen.", familySub: "Tot 5 accounts met één gedeelde lijst. Alleen de eigenaar betaalt.",
  singleList: ["Alles uit Gratis", "Eigen recepten, onbeperkt", "Je week plannen: alle recepten in één keer op je lijst", "Je lijst en recepten op al je toestellen", "Maandelijks opzegbaar"],
  familyList: ["Alles uit Single, voor iedereen", "Jij en tot 4 anderen", "Eén gedeelde boodschappenlijst, live op elke gsm", "Samen deals bewaren en zien wat je samen bespaart", "Je eigen lijst blijft van jou", "Maandelijks opzegbaar"],
  famSave: (v, pp) => `${v} per maand goedkoper dan 5 × Single: ${pp} per persoon.`,
  buySingle: "Neem Single", buyFamily: "Neem Family", yourPlan: "Dit is je plan", switchToFam: "Overstappen naar Family", switchToSingle: "Overstappen naar Single",
  prFine: "Per maand betaald, geen jaarabonnement. Opzeggen kan altijd: je houdt Premium tot het einde van de betaalde maand.",
  seePremium: "Bekijk Premium", accManage: "Betaalgegevens, facturen of opzeggen", manageWhy: "Dat regel je veilig op de pagina van Stripe, onze betaalpartner.",
  planRenews: d => `Verlengt op ${d}.`, planEnds: d => `Stopt op ${d}; tot dan werkt alles.`, planActive: "Actief.", planStopped: "Gestopt.",
  planVia: o => `betaald door ${o}`, planPaused: "Gepauzeerd: het abonnement van je gezin loopt niet.",
  payFailed: d => `Je betaling is mislukt. Werk je betaalgegevens bij vóór ${d}, anders stopt Premium.`,
  payFailedFam: d => `Je betaling is mislukt. Werk je betaalgegevens bij vóór ${d}, anders stopt Premium voor het hele gezin.`,
  payStopped: "Je betaling is mislukt en Premium is gestopt. Werk je betaalgegevens bij om verder te gaan.",
  switchFamQ: "Je Single wordt Family, op hetzelfde abonnement. Je betaalt nu alleen het verschil voor de rest van deze maand, daarna € 12,99 per maand. Je lijst en recepten blijven. Doorgaan?",
  switchSingleQ: "Je Family wordt Single. Je gezin wordt gepauzeerd (er wordt niets gewist) en wat je te veel betaald hebt, gaat af van je volgende factuur. Doorgaan?",
  paidWait: "Even geduld: we wachten op de bevestiging van je betaling…", paidOk: "Premium staat aan.", paidSlow: "Je betaling wordt nog verwerkt. Kijk zo dadelijk opnieuw.",
  buyErrs: { member: "Je zit in een gezin. Verlaat het eerst als je zelf wil betalen.", single: "Je hebt al Single.", family: "Je hebt al Family.", others: "Er zitten nog mensen in je gezin. Verwijder ze eerst, dan kan je naar Single." },
  accNeed: { plan: "Je week plannen zit in Premium.", recipes: "Meer dan één eigen recept zit in Premium.", buy: "Log in om Premium te nemen." },
  famT: "Je gezin", famDefault: "Ons gezin", famPromo: "Met Family deel je één boodschappenlijst met tot 4 anderen. Iedereen vinkt af wat gekocht is.", seeFamily: "Bekijk Family",
  famOwner: "eigenaar", famFreeSpot: "vrij", famPlaces: (n, m) => `${n} van ${m} plaatsen`, famFree: n => n === 1 ? "1 vrij" : `${n} vrij`,
  famLocked: "Je gezin is gepauzeerd: het abonnement loopt niet. Er is niets gewist; alles komt terug zodra er weer betaald wordt.",
  famLockedOwner: "Je gezin is gepauzeerd omdat het abonnement niet loopt. Er is niets gewist: neem Family opnieuw en alles is terug.",
  famSavedMonth: v => `Samen bespaard deze maand: ${v}`,
  famNameLbl: "Naam van je gezin", famEmailPh: "E-mailadres van wie je uitnodigt", famInviteBtn: "Uitnodigen",
  famInviteWhy: "De link werkt 48 uur, één keer, en alleen voor dat e-mailadres.",
  famInviteMade: e => `Uitnodiging klaar voor ${e}. Stuur de link door:`, famLinkLbl: "Uitnodigingslink",
  famMail: "Mail de link", famShareBtn: "Deel", famCopy: "Kopieer", famCopied: "Link gekopieerd",
  famMailSubj: "Kom bij ons gezin op deal'ke", famMailBody: (o, l) => `${o} nodigt je uit om samen één boodschappenlijst te delen op deal'ke.\n\nOpen deze link binnen 48 uur en log in met dit e-mailadres:\n${l}`,
  famPending: d => `uitgenodigd, tot ${d}`, famCancel: "Annuleer", famRemove: "Verwijder",
  famRemoveQ: n => `${n} uit je gezin verwijderen? De gedeelde lijst is dan meteen weg voor hen. Hun eigen lijst blijft van hen.`,
  famLeave: "Gezin verlaten", famLeaveQ: "Het gezin verlaten? Je ziet de gedeelde lijst dan niet meer. Je eigen lijst blijft.",
  famLeaveOwnerQ: "Je gezin sluiten? Er wordt niets gewist, maar niemand ziet de gedeelde lijst nog.", famLeft: "Je hebt het gezin verlaten",
  famGone: "Je bent niet meer in het gezin.", famJoined: h => `Welkom in ${h}! Jullie delen nu één lijst.`,
  famJoinSign: "Je bent uitgenodigd voor een gezin op deal'ke. Log in met het e-mailadres waarop je de uitnodiging kreeg.",
  famErrs: { full: "Je gezin is vol: 5 personen, uitnodigingen meegeteld.", owner: "Alleen de eigenaar van het gezin kan dat.", notpaid: "Het abonnement van dit gezin loopt niet.",
    self: "Dat is je eigen e-mailadres.", member: "Die persoon zit al in je gezin.", email: "Dat e-mailadres klopt niet.",
    others: "Verwijder eerst de anderen uit je gezin.", cancel: "Zeg eerst je abonnement op.", other_email: h => `Deze uitnodiging is voor een ander e-mailadres${h ? ` (${h})` : ""}. Log in met dat adres.`,
    expired: "Deze uitnodiging is verlopen. Vraag een nieuwe.", revoked: "Deze uitnodiging is geannuleerd.", accepted: "Deze uitnodiging is al gebruikt.",
    unknown: "Deze uitnodigingslink klopt niet.", single: "Je betaalt nog voor Single. Zeg dat eerst op (het loopt tot het einde van de maand), dan kan je meedoen.",
    leave: "Je zit al in een ander gezin. Verlaat dat eerst." },
  invT: "Uitnodiging", invText: (o, f) => `${o || "Iemand"} nodigt je uit voor ${f}. Jullie delen dan één boodschappenlijst; je eigen lijst blijft van jou.`,
  invAccept: "Doe mee", invNo: "Nee, bedankt",
  famListT: n => `Gezinslijst · ${n}`, famTickHint: "Vink af wat je koopt: de anderen zien het meteen.", myListT: "Alleen voor mij",
  myListHint: "Dit ziet alleen jij. Tik op Naar gezin om iets te delen.", toFam: "Naar gezin", movedFam: "Op de gezinslijst gezet",
  wantForLbl: "Waar zet je het op?", forFam: "Op de gezinslijst", forMe: "Alleen voor mij", qtyLess: "Minder", qtyMore: "Meer",
  famDealsT: "Gedeelde deals", famDealGone: "niet meer in promo", shareDeal: "Deel met je gezin", unshare: "Niet meer delen", dealShared: "Gedeeld met je gezin",
});
Object.assign(T.fr, {
  prTitle: "Choisissez votre formule", single: "Single", family: "Family", bestValue: "Meilleur prix", perMonth: "par mois",
  singleSub: "Pour vous seul. Un compte, non partageable.", familySub: "Jusqu’à 5 comptes et une liste partagée. Seul le titulaire paie.",
  singleList: ["Tout ce qui est gratuit", "Recettes perso illimitées", "Planifier la semaine : toutes les recettes d’un coup sur ma liste", "Liste et recettes sur tous vos appareils", "Résiliable chaque mois"],
  familyList: ["Tout Single, pour tout le monde", "Vous et jusqu’à 4 autres", "Une liste de courses partagée, à jour sur chaque téléphone", "Garder des promos ensemble et voir ce que vous économisez ensemble", "Votre propre liste reste à vous", "Résiliable chaque mois"],
  famSave: (v, pp) => `${v} par mois de moins que 5 × Single : ${pp} par personne.`,
  buySingle: "Prendre Single", buyFamily: "Prendre Family", yourPlan: "Votre formule", switchToFam: "Passer à Family", switchToSingle: "Passer à Single",
  prFine: "Payé au mois, pas d’abonnement annuel. Résiliable à tout moment : Premium reste actif jusqu’à la fin du mois payé.",
  seePremium: "Voir Premium", accManage: "Paiement, factures ou résiliation", manageWhy: "Cela se fait en toute sécurité sur la page de Stripe, notre partenaire de paiement.",
  planRenews: d => `Renouvelé le ${d}.`, planEnds: d => `Se termine le ${d} ; jusque-là tout fonctionne.`, planActive: "Actif.", planStopped: "Arrêté.",
  planVia: o => `payé par ${o}`, planPaused: "En pause : l’abonnement de votre famille ne court plus.",
  payFailed: d => `Votre paiement a échoué. Mettez à jour votre moyen de paiement avant le ${d}, sinon Premium s’arrête.`,
  payFailedFam: d => `Votre paiement a échoué. Mettez à jour votre moyen de paiement avant le ${d}, sinon Premium s’arrête pour toute la famille.`,
  payStopped: "Votre paiement a échoué et Premium s’est arrêté. Mettez à jour votre moyen de paiement pour continuer.",
  switchFamQ: "Votre Single devient Family, sur le même abonnement. Vous payez maintenant seulement la différence pour le reste du mois, puis 12,99 € par mois. Votre liste et vos recettes restent. Continuer ?",
  switchSingleQ: "Votre Family devient Single. Votre famille est mise en pause (rien n’est effacé) et le trop-payé est déduit de votre prochaine facture. Continuer ?",
  paidWait: "Un instant : nous attendons la confirmation de votre paiement…", paidOk: "Premium est activé.", paidSlow: "Votre paiement est encore en cours. Revenez dans un instant.",
  buyErrs: { member: "Vous faites partie d’une famille. Quittez-la d’abord si vous voulez payer vous-même.", single: "Vous avez déjà Single.", family: "Vous avez déjà Family.", others: "Il reste des personnes dans votre famille. Retirez-les d’abord pour passer à Single." },
  accNeed: { plan: "Planifier la semaine fait partie de Premium.", recipes: "Plus d’une recette perso fait partie de Premium.", buy: "Connectez-vous pour prendre Premium." },
  famT: "Votre famille", famDefault: "Notre famille", famPromo: "Avec Family, vous partagez une liste de courses avec jusqu’à 4 autres. Chacun coche ce qui est acheté.", seeFamily: "Voir Family",
  famOwner: "titulaire", famFreeSpot: "libre", famPlaces: (n, m) => `${n} places sur ${m}`, famFree: n => n === 1 ? "1 libre" : `${n} libres`,
  famLocked: "Votre famille est en pause : l’abonnement ne court pas. Rien n’est effacé ; tout revient dès que c’est payé.",
  famLockedOwner: "Votre famille est en pause car l’abonnement ne court pas. Rien n’est effacé : reprenez Family et tout revient.",
  famSavedMonth: v => `Économisé ensemble ce mois-ci : ${v}`,
  famNameLbl: "Nom de votre famille", famEmailPh: "E-mail de la personne invitée", famInviteBtn: "Inviter",
  famInviteWhy: "Le lien marche 48 heures, une seule fois, et seulement pour cet e-mail.",
  famInviteMade: e => `Invitation prête pour ${e}. Envoyez le lien :`, famLinkLbl: "Lien d’invitation",
  famMail: "Envoyer par e-mail", famShareBtn: "Partager", famCopy: "Copier", famCopied: "Lien copié",
  famMailSubj: "Rejoins notre famille sur deal'ke", famMailBody: (o, l) => `${o} t’invite à partager une liste de courses sur deal'ke.\n\nOuvre ce lien dans les 48 heures et connecte-toi avec cet e-mail :\n${l}`,
  famPending: d => `invité, jusqu’au ${d}`, famCancel: "Annuler", famRemove: "Retirer",
  famRemoveQ: n => `Retirer ${n} de votre famille ? La liste partagée disparaît aussitôt pour cette personne. Sa propre liste reste à elle.`,
  famLeave: "Quitter la famille", famLeaveQ: "Quitter la famille ? Vous ne verrez plus la liste partagée. Votre propre liste reste.",
  famLeaveOwnerQ: "Fermer votre famille ? Rien n’est effacé, mais plus personne ne voit la liste partagée.", famLeft: "Vous avez quitté la famille",
  famGone: "Vous ne faites plus partie de la famille.", famJoined: h => `Bienvenue dans ${h} ! Vous partagez maintenant une liste.`,
  famJoinSign: "Vous êtes invité dans une famille sur deal'ke. Connectez-vous avec l’e-mail qui a reçu l’invitation.",
  famErrs: { full: "Votre famille est complète : 5 personnes, invitations comprises.", owner: "Seul le titulaire de la famille peut faire cela.", notpaid: "L’abonnement de cette famille ne court pas.",
    self: "C’est votre propre e-mail.", member: "Cette personne fait déjà partie de votre famille.", email: "Cet e-mail n’est pas valable.",
    others: "Retirez d’abord les autres de votre famille.", cancel: "Résiliez d’abord votre abonnement.", other_email: h => `Cette invitation est pour un autre e-mail${h ? ` (${h})` : ""}. Connectez-vous avec cette adresse.`,
    expired: "Cette invitation a expiré. Demandez-en une nouvelle.", revoked: "Cette invitation a été annulée.", accepted: "Cette invitation a déjà été utilisée.",
    unknown: "Ce lien d’invitation n’est pas valable.", single: "Vous payez encore Single. Résiliez-le d’abord (il court jusqu’à la fin du mois), puis rejoignez.",
    leave: "Vous êtes déjà dans une autre famille. Quittez-la d’abord." },
  invT: "Invitation", invText: (o, f) => `${o || "Quelqu’un"} vous invite dans ${f}. Vous partagerez une liste de courses ; votre propre liste reste à vous.`,
  invAccept: "Rejoindre", invNo: "Non merci",
  famListT: n => `Liste de famille · ${n}`, famTickHint: "Cochez ce que vous achetez : les autres le voient aussitôt.", myListT: "Rien que pour moi",
  myListHint: "Vous seul le voyez. Touchez Vers la famille pour partager.", toFam: "Vers la famille", movedFam: "Mis sur la liste de famille",
  wantForLbl: "Où l’ajouter ?", forFam: "Liste de famille", forMe: "Rien que pour moi", qtyLess: "Moins", qtyMore: "Plus",
  famDealsT: "Promos partagées", famDealGone: "plus en promo", shareDeal: "Partager avec la famille", unshare: "Ne plus partager", dealShared: "Partagé avec votre famille",
});
Object.assign(T.en, {
  prTitle: "Choose your plan", single: "Single", family: "Family", bestValue: "Best value", perMonth: "a month",
  singleSub: "Just for you. One account, not shareable.", familySub: "Up to 5 accounts with one shared list. Only the owner pays.",
  singleList: ["Everything in Free", "Unlimited recipes of your own", "Plan your week: every recipe on your list at once", "Your list and recipes on all your devices", "Cancel any month"],
  familyList: ["Everything in Single, for everyone", "You and up to 4 others", "One shared shopping list, live on every phone", "Save deals together and see what you save together", "Your own list stays yours", "Cancel any month"],
  famSave: (v, pp) => `${v} a month less than 5 × Single: ${pp} per person.`,
  buySingle: "Get Single", buyFamily: "Get Family", yourPlan: "Your plan", switchToFam: "Switch to Family", switchToSingle: "Switch to Single",
  prFine: "Paid monthly, no yearly plan. Cancel any time: you keep Premium until the end of the month you paid for.",
  seePremium: "See Premium", accManage: "Payment details, invoices or cancel", manageWhy: "You do that safely on the page of Stripe, our payment partner.",
  planRenews: d => `Renews on ${d}.`, planEnds: d => `Ends on ${d}; everything works until then.`, planActive: "Active.", planStopped: "Stopped.",
  planVia: o => `paid by ${o}`, planPaused: "Paused: your family's subscription isn't running.",
  payFailed: d => `Your payment failed. Update your payment details before ${d}, or Premium stops.`,
  payFailedFam: d => `Your payment failed. Update your payment details before ${d}, or Premium stops for the whole family.`,
  payStopped: "Your payment failed and Premium has stopped. Update your payment details to carry on.",
  switchFamQ: "Your Single becomes Family, on the same subscription. You pay only the difference for the rest of this month now, then €12.99 a month. Your list and recipes stay. Go ahead?",
  switchSingleQ: "Your Family becomes Single. Your family is paused (nothing is deleted) and what you overpaid comes off your next invoice. Go ahead?",
  paidWait: "One moment: waiting for your payment to be confirmed…", paidOk: "Premium is on.", paidSlow: "Your payment is still being processed. Check again in a moment.",
  buyErrs: { member: "You're in a family. Leave it first if you want to pay yourself.", single: "You already have Single.", family: "You already have Family.", others: "There are still people in your family. Remove them first, then you can switch to Single." },
  accNeed: { plan: "Planning your week is part of Premium.", recipes: "More than one recipe of your own is part of Premium.", buy: "Sign in to get Premium." },
  famT: "Your family", famDefault: "Our family", famPromo: "With Family you share one shopping list with up to 4 others. Everyone ticks off what's bought.", seeFamily: "See Family",
  famOwner: "owner", famFreeSpot: "free", famPlaces: (n, m) => `${n} of ${m} places`, famFree: n => `${n} free`,
  famLocked: "Your family is paused: the subscription isn't running. Nothing is deleted; it all comes back once it's paid again.",
  famLockedOwner: "Your family is paused because the subscription isn't running. Nothing is deleted: get Family again and it's all back.",
  famSavedMonth: v => `Saved together this month: ${v}`,
  famNameLbl: "Your family's name", famEmailPh: "Email of the person you invite", famInviteBtn: "Invite",
  famInviteWhy: "The link works for 48 hours, once, and only for that email address.",
  famInviteMade: e => `Invitation ready for ${e}. Send them the link:`, famLinkLbl: "Invitation link",
  famMail: "Email the link", famShareBtn: "Share", famCopy: "Copy", famCopied: "Link copied",
  famMailSubj: "Join our family on deal'ke", famMailBody: (o, l) => `${o} invites you to share one shopping list on deal'ke.\n\nOpen this link within 48 hours and sign in with this email address:\n${l}`,
  famPending: d => `invited, until ${d}`, famCancel: "Cancel", famRemove: "Remove",
  famRemoveQ: n => `Remove ${n} from your family? The shared list is gone for them straight away. Their own list stays theirs.`,
  famLeave: "Leave the family", famLeaveQ: "Leave the family? You won't see the shared list any more. Your own list stays.",
  famLeaveOwnerQ: "Close your family? Nothing is deleted, but nobody sees the shared list any more.", famLeft: "You left the family",
  famGone: "You're no longer in the family.", famJoined: h => `Welcome to ${h}! You now share one list.`,
  famJoinSign: "You've been invited to a family on deal'ke. Sign in with the email address the invitation was sent to.",
  famErrs: { full: "Your family is full: 5 people, invitations included.", owner: "Only the family's owner can do that.", notpaid: "This family's subscription isn't running.",
    self: "That's your own email address.", member: "That person is already in your family.", email: "That email address isn't valid.",
    others: "Remove the others from your family first.", cancel: "Cancel your subscription first.", other_email: h => `This invitation is for another email address${h ? ` (${h})` : ""}. Sign in with that address.`,
    expired: "This invitation has expired. Ask for a new one.", revoked: "This invitation was cancelled.", accepted: "This invitation has already been used.",
    unknown: "This invitation link isn't valid.", single: "You're still paying for Single. Cancel it first (it runs to the end of the month), then you can join.",
    leave: "You're already in another family. Leave that one first." },
  invT: "Invitation", invText: (o, f) => `${o || "Someone"} invites you to ${f}. You'll share one shopping list; your own list stays yours.`,
  invAccept: "Join", invNo: "No thanks",
  famListT: n => `Family list · ${n}`, famTickHint: "Tick what you buy: the others see it straight away.", myListT: "Just for me",
  myListHint: "Only you see this. Tap To family to share something.", toFam: "To family", movedFam: "Put on the family list",
  wantForLbl: "Where does it go?", forFam: "Family list", forMe: "Just for me", qtyLess: "Fewer", qtyMore: "More",
  famDealsT: "Shared deals", famDealGone: "no longer on promo", shareDeal: "Share with your family", unshare: "Stop sharing", dealShared: "Shared with your family",
});
const CAT_ORDER = ["fruit_veg", "meat_fish", "dairy", "bread", "pantry", "snacks", "drinks", "household", "other"];
const RADII = [2, 5, 10, 15, 25];
// Logo stand-ins in each chain's own colours (swap for official logo files when allowed)
const CHAINS = {
  "Colruyt": { bg: "#E2001A", fg: "#fff", l: "COLRUYT" }, "Okay": { bg: "#E30613", fg: "#fff", l: "OKay" },
  "Bio-Planet": { bg: "#5A8F29", fg: "#fff", l: "Bio-Planet" }, "Delhaize": { bg: "#fff", fg: "#D4001A", bd: "#D4001A", l: "Delhaize" },
  "Lidl": { bg: "#FFF000", fg: "#0050AA", bd: "#0050AA", l: "Lidl" }, "Aldi": { bg: "#00205B", fg: "#fff", l: "ALDI" },
  "Carrefour": { bg: "#fff", fg: "#004E9F", bd: "#E30613", l: "Carrefour" }, "Albert Heijn": { bg: "#00A0E2", fg: "#fff", l: "AH" },
  "Intermarché": { bg: "#E30613", fg: "#fff", l: "Intermarché" }, "Spar": { bg: "#007A3D", fg: "#fff", l: "SPAR" },
  "Match": { bg: "#E2001A", fg: "#fff", l: "Match" }, "Cora": { bg: "#E2001A", fg: "#fff", l: "cora" },
  "Jumbo": { bg: "#FFC800", fg: "#1D1B19", l: "Jumbo" }, "Sligro": { bg: "#003B7A", fg: "#fff", l: "Sligro" },
  "Louis Delhaize": { bg: "#fff", fg: "#B5121B", bd: "#B5121B", l: "Louis D." }, "Alvo": { bg: "#E30613", fg: "#fff", l: "Alvo" },
  "Renmans": { bg: "#7A1F2B", fg: "#fff", l: "Renmans" }, "Ekoplaza": { bg: "#2E7D32", fg: "#fff", l: "Ekoplaza" },
  "Delitraiteur": { bg: "#1D1B19", fg: "#fff", l: "Delitraiteur" }, "Cru": { bg: "#2B2A26", fg: "#fff", l: "Cru" },
  // Dutch chains, only in Zeeuws-Vlaanderen
  "Plus": { bg: "#00843D", fg: "#fff", l: "PLUS" }, "Coop": { bg: "#F37021", fg: "#fff", l: "Coop" },
  "Dirk": { bg: "#E30613", fg: "#fff", l: "Dirk" }, "Hoogvliet": { bg: "#004F9F", fg: "#fff", l: "Hoogvliet" },
  "DekaMarkt": { bg: "#E2001A", fg: "#fff", l: "DekaMarkt" },
};

// ---------- state ----------
const SYNCED = new Set(["list", "recipes", "have", "plan", "pc", "radius", "hist", "wants", "shop", "bought", "alerts", "home", "diet", "me", "famQ"]); // saved to the account when signed in
const store = {
  get(k, d) { try { const v = localStorage.getItem("dk." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("dk." + k, JSON.stringify(v)); } catch { /* private mode */ } if (SYNCED.has(k)) queueSync(); },
};
const url = new URLSearchParams(location.search);
const browserLang = (navigator.language || "nl").slice(0, 2);
const S = {
  lang: url.get("lang") || store.get("lang", ["nl", "fr", "en"].includes(browserLang) ? browserLang : "nl"),
  pc: store.get("pc", null), radius: store.get("radius", 15),
  q: url.get("q") || "", cat: url.get("cat") || "",
  kinds: new Set((url.get("type") || "").split(",").filter(Boolean)),
  chains: new Set((url.get("store") || "").split(",").filter(Boolean)),
  sort: url.get("sort") || store.get("sort", "value"),
  list: store.get("list", {}), // id -> deal snapshot, so the list survives a new week of data
  wants: store.get("wants", []), // [{ id, q }]: products in your own words ("koffie"), matched to deals every day
  shop: store.get("shop", ""),   // preferred chain: shown first, cheaper options still shown
  alerts: store.get("alerts", false), // also by email (sent by alerts/daily.py on GitHub Actions, once email is set up)
  pushOn: store.get("pushOn", null),  // this device's push subscription {endpoint, keys}, or null (not synced: it's per device)
  bought: store.get("bought", []), // items ticked as bought: the only thing "money saved" counts
  me: store.get("me", { name: "", avatar: "" }),
  famQ: store.get("famQ", []),   // the family list's open items, copied to prefs for the morning notification
  wantFor: store.get("wantFor", "fam"),   // where a new item goes when you're in a family: "fam" or "me"
   // name and picture the people you share a list with see
  diet: new Set(store.get("diet", [])), // profile: vegetarian, gluten-free, halal, ... (site/diet.js); the same as the filters
  shown: 48,
};
let DEALS = [], BRANCHES = [], PCS = {}, PCS_NL = {}, SAMPLE = false, UPDATED = null;
let nearest = {}; // chain -> {d, branch}

const $ = s => document.querySelector(s);
const t = () => T[S.lang] || T.nl;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = v => v == null ? "" : new Intl.NumberFormat(LOCALE[S.lang], { style: "currency", currency: "EUR" }).format(v);
const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// ---------- anonymous statistics (site/consent.js: only after "Accept" on the cookie banner) ----------
const trk = (kind, d) => { try { window.DKTrack?.(kind, d); } catch { /* never in the way */ } };

// ---------- site settings from the admin back end (supabase site_settings, readable by everyone) ----------
let SET = {};
async function getSettings() {
  const c = window.DK_CONFIG || {};
  if (!c.supabaseUrl || !c.supabaseAnonKey) return {};
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 2500);  // never hold the page up
    const r = await fetch(c.supabaseUrl.replace(/\/$/, "") + "/rest/v1/site_settings?select=key,value",
      { headers: { apikey: c.supabaseAnonKey, Authorization: "Bearer " + c.supabaseAnonKey }, signal: ctl.signal });
    clearTimeout(timer);
    if (!r.ok) return {};
    return Object.fromEntries((await r.json()).map(x => [x.key, x.value]));
  } catch { return {}; }
}
const dealKey = d => `${d.store}|${d.name}`;
// stores and deals hidden in the back end (e.g. a wrong price) don't show
function applySettings(raw) {
  const hideS = new Set(Array.isArray(SET.hidden_stores) ? SET.hidden_stores : []);
  const hideD = new Set(Array.isArray(SET.hidden_deals) ? SET.hidden_deals : []);
  return raw.filter(d => !hideS.has(d.store) && !hideD.has(dealKey(d)));
}
function paintSettings() {
  const lang = S.lang, f = SET.features || {};
  document.querySelectorAll('[data-view="recipes"]').forEach(a => { a.hidden = f.recipes === false; });
  document.querySelectorAll('[data-view="pricing"]').forEach(a => { a.hidden = f.pricing === false; });
  if (f.recipes === false && location.hash === "#recipes") location.hash = "#deals";
  if (f.pricing === false && location.hash === "#pricing") location.hash = "#deals";
  const a = SET.announcement, txt = a?.on && (a[lang] || a.nl || a.en || a.fr);
  let bar = $("#announce");
  if (txt) {
    if (!bar) { bar = document.createElement("div"); bar.id = "announce"; bar.setAttribute("role", "status"); $("header.top").after(bar); }
    bar.className = "announce " + (a.tone === "warn" ? "warn" : "info");
    bar.innerHTML = `<div class="wrap">${esc(txt)}${a.link && /^https?:\/\//.test(a.link) ? ` <a href="${esc(a.link)}" rel="noopener">→</a>` : ""}</div>`;
  } else bar?.remove();
  const m = SET.maintenance, mt = m?.on && (m[lang] || m.nl || m.en);
  let ov = $("#maint");
  if (mt) {
    if (!ov) { ov = document.createElement("div"); ov.id = "maint"; ov.className = "maint"; document.body.append(ov); }
    ov.innerHTML = `<div class="pop"><h3>deal’ke</h3><p>${esc(mt)}</p></div>`;
  } else ov?.remove();
}

// ---------- data ----------
function dealKind(text) { // mirrors collector/parse.py deal_kind for older data
  if (!text) return null;
  const s = text.toLowerCase();
  let m = s.match(/\b(\d)\s*\+\s*(\d)\b/); if (m) return `${+m[1]}+${+m[2]}`;
  m = s.match(/\b(\d+)\s*(?:voor|pour|for)\s*(€\s*)?(\d+(?:[.,]\d+)?)\s*(€|eur)?/);
  if (m) { if (m[2] || m[4] || /[.,]/.test(m[3])) return "bundle"; const g = +m[1], p = +m[3]; if (g > p && p > 0) return `${p}+${g - p}`; }
  if (/\b2(?:de|e|ème|nd)\b/.test(s)) { if (/halve prijs|moitié prix|half price|-?\s*50\s*%/.test(s)) return "2nd_half"; if (/\d+\s*%/.test(s)) return "2nd_pct"; }
  if (/-\s*\d+\s*%|\d+\s*%\s*(?:korting|réduction|off)/.test(s)) return "percent";
  if (/prijsdaling|baisse de prix|price drop|nieuwe lage prijs|bonus|actieprijs|prix promo/.test(s)) return "price_drop";
  return "other";
}
const kindGroup = k => !k ? "other" : (k === "1+1" || k === "2+1") ? k : /^\d\+\d$/.test(k) ? "multi" : k;

function prepare(raw) {
  return raw.map((d, i) => {
    const kind = d.deal_kind || dealKind(d.promo_text) || (d.old_price ? "price_drop" : "other");
    const discount = d.old_price && d.old_price > d.price ? (d.old_price - d.price) / d.old_price : null;
    let id = 0; for (const c of `${d.store}|${d.name}|${d.pack_size}|${d.price}`) id = (id * 31 + c.charCodeAt(0)) | 0;
    // what the product is (concepts.js): its aisle also fixes the shop's own label ("Kattenvoeding, Kip" is not meat)
    const k = window.DKConcepts ? DKConcepts.analyse(d.name, d.brand, d.language) : { type: null, all: [], marks: [], aisle: null };
    return { ...d, id: "d" + (id >>> 0).toString(36), kind, group: kindGroup(kind), cat: k.aisle || d.category || "other", pk: k,
      discount, until: d.valid_until ? new Date(d.valid_until) : null, hay: fold(`${d.name} ${d.brand || ""} ${d.store}`), i };
  });
}

async function getJSON(path) {
  try { const r = await fetch(path, { cache: "no-cache" }); return r.ok ? r.json() : null; } catch { return null; }
}

async function load() {
  const [deals, branches, pcs, meta, pcsNl, set] = await Promise.all([
    getJSON("data/deals.json"), getJSON("data/stores.json"), getJSON("data/postcodes.json"), getJSON("data/meta.json"),
    getJSON("data/postcodes-nl.json"), getSettings()]);
  SET = set || {};
  let raw = deals || [];
  if (!raw.length) { raw = (await getJSON("data/sample-deals.json")) || []; SAMPLE = true; }
  DEALS = prepare(applySettings(raw));
  BRANCHES = branches || [];
  PCS = pcs || {};
  PCS_NL = pcsNl || {};
  UPDATED = meta?.collected_at || raw.reduce((a, d) => (d.collected_at > a ? d.collected_at : a), "") || null;
  computeNearest();
}

function haversine(a, b, c, d) {
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}
// Postcodes: Belgian ones are stored as "9000", Dutch ones (Zeeuws-Vlaanderen) as "NL-4531",
// because 4500-4589 exist in both countries (Huy/Liège and Terneuzen/Hulst/Sluis).
const isNL = pc => String(pc || "").startsWith("NL-");
// An address is stored as "@BE|51.054|3.722|Veldstraat 1, 9000 Gent" (rounded to ~100 m).
const isGeo = pc => String(pc || "").startsWith("@");
const geo = pc => { const [cc, lat, lon, ...rest] = pc.slice(1).split("|"); return { cc, lat: +lat, lon: +lon, label: rest.join("|") }; };
const pcAt = pc => { if (!pc) return null; if (isGeo(pc)) { const g = geo(pc); return [g.lat, g.lon, g.label]; } return isNL(pc) ? PCS_NL[pc.slice(3)] : PCS[pc]; };
const pcName = pc => { if (isGeo(pc)) { const g = geo(pc); return g.label + (g.cc === "NL" ? " (NL)" : ""); }
  const p = pcAt(pc); return p ? `${isNL(pc) ? pc.slice(3) : pc} ${p[2]}${isNL(pc) ? " (NL)" : ""}` : (isNL(pc) ? pc.slice(3) : pc || ""); };
const pcShort = pc => !pc ? "" : isGeo(pc) ? geo(pc).label.split(",")[0] : isNL(pc) ? pc.slice(3) : pc;  // "9000" or "Veldstraat 1"
const pcInput = pc => !pc ? "" : isGeo(pc) ? geo(pc).label : pcShort(pc);                                  // what goes back in the box
const ccOf = pc => isGeo(pc) ? geo(pc).cc : isNL(pc) ? "NL" : "BE";
// Nearest branch per chain *and country*: a Dutch Lidl promo only counts Dutch Lidl branches, and the other way round.
// Near the border you get the promos of both countries inside your radius.
function computeNearest() {
  nearest = {};
  const p = pcAt(S.pc);
  if (!p || !BRANCHES.length) return;
  for (const b of BRANCHES) {
    const d = haversine(p[0], p[1], b.lat, b.lon), k = `${b.cc || "BE"}|${b.chain}`;
    if (!nearest[k] || d < nearest[k].d) nearest[k] = { d, b };
  }
}
const nearOf = d => nearest[`${d.cc || "BE"}|${d.store}`];
const dist = chain => { const a = nearest["BE|" + chain]?.d, b = nearest["NL|" + chain]?.d; return a == null ? b : b == null ? a : Math.min(a, b); };
const distDeal = d => nearOf(d)?.d;
function inRadius(d) {
  const nl = d.cc === "NL", k = distDeal(d);
  if (!S.pc) return !nl;               // no postcode yet: Belgian promos only
  if (k == null) return !nl;           // no branch of this chain known: keep Belgian promos as before
  return k <= S.radius;
}

// ---------- filtering ----------
const dietOn = () => S.diet.size > 0 && !!window.DKDiet;
const dietOk = d => !dietOn() || DKDiet.fits(d, [...S.diet]);
function setDiet(k) { S.diet.has(k) ? S.diet.delete(k) : S.diet.add(k); store.set("diet", [...S.diet]); matchCache.clear(); promoNote(); }
function matches(d, skip) {
  if (!inRadius(d)) return false;
  if (skip !== "cat" && S.cat && d.cat !== S.cat) return false;
  if (skip !== "kind" && S.kinds.size && !S.kinds.has(d.group)) return false;
  if (skip !== "chain" && S.chains.size && !S.chains.has(d.store)) return false;
  if (!dietOk(d)) return false;
  if (S.q && !DS.search(DEALS, S.q).hits.has(d.id)) return false;  // typo-tolerant, see search.js
  return true;
}
const SORTS = {
  value: (a, b) => ((a.unit && a.unit_price) ?? 1e9) - ((b.unit && b.unit_price) ?? 1e9) || a.price - b.price,
  price: (a, b) => a.price - b.price,
  discount: (a, b) => (b.discount ?? effDiscount(b)) - (a.discount ?? effDiscount(a)),
  near: (a, b) => (distDeal(a) ?? 1e9) - (distDeal(b) ?? 1e9) || SORTS.value(a, b),
  ending: (a, b) => (a.until ?? 9e15) - (b.until ?? 9e15),
};
function effDiscount(d) { const m = /^(\d)\+(\d)$/.exec(d.kind); if (m) return +m[2] / (+m[1] + +m[2]); if (d.kind === "2nd_half") return .25; return 0; }

// ---------- rendering ----------
function tagText(d) {
  const L = t(), m = /^(\d)\+(\d)$/.exec(d.kind);
  if (m) return `${d.kind} ${L.tag.free("").trim()}`;
  if (d.kind === "2nd_half") return L.tag["2nd_half"];
  if (d.kind === "percent") { const p = (d.promo_text || "").match(/(\d+)\s*%/); return `-${p ? p[1] : Math.round((d.discount || 0) * 100)}%`; }
  if (d.kind === "price_drop") return d.discount ? `-${Math.round(d.discount * 100)}%` : L.tag.price_drop;
  return d.promo_text || L.tag.promo;
}
function sicon(chain, cls = "") {
  const c = CHAINS[chain] || { bg: "#17150F", fg: "#fff", l: chain };
  const s = c.s || c.l.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 1).toUpperCase();
  return `<span class="sicon ${cls}" aria-hidden="true" style="background:${c.bg};color:${c.fg};${c.bd ? `box-shadow:inset 0 0 0 1.5px ${c.bd};` : ""}">${esc(s)}</span>`;
}
function logo(chain, big) {
  const c = CHAINS[chain] || { bg: "#1D1B19", fg: "#fff", l: chain };
  return `<span class="slogo" style="background:${c.bg};color:${c.fg};${c.bd ? `box-shadow:inset 0 0 0 1px ${c.bd};` : ""}${big ? "height:28px;font-size:13px" : ""}">${esc(c.l)}</span>`;
}
const km = d => d == null ? "" : `${d < 10 ? d.toFixed(1).replace(".", S.lang === "en" ? "." : ",") : Math.round(d)} km`;
const kmText = chain => km(dist(chain));
// how far another shop is from your favourite one (its branch nearest to you), so you know what the detour costs
function kmFromFav(chain) {
  if (!S.shop || chain === S.shop) return null;
  const fav = nearest["BE|" + S.shop]?.b || nearest["NL|" + S.shop]?.b; if (!fav) return null;
  let best = null;
  for (const b of BRANCHES) if (b.chain === chain) { const d = haversine(fav.lat, fav.lon, b.lat, b.lon); if (best == null || d < best) best = d; }
  return best;
}
const favNote = chain => { const d = kmFromFav(chain); return d == null ? "" : ` (${t().fromFav(km(d), esc(S.shop))})`; };
const kmDeal = d => km(distDeal(d));
const ccTag = d => d.cc === "NL" ? `<span class="cc-tag" title="${esc(t().cc.NL)}"><i class="flag nl"></i>NL</span>` : "";
const pct = d => { if (d.discount) return Math.round(d.discount * 100); const e = effDiscount(d); if (e) return Math.round(e * 100);
  const p = (d.promo_text || "").match(/(\d+)\s*%/); return p ? +p[1] : null; };
function photo(d, big) {
  const img = d.image_url ? `<img src="${esc(d.image_url)}" alt="" loading="${big ? "eager" : "lazy"}" decoding="async" onerror="this.remove()">` : "";
  const cat = t().cats[d.cat] || "", p = pct(d), tag = tagText(d);
  const p2 = `${t().promo} · ${tag}`;
  return `<div class="photo">${img || `<div class="ph"><b>${esc((d.brand || d.name || "?").trim()[0])}</b><span>${esc(cat)}</span></div>`}
    ${p ? `<span class="ribbon" aria-hidden="true">−${p}%</span>` : ""}
    <div class="pills">${p ? `<span class="p1">−${p}%</span>` : ""}<span class="p2">${esc(p2)}</span></div></div>`;
}
const unitLine = d => d.unit_price ? `<span class="unit"><b>${money(d.unit_price)}</b>/${t().perUnit[d.unit] || d.unit}</span>` : "";
const plus = on => on
  ? `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

function card(d) {
  const on = !!S.list[d.id], L = t(), save = d.old_price && d.old_price > d.price ? d.old_price - d.price : null;
  return `<article class="card" data-id="${d.id}" tabindex="0" aria-label="${esc(d.name)}, ${money(d.price)}, ${esc(d.store)}">
    ${photo(d)}
    <div class="body">
      <h3 class="name">${esc(d.name)}</h3>
      <div class="where">${sicon(d.store)}<span>${esc(d.store)}${ccTag(d)}${d.pack_size ? ` · ${esc(d.pack_size)}` : ""}</span></div>
      <div class="priceline"><span class="price">${money(d.price)}</span>${d.old_price ? `<span class="old">${money(d.old_price)}</span>` : ""}</div>
      ${d.unit_price && d.unit ? `<span class="unit">${money(d.unit_price)} / ${L.perUnit[d.unit] || d.unit}</span>` : ""}
      ${save ? `<span class="save">${L.youSave(money(save))}</span>` : ""}
      <div class="foot-row"><span>${kmDeal(d)}</span>
        <button type="button" class="add" data-add="${d.id}" aria-pressed="${on}" aria-label="${on ? L.added : L.add}">${plus(on)}</button></div>
    </div></article>`;
}

function chipsHTML(items, active, attr) {
  return items.map(([key, label, n, extra]) =>
    `<button type="button" class="chip" ${attr}="${esc(key)}" aria-pressed="${active(key)}">${extra || ""}${esc(label)}${n != null ? ` <span class="n">${n}</span>` : ""}</button>`).join("");
}

// Shops around the postcode: a map with every branch inside the radius, and the nearest branch per chain as a list
const MAP = { lib: null, map: null, layer: null, markers: {}, key: "" };
function loadLeaflet() {
  if (!MAP.lib) MAP.lib = loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js").then(() => window.L);
  return MAP.lib;
}
function branchesNear() {
  const p = pcAt(S.pc); if (!p) return [];
  return BRANCHES.map(b => ({ b, d: haversine(p[0], p[1], b.lat, b.lon) })).filter(x => x.d <= S.radius).sort((x, y) => x.d - y.d);
}
const route = b => `https://www.openstreetmap.org/directions?to=${b.lat},${b.lon}`;
function renderNear() {
  const L = t(), box = $("#near");
  const all = branchesNear();
  box.hidden = !all.length; if (!all.length) return;
  const live = new Set(DEALS.map(d => `${d.cc || "BE"}|${d.store}`)), withDeals = b => live.has(`${b.cc || "BE"}|${b.chain}`);
  const noDeals = b => b.cc === "NL" ? L.nearNL : L.nearNo;
  const first = {}; for (const x of all) first[`${x.b.cc || "BE"}|${x.b.chain}`] ??= x; // nearest per chain and country
  const near = Object.values(first);
  $("#nearT").textContent = L.nearT(all.length, S.radius);
  $("#nearSub").textContent = L.nearSub(near.length, pcName(S.pc));
  $("#nearList").innerHTML = near.map(({ b, d }, i) => `<li><button type="button" class="near-go" data-near="${i}">${sicon(b.chain, "lg")}<span><b>${esc(b.name)}</b><small>${esc(b.address || b.chain)}${withDeals(b) ? "" : ` · ${noDeals(b)}`}</small></span><span class="km">${km(d)}</span></button>
    <a class="route" href="${route(b)}" target="_blank" rel="noopener">${L.nearRoute}</a></li>`).join("");
  $("#nearList").onclick = e => { const g = e.target.closest("[data-near]"); if (g) focusBranch(near[+g.dataset.near].b); };
  const key = `${S.pc}|${S.radius}|${S.lang}|${BRANCHES.length}`;
  if (key === MAP.key) return;
  MAP.key = key;
  loadLeaflet().then(Lf => drawMap(Lf, pcAt(S.pc), all, withDeals, noDeals)).catch(() => { $("#map").hidden = true; });
}
function pin(Lf, chain) {
  const c = CHAINS[chain] || { bg: "#17150F", fg: "#fff", l: chain };
  const s = c.s || c.l.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 1).toUpperCase();
  return Lf.divIcon({ className: "pin", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
    html: `<span style="background:${c.bg};color:${c.fg};${c.bd ? `box-shadow:inset 0 0 0 2px ${c.bd},0 1px 4px rgba(0,0,0,.35);` : ""}">${esc(s)}</span>` });
}
function drawMap(Lf, p, all, withDeals, noDeals) {
  const L = t();
  if (!MAP.map) {
    MAP.map = Lf.map("map", { scrollWheelZoom: false, zoomControl: true });
    Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(MAP.map);
  }
  MAP.layer?.remove();
  MAP.layer = Lf.layerGroup().addTo(MAP.map);
  MAP.markers = {};
  const home = [p[0], p[1]];
  Lf.circle(home, { radius: S.radius * 1000, color: "#B4E01F", weight: 2, fillColor: "#C6F135", fillOpacity: .08, interactive: false }).addTo(MAP.layer);
  Lf.marker(home, { icon: Lf.divIcon({ className: "pin home", iconSize: [18, 18], iconAnchor: [9, 9] }), title: pcName(S.pc), keyboard: false }).addTo(MAP.layer);
  for (const { b, d } of all) {
    const m = Lf.marker([b.lat, b.lon], { icon: pin(Lf, b.chain), title: b.name })
      .bindPopup(`<b>${esc(b.name)}</b><br>${esc(b.address || "")}${b.address ? "<br>" : ""}${km(d)}${withDeals(b) ? "" : ` · ${noDeals(b)}`}<br><a href="${route(b)}" target="_blank" rel="noopener">${L.nearRoute}</a>`);
    m.addTo(MAP.layer); MAP.markers[`${b.lat},${b.lon}`] = m;
  }
  MAP.map.invalidateSize();
  MAP.map.fitBounds(Lf.latLng(home).toBounds(S.radius * 2000), { padding: [8, 8] });
}
function focusBranch(b) {
  const m = MAP.markers[`${b.lat},${b.lon}`]; if (!m || !MAP.map) return;
  MAP.map.setView([b.lat, b.lon], Math.max(MAP.map.getZoom(), 15)); m.openPopup();
  $("#map").scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function render() {
  renderNear();
  const L = t();
  // facet counts: each filter group counts what the *other* filters leave
  const count = (skip, key) => { const m = new Map(); for (const d of DEALS) if (matches(d, skip)) m.set(d[key], (m.get(d[key]) || 0) + 1); return m; };
  const catN = count("cat", "cat"), kindN = count("kind", "group"), chainN = count("chain", "store");
  const totalCat = [...catN.values()].reduce((a, b) => a + b, 0);

  const grid = `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
  const pic = c => { const d = DEALS.filter(x => x.cat === c && x.image_url).sort((a, b) => (pct(b) || 0) - (pct(a) || 0))[0];
    return d ? `<img src="${esc(d.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : ""; };
  $("#tabs").innerHTML = [`<button type="button" data-cat="" aria-pressed="${!S.cat}"><span class="tile">${grid}</span><span>${L.allDeals}</span></button>`]
    .concat(CAT_ORDER.filter(c => catN.get(c) || S.cat === c).map(c =>
      `<button type="button" data-cat="${c}" aria-pressed="${S.cat === c}"><span class="tile">${pic(c)}</span><span>${L.cats[c]}<sup>${catN.get(c) || 0}</sup></span></button>`)).join("");

  $("#kinds").innerHTML = chipsHTML(
    KIND_ORDER.filter(k => kindN.get(k) || S.kinds.has(k)).map(k => [k, L.kinds[k], kindN.get(k) || 0]),
    k => S.kinds.has(k), "data-kind").replace(/class="chip"/g, 'class="chip sm"');

  $("#diets").innerHTML = (window.DKDiet ? DKDiet.KEYS : []).map(k => `<button type="button" class="chip sm diet" data-diet="${k}" aria-pressed="${S.diet.has(k)}">${esc(L.diets[k])}</button>`).join("");
  $("#dietNote").hidden = !dietOn(); $("#dietNote").textContent = L.dietNote;
  const chains = [...new Set(DEALS.map(d => d.store))]
    .filter(c => chainN.get(c) || S.chains.has(c))
    .sort((a, b) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9) || a.localeCompare(b));
  $("#stores").innerHTML = `<button type="button" class="chip" data-chain="*" aria-pressed="${!S.chains.size}">${L.allStores}</button>` +
    chains.map(c => `<button type="button" class="chip" data-chain="${esc(c)}" aria-pressed="${S.chains.has(c)}">${sicon(c)}${esc(c)}${kmText(c) ? ` <span class="km">${kmText(c)}</span>` : ` <span class="n">${chainN.get(c) || 0}</span>`}</button>`).join("");

  $("#sort").innerHTML = Object.entries(L.sorts)
    .filter(([k]) => k !== "near" || Object.keys(nearest).length)
    .map(([k, v]) => `<option value="${k}"${S.sort === k ? " selected" : ""}>${v}</option>`).join("");

  const list = DEALS.filter(d => matches(d)).sort(S.q ? searchOrder() : SORTS[S.sort] || SORTS.value);
  const here = pcAt(S.pc) ? pcName(S.pc) : "";
  $("#secTitle").textContent = S.q ? L.searchTitle(S.q) : (S.cat ? L.cats[S.cat] : L.secTitle);
  $("#secSub").textContent = (S.q && list.length && DS.search(DEALS, S.q).mode < 3 ? L.qFuzzy + " " : "") + L.secSub(list.length, Object.keys(nearest).length ? here : "", S.radius);
  $("#clearAll").hidden = !(S.q || S.cat || S.kinds.size || S.chains.size);
  $("#grid").innerHTML = list.length
    ? list.slice(0, S.shown).map(card).join("")
    : `<div class="empty"><h3>${L.emptyT}</h3><p>${L.emptyP}</p></div>`;
  $("#more").hidden = list.length <= S.shown;
  syncURL();
}

function renderStatic() {
  const L = t();
  document.documentElement.lang = S.lang;
  promoNote();
  document.querySelectorAll("[data-t]").forEach(el => { const v = L[el.dataset.t]; if (typeof v === "string") el.textContent = v; });
  document.querySelectorAll("[data-t-ph]").forEach(el => { el.placeholder = L[el.dataset.tPh]; el.setAttribute("aria-label", L[el.dataset.tPh]); });
  document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === S.lang));
  document.querySelectorAll("[data-t-label]").forEach(el => el.setAttribute("aria-label", L[el.dataset.tLabel]));
  renderHero();
  $("#sampleNote").hidden = !SAMPLE;
  $("#locLbl").textContent = S.pc ? `${pcName(S.pc)} · ${S.radius} km` : L.setPc;
  paintCc();
  $("#footUpdated").textContent = UPDATED ? L.updated(new Date(UPDATED).toLocaleString(LOCALE[S.lang], { dateStyle: "medium", timeStyle: "short" })) : "";
  $("#hero").classList.toggle("compact", !!S.pc && !url.has("hero"));
  $("#hero").classList.toggle("slim", !S.pc && !url.has("hero"));  // first visit: one postcode box, then straight to the deals
  $("#listCount").textContent = listN();
}

function syncURL() {
  const p = new URLSearchParams();
  if (S.q) p.set("q", S.q); if (S.cat) p.set("cat", S.cat);
  if (S.kinds.size) p.set("type", [...S.kinds].join(","));
  if (S.chains.size) p.set("store", [...S.chains].join(","));
  if (S.sort !== "value") p.set("sort", S.sort);
  const s = p.toString();
  history.replaceState(null, "", (s ? `?${s}` : location.pathname) + location.hash);
}

// ISO week number, for the "Deals of week 45" band
function isoWeek(d) { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day); return Math.ceil(((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7); }

function renderHero() {
  const L = t(), live = DEALS.filter(d => inRadius(d));
  const chains = [...new Set(live.map(d => d.store))];
  const saves = live.filter(d => d.old_price > d.price).map(d => d.old_price - d.price);
  const avg = saves.length ? saves.reduce((a, b) => a + b, 0) / saves.length : 0;
  // one slim line above the deals: how many, where, and when we last looked (stale deals are what people hate most)
  const when = UPDATED ? new Date(UPDATED) : null;
  const time = when ? (when.toDateString() === new Date().toDateString()
    ? L.today(when.toLocaleTimeString(LOCALE[S.lang], { hour: "2-digit", minute: "2-digit" }))
    : when.toLocaleString(LOCALE[S.lang], { weekday: "short", hour: "2-digit", minute: "2-digit" })) : "";
  $("#trustbar").innerHTML = `<span class="icons">${chains.map(c => sicon(c)).join("")}</span><span>${L.checked(live.length, pcAt(S.pc) ? pcName(S.pc) : "", time)}</span>
    ${(() => { const m = DKBasket.savings(S.bought, Date.now()).month;
      return m ? `<span class="pill lime">${L.youSaved(money(m))}</span>` : avg ? `<span class="pill lime">${L.avgSave(money(avg))}</span>` : ""; })()}`;
  $("#eyebrow").textContent = L.eyebrow(chains.length);
  $("#heroH").innerHTML = L.heroH;
  $("#heroSub").textContent = L.heroSub(chains.length, S.radius);
  $("#heroGo").textContent = L.heroGo(S.pc ? pcShort(S.pc) : ($("#heroPc").value.trim().length === 4 ? $("#heroPc").value.trim() : ""));
  const top = [...live].filter(d => pct(d)).sort((a, b) => pct(b) - pct(a));
  const best = top[0];
  $("#biggest").innerHTML = best ? L.biggest(pct(best), esc(best.name), `${esc(best.store)}, ${money(best.price)}`) : "";
  // live preview: the four best deals with a photo, one per store where possible
  const pick = [], seen = new Set();
  for (const d of top) if (d.image_url && !seen.has(d.store) && pick.length < 4) { pick.push(d); seen.add(d.store); }
  for (const d of top) if (pick.length < 4 && !pick.includes(d)) pick.push(d);
  const host = S.pc ? `deal-ke.be · ${S.pc}` : "deal-ke.be";
  $("#preview").innerHTML = `<div class="pv-bar"><i></i><i></i><i></i><span>${host}</span></div>
    <div class="pv-body"><h3>${L.pvTitle}</h3>${pick.map(d => `<button type="button" class="pv-row" data-open="${d.id}">
      <span class="th">${d.image_url ? `<img src="${esc(d.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>
      <span style="min-width:0"><span class="nm" style="display:block">${esc(d.name)}</span><span class="st">${sicon(d.store)}${esc(d.store)}${ccTag(d)}${kmDeal(d) ? ` · ${kmDeal(d)}` : ""}</span></span>
      <span class="pr">${money(d.price)}<small>−${pct(d)}%</small></span></button>`).join("")}</div>`;
  const maxP = top.length ? pct(top[0]) : 0;
  $("#band").innerHTML = `<span class="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 12.6V4a1 1 0 0 1 1-1h8.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-8.6 8.6a1 1 0 0 1-1.4 0L3.3 13.3a1 1 0 0 1-.3-.7z" fill="none" stroke="#17150F" stroke-width="1.8"/><circle cx="8" cy="8" r="1.6" fill="#17150F"/></svg></span>
    <div><h2>${L.week(isoWeek(new Date()))}</h2><p>${L.bandSub(live.length, chains.length)}</p></div>
    ${maxP ? `<div class="upto"><small>${L.upTo}</small><b>−${maxP}%</b></div>` : ""}`;
}

// ---------- details sheet ----------
let lastFocus = null;
function openDialog(bg, focusEl) { lastFocus = document.activeElement; bg.hidden = false; document.body.style.overflow = "hidden"; (focusEl || bg.querySelector("button,input,a"))?.focus(); }
function closeDialogs() {
  for (const id of ["#sheetBg", "#listBg", "#locDlg", "#recipeDlg", "#accDlg"]) $(id).hidden = true;
  document.body.style.overflow = ""; lastFocus?.focus?.();
}

function openDeal(id) {
  const d = DEALS.find(x => x.id === id) || S.list[id]; if (!d) return;
  if (S.q) noteSearch(S.q);  // opening a result confirms the search
  noteProduct(d);
  trk("open_deal", { store: d.store, cat: d.cat, label: d.name });
  const L = t(), F = L.facts, on = !!S.list[d.id], n = nearOf(d);
  const save = d.old_price ? d.old_price - d.price : null;
  const dest = n ? `${n.b.lat},${n.b.lon}` : encodeURIComponent(`${d.store} ${pcName(S.pc)} ${d.cc === "NL" ? "Nederland" : "Belgium"}`);
  const others = DEALS.filter(x => x.id !== d.id && x.cat === d.cat && x.cat !== "other" && inRadius(x) && x.unit === d.unit && x.unit_price)
    .sort(SORTS.value).slice(0, 4);
  $("#sheet").classList.remove("narrow");
  $("#sheet").innerHTML = `
    <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    ${photo(d, true)}
    <div>
      <div class="where">${sicon(d.store, "lg")}<span>${esc(d.store)}${d.pack_size ? ` · ${esc(d.pack_size)}` : ""}</span></div>
      <h2 id="sheetTitle">${esc(d.name)}</h2>
      <div class="priceline"><span class="price">${money(d.price)}</span>${d.old_price ? `<span class="old">${money(d.old_price)}</span>` : ""}</div>
      <dl class="facts">
        ${d.unit_price && d.unit ? `<dt>${F.unit} ${L.perUnit[d.unit] || d.unit}</dt><dd><b>${money(d.unit_price)}</b> <span class="unit">${L.effective}</span></dd>` : ""}
        ${save ? `<dt>${F.save}</dt><dd class="good">${money(save)}${d.discount ? ` (−${Math.round(d.discount * 100)}%)` : ""}</dd>` : ""}
        ${d.promo_text ? `<dt>${F.promo}</dt><dd>${esc(d.promo_text)}</dd>` : ""}
        <dt>${F.store}</dt><dd>${logo(d.store, true)}</dd>
        ${n ? `<dt>${F.near}</dt><dd>${esc(n.b.address || n.b.name)} · ${kmDeal(d)}</dd>` : ""}
        ${d.pack_size ? `<dt>${F.pack}</dt><dd>${esc(d.pack_size)}</dd>` : ""}
        ${d.brand ? `<dt>${F.brand}</dt><dd>${esc(d.brand)}</dd>` : ""}
        ${d.until ? `<dt>${F.until}</dt><dd>${d.until.toLocaleDateString(LOCALE[S.lang], { weekday: "short", day: "numeric", month: "long" })}</dd>` : ""}
      </dl>
      <div class="cta">
        <button type="button" class="btn" data-add="${d.id}" aria-pressed="${on}">${plus(on)} ${on ? L.added : L.add}</button>
        <a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${dest}" target="_blank" rel="noopener" data-trk="directions" data-trk-store="${esc(d.store)}" data-trk-label="${esc(d.name)}">${L.directions}</a>
        ${d.source_url && !SAMPLE ? `<a class="btn ghost" href="${esc(d.source_url)}" target="_blank" rel="noopener" data-trk="to_store" data-trk-store="${esc(d.store)}" data-trk-label="${esc(d.name)}">${L.seeStore}</a>` : ""}
      </div>
      ${others.length ? `<div class="others"><h3>${L.sameElse}</h3><ul>${others.map(o =>
        `<li><button type="button" data-open="${o.id}"><span class="on">${esc(o.name)} · ${esc(o.store)}</span><b>${money(o.unit_price)}/${L.perUnit[o.unit] || o.unit}</b></button></li>`).join("")}</ul></div>` : ""}
    </div>`;
  if ($("#sheetBg").hidden) openDialog($("#sheetBg"), $("#sheet .btn")); else $("#sheet .btn").focus();
}

// ---------- my list ----------
function toggleList(id) {
  const d = DEALS.find(x => x.id === id) || S.list[id]; if (!d) return;
  if (S.list[id]) delete S.list[id];
  else { const { hay, until, i, _sx, pk, ...keep } = d; S.list[id] = keep; toast(t().addedToast); noteProduct(d, 2); trk("add_list", { store: d.store, cat: d.cat, label: d.name }); }
  store.set("list", S.list);
  const c = $("#listCount"); c.textContent = listN(); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  document.querySelectorAll(`[data-add="${id}"]`).forEach(b => {
    const on = !!S.list[id]; b.setAttribute("aria-pressed", on);
    b.innerHTML = b.classList.contains("btn") ? `${plus(on)} ${on ? t().added : t().add}` : plus(on);
    if (!b.classList.contains("btn")) b.setAttribute("aria-label", on ? t().added : t().add);
  });
  if (!$("#listBg").hidden) renderList();
}

// ---------- money saved: only what people tick as bought ----------
const today = () => DKBasket.dayOf(Date.now());
const boughtOf = k => S.bought.find(b => b.k === k && (k.startsWith("d:") || b.day === today()));  // a need ticks again every day
function toggleBought(k, d, label) {
  const hit = boughtOf(k);
  const fw = k.startsWith("w:") && FAM.items.find(x => "w:" + x.id === k);
  if (fw) {   // family list: the tick is for everyone (and what it saved counts for the family)
    const on = !(hit || fw.doneBy); fw.doneBy = on ? ACC.user.id : null; famTick(fw.id, on, DKBasket.saveOf(d));
    if (!on && !hit) { renderList(); return; }
  }
  if (hit) S.bought = S.bought.filter(b => b !== hit);
  else {
    S.bought.push({ k, day: today(), name: (d?.name || label || "").slice(0, 80), store: d?.store || "", paid: d?.price || 0, save: DKBasket.saveOf(d) });
    // what you buy again and again rises to the top of the search suggestions (never added to the list by itself)
    if (d) noteProduct(d, 3);
    if (label && DS.bump(HIST, "q", DS.qwords(label).join(" "), 2, Date.now())) saveHist();
  }
  S.bought = DKBasket.pruneBought(S.bought, Date.now()); store.set("bought", S.bought);
  if (!hit && DKBasket.saveOf(d) > 0) toast(t().savedMonth(money(DKBasket.savings(S.bought, Date.now()).month)));
  renderList(); renderHero();
}
const tickBtn = (k, d, label, done) => { const on = done ?? !!boughtOf(k), L = t();
  return `<button type="button" class="tick" data-buy="${k}"${d ? ` data-deal="${d.id}"` : ""} data-label="${esc(label || "")}" aria-pressed="${on}" aria-label="${on ? L.bought : L.notBought}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`; };
function savedHTML(L) {
  const s = DKBasket.savings(S.bought, Date.now());
  if (!s.month) return "";
  // only compare when it's good news: early in the month a partial month always looks worse than a full one
  const diff = s.lastMonth && s.month > s.lastMonth ? Math.round((s.month - s.lastMonth) * 100) / 100 : 0;
  const bits = [s.week ? L.savedWeek(money(s.week)) : "", s.topShop ? L.savedTop(esc(s.topShop)) : "",
    diff ? L.savedVs(money(diff)) : ""].filter(Boolean);
  return `<div class="savedbox"><b>${L.savedMonth(money(s.month))}</b>${bits.length ? `<small>${bits.join(" · ")}</small>` : ""}</div>`;
}
const listN = () => Object.keys(S.list).length + needs().length;
const nearDeals = () => DEALS.filter(d => inRadius(d) && dietOk(d));
// favourite shop: chosen in the account or on My list; the shops near you first, nearest on top
const shopChoices = () => {
  const near = Object.entries(nearest).filter(([, n]) => n?.d != null && n.d <= S.radius).map(([k]) => k.split("|")[1]);
  return [...new Set([S.shop, ...[...new Set([...near, ...nearDeals().map(d => d.store)])].sort((a, b) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9))].filter(Boolean))];
};
function setShop(chain) { S.shop = chain || ""; store.set("shop", S.shop); promoNote(); }
function addWants(text, forMe) {
  if (FAM.live && !forMe && S.wantFor !== "me") {   // you chose "For the family": it goes on the shared list
    const qs = (Array.isArray(text) ? text : String(text).split(/[,;\n]+/)).map(x => x.trim()).filter(x => x.length >= 2).slice(0, 30);
    famAddItems(qs); promoSeen(); return qs.length;
  }
  const have = new Set(S.wants.map(w => DS.fold(w.q))); let n = 0;
  for (const q of (Array.isArray(text) ? text : String(text).split(/[,;\n]+/)).map(x => x.trim()).filter(x => x.length >= 2).slice(0, 30)) {
    if (have.has(DS.fold(q))) continue;
    have.add(DS.fold(q)); n++; S.wants.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), q: q.slice(0, 60) });
  }
  store.set("wants", S.wants); $("#listCount").textContent = listN(); promoSeen();  // you are looking at it
  return n;
}
// "What you need": every item matched to this week's deals nearby, and the shop that covers most for least
function wantsHTML(L) {
  const all = needs(), N = all.length;
  const c = DKBasket.compare(all, nearDeals(), S.shop);
  const x = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const chains = [...new Set(nearDeals().map(d => d.store))].sort((a, b) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9));
  const shopSel = `<label class="myshop"><span>${L.myShop}</span><select id="myShop"><option value="">${L.myShopAny}</option>
    ${shopChoices().map(ch => `<option value="${esc(ch)}"${ch === S.shop ? " selected" : ""}>${esc(ch)}${kmText(ch) ? ` · ${kmText(ch)}` : ""}</option>`).join("")}</select></label>`;
  const p = c.pick;
  const pickBox = p ? `<div class="starthere">${sicon(p.chain)}<div><small>${p.chain === S.shop ? L.myShopT : L.cheapT}</small><b>${esc(p.chain)}</b>
      <div class="sub">${L.covers(p.n, N)}${kmText(p.chain) ? ` · ${kmText(p.chain)}` : ""}</div></div>
      <div class="tot"><b>${money(p.total)}</b></div></div>` : "";
  const tip = c.tip ? `<p class="tip">${c.tip.cheaper ? L.tipCheaper(esc(c.tip.chain), money(c.tip.cheaper), c.tip.on) : ""}${c.tip.cheaper && c.tip.more ? " · " : ""}${c.tip.more ? L.tipMore(esc(c.tip.chain), c.tip.more) : ""}${favNote(c.tip.chain)}</p>`
    : c.preferredMissing ? `<p class="tip">${L.prefMissing(esc(S.shop))}</p>` : "";
  const split = c.split ? `<p class="tip split">${L.splitTip(esc(c.split.chain), money(c.split.save), c.split.moved.length)}${favNote(c.split.chain)}</p>` : "";
  const others = c.shops.filter(s => s !== p).slice(0, 3);
  const row = ({ item, best, byShop }) => {
    const d = (c.split?.moved.includes(item.id) && byShop[c.split.chain]) || (p && byShop[p.chain]) || best;
    const on = !!boughtOf("w:" + item.id) || !!item.doneBy;
    const who = item.fam && FAM.members.length > 1 ? memberOf(item.doneBy || item.by) : null;
    const qty = item.fam ? `<span class="qty"><button type="button" data-qty="${item.id}|-1" aria-label="${L.qtyLess}"${item.qty <= 1 ? " disabled" : ""}>−</button><b>${item.qty}</b><button type="button" data-qty="${item.id}|1" aria-label="${L.qtyMore}">+</button></span>` : "";
    const move = !item.fam && FAM.live ? `<button type="button" class="linkish tofam" data-fam-move="${item.id}">${L.toFam}</button>` : "";
    return `<li class="tickrow${on ? " done" : ""}">${tickBtn("w:" + item.id, d, item.q, on)}<span><b class="wq">${who ? `<span class="by" title="${esc(item.doneBy ? L.famBought(who.name || "?") : who.name || "")}">${av(who.avatar, 18, who.name || "")}</span>` : ""}${esc(item.q)}${item.fam && item.qty > 1 ? ` <small>× ${item.qty}</small>` : ""}</b><span class="unit">${d ? `${esc(d.name)} · ${esc(d.store)}${d.promo_text ? ` · ${esc(d.promo_text)}` : ""}` : L.wantNone}</span>${qty}${move}</span>
      ${d ? `<button type="button" class="p linkish" data-open="${d.id}">${money(d.price)}</button>` : `<span class="p"></span>`}
      <button type="button" data-unwant="${item.id}" aria-label="${L.remove}">${x}</button></li>`;
  };
  const famRows = c.items.filter(r => r.item.fam).map(row).join(""), myRows = c.items.filter(r => !r.item.fam).map(row).join("");
  const forSeg = FAM.live ? `<span class="wantfor" role="group" aria-label="${L.wantForLbl}">${["fam", "me"].map(k => `<button type="button" data-want-for="${k}" aria-pressed="${(S.wantFor === "me" ? "me" : "fam") === k}">${k === "fam" ? L.forFam : L.forMe}</button>`).join("")}</span>` : "";
  return `${savedHTML(L)}<form class="wantform" id="wantForm"><input id="wantIn" autocomplete="off" enterkeyhint="done" placeholder="${L.wantPh}" aria-label="${L.wantPh}">
      <button type="submit" class="btn">${L.wantAdd}</button></form>${forSeg}
    ${N ? `${pickBox}${tip}${split}${chains.length ? shopSel : ""}
    ${others.length ? `<div class="othershops"><small>${L.otherShops}</small>${others.map(s => `<span>${sicon(s.chain)}${esc(s.chain)} · ${L.covers(s.n, N)} · <b>${money(s.total)}</b>${favNote(s.chain)}</span>`).join("")}</div>` : ""}
    ${famRows ? `<section class="shop fam"><div class="shop-h">${esc(L.famListT(FAM.name))}<span class="sharedwith">${FAM.members.map(m => av(m.avatar, 22, m.name || "")).join("")}</span></div><p class="hint">${L.famTickHint}</p><ul>${famRows}</ul>
      ${famItems().some(w => w.doneBy) ? `<button type="button" class="linkish" data-fam-clear>${L.famClear}</button>` : ""}</section>` : ""}
    ${myRows ? `<section class="shop"><div class="shop-h">${FAM.live ? L.myListT : L.wantsT}</div><p class="hint">${FAM.live ? L.myListHint : L.tickHint}</p><ul>${myRows}</ul></section>` : ""}` : ""}`;
}
function listText() {
  const L = t(), by = groupList();
  const c = needs().length ? DKBasket.compare(needs(), nearDeals(), S.shop) : null;
  const need = c ? `${L.wantsT}${c.pick ? ` (${c.pick.chain})` : ""}\n` + c.items.map(({ item, best, byShop }) => {
    const d = (c.pick && byShop[c.pick.chain]) || best;
    return `- ${item.q}${d ? `: ${d.name}, ${d.store}, ${money(d.price)}` : ""}`; }).join("\n") + "\n\n" : "";
  if (!Object.keys(S.list).length) return need.trim();
  return need + Object.entries(by).map(([c, items]) => `${c}${kmText(c) ? ` (${kmText(c)})` : ""}\n` +
    items.map(d => `- ${d.name}${d.pack_size ? `, ${d.pack_size}` : ""}: ${money(d.price)}${d.promo_text ? ` [${d.promo_text}]` : ""}`).join("\n")).join("\n\n") + `\n\n${L.total}: ${money(listTotals().total)}`;
}
function groupList() {
  const by = {};
  for (const d of Object.values(S.list)) (by[d.store] ||= []).push(d);
  return Object.fromEntries(Object.entries(by).sort(([a], [b]) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9)));
}
function listTotals() {
  let total = 0, saved = 0;
  for (const d of Object.values(S.list)) { total += d.price; if (d.old_price) saved += d.old_price - d.price; }
  return { total, saved };
}
function renderList() {
  const L = t(), by = groupList(), n = Object.keys(S.list).length, { total, saved } = listTotals(), focusWant = document.activeElement?.id === "wantIn";
  const x = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const shops = Object.entries(by).map(([c, items]) => ({ c, items,
    sum: items.reduce((a, d) => a + d.price, 0), save: items.reduce((a, d) => a + (d.old_price > d.price ? d.old_price - d.price : 0), 0) }));
  // start where you save the most; ties go to the nearest store
  const best = [...shops].sort((a, b) => b.save - a.save || b.items.length - a.items.length || (dist(a.c) ?? 1e9) - (dist(b.c) ?? 1e9))[0];
  if (best) shops.sort((a, b) => (b === best) - (a === best));
  $("#drawer").innerHTML = `
    <div class="drawer-head"><div><h3 id="listTitle">${L.listTitle}</h3><p>${L.listSub2}</p></div>
      <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
    <div class="drawer-body">${wantsHTML(L)}${n ? `
      ${needs().length ? `<h4 class="dealsT">${L.dealsT}</h4>` : ""}
      ${shops.length > 1 || best ? `<div class="starthere">${sicon(best.c)}<div><small>${L.startHere}</small><b>${esc(best.c)}</b>
        <div class="sub">${L.ofItems(best.items.length, n)}${kmText(best.c) ? ` · ${kmText(best.c)}` : ""}</div></div>
        <div class="tot"><b>${money(best.sum)}</b>${best.save ? L.totalSave(money(best.save)) : ""}</div></div>` : ""}
      ${shops.map(s => `<section class="shop${s === best && shops.length > 1 ? " best" : ""}"><div class="shop-h">${sicon(s.c, "lg")}${esc(s.c)}
          ${kmText(s.c) ? `<span class="km">${kmText(s.c)}</span>` : ""}
          ${s === best && shops.length > 1 ? `<span class="pill lime">${L.bestStore}</span>` : ""}<span class="sum">${money(s.sum)}</span></div>
        <ul>${s.items.map(d => `<li class="tickrow${boughtOf("d:" + d.id) ? " done" : ""}">${tickBtn("d:" + d.id, d, d.name)}<span>${esc(d.name)}${d.promo_text || d.pack_size ? `<span class="unit">${esc([d.pack_size, d.promo_text].filter(Boolean).join(" · "))}</span>` : ""}</span>
          <span class="p">${money(d.price)}</span>
          ${FAM.live && !FAM.deals.some(f => f.id === d.id) ? `<button type="button" class="sharedeal" data-share-deal="${esc(d.id)}" aria-label="${L.shareDeal}" title="${L.shareDeal}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7M6 9.5V20h12V9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 11v6M9 14h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>` : ""}
          <button type="button" data-add="${d.id}" aria-label="${L.remove}">${x}</button></li>`).join("")}</ul></section>`).join("")}`
      : needs().length || FAM.deals.length ? "" : `<p class="drawer-empty">${L.listEmpty}</p>`}${famDealsHTML(L)}</div>
    ${n || needs().length ? `<div class="drawer-foot">
      ${n ? `<div class="total"><span>${L.total}</span><b>${money(total)}</b></div>` : ""}
      ${saved > 0 ? `<div class="total"><span>${L.saved}</span><span class="good">${money(saved)}</span></div>` : ""}
      <button type="button" class="btn block" id="shareList">${L.share}</button>
      <button type="button" class="btn ghost" id="clearList">${L.clearList}</button></div>` : ""}`;
  if (focusWant) $("#wantIn")?.focus();
}

// deals someone saved for the whole family
function famDealsHTML(L) {
  if (!FAM.live || !FAM.deals.length) return "";
  const x = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  return `<section class="shop fam"><div class="shop-h">${L.famDealsT}</div><ul>${FAM.deals.map(d => { const who = memberOf(d.by), live = DEALS.find(y => y.id === d.id);
    return `<li><span class="by">${who ? av(who.avatar, 22, who.name || "") : ""}</span><span>${live ? `<button type="button" class="linkish" data-open="${esc(d.id)}">${esc(d.name || "")}</button>` : esc(d.name || "")}<span class="unit">${esc([d.store, d.promo_text].filter(Boolean).join(" · "))}${live ? "" : ` · ${L.famDealGone}`}</span></span>
      <span class="p">${money(d.price)}</span><button type="button" data-unshare="${esc(d.rowId)}" aria-label="${L.unshare}">${x}</button></li>`; }).join("")}</ul></section>`;
}

let toastTimer;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("on"), 1800); }

// ---------- location ----------
function renderRadius(sel) {
  $("#radiusSeg").innerHTML = RADII.map(r => `<button type="button" data-r="${r}" aria-pressed="${r === sel}">${r} km</button>`).join("");
}
// The postcode box has a Belgium / Netherlands picker next to it. "4531 AB", "NL-4531" or "B-4500" pick the
// country themselves; a number that only exists in the other country switches the picker over.
function readPc(raw, cc) {
  const m = String(raw || "").toUpperCase().replace(/\s+/g, "").match(/^(NL|BE?)?-?(\d{4})([A-Z]{2})?$/);
  if (!m) return null;
  const [, pre, n, letters] = m, has = { BE: !!PCS[n], NL: !!PCS_NL[n] };
  const want = pre === "NL" || letters ? "NL" : pre ? "BE" : cc || "BE";
  const got = has[want] ? want : !pre && !letters && has[want === "NL" ? "BE" : "NL"] ? (want === "NL" ? "BE" : "NL") : null;
  return got ? (got === "NL" ? "NL-" + n : n) : null;
}
const guessCc = () => S.pc ? ccOf(S.pc) : /-NL$/i.test(navigator.language || "") ? "NL" : "BE";
function ccPicked(inputId) { return document.querySelector(`.cc-seg[data-for="${inputId}"] [aria-pressed="true"]`)?.dataset.cc || guessCc(); }
function paintCc(cc, inputId) {
  const L = t();
  document.querySelectorAll(inputId ? `.cc-seg[data-for="${inputId}"]` : ".cc-seg").forEach(el => {
    const sel = cc || el.querySelector('[aria-pressed="true"]')?.dataset.cc || guessCc();
    el.setAttribute("aria-label", L.country);
    el.innerHTML = ["BE", "NL"].map(c => `<button type="button" data-cc="${c}" aria-pressed="${c === sel}" title="${esc(L.cc[c])}"><i class="flag ${c.toLowerCase()}"></i>${c}</button>`).join("");
  });
}
// Addresses: Photon (photon.komoot.io), an open geocoder on OpenStreetMap data that allows search-as-you-type
// with fair use. Only Belgium and Zeeuws-Vlaanderen count; the BE/NL picker puts that country's results first.
const GEO_BOX = "2.5,49.45,6.45,51.52";
const ZV = [51.17, 3.35, 51.46, 4.30]; // same box as collector/locations.py
const geoCache = new Map();
async function geocode(q, cc) {
  q = q.trim(); if (q.length < 3) return [];
  const key = `${S.lang}|${q.toLowerCase()}`;
  if (!geoCache.has(key)) {
    const lang = S.lang === "fr" ? "fr" : S.lang === "en" ? "en" : "default";
    geoCache.set(key, fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=${lang}&bbox=${GEO_BOX}`)
      .then(r => r.ok ? r.json() : { features: [] }).then(j => j.features || []).catch(() => { geoCache.delete(key); return []; }));
  }
  const out = [], seen = new Set();
  for (const f of await geoCache.get(key)) {
    const p = f.properties || {}, [lon, lat] = f.geometry?.coordinates || [];
    const c = (p.countrycode || "").toUpperCase();
    if (lat == null || !(c === "BE" || (c === "NL" && lat >= ZV[0] && lat <= ZV[2] && lon >= ZV[1] && lon <= ZV[3]))) continue;
    const street = p.street ? [p.street, p.housenumber].filter(Boolean).join(" ") : p.name;
    const place = [p.postcode, p.city || p.town || p.village || (p.street ? null : p.county)].filter(Boolean).join(" ");
    const label = [street, place].filter(Boolean).join(", ").replace(/\|/g, "/");
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, cc: c, pc: `@${c}|${lat.toFixed(3)}|${lon.toFixed(3)}|${label}` });
  }
  return out.sort((a, b) => (b.cc === cc) - (a.cc === cc)).slice(0, 5);
}
function sugBox(input) {
  let ul = input.closest("form")?.querySelector(`.addr-sug[data-for="${input.id}"]`);
  if (!ul) {
    ul = document.createElement("ul"); ul.className = "addr-sug"; ul.dataset.for = input.id; ul.hidden = true;
    ul.setAttribute("role", "listbox");
    (input.closest(".pcbox, .pc-row") || input).after(ul);
    ul.addEventListener("click", e => {
      const b = e.target.closest("[data-loc]"); if (!b) return;
      input.value = b.dataset.label; input.dataset.loc = b.dataset.loc; input.dataset.locFor = b.dataset.label;
      hideSug(input); input.form.requestSubmit();
    });
  }
  return ul;
}
function hideSug(input) { const ul = input && input.form?.querySelector(`.addr-sug[data-for="${input.id}"]`); if (ul) ul.hidden = true; }
let sugTimer, sugSeq = 0;
function suggestAddress(input) {
  clearTimeout(sugTimer);
  const q = input.value.trim(), seq = ++sugSeq;
  if (q.length < 4 || !/[a-zà-ÿ]{2}/i.test(q) || readPc(q, ccPicked(input.id))) { hideSug(input); return; }
  sugTimer = setTimeout(async () => {
    const res = await geocode(q, ccPicked(input.id));
    if (seq !== sugSeq) return;  // the person kept typing
    const ul = sugBox(input);
    ul.hidden = !res.length;
    ul.innerHTML = res.map(r => `<li><button type="button" role="option" data-loc="${esc(r.pc)}" data-label="${esc(r.label)}">${r.cc === "NL" ? '<i class="flag nl"></i>' : '<i class="flag be"></i>'}${esc(r.label)}</button></li>`).join("")
      + `<li class="credit">${esc(t().addrCredit)}</li>`;
  }, 250);
}
async function setPc(raw, errEl, inputId) {
  const input = document.getElementById(inputId), text = String(raw || "").trim();
  let pc = input?.dataset.loc && input.dataset.locFor === text ? input.dataset.loc : readPc(text, ccPicked(inputId));
  if (!pc && /[a-zà-ÿ]{2}/i.test(text)) {            // an address typed without picking a suggestion: take the best match
    errEl.textContent = t().addrBusy; errEl.hidden = false;
    pc = (await geocode(text, ccPicked(inputId)))[0]?.pc || null;
  }
  if (input) hideSug(input);
  if (!pc && Object.keys(PCS).length) { errEl.textContent = t().badPc; errEl.hidden = false; return false; }
  const val = pc || text;
  errEl.hidden = true; S.pc = val; store.set("pc", val); computeNearest(); paintCc(ccOf(val)); return true;
}

// ---------- search suggestions (matching and ranking live in search.js) ----------
// History of searches and opened products, used to put each person's favourites first.
// On this device for guests; in the account (user_data.history) when signed in.
const DS = window.DKSearch;
let HIST = DS.clean(store.get("hist", null));
const SG = { idx: -1, items: [] };
function saveHist() { HIST = DS.prune(HIST, Date.now()); store.set("hist", HIST); }
function noteSearch(q) { const k = DS.qwords(q).join(" "); if (k.length >= 2 && DS.bump(HIST, "q", k, 1, Date.now())) saveHist(); }
function noteProduct(d, by = 1) {
  const now = Date.now(), a = DS.bump(HIST, "p", DS.productKey(d), by, now), b = d.cat && d.cat !== "other" && DS.bump(HIST, "c", d.cat, by, now);
  if (a || b) saveHist();
}
function runSearch(q) {
  q = q.trim(); $("#q").value = q;
  closeSuggest(); if (q) noteSearch(q);
  if (q !== S.q) { S.q = q; S.shown = 48; render(); }
  if (q) trk("search", { label: q.toLowerCase(), n: DEALS.filter(d => matches(d)).length });
  $("#q").blur(); $("#results").scrollIntoView({ behavior: "smooth" });
}
// Search results: what you look for first (chicken before chicken spices, exact before typos), then within that
// group your favourites first (unless you picked another order), then the order you picked (price per kg by default)
function searchOrder() {
  const res = DS.search(DEALS, S.q), by = SORTS[S.sort] || SORTS.value, now = Date.now(), fav = new Map();
  const topQ = S.sort === "value" ? DS.topQueries(HIST, now) : null;
  const likes = d => { if (!topQ) return 0; if (!fav.has(d.id)) fav.set(d.id, DS.personal(HIST, d, now, topQ) >= 1 ? 1 : 0); return fav.get(d.id); };
  return (a, b) => DS.group(res, b) - DS.group(res, a) || likes(b) - likes(a) || by(a, b);
}
function renderSuggest() {
  const L = t(), input = $("#q"), box = $("#qList"), q = input.value.trim(), now = Date.now();
  const items = [], parts = [];
  const head = txt => parts.push(`<li role="presentation" class="sg-h">${esc(txt)}</li>`);
  const clock = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const lens = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const opt = (item, inner, cls = "") => { const i = items.push(item) - 1;
    parts.push(`<li role="option" id="sg${i}" data-sg="${i}" class="${cls}" aria-selected="${i === SG.idx}">${inner}</li>`); };
  const past = k => opt({ q: k }, `<span class="th ic">${clock}</span><span class="pn"><b>${esc(k)}</b></span>
    <button type="button" class="sg-x" data-sgdel="${esc(k)}" tabindex="-1" aria-label="${esc(L.sgDel(k))}"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`, "past");
  const deal = d => opt({ id: d.id }, `<span class="th">${d.image_url ? `<img src="${esc(d.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : esc((d.name || "?")[0])}</span>
    <span class="pn"><b>${esc(d.name)}</b><span class="st">${sicon(d.store)}${esc(d.store)}${d.pack_size ? ` · ${esc(d.pack_size)}` : ""}${kmText(d.store) ? ` · ${kmText(d.store)}` : ""}</span></span>
    <span class="pp">${money(d.price)}</span>`);
  if (!q) {
    const rec = DS.recent(HIST, now, "", 5), fav = DS.favourites(DEALS, HIST, now, { filter: d => inRadius(d) && dietOk(d), n: 4 });
    if (rec.length) { head(L.sgRecent); rec.forEach(past); }
    if (fav.length) { head(L.sgFav); fav.forEach(deal); }
  } else {
    DS.recent(HIST, now, q, 2).forEach(past);
    const s = DS.suggest(DEALS, q, HIST, now, { filter: d => inRadius(d) && dietOk(d), n: 6 });
    s.deals.forEach(deal);
    if (s.total) opt({ all: q }, `<span class="th ic">${lens}</span><span class="pn"><b>${esc(L.sgAll(q))}</b></span><span class="pp n">${s.total}</span>`, "all");
  }
  SG.items = items;
  if (SG.idx >= items.length) SG.idx = -1;
  box.innerHTML = parts.join("");
  const open = items.length > 0 && document.activeElement === input;
  box.hidden = !open; input.setAttribute("aria-expanded", open);
  input.setAttribute("aria-activedescendant", open && SG.idx >= 0 ? `sg${SG.idx}` : "");
}
function closeSuggest() { SG.idx = -1; $("#qList").hidden = true; $("#q").setAttribute("aria-expanded", "false"); $("#q").removeAttribute("aria-activedescendant"); }
function pickSuggest(i) {
  const it = SG.items[i]; if (!it) return;
  if (it.q) { runSearch(it.q); return; }
  if (it.all) { runSearch(it.all); return; }
  const q = $("#q").value.trim(); closeSuggest(); $("#q").blur();
  if (q && q !== S.q) { S.q = q; S.shown = 48; render(); }
  openDeal(it.id);
}
function bindSuggest() {
  const input = $("#q"), box = $("#qList");
  input.addEventListener("focus", () => { SG.idx = -1; renderSuggest(); });
  input.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== input) closeSuggest(); }, 0));
  input.addEventListener("keydown", e => {
    const n = SG.items.length;
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && n) {
      e.preventDefault();
      if (box.hidden) { renderSuggest(); return; }
      SG.idx = e.key === "ArrowDown" ? (SG.idx + 1 >= n ? -1 : SG.idx + 1) : (SG.idx <= -1 ? n - 1 : SG.idx - 1);
      renderSuggest(); $("#sg" + SG.idx)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && !box.hidden && SG.idx >= 0) { e.preventDefault(); pickSuggest(SG.idx); }
    else if (e.key === "Escape" && !box.hidden) { e.preventDefault(); e.stopPropagation(); closeSuggest(); }  // first Esc closes, the next one clears
  });
  box.addEventListener("mousedown", e => e.preventDefault());  // keep focus in the search box
  box.addEventListener("click", e => {
    e.stopPropagation();
    const del = e.target.closest("[data-sgdel]");
    if (del) { delete HIST.q[del.dataset.sgdel]; saveHist(); renderSuggest(); return; }
    const li = e.target.closest("[data-sg]"); if (li) pickSuggest(+li.dataset.sg);
  });
}

// ---------- events ----------
function bind() {
  let qTimer;
  $("#q").value = S.q;
  $("#q").addEventListener("input", e => { SG.idx = -1; renderSuggest(); clearTimeout(qTimer); qTimer = setTimeout(() => { S.q = e.target.value.trim(); S.shown = 48; render(); }, 120); });
  $("#searchForm").addEventListener("submit", e => { e.preventDefault(); clearTimeout(qTimer); runSearch($("#q").value); });
  bindSuggest();

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { if (![...document.querySelectorAll(".scrim")].every(s => s.hidden)) closeDialogs(); else if (document.activeElement === $("#q")) { $("#q").value = ""; S.q = ""; render(); } }
    if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("#q").focus(); }
    if (e.key === "Enter" && document.activeElement.classList?.contains("card")) openDeal(document.activeElement.dataset.id);
    if (e.key === "Tab") { const open = [...document.querySelectorAll(".scrim")].find(s => !s.hidden); if (open) trap(e, open); }
  });

  document.addEventListener("click", e => {
    const el = e.target.closest("button,a,.card,.scrim"); if (!el) return;
    if (el.dataset.add) { e.stopPropagation(); toggleList(el.dataset.add); return; }
    if (el.dataset.open) { openDeal(el.dataset.open); return; }
    if ("close" in el.dataset || (el.classList.contains("scrim") && e.target === el)) { closeDialogs(); return; }
    if (el.dataset.lang) { S.lang = el.dataset.lang; store.set("lang", S.lang); paintSettings(); renderStatic(); render(); showView(); paintAccount(); return; }
    if ("soon" in el.dataset) { closeDialogs(); startTrial(); return; }
    if (el.dataset.buy) { buy(el.dataset.buy); return; }
    if (el.dataset.famMove) { famMove(el.dataset.famMove); return; }
    if (el.dataset.shareDeal) { famShareDeal(el.dataset.shareDeal); return; }
    if (el.dataset.unshare) { famUnshare(el.dataset.unshare); return; }
    if (el.dataset.qty) { const [id, dq] = el.dataset.qty.split("|"), it = FAM.items.find(i => i.id === id); if (it) famQty(id, it.qty + +dq); return; }
    if (el.dataset.wantFor) { S.wantFor = el.dataset.wantFor; store.set("wantFor", S.wantFor); renderList(); $("#wantIn")?.focus(); return; }
    if ("account" in el.dataset) { openAccountFresh(); return; }
    if ("portal" in el.dataset) { openPortal(); return; }
    if ("logout" in el.dataset) { signOut(); return; }
    if (el.dataset.cat != null && el.closest("#tabs")) { S.cat = el.dataset.cat; S.shown = 48; render(); if (S.cat) trk("filter_cat", { cat: S.cat }); return; }
    if (el.dataset.diet) { setDiet(el.dataset.diet); S.shown = 48; render(); if (!$("#accDlg").hidden) openAccount(ACC.why); if (location.hash === "#recipes") renderRecipes(); return; }
    if (el.dataset.kind) { S.kinds.has(el.dataset.kind) ? S.kinds.delete(el.dataset.kind) : S.kinds.add(el.dataset.kind); S.shown = 48; render(); return; }
    if (el.dataset.chain === "*") { S.chains.clear(); S.shown = 48; render(); return; }
    if (el.dataset.chain) { S.chains.has(el.dataset.chain) ? S.chains.delete(el.dataset.chain) : S.chains.add(el.dataset.chain); S.shown = 48; render(); if (S.chains.has(el.dataset.chain)) trk("filter_store", { store: el.dataset.chain }); return; }
    if (el.dataset.r) { document.querySelectorAll("#radiusSeg button").forEach(b => b.setAttribute("aria-pressed", b === el)); return; }
    if (el.classList.contains("card")) { openDeal(el.dataset.id); return; }
  });

  $("#sort").addEventListener("change", e => { S.sort = e.target.value; store.set("sort", S.sort); render(); });
  $("#clearAll").addEventListener("click", () => { S.q = ""; $("#q").value = ""; S.cat = ""; S.kinds.clear(); S.chains.clear(); render(); });
  $("#moreBtn").addEventListener("click", () => { S.shown += 48; render(); });

  for (const id of ["heroPc", "locPc"]) $("#" + id).addEventListener("input", e => suggestAddress(e.target));
  document.addEventListener("input", e => { if (e.target.id === "accPc") suggestAddress(e.target); });
  $("#heroForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!await setPc($("#heroPc").value, $("#heroErr"), "heroPc")) return;
    renderStatic(); render(); $("#results").scrollIntoView({ behavior: "smooth" });
  });
  document.addEventListener("click", e => {
    const b = e.target.closest(".cc-seg [data-cc]"); if (!b) return;
    b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
  });
  $("#locBtn").addEventListener("click", () => { $("#locPc").value = pcInput(S.pc); hideSug($("#locPc")); paintCc(guessCc(), "locPc"); $("#locErr").hidden = true; renderRadius(S.radius); openDialog($("#locDlg"), $("#locPc")); });
  $("#locForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!await setPc($("#locPc").value, $("#locErr"), "locPc")) return;
    const r = +($("#radiusSeg [aria-pressed=true]")?.dataset.r || S.radius); S.radius = r; store.set("radius", r);
    computeNearest(); closeDialogs(); renderStatic(); render();
  });
  $("#listBtn").addEventListener("click", openList);
  $("#promoNote")?.addEventListener("click", e => { if (e.target.closest("[data-promo-see]")) openList(); else if (e.target.closest("[data-promo-x]")) promoSeen(); });
  $("#drawer").addEventListener("click", async e => {
    const tb = e.target.closest("[data-buy]");
    if (tb) { const id = tb.dataset.deal; toggleBought(tb.dataset.buy, id ? (DEALS.find(x => x.id === id) || S.list[id]) : null, tb.dataset.label); return; }
    const uw = e.target.closest("[data-unwant]");
    if (uw) { const id = uw.dataset.unwant; if (FAM.items.some(i => i.id === id)) { famRemove(id); return; }
      S.wants = S.wants.filter(w => w.id !== id); store.set("wants", S.wants); $("#listCount").textContent = listN(); renderList(); return; }
    if (e.target.closest("[data-fam-clear]")) { famClear(); return; }
    if (e.target.closest("#clearList")) { S.list = {}; S.wants = []; store.set("list", S.list); store.set("wants", S.wants); $("#listCount").textContent = listN(); renderList(); render(); }
    if (e.target.closest("#shareList")) {
      const text = listText();
      try { await navigator.share({ title: t().listTitle, text }); return; } catch (err) { if (err?.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(text); toast(t().copied); } catch { /* no clipboard either */ }
    }
  });
  $("#drawer").addEventListener("submit", e => {
    if (e.target.id !== "wantForm") return;
    e.preventDefault(); addWants($("#wantIn").value); renderList(); $("#wantIn").focus();
  });
  $("#drawer").addEventListener("change", e => {
    if (e.target.id !== "myShop") return;
    setShop(e.target.value); renderList();
  });
  $("#heroPc").addEventListener("input", () => { if (!S.pc) $("#heroGo").textContent = t().heroGo($("#heroPc").value.trim().length === 4 ? $("#heroPc").value.trim() : ""); });
}
function trap(e, root) {
  const f = [...root.querySelectorAll("button,a[href],input,select,textarea")].filter(x => !x.hidden && x.offsetParent);
  if (!f.length) return; const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}


// ---------- recipes ----------
const R = {
  own: store.get("recipes", []),            // recipes the user added
  have: store.get("have", {}),              // recipe id -> {ingredient index: true/false}
  plan: new Set(store.get("plan", [])),     // recipe ids planned this week, in day order (the week menu)
  menuN: store.get("menuN", 5),             // how many evenings the week menu fills
};
// Household: a child eats about half a portion. Recipes are scaled to it, and so is what to buy.
S.home = store.get("home", { adults: 2, kids: 0 });
const portions = () => Math.max(1, (+S.home.adults || 0) + 0.5 * (+S.home.kids || 0));
const scaleOf = r => portions() / (r.serves || 4);
const packsOf = r => Math.max(1, Math.ceil(scaleOf(r) - 0.1));   // a recipe for 4 and 2 people: one pack; for 5: two
function scaleAmt(a, f) {   // "1 kg" x1.5 -> "1,5 kg"; "3" x1.5 -> "5"; "2 × 33 cl" x2 -> "4 × 33 cl"
  if (!a || Math.abs(f - 1) < 0.01) return a;
  return String(a).replace(/^(\d+(?:[.,]\d+)?)(\s*)(\S*)/, (m, n, sp, unit) => {
    const v = parseFloat(n.replace(",", ".")) * f, u = unit.toLowerCase();
    const r = /^(g|gr|ml)$/.test(u) ? Math.max(10, Math.round(v / 10) * 10) : /^(kg|l|cl|dl)$/.test(u) ? Math.round(v * 10) / 10 : Math.max(1, Math.round(v));
    return String(r).replace(".", S.lang === "en" ? "." : ",") + sp + unit;
  });
}
const allRecipes = () => [...R.own, ...(window.DK_RECIPES || [])];
const rTitle = r => r.t[S.lang] || r.t.nl || Object.values(r.t)[0];
const iName = ing => ing.n[S.lang] || ing.n.nl || Object.values(ing.n)[0];
function hasIt(r, i) { const v = R.have[r.id]?.[i]; return v == null ? !!r.i[i].basic : v; }
function wordStart(hay, k) {
  for (let at = hay.indexOf(k); at !== -1; at = hay.indexOf(k, at + 1)) if (at === 0 || !/[a-z0-9]/.test(hay[at - 1])) return true;
  return false;
}
const matchCache = new Map();
function bestDeal(ing) {
  const key = ing.k.join("|") + "#" + (ing.c || "") + "#" + S.pc + S.radius + [...S.diet];
  if (matchCache.has(key)) return matchCache.get(key);
  const ks = ing.k.map(fold);
  const d = DEALS.filter(x => inRadius(x) && dietOk(x) && (!ing.c || x.cat === ing.c) && ks.some(k => wordStart(x.hay, k)))
    .sort((a, b) => SORTS.value(a, b))[0] || null;
  matchCache.set(key, d);
  return d;
}
function recipeStats(r) {
  let promo = 0, buy = 0, cost = 0;
  const deals = [];
  r.i.forEach((ing, i) => {
    const d = bestDeal(ing);
    if (d) promo++;
    if (!hasIt(r, i)) { buy++; if (d) { cost += d.price * packsOf(r); deals.push(d); } }
  });
  return { promo, buy, cost, deals, packs: packsOf(r) };
}
function meter(r) {
  return `<div class="meter" aria-hidden="true">${r.i.map((ing, i) =>
    `<i class="${hasIt(r, i) ? "m-have" : bestDeal(ing) ? "deal" : ""}"></i>`).join("")}</div>`;
}
const star = on => `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

const tick = `<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function renderRecipes() {
  const L = t();
  matchCache.clear();
  const list = allRecipes().map(r => ({ r, st: recipeStats(r) }))
    .sort((a, b) => (R.plan.has(b.r.id) - R.plan.has(a.r.id)) || (b.st.promo / b.r.i.length - a.st.promo / a.r.i.length));
  $("#rgrid").innerHTML = list.map(({ r, st }) => {
    const on = R.plan.has(r.id);
    return `<article class="rcard${on ? " on" : ""}" data-recipe="${esc(r.id)}" tabindex="0">
      <button type="button" class="pin" data-plan="${esc(r.id)}" aria-pressed="${on}" aria-label="${L.plan}">${on ? tick : ""}</button>
      <h3>${esc(rTitle(r))}</h3>
      <div class="rside">${st.cost ? `<b class="price">≈ ${money(st.cost)}</b>` : ""}<span>${st.buy ? L.toBuy(st.buy) : L.allHave}</span></div>
      <p class="rtop">${[r.own ? L.mine : "", r.serves && L.persons(r.serves), r.min && L.minutes(r.min), L.onPromo(st.promo, r.i.length)].filter(Boolean).join(" · ")}</p>
      ${meter(r)}
    </article>`;
  }).join("");
  const byId = new Map(list.map(x => [x.r.id, x]));
  const planned = [...R.plan].map(id => byId.get(id)).filter(Boolean);
  const seg = [3, 5, 7].map(n => `<button type="button" data-menun="${n}" aria-pressed="${n === R.menuN}">${n}</button>`).join("");
  const num = (k, lo, label) => `<label><span>${label}</span><select data-home="${k}">${Array.from({ length: 9 - lo }, (_, i) => i + lo).map(n => `<option${n === +S.home[k] ? " selected" : ""}>${n}</option>`).join("")}</select></label>`;
  const home = `<div class="homesize" role="group" aria-label="${L.homeFor}">${num("adults", 1, L.homeAdults)}${num("kids", 0, L.homeKids)}</div>`;
  const est = planned.reduce((a, x) => a + x.st.cost, 0);
  const promo = new Set(planned.flatMap(x => x.st.deals.map(d => d.id))).size;
  $("#plan").innerHTML = `<div class="menu">
    <div class="menu-h"><div><h3>${L.menuT}</h3><p>${planned.length ? L.planSum(planned.length, promo, money(est)) : dietOn() && !menuRank(new Set()).length ? L.menuNoDiet : L.menuSub}</p></div>
      <div class="menu-act"><span class="seg" role="group" aria-label="${L.menuN}">${seg}</span>
        <button type="button" class="btn${planned.length ? " ghost" : ""}" data-automenu>${planned.length ? L.menuRedo : L.menuMake}</button></div></div>
    ${home}
    ${planned.length ? `<ol class="days">${planned.map((x, i) => `<li><span class="day">${L.menuDays[i % 7]}</span>
        <button type="button" class="dish" data-recipe="${esc(x.r.id)}"><b>${esc(rTitle(x.r))}</b><small>${[x.r.own ? L.mine : "", x.st.cost ? `≈ ${money(x.st.cost)}` : "", menuSave(x.st) ? L.menuSaves(money(menuSave(x.st))) : ""].filter(Boolean).join(" · ")}</small></button>
        <button type="button" class="swap" data-swap="${esc(x.r.id)}" aria-label="${L.menuSwap}" title="${L.menuSwap}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h13l-3-3M20 15H7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>`).join("")}</ol>
      <button type="button" class="btn" data-planadd>${L.menuToList}</button>` : ""}
  </div>`;
}
// Week menu: dinners ranked by what this week's deals save on the ingredients you still need to buy.
// Your own recipes get a small head start, so the menu uses them when they're about as good.
const menuSave = st => Math.round(st.deals.reduce((a, d) => a + DKBasket.saveOf(d), 0) * (st.packs || 1) * 100) / 100;
// a recipe fits your diet when no ingredient goes against it (stoofvlees is not vegetarian, bloem not gluten-free)
const recipeFits = r => !dietOn() || r.i.every(ing => DKDiet.ingredientFits({ name: [ing.n?.nl || iName(ing), ...(ing.k || [])].join(" "), category: ing.c || "" }, [...S.diet]));
function menuRank(skip) {
  return allRecipes().filter(r => !skip.has(r.id) && recipeFits(r)).map(r => { const st = recipeStats(r);
    return { r, score: menuSave(st) + 3 * st.promo / r.i.length + (r.own ? 1 : 0) }; })
    .sort((a, b) => b.score - a.score).map(x => x.r.id);
}
const swappedOut = new Set();  // recipes you swapped away, so "other recipe" keeps offering new ones
function autoMenu() { trk("recipe", { label: "week_menu" }); matchCache.clear(); swappedOut.clear(); R.plan = new Set(menuRank(new Set()).slice(0, R.menuN)); store.set("plan", [...R.plan]); }
function resizeMenu(n) {  // keep the dinners you have, drop from the end or add the next best
  const keep = [...R.plan].slice(0, n);
  R.plan = new Set([...keep, ...menuRank(new Set([...keep, ...swappedOut])).slice(0, Math.max(0, n - keep.length))]); store.set("plan", [...R.plan]);
}
function swapMenu(id) {
  swappedOut.add(id);
  let next = menuRank(new Set([...R.plan, ...swappedOut]))[0];
  if (!next) { swappedOut.clear(); swappedOut.add(id); next = menuRank(new Set([...R.plan, id]))[0]; }  // seen them all: start over
  if (!next) return;
  R.plan = new Set([...R.plan].map(x => x === id ? next : x)); store.set("plan", [...R.plan]);
}
// an ingredient as a shopping-list word: "Aardappelen of frieten" -> "Aardappelen"
const wantWord = ing => iName(ing).split(/\s+(?:of|ou|or)\s+/i)[0].replace(/\(.*?\)/g, "").trim();
function missingWants(rs) {
  const out = [];
  for (const r of rs) r.i.forEach((ing, i) => { if (!hasIt(r, i)) out.push(wantWord(ing)); });
  return out;
}

function openRecipe(id, keepFocus) {
  const r = allRecipes().find(x => x.id === id); if (!r) return;
  const L = t(), on = R.plan.has(r.id);
  matchCache.clear();
  const st = recipeStats(r);
  $("#sheet").innerHTML = `
    <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <div class="rsheet">
      <p class="rtop"><span>${[r.own ? L.mine : "", L.forN(String(portions()).replace(".", S.lang === "en" ? "." : ","), Math.abs(scaleOf(r) - 1) > 0.01 ? r.serves || 4 : 0), r.min && L.minutes(r.min)].filter(Boolean).join(" · ")}</span></p>
      <h2 id="sheetTitle">${esc(rTitle(r))}</h2>
      <p class="rmeta">${L.onPromo(st.promo, r.i.length)}${st.cost ? ` · ${L.toBuy(st.buy)} ≈ <b>${money(st.cost)}</b>` : ""}</p>
      <ul class="ings">${r.i.map((ing, i) => {
        const have = hasIt(r, i), d = bestDeal(ing), inList = d && S.list[d.id];
        return `<li class="${have ? "had" : ""}">
          <label class="have"><input type="checkbox" data-have="${esc(r.id)}|${i}" ${have ? "checked" : ""}><span>${L.haveIt}</span></label>
          <div class="iname"><b>${esc(iName(ing))}</b>${ing.a ? ` <span class="unit">${esc(scaleAmt(ing.a, scaleOf(r)))}</span>` : ""}</div>
          <div class="imatch">${have ? "" : d ? `<button type="button" class="dealpick" data-open="${d.id}">${logo(d.store)}<span class="dn">${esc(d.name)}</span><span class="tagmini">${esc(tagText(d))}</span><b>${money(d.price)}</b></button>
              <button type="button" class="add small" data-add="${d.id}" aria-pressed="${!!inList}" aria-label="${inList ? L.added : L.add}">${plus(!!inList)}</button>` : `<span class="unit">${L.noDeal}</span>`}</div>
        </li>`; }).join("")}</ul>
      <div class="cta">
        <button type="button" class="btn" data-addmissing="${esc(r.id)}" ${st.deals.length ? "" : "disabled"}>${L.addMissing}</button>
        <button type="button" class="btn ghost" data-plan="${esc(r.id)}" aria-pressed="${on}">${star(on)} ${on ? L.planned : L.plan}</button>
        ${r.own ? `<button type="button" class="btn ghost" data-editrecipe="${esc(r.id)}">${L.editRecipe}</button>
          <button type="button" class="btn ghost" data-delrecipe="${esc(r.id)}">${L.deleteRecipe}</button>` : ""}
      </div>
      ${r.steps ? `<div class="steps"><h3>${L.stepsTitle}</h3>${r.steps.split(/\n+/).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join("")}</div>` : ""}
    </div>`;
  $("#sheet").classList.add("narrow");
  if ($("#sheetBg").hidden) openDialog($("#sheetBg"), $("#sheet .x"));
  else if (keepFocus) document.querySelector(`[data-have="${keepFocus}"]`)?.focus();
}

function addDeals(deals) {
  let n = 0;
  for (const d of deals) if (!S.list[d.id]) { const { hay, until, i, ...keep } = d; S.list[d.id] = keep; n++; }
  store.set("list", S.list);
  $("#listCount").textContent = listN();
  toast(t().addedMissing(n));
}

// ---------- recipe maker: ingredients picked from the stores' products ----------
const AMOUNT = /^([\d.,/½¼¾]+\s*(?:kg|g|gr|l|cl|ml|dl|el|tl|st|stuks?|x|×|blik|pak|zak|snede|sneden|teentjes?)?\.?)\s+(.*)$/i;
const STOP = new Set(["fijne", "verse", "vers", "grote", "kleine", "mini", "extra", "classic", "original", "stuks", "pack", "promo", "voor", "pour", "avec", "met", "van", "the", "and"]);
const M = { name: "", serves: 4, items: [], steps: "", editing: null };
function keywordsFor(label, brand) {
  const b = fold(brand || "");
  const words = fold(label).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w) && w !== b && !/^\d/.test(w));
  const longest = [...words].sort((a, c) => c.length - a.length)[0];  // first word + longest word, e.g. "kiwi", "aardappelsparretjes"
  return [...new Set([fold(label), words[0], longest])].filter(Boolean);
}
function fromProduct(d) {
  return { n: { nl: d.name, fr: d.name, en: d.name }, a: d.pack_size || "", k: keywordsFor(d.name, d.brand), c: d.cat !== "other" ? d.cat : undefined,
    src: { store: d.store, img: d.image_url || null } };
}
function fromText(text) {
  const m = text.match(AMOUNT), amount = m ? m[1] : "", label = (m ? m[2] : text).replace(/^(?:de|het|een|du|de la|des|of)\s+/i, "").trim();
  return { n: { nl: label, fr: label, en: label }, a: amount, k: keywordsFor(label) };
}
function products(q) {
  const ws = fold(q).split(/\s+/).filter(Boolean); if (!ws.length) return [];
  const seen = new Set(), out = [];
  for (const d of DEALS) {
    if (!ws.every(w => d.hay.includes(w))) continue;
    const key = fold(d.name) + "|" + d.store; if (seen.has(key)) continue; seen.add(key);
    out.push({ d, score: (wordStart(fold(d.name), ws[0]) ? 0 : 1) });
  }
  return out.sort((a, b) => a.score - b.score || a.d.price - b.d.price).slice(0, 8).map(x => x.d);
}
let pickIdx = -1;
function renderPick() {
  const L = t(), q = $("#pickQ").value.trim(), list = $("#pickList");
  if (!q) { list.hidden = true; $("#pickQ").setAttribute("aria-expanded", "false"); return; }
  const found = products(q);
  list.innerHTML = found.map((d, i) => `<li role="option" id="pick${i}" data-pick="${d.id}" aria-selected="${i === pickIdx}">
      <span class="th">${d.image_url ? `<img src="${esc(d.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>
      <span class="pn"><b>${esc(d.name)}</b><span class="st">${sicon(d.store)}${esc(d.store)}${d.pack_size ? ` · ${esc(d.pack_size)}` : ""}</span></span>
      <span class="pp">${money(d.price)}</span></li>`).join("") +
    `<li role="option" id="pick${found.length}" data-pickfree="1" aria-selected="${pickIdx === found.length}" class="free"><span class="th">+</span><span class="pn">${esc(L.rFree(q))}</span></li>`;
  list.hidden = false; $("#pickQ").setAttribute("aria-expanded", "true");
  $("#pickQ").setAttribute("aria-activedescendant", pickIdx >= 0 ? `pick${pickIdx}` : "");
}
function choose(item) {
  M.items.push(item); $("#pickQ").value = ""; pickIdx = -1; renderPick(); renderChosen(); $("#pickQ").focus(); $("#recipeErr").hidden = true;
}
function renderChosen() {
  const L = t();
  $("#chosen").innerHTML = M.items.map((ing, i) => `<li>
      <span class="th">${ing.src?.img ? `<img src="${esc(ing.src.img)}" alt="" onerror="this.remove()">` : ""}</span>
      <span class="pn"><b>${esc(iName(ing))}</b>${ing.src ? `<span class="st">${sicon(ing.src.store)}${esc(ing.src.store)}</span>` : ""}</span>
      <input class="amt" data-amt="${i}" value="${esc(ing.a || "")}" placeholder="${L.rAmount}" aria-label="${L.rAmount}" maxlength="20">
      <button type="button" class="rm" data-rm="${i}" aria-label="${L.remove}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></li>`).join("");
}
function openMaker(r) {
  M.editing = r ? r.id : null; M.items = r ? r.i.map(x => ({ ...x })) : [];
  $("#recipeForm").reset(); $("#recipeErr").hidden = true;
  $("#recipeTitle").textContent = r ? t().editRecipe : t().newRecipe;
  $("#rName").value = r ? rTitle(r) : ""; $("#rServes").value = r?.serves || 4; $("#rSteps").value = r?.steps || "";
  pickIdx = -1; renderPick(); renderChosen();
  openDialog($("#recipeDlg"), $("#rName"));
}
function saveMaker() {
  const name = $("#rName").value.trim();
  if (!M.items.length) { $("#recipeErr").textContent = t().rNone; $("#recipeErr").hidden = false; $("#pickQ").focus(); return null; }
  const r = { id: M.editing || "own-" + Date.now().toString(36), own: true, t: { nl: name, fr: name, en: name },
    serves: +$("#rServes").value || null, i: M.items, steps: $("#rSteps").value.trim() };
  const at = R.own.findIndex(x => x.id === r.id);
  if (at >= 0) R.own[at] = r; else R.own.unshift(r);
  store.set("recipes", R.own); toast(t().rSaved);
  return r;
}

// Free, Single and Family side by side; Family is the best value (5 people for less than 3 Singles)
function renderPricing() {
  const L = t(), c = new Set(DEALS.map(d => d.store)).size, p = ACC.plan || {};
  const li = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const mine = k => p.plan === k && p.live || (k === "family" && p.plan === "family_member" && p.live);
  const btn = k => mine(k) ? `<button type="button" class="btn ghost block" disabled>${L.yourPlan}</button>`
    : `<button type="button" class="btn block${k === "single" ? " ghost" : ""}" data-buy="${k}">${(p.plan === "single" || p.plan === "family") && p.live ? (k === "family" ? L.switchToFam : L.switchToSingle) : k === "family" ? L.buyFamily : L.buySingle}</button>`;
  const fiveSingles = 5 * PRICE.single, saving = Math.round((fiveSingles - PRICE.family) * 100) / 100;
  $("#pricing").innerHTML = `<h2>${L.prTitle}</h2><p>${L.prSub(c, S.radius)}</p>
    <div class="plans three">
      <div class="plancard"><h3>${L.free}</h3><p>${L.freeSub}</p><div class="amount">${money(0).replace(/[.,]00/, "")}</div>${li(L.freeList(c))}
        <a class="btn ghost block" href="#deals">${L.freeBtn}</a></div>
      <div class="plancard"><h3>${L.single}</h3><p>${L.singleSub}</p>
        <div class="amount">${money(PRICE.single)} <small>${L.perMonth}</small></div>${li(L.singleList)}${btn("single")}</div>
      <div class="plancard plus"><span class="pill">${L.bestValue}</span><h3>${L.family}</h3><p>${L.familySub}</p>
        <div class="amount">${money(PRICE.family)} <small>${L.perMonth}</small></div>
        <p class="famsave">${L.famSave(money(saving), money(Math.round(PRICE.family / 5 * 100) / 100))}</p>${li(L.familyList)}${btn("family")}</div>
    </div><p class="fine prfine">${L.prFine}</p>`;
}
function showView() {
  if (location.hash === "#account") { history.replaceState(null, "", location.pathname + location.search); openAccountFresh(); }
  if (location.hash === "#list") { history.replaceState(null, "", location.pathname + location.search); if (DEALS.length) openList(); }  // tapped the daily notification
  const v = location.hash === "#recipes" ? "recipes" : location.hash === "#pricing" ? "pricing" : "deals";
  $("#viewDeals").hidden = v !== "deals";
  $("#viewRecipes").hidden = v !== "recipes";
  $("#viewPricing").hidden = v !== "pricing";
  document.querySelectorAll("[data-view]").forEach(a => a.setAttribute("aria-current", a.dataset.view === v ? "page" : "false"));
  if (v === "recipes") renderRecipes();
  if (v === "pricing") renderPricing();
  trk(v === "pricing" ? "pricing" : "view", { label: v });
}

function bindRecipes() {
  document.addEventListener("change", e => {
    const k = e.target.dataset?.home; if (!k) return;
    S.home = { ...S.home, [k]: +e.target.value }; store.set("home", S.home); matchCache.clear(); renderRecipes();
  });
  window.addEventListener("hashchange", () => { showView(); window.scrollTo(0, 0); });
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-recipe],[data-plan],[data-addmissing],[data-planadd],[data-delrecipe],[data-editrecipe],[data-automenu],[data-swap],[data-menun]"); if (!el) return;
    if ("automenu" in el.dataset) { if (!allowed("plan")) return; autoMenu(); renderRecipes(); return; }
    if (el.dataset.swap) { swapMenu(el.dataset.swap); renderRecipes(); return; }
    if (el.dataset.menun) { R.menuN = +el.dataset.menun; store.set("menuN", R.menuN); if (R.plan.size) resizeMenu(R.menuN); renderRecipes(); return; }
    if (el.dataset.plan) {
      e.stopPropagation();
      if (!R.plan.has(el.dataset.plan) && !allowed("plan")) return;
      R.plan.has(el.dataset.plan) ? R.plan.delete(el.dataset.plan) : R.plan.add(el.dataset.plan);
      store.set("plan", [...R.plan]); renderRecipes();
      if (!$("#sheetBg").hidden && el.closest("#sheet")) openRecipe(el.dataset.plan);
    } else if (el.dataset.addmissing) {
      const r = allRecipes().find(x => x.id === el.dataset.addmissing); addDeals(recipeStats(r).deals); openRecipe(r.id); renderRecipes();
    } else if ("planadd" in el.dataset) {
      toast(t().wantsAdded(addWants(missingWants(allRecipes().filter(r => R.plan.has(r.id)))))); renderRecipes();
    } else if (el.dataset.editrecipe) {
      const r = R.own.find(x => x.id === el.dataset.editrecipe); closeDialogs(); if (r) openMaker(r);
    } else if (el.dataset.delrecipe) {
      R.own = R.own.filter(r => r.id !== el.dataset.delrecipe); store.set("recipes", R.own);
      R.plan.delete(el.dataset.delrecipe); store.set("plan", [...R.plan]); closeDialogs(); renderRecipes();
    } else if (el.dataset.recipe) {
      openRecipe(el.dataset.recipe);
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && document.activeElement.classList?.contains("rcard")) openRecipe(document.activeElement.dataset.recipe); });
  document.addEventListener("change", e => {
    const v = e.target.dataset?.have; if (!v) return;
    const [id, i] = v.split("|");
    (R.have[id] ||= {})[i] = e.target.checked; store.set("have", R.have);
    openRecipe(id, v); renderRecipes();
  });
  $("#newRecipe").addEventListener("click", () => { if (R.own.length >= 1 && !allowed("recipes")) return; openMaker(); });
  $("#recipeForm").addEventListener("submit", e => {
    e.preventDefault();
    if (document.activeElement === $("#pickQ")) return; // Enter in the search picks, it doesn't save
    const r = saveMaker(); if (!r) return;
    closeDialogs(); matchCache.clear(); renderRecipes(); openRecipe(r.id);
  });
  $("#pickQ").addEventListener("input", () => { pickIdx = -1; renderPick(); });
  $("#pickQ").addEventListener("keydown", e => {
    const opts = [...$("#pickList").children];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); if (!opts.length) return;
      pickIdx = (pickIdx + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length; renderPick();
      $("#pick" + pickIdx)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault(); if (!opts.length) return;
      const o = opts[Math.max(pickIdx, 0)]; o.dataset.pickfree ? choose(fromText($("#pickQ").value.trim())) : choose(fromProduct(DEALS.find(d => d.id === o.dataset.pick)));
    } else if (e.key === "Escape" && $("#pickQ").value) { e.stopPropagation(); $("#pickQ").value = ""; renderPick(); }
  });
  $("#pickList").addEventListener("mousedown", e => e.preventDefault()); // keep focus in the search box
  $("#pickList").addEventListener("click", e => {
    const o = e.target.closest("li"); if (!o) return;
    o.dataset.pickfree ? choose(fromText($("#pickQ").value.trim())) : choose(fromProduct(DEALS.find(d => d.id === o.dataset.pick)));
  });
  $("#chosen").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) { M.items.splice(+b.dataset.rm, 1); renderChosen(); } });
  $("#chosen").addEventListener("input", e => { const i = e.target.dataset.amt; if (i != null) M.items[+i].a = e.target.value; });
}

// ---------- accounts and payments (on only when config.js has the Supabase keys) ----------
const CFG = window.DK_CONFIG || {};
const ACC = { on: !!(CFG.supabaseUrl && CFG.supabaseAnonKey), sb: null, user: null, profile: null, plan: null, invite: null, pulling: false, push: [] };
const PAY = () => ACC.on && CFG.payments === true;  // Premium is only sold (and locked) once Stripe is connected
// Premium (Single or a place in a paid Family) as the DATABASE says (my_plan): never a flag the browser sets.
const isPlus = () => !!ACC.plan?.premium;
// Free: every deal, my list, one own recipe. Premium: unlimited recipes and the weekly plan; Family: the shared list.
function allowed(feature) {
  if (!PAY() || isPlus()) return true;
  openAccount(feature);
  return false;
}
function loadScript(src) {
  return new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.append(s); });
}
async function initAccounts() {
  const btn = $("#accBtn");
  if (!ACC.on) return;               // no keys yet: the site works exactly as before, without accounts
  btn.hidden = false;
  try { await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js"); }
  catch { ACC.on = false; btn.hidden = true; return; }  // can't reach the login service: carry on without accounts
  ACC.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  ACC.sb.auth.onAuthStateChange((_e, session) => { setUser(session?.user || null); });
  const { data } = await ACC.sb.auth.getSession();
  await setUser(data.session?.user || null);
  if (url.has("paid")) { history.replaceState(null, "", location.pathname + location.hash); waitForPremium(); }  // back from Stripe checkout
  if (!ACC.user && pendingInvite()) openAccount("join");             // opened an invitation link: sign in first
}
async function setUser(user) {
  if ((user?.id || null) === (ACC.user?.id || null) && ACC.profile) return;
  ACC.user = user; ACC.profile = null;
  adminCheck(user);
  if (user) { await refreshProfile(); await mktPending(); await refreshPlan(); await pull(); await famLoad(); await inviteCheck(); }
  else { ACC.plan = null; ACC.invite = null; famReset(); }
  paintAccount();
}
// people with back-end access get an "Admin" button to switch over (the database decides who: admin_role, 005_admin.sql)
async function adminCheck(user) {
  const b = $("#admBtn"); if (!b) return;
  b.hidden = true;
  if (!user) return;
  try { const { data } = await ACC.sb.rpc("admin_role"); b.hidden = !data || ACC.user?.id !== user.id; } catch { /* no button */ }
}
// ticked "send me news" while signing in to an account that already existed: save that yes now
async function mktPending() {
  let want = false; try { want = localStorage.getItem("dk.mkt") === "1"; localStorage.removeItem("dk.mkt"); } catch { /* */ }
  if (want && ACC.profile && ACC.profile.marketing_opt_in === false) {
    const { data } = await ACC.sb.rpc("set_marketing", { yes: true }); if (data) ACC.profile.marketing_opt_in = true;
  }
}
// what the database says about your plan: Single, Family (owner or member), or free
async function refreshPlan() {
  if (!ACC.user) { ACC.plan = null; return; }
  const { data, error } = await ACC.sb.rpc("my_plan");
  ACC.plan = error || !data ? { plan: "free", premium: false, off: true } : data;
  FAM.live = !!ACC.plan.family?.live;
}
// Back from Stripe: Premium switches on only when Stripe has told the webhook it is paid, so wait for that.
async function waitForPremium(want) {
  const L = t(); toast(L.paidWait);
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    if (!ACC.user) continue;
    await refreshPlan();
    if (want ? ACC.plan?.plan === want || (want === "family" && ACC.plan?.family?.role === "owner" && ACC.plan.family.live) : ACC.plan?.premium) {
      await famLoad(); toast(L.paidOk); openAccount(); render(); return;
    }
  }
  toast(L.paidSlow); openAccount();
}
async function refreshProfile() {
  if (!ACC.user) return;
  const { data } = await ACC.sb.from("profiles").select("*").eq("id", ACC.user.id).single();
  ACC.profile = data || {};
  paintAccount();
}
// first sign-in on a device: merge what's in the browser with what's in the account
async function pull() {
  const { data } = await ACC.sb.from("user_data").select("*").eq("user_id", ACC.user.id).single();
  if (!data) return;
  ACC.pulling = true;
  S.list = { ...(data.list || {}), ...S.list };
  const ids = new Set(R.own.map(r => r.id));
  R.own = [...R.own, ...(data.recipes || []).filter(r => !ids.has(r.id))];
  R.have = { ...(data.have || {}), ...R.have };
  R.plan = new Set([...(data.plan || []), ...R.plan]);
  if (data.history) { HIST = DS.prune(DS.merge(HIST, data.history), Date.now()); store.set("hist", HIST); }
  // preferred postcode: the one saved in the account, else the one given when the account was made
  const pref = data.prefs?.pc || ACC.user.user_metadata?.pc;
  if (pref && !S.pc && pcAt(pref)) { S.pc = pref; store.set("pc", pref); computeNearest(); }
  // list items and preferred shop live in prefs, so no database change is needed
  const known = new Set(S.wants.map(w => DS.fold(w.q)));
  S.wants = [...S.wants, ...(data.prefs?.wants || []).filter(w => w?.q && !known.has(DS.fold(w.q)))];
  if (data.prefs?.shop) S.shop = data.prefs.shop;
  if (data.prefs?.me && (data.prefs.me.name || data.prefs.me.avatar) && !S.me.name && !S.me.avatar) { S.me = data.prefs.me; store.set("me", S.me); }
  if (Array.isArray(data.prefs?.diet) && data.prefs.diet.length) { S.diet = new Set(data.prefs.diet); store.set("diet", [...S.diet]); }  // allergies: the account wins
  if (data.prefs?.home?.adults && !localStorage.getItem("dk.home")) { S.home = data.prefs.home; store.set("home", S.home); }  // the shop saved in the account wins: it is a profile setting
  if (data.prefs?.alerts) { S.alerts = true; store.set("alerts", true); }
  // devices that get the daily notification: the account's list is the truth (the morning job removes dead ones)
  ACC.push = (data.prefs?.push || []).filter(p => p?.endpoint);
  const seen = new Set(S.bought.map(b => `${b.k}|${b.day}`));
  S.bought = DKBasket.pruneBought([...(data.prefs?.bought || []).filter(b => b?.k && b.day && !seen.has(`${b.k}|${b.day}`)), ...S.bought]
    .sort((a, b) => a.day.localeCompare(b.day)), Date.now());
  store.set("wants", S.wants); store.set("shop", S.shop); store.set("bought", S.bought);
  const r = data.prefs?.radius || ACC.user.user_metadata?.radius;
  if (r && RADII.includes(+r) && !localStorage.getItem("dk.radius")) { S.radius = +r; store.set("radius", S.radius); }
  store.set("list", S.list); store.set("recipes", R.own); store.set("have", R.have); store.set("plan", [...R.plan]);
  ACC.pulling = false;
  $("#listCount").textContent = listN();
  renderStatic(); render(); if (location.hash === "#recipes") renderRecipes();
  push();
}
let syncTimer;
function queueSync() { if (!ACC.user || ACC.pulling) return; clearTimeout(syncTimer); syncTimer = setTimeout(push, 800); }
async function push() {
  if (!ACC.user) return;
  await ACC.sb.from("user_data").upsert({ user_id: ACC.user.id, list: S.list, recipes: R.own, have: R.have, plan: [...R.plan],
    prefs: { pc: S.pc, radius: S.radius, lang: S.lang, shop: S.shop, wants: S.wants, bought: S.bought, alerts: !!S.alerts, push: pushList(), home: S.home, diet: [...S.diet], me: S.me, famQ: S.famQ }, updated_at: new Date().toISOString() });
  // separate call, so the list still syncs if the history column (migration 002) isn't there yet
  await ACC.sb.from("user_data").update({ history: HIST }).eq("user_id", ACC.user.id);
}
// ---------- Family Premium: up to 5 people, one shared list (supabase/migrations/004_premium_families.sql) ----------
// The browser only SHOWS this: who may see the family list, invite, remove or pay is checked again by the database
// every time. Your own list ("Only me") stays private: something goes to the family only when you add it there or
// press "To family".
const FAM = { hid: null, name: "", role: null, live: false, max: 5, members: [], items: [], deals: [], invites: [], ch: null, off: false, link: null, linkFor: "" };
const INV_KEY = "dk.invite";
{ const tok = url.get("invite"); if (tok && /^[0-9a-f]{64}$/.test(tok)) { try { localStorage.setItem(INV_KEY, tok); } catch { /* private mode */ } } }
if (url.has("invite") || url.has("join")) history.replaceState(null, "", location.pathname + location.hash);
const pendingInvite = () => { try { return localStorage.getItem(INV_KEY) || (/^[0-9a-f]{64}$/.test(url.get("invite") || "") ? url.get("invite") : null); } catch { return null; } };
const dropInvite = () => { try { localStorage.removeItem(INV_KEY); } catch { /* private mode */ } url.delete("invite"); };
const isUuid = id => /^[0-9a-f-]{36}$/.test(id);
const meName = () => S.me.name || (ACC.user?.email || "").split("@")[0];
const memberOf = id => FAM.members.find(m => m.user_id === id);
const av = (v, size, label) => window.DKAvatars ? DKAvatars.html(v, size, label) : "";
const isOwner = () => FAM.role === "owner";
const famItems = () => FAM.live ? FAM.items.filter(i => !i.cleared) : [];
const needs = () => [...famItems(), ...S.wants];   // what you need: the family's list and your own
const dbErr = e => String(e?.message || e || "");
function famRepaint() {
  $("#listCount").textContent = listN();
  if (!$("#listBg").hidden) renderList();
  if (!$("#accDlg").hidden) openAccount(ACC.why);
  promoNote();
}
function famReset() {
  if (FAM.ch) { try { ACC.sb.removeChannel(FAM.ch); } catch { /* gone */ } }
  Object.assign(FAM, { hid: null, name: "", role: null, live: false, members: [], items: [], deals: [], invites: [], ch: null, link: null, linkFor: "" });
}
async function famLoad() {
  if (!ACC.user) return;
  const { data, error } = await ACC.sb.from("household_members").select("household_id, role, households(name, max_members)")
    .eq("user_id", ACC.user.id).eq("status", "active").maybeSingle();
  if (error || ACC.plan?.off) { FAM.off = true; return; }       // migration 004 not run yet: families stay hidden
  FAM.off = false;
  if (!data) { famReset(); famRepaint(); return; }
  if (FAM.hid && FAM.hid !== data.household_id) famReset();
  Object.assign(FAM, { hid: data.household_id, role: data.role, name: data.households?.name || t().famDefault,
    max: data.households?.max_members || 5, live: !!ACC.plan?.family?.live });
  await famPull();
  if (!FAM.ch && ACC.sb.channel) {
    const f = `household_id=eq.${FAM.hid}`, pull = () => famPull();
    FAM.ch = ACC.sb.channel("fam-" + FAM.hid)
      .on("postgres_changes", { event: "*", schema: "public", table: "household_items", filter: f }, pull)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "household_items" }, pull)   // deletes can't be filtered
      .on("postgres_changes", { event: "*", schema: "public", table: "household_members", filter: f }, pull)
      .on("postgres_changes", { event: "*", schema: "public", table: "family_deals", filter: f }, pull)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "family_deals" }, pull).subscribe();
  }
}
let famPulling = null;
function famPull() { famPulling ||= famPullNow().finally(() => { famPulling = null; }); return famPulling; }
async function famPullNow() {
  if (!FAM.hid) return;
  const q = [ACC.sb.from("household_members").select("user_id, name, avatar, role").eq("household_id", FAM.hid).eq("status", "active").order("joined_at")];
  if (FAM.live) q.push(
    ACC.sb.from("household_items").select("id, q, qty, added_by, done_by, done_at, saved, cleared_at").eq("household_id", FAM.hid).order("created_at"),
    ACC.sb.from("family_deals").select("id, deal_id, data, added_by").eq("household_id", FAM.hid).order("created_at", { ascending: false }));
  if (isOwner()) q.push(ACC.sb.from("family_invitations").select("id, invited_email, expires_at").eq("family_id", FAM.hid).eq("status", "pending").gt("expires_at", new Date().toISOString()).order("created_at"));
  const [m, it, dl, inv] = await Promise.all(q);
  FAM.members = m.data || [];
  if (!FAM.members.some(x => x.user_id === ACC.user?.id)) {   // removed by the owner (or left on another phone)
    famReset(); await refreshPlan(); toast(t().famGone); famRepaint(); return;
  }
  if (FAM.live) {
    FAM.items = (it?.data || []).map(x => ({ id: x.id, q: x.q, qty: x.qty || 1, by: x.added_by, doneBy: x.done_by || null, saved: +x.saved || 0, doneAt: x.done_at, cleared: !!x.cleared_at, fam: true }));
    FAM.deals = (dl?.data || []).map(x => ({ ...(x.data || {}), id: x.deal_id, rowId: x.id, by: x.added_by }));
  } else { FAM.items = []; FAM.deals = []; }
  FAM.invites = inv?.data || [];
  // a copy of the family's open items in your prefs, so the morning notification knows them too
  const famQ = famItems().filter(i => !i.doneBy).map(i => i.q);
  if (JSON.stringify(famQ) !== JSON.stringify(S.famQ)) { S.famQ = famQ; store.set("famQ", famQ); }
  famRepaint();
}
async function famAddItems(qs) {
  if (!FAM.live || !qs.length) return 0;
  const have = new Set(famItems().filter(i => !i.doneBy).map(i => DS.fold(i.q)));
  const add = [...new Set(qs.map(q => q.trim().slice(0, 60)).filter(q => q.length >= 2 && !have.has(DS.fold(q))))];
  if (!add.length) return 0;
  // show it straight away; the database fills in who added it
  FAM.items.push(...add.map(q => ({ id: "tmp" + Math.random().toString(36).slice(2), q, qty: 1, by: ACC.user.id, fam: true })));
  famRepaint();
  const { error } = await ACC.sb.from("household_items").insert(add.map(q => ({ household_id: FAM.hid, q, qty: 1 })));
  if (error) toast(t().accErr);
  await famPull();
  return add.length;
}
// only the changed fields are sent, so two people changing different things never undo each other
async function famUpdate(id, fields) {
  if (!FAM.live || !isUuid(id)) return;
  const it = FAM.items.find(i => i.id === id); if (it) Object.assign(it, fields.qty ? { qty: fields.qty } : {});
  const { error } = await ACC.sb.from("household_items").update(fields).eq("id", id);
  if (error) toast(t().accErr);
  famPull();
}
const famTick = (id, on, saved) => famUpdate(id, on ? { done_by: ACC.user.id, saved: Math.max(0, Math.min(500, Math.round((saved || 0) * 100) / 100)) } : { done_by: null });
const famQty = (id, qty) => famUpdate(id, { qty: Math.max(1, Math.min(99, qty)) });
async function famRemove(id) {
  if (!FAM.live || !isUuid(id)) return;
  FAM.items = FAM.items.filter(i => i.id !== id); famRepaint();
  await ACC.sb.from("household_items").delete().eq("id", id); famPull();
}
async function famClear() {   // bought things leave the list but still count for "saved together"
  if (!FAM.live) return;
  await ACC.sb.from("household_items").update({ cleared_at: new Date().toISOString() }).eq("household_id", FAM.hid).not("done_by", "is", null).is("cleared_at", null);
  famPull();
}
async function famMove(id) {   // one of your own items, on purpose, to the family list
  const w = S.wants.find(x => x.id === id); if (!w) return;
  S.wants = S.wants.filter(x => x !== w); store.set("wants", S.wants);
  await famAddItems([w.q]); toast(t().movedFam);
}
async function famShareDeal(id) {
  const d = DEALS.find(x => x.id === id) || S.list[id]; if (!d || !FAM.live) return;
  const data = Object.fromEntries(["name", "store", "price", "old_price", "promo_text", "pack_size", "brand", "cat", "valid_to", "cc"].filter(k => d[k] != null).map(k => [k, d[k]]));
  const { error } = await ACC.sb.from("family_deals").insert({ household_id: FAM.hid, deal_id: String(d.id).slice(0, 200), data });
  toast(error && !/duplicate/i.test(dbErr(error)) ? t().accErr : t().dealShared); famPull();
}
async function famUnshare(rowId) { if (isUuid(rowId)) { await ACC.sb.from("family_deals").delete().eq("id", rowId); famPull(); } }
function famSavedMonth() {
  const m = new Date().toISOString().slice(0, 7);
  return FAM.items.filter(i => i.doneBy && (i.doneAt || "").startsWith(m)).reduce((a, i) => a + i.saved, 0);
}
async function famInvite(email) {
  const L = t();
  const { data: tok, error } = await ACC.sb.rpc("create_invitation", { email });
  if (error || !tok) { toast(famErr(error, L)); return; }
  FAM.link = location.origin + location.pathname + "?invite=" + tok; FAM.linkFor = email.trim().toLowerCase();
  await famPull();
}
async function famRevoke(id) { const { error } = await ACC.sb.rpc("revoke_invitation", { invite: id }); if (error) toast(t().accErr); famPull(); }
async function famRemoveMember(uid) {
  const L = t(), m = memberOf(uid);
  if (!confirm(L.famRemoveQ(m?.name || "?"))) return;
  const { error } = await ACC.sb.rpc("remove_member", { member: uid });
  if (error) toast(famErr(error, L)); famPull();
}
async function famLeave() {
  const L = t();
  if (!confirm(isOwner() ? L.famLeaveOwnerQ : L.famLeaveQ)) return;
  const { error } = await ACC.sb.rpc("leave_family");
  if (error) { toast(famErr(error, L)); return; }
  famReset(); await refreshPlan(); toast(L.famLeft); famRepaint();
}
async function famRename(name) {
  const { error } = await ACC.sb.rpc("rename_family", { new_name: name });
  if (error) toast(famErr(error, t())); else { FAM.name = name.trim().slice(0, 40) || FAM.name; famRepaint(); }
}
// the database's reasons, in words people understand
function famErr(e, L) {
  const m = dbErr(e);
  for (const [re, k] of [[/family full/, "full"], [/only the owner/, "owner"], [/not paid/, "notpaid"], [/that is you/, "self"], [/already a member/, "member"],
    [/bad email/, "email"], [/remove the others/, "others"], [/cancel the subscription/, "cancel"], [/another email/, "other_email"], [/expired/, "expired"],
    [/revoked/, "revoked"], [/accepted/, "accepted"], [/unknown/, "unknown"], [/cancel single/, "single"], [/leave your family/, "leave"]])
    if (re.test(m)) return typeof L.famErrs[k] === "function" ? L.famErrs[k]("") : L.famErrs[k];
  return L.accErr;
}
// an invitation link was opened: who invites, and accept it here (only with the invited email address)
async function inviteCheck() {
  const tok = pendingInvite(); if (!tok || !ACC.user) return;
  const { data, error } = await ACC.sb.rpc("invitation_info", { token: tok });
  if (error) return;
  ACC.invite = { tok, ...data };
  if (!data.ok && data.reason !== "other_email") dropInvite();
  openAccount("invite");
}
async function inviteAccept() {
  const L = t(), tok = ACC.invite?.tok; if (!tok) return;
  const { error } = await ACC.sb.rpc("accept_invitation", { token: tok, my_name: meName(), my_avatar: S.me.avatar || null });
  if (error) { ACC.invite = { tok, ok: false, err: famErr(error, L) }; if (!/single|leave/.test(dbErr(error))) dropInvite(); openAccount("invite"); return; }
  dropInvite(); ACC.invite = null;
  await refreshPlan(); await famLoad(); toast(L.famJoined(FAM.name)); openAccount();
}
function inviteHTML(L) {
  const i = ACC.invite; if (!i) return "";
  const msg = i.ok ? L.invText(esc(i.owner || ""), esc(i.family || "")) : esc(i.err || (i.reason === "other_email" ? L.famErrs.other_email(i.email_hint || "") : L.famErrs[i.reason] || L.accErr));
  return `<section class="invcard"><h4>${L.invT}</h4><p>${msg}</p>${i.ok ? `<div class="pop-actions"><button type="button" class="btn" data-inv-accept>${L.invAccept}</button><button type="button" class="btn ghost" data-inv-no>${L.invNo}</button></div>`
    : `<button type="button" class="linkish" data-inv-no>${L.close}</button>`}</section>`;
}
// the home on the account page: a house with everyone in it, and (for the owner) the family management
function houseHTML(L) {
  const people = FAM.hid ? FAM.members : [{ user_id: ACC.user.id, name: meName(), avatar: S.me.avatar }];
  const roof = `<svg class="house-bg" viewBox="0 0 320 210" preserveAspectRatio="none" aria-hidden="true"><path d="M160 8 12 92h22v110h252V92h22z" fill="var(--mustard-soft)" stroke="var(--mustard)" stroke-width="4" stroke-linejoin="round"/><rect x="226" y="30" width="22" height="38" fill="var(--mustard)" rx="3"/></svg>`;
  const free = Math.max(0, FAM.max - FAM.members.length - FAM.invites.length);
  const empty = FAM.hid && isOwner() ? Array.from({ length: Math.min(free, 4) }, () => `<span class="person freespot"><span class="av" style="width:46px;height:46px" aria-hidden="true"></span><small>${L.famFreeSpot}</small></span>`).join("") : "";
  const who = people.map(m => `<span class="person">${av(m.avatar, 46, m.name || "")}<small>${esc(m.user_id === ACC.user.id ? `${m.name || meName()} (${L.famYou})` : m.name || "?")}</small></span>`).join("") + empty;
  if (!FAM.hid) return `<section class="famcard"><h4>${L.famT}</h4><div class="house">${roof}<div class="people">${who}</div></div>
    <p class="muted">${L.famPromo}</p><a class="btn block" href="#pricing" data-close>${L.seeFamily}</a></section>`;
  const locked = !FAM.live ? `<p class="warn">${isOwner() ? L.famLockedOwner : L.famLocked}</p>` : "";
  const saved = FAM.live && famSavedMonth() > 0 ? `<p class="savedtogether">${L.famSavedMonth(money(famSavedMonth()))}</p>` : "";
  const rows = `<ul class="members">${FAM.members.map(m => `<li>${av(m.avatar, 28, m.name || "")}<span>${esc(m.name || "?")}${m.user_id === ACC.user.id ? ` (${L.famYou})` : ""}${m.role === "owner" ? ` <small class="muted">· ${L.famOwner}</small>` : ""}</span>
      ${isOwner() && m.user_id !== ACC.user.id ? `<button type="button" class="linkish" data-fam-remove="${esc(m.user_id)}">${L.famRemove}</button>` : ""}</li>`).join("")}
    ${isOwner() ? FAM.invites.map(i => `<li class="pending"><span class="av" style="width:28px;height:28px" aria-hidden="true"></span><span>${esc(i.invited_email)} <small class="muted">· ${L.famPending(dayMonth(i.expires_at))}</small></span>
      <button type="button" class="linkish" data-fam-revoke="${esc(i.id)}">${L.famCancel}</button></li>`).join("") : ""}</ul>`;
  const link = FAM.link ? `<div class="invlink" role="status"><p class="small">${L.famInviteMade(esc(FAM.linkFor))}</p>
      <input class="famlink" readonly value="${esc(FAM.link)}" aria-label="${L.famLinkLbl}">
      <div class="pop-actions"><a class="btn" href="mailto:${encodeURIComponent(FAM.linkFor)}?subject=${encodeURIComponent(L.famMailSubj)}&body=${encodeURIComponent(L.famMailBody(meName(), FAM.link))}">${L.famMail}</a>
        ${navigator.share ? `<button type="button" class="btn ghost" data-fam-share>${L.famShareBtn}</button>` : ""}<button type="button" class="btn ghost" data-fam-copy>${L.famCopy}</button></div></div>` : "";
  const manage = isOwner() ? `<div class="fammanage">
      <label class="field"><span>${L.famNameLbl}</span><input id="famName" maxlength="40" value="${esc(FAM.name)}"></label>
      ${FAM.live ? free > 0 ? `<form id="famInviteForm" class="wantform" autocomplete="off"><input id="famEmail" type="email" required inputmode="email" placeholder="${esc(L.famEmailPh)}" aria-label="${esc(L.famEmailPh)}"><button type="submit" class="btn">${L.famInviteBtn}</button></form>
        <small class="muted">${L.famInviteWhy}</small>` : `<p class="muted small">${L.famErrs.full}</p>` : ""}${link}</div>` : "";
  return `<section class="famcard"><h4>${esc(FAM.name)}</h4>
    <div class="house">${roof}<div class="people">${who}</div></div>
    <p class="muted">${L.famPlaces(FAM.members.length, FAM.max)}${isOwner() ? ` · ${L.famFree(free)}` : ""}</p>${locked}${saved}
    ${rows}${manage}
    <button type="button" class="linkish leave" data-fam-leave>${L.famLeave}</button></section>`;
}
function meHTML(L) {
  const pick = window.DKAvatars ? `<div class="avpick" id="avPick" hidden>${DKAvatars.KEYS.map(k => `<button type="button" data-av="a:${k}" aria-pressed="${S.me.avatar === "a:" + k}" aria-label="${k}">${DKAvatars.svg(k)}</button>`).join("")}
      <label class="btn ghost avup">${L.avUpload}<input type="file" id="avFile" accept="image/*" hidden></label></div>` : "";
  return `<section class="mecard"><button type="button" class="mepic" data-av-open aria-expanded="false" aria-controls="avPick" aria-label="${L.avChange}">${av(S.me.avatar, 64, meName())}<span class="pen" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg></span></button>
    <label class="field mename"><span>${L.meName}</span><input id="meName" maxlength="30" autocomplete="nickname" value="${esc(S.me.name)}" placeholder="${esc(L.meNamePh)}"></label></section>${pick}`;
}
function saveMe() {
  store.set("me", S.me);
  if (FAM.hid) ACC.sb.from("household_members").update({ name: meName(), avatar: S.me.avatar || null }).eq("household_id", FAM.hid).eq("user_id", ACC.user.id).then(() => famPull());
}
function bindMe(box) {
  const L = t();
  box.querySelector("[data-av-open]")?.addEventListener("click", e => { const p = $("#avPick"); p.hidden = !p.hidden; e.currentTarget.setAttribute("aria-expanded", String(!p.hidden)); });
  box.querySelectorAll("[data-av]").forEach(b => b.addEventListener("click", () => { S.me = { ...S.me, avatar: b.dataset.av }; saveMe(); openAccount(ACC.why); }));
  box.querySelector("#avFile")?.addEventListener("change", async e => {
    try { S.me = { ...S.me, avatar: await DKAvatars.fromFile(e.target.files[0]) }; saveMe(); openAccount(ACC.why); } catch { toast(L.avErr); }
  });
  box.querySelector("#meName")?.addEventListener("change", e => { S.me = { ...S.me, name: e.target.value.trim().slice(0, 30) }; saveMe(); });
  box.querySelector("#famName")?.addEventListener("change", e => famRename(e.target.value));
  box.querySelector("#famInviteForm")?.addEventListener("submit", e => { e.preventDefault(); famInvite($("#famEmail").value); });
  box.querySelectorAll("[data-fam-remove]").forEach(b => b.addEventListener("click", () => famRemoveMember(b.dataset.famRemove)));
  box.querySelectorAll("[data-fam-revoke]").forEach(b => b.addEventListener("click", () => famRevoke(b.dataset.famRevoke)));
  box.querySelector("[data-fam-leave]")?.addEventListener("click", famLeave);
  box.querySelector("[data-fam-copy]")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(FAM.link); toast(L.famCopied); } catch { box.querySelector(".famlink")?.select(); } });
  box.querySelector("[data-fam-share]")?.addEventListener("click", async () => { try { await navigator.share({ title: "deal'ke", text: L.famMailBody(meName(), ""), url: FAM.link }); } catch { /* closed */ } });
  box.querySelector("[data-inv-accept]")?.addEventListener("click", inviteAccept);
  box.querySelector("[data-inv-no]")?.addEventListener("click", () => { dropInvite(); ACC.invite = null; openAccount(); });
}

// ---------- daily notification (web push) ----------
// The morning job (alerts/daily.py) sends it through the browser's own push service; sw.js shows it.
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const pushCan = () => !!CFG.vapidPublicKey && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const pushList = () => [...(S.pushOn ? [{ ...S.pushOn, at: DKBasket.dayOf(Date.now()) }] : []), ...ACC.push.filter(p => p.endpoint !== S.pushOn?.endpoint)].slice(0, 5);
const keyBytes = b64 => Uint8Array.from(atob((b64 + "=".repeat(-b64.length & 3)).replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
async function pushStart() {   // returns "on", "ios", "denied" or "no"
  if (!pushCan()) return isIOS && !isApp() ? "ios" : "no";
  if (await Notification.requestPermission() !== "granted") return "denied";
  try {
    const reg = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(CFG.vapidPublicKey) });
    const j = sub.toJSON();
    S.pushOn = { endpoint: j.endpoint, keys: j.keys }; store.set("pushOn", S.pushOn); push();
    return "on";
  } catch { return "no"; }
}
async function pushStop() {
  const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
  const sub = await reg?.pushManager.getSubscription();
  const gone = S.pushOn?.endpoint || sub?.endpoint;
  ACC.push = ACC.push.filter(p => p.endpoint !== gone);
  S.pushOn = null; store.set("pushOn", null); push();
  try { await sub?.unsubscribe(); } catch { /* already gone */ }
}
// the browser can drop a subscription (or the person blocks notifications): then the switch must say "off"
async function pushCheck() {
  if (!S.pushOn || !pushCan()) return;
  const sub = Notification.permission === "granted" && await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
  if (!sub) { ACC.push = ACC.push.filter(p => p.endpoint !== S.pushOn.endpoint); S.pushOn = null; store.set("pushOn", null); push(); }
  else if (sub.endpoint !== S.pushOn.endpoint) { const j = sub.toJSON(); S.pushOn = { endpoint: j.endpoint, keys: j.keys }; store.set("pushOn", S.pushOn); push(); }
}

// ---------- "on promo now" note when the site opens ----------
// Works without an account or notifications: what's new on promo from your list since you last looked.
const promoKey = (item, d) => `${DS.fold(item.q)}|${d.store}|${d.price}`;
function promoNow() {
  if (!needs().length || !window.DKBasket) return [];
  const c = DKBasket.compare(needs().filter(i => !i.doneBy), nearDeals(), S.shop);
  return c.items.map(({ item, best, byShop }) => ({ item, d: (c.pick && byShop[c.pick.chain]) || best })).filter(x => x.d);
}
function promoNote() {
  const el = $("#promoNote"); if (!el) return;
  const seen = new Set(store.get("seenPromo", []));
  const fresh = promoNow().filter(x => !seen.has(promoKey(x.item, x.d)));
  if (!fresh.length || SAMPLE) { el.hidden = true; return; }
  const L = t();
  el.innerHTML = `<span class="bell" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>
    <span class="txt"><b>${L.promoNote(fresh.length)}</b><small>${fresh.slice(0, 3).map(x => esc(L.promoWhat(x.item.q, x.d.store))).join(" · ")}${fresh.length > 3 ? " …" : ""}</small></span>
    <button type="button" class="btn small" data-promo-see>${L.promoSee}</button>
    <button type="button" class="x" data-promo-x aria-label="${L.close}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
  el.hidden = false;
}
function promoSeen() {
  const keys = promoNow().map(x => promoKey(x.item, x.d));
  store.set("seenPromo", [...new Set([...store.get("seenPromo", []), ...keys])].slice(-300));
  const el = $("#promoNote"); if (el) el.hidden = true;
}
function openList() { promoSeen(); renderList(); openDialog($("#listBg"), $("#drawer .x")); }

async function callFn(name, body = {}) {
  const { data, error } = await ACC.sb.functions.invoke(name, { body });
  if (data?.url) { location.href = data.url; return data; }
  let why = ""; try { why = (await error?.context?.json?.())?.error || ""; } catch { /* no body */ }
  return { ...(data || {}), why };
}
// Buy or switch a plan. The server decides what is allowed (one paid plan per person, members leave first, ...).
async function buy(plan) {
  const L = t();
  if (!PAY()) { toast(L.soon); return; }
  if (!ACC.user) { openAccount("buy"); return; }
  const cur = ACC.plan?.plan;
  if (cur === "family_member") { toast(L.buyErrs.member); return; }
  if ((cur === "single" && plan === "family") || (cur === "family" && plan === "single")) { if (!confirm(plan === "family" ? L.switchFamQ : L.switchSingleQ)) return; }
  toast(L.accRedirect);
  const r = await callFn("create-checkout", { plan });
  if (!r) return;
  if (r.switched) { waitForPremium(plan); return; }
  toast(L.buyErrs[{ "already single": "single", "already family": "family", "member: leave the family first": "member", "owner: remove members first": "others" }[r.why]] || L.accErr);
}
function startTrial() { location.hash = "#pricing"; }
async function openPortal() { toast(t().accRedirect); const r = await callFn("customer-portal"); if (r) toast(t().accErr); }
async function signOut() { await ACC.sb.auth.signOut(); closeDialogs(); toast(t().accOut); }
function paintAccount() {
  const b = $("#accBtn"); if (!b) return;
  b.classList.toggle("in", !!ACC.user);
  $("#accLbl").textContent = ACC.user ? "" : t().accSignIn;   // signed out: say "Inloggen" next to the icon so it is easy to find
  b.setAttribute("aria-label", ACC.user ? t().accTitle : t().accSignIn);
  if (!$("#accDlg").hidden) openAccount(ACC.why);
}
const dayMonth = x => x ? new Date(x).toLocaleDateString(LOCALE[S.lang], { day: "numeric", month: "long" }) : "";
const PRICE = { single: 4.99, family: 12.99 };
// The plan as the account page shows it. Members see the family's state, never payment details.
function planLine() {
  const L = t(), p = ACC.plan || {};
  if (p.plan === "single" || p.plan === "family") {
    const what = `${p.plan === "single" ? L.single : L.family} · ${money(PRICE[p.plan])} ${L.perMonth}`;
    const when = !p.live ? L.planStopped : p.cancel_at_period_end ? L.planEnds(dayMonth(p.period_end)) : p.period_end ? L.planRenews(dayMonth(p.period_end)) : L.planActive;
    return `${what}. ${when}`;
  }
  if (p.plan === "family_member") return `${L.family} · ${L.planVia(p.family?.owner_name || "?")}. ${p.live ? L.planActive : L.planPaused}`;
  return L.accFree;
}
function subHTML(L) {
  const p = ACC.plan || {};
  if (!PAY() && !(p.plan && p.plan !== "free")) return "";
  const warn = p.payment === "failed" && (p.plan === "single" || p.plan === "family") && p.status !== "active"
    ? `<p class="warn" role="alert">${p.live ? (p.plan === "family" ? L.payFailedFam : L.payFailed)(dayMonth(p.grace_until)) : L.payStopped}</p>` : "";
  const btns = [];
  if (p.plan === "single" || p.plan === "family") btns.push(`<button type="button" class="btn" data-portal>${L.accManage}</button>`);
  if (p.plan === "single" && p.live) btns.push(`<button type="button" class="btn ghost" data-buy="family">${L.switchToFam}</button>`);
  if (p.plan === "family" && p.live && FAM.members.length <= 1) btns.push(`<button type="button" class="btn ghost" data-buy="single">${L.switchToSingle}</button>`);
  if (!p.plan || p.plan === "free" || (!p.live && p.plan !== "family_member")) btns.push(`<a class="btn${btns.length ? " ghost" : ""}" href="#pricing" data-close>${L.seePremium}</a>`);
  return `${warn}${btns.length ? `<div class="cta subcta">${btns.join("")}</div>` : ""}${p.plan === "single" || p.plan === "family" ? `<p class="muted small">${L.manageWhy}</p>` : ""}`;
}
// open the account and check the plan again (it may have changed: a payment, a removal, a cancellation)
function openAccountFresh() {
  openAccount();
  if (ACC.user && ACC.sb) refreshPlan().then(famLoad).then(() => { if (!$("#accDlg").hidden) openAccount(ACC.why); });
}
function openAccount(why) {
  const L = t(); ACC.why = why;
  const box = $("#accBox");
  const upsell = why === "join" ? `<p class="upsell">${L.famJoinSign}</p>` : why && why !== "trial" && L.accNeed[why] ? `<p class="upsell">${L.accNeed[why]}</p>` : "";
  if (!ACC.user) {
    box.innerHTML = `<h3 id="accTitle">${L.accSignIn}</h3>${upsell}<p class="muted">${L.accWhy}</p>
      <form id="accForm" class="acc-form"><label class="field"><span>${L.accEmail}</span><input id="accEmail" type="email" required autocomplete="email" inputmode="email"></label>
      <div class="field"><label for="accPc">${L.accPc}</label>
        <div class="pc-row"><input id="accPc" maxlength="120" autocomplete="off" value="${esc(pcInput(S.pc))}" placeholder="${esc(L.pcPh)}">
          <span class="cc-seg" role="group" data-for="accPc"></span></div>
        <small class="muted">${L.accPcWhy}</small></div>
      <p class="pc-error" id="accPcErr" role="alert" hidden></p>
      <label class="alerts mkt"><input type="checkbox" id="accMkt"><span><b>${L.mkt}</b><small class="muted">${L.mktWhy}</small></span></label>
      <button class="btn block" type="submit">${L.accSend}</button></form>
      <p class="muted small" id="accSent" hidden></p>
      <div class="pop-actions"><button type="button" class="btn ghost" data-close>${L.close}</button></div>`;
    $("#accForm").addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#accEmail").value.trim();
      if ($("#accPc").value.trim() && !await setPc($("#accPc").value, $("#accPcErr"), "accPc")) return; // optional, but must be valid
      renderStatic(); render();
      const mkt = $("#accMkt")?.checked === true;
      try { mkt ? localStorage.setItem("dk.mkt", "1") : localStorage.removeItem("dk.mkt"); } catch { /* private mode */ }  // an existing account: saved after sign-in
      trk("signup", {});
      const { error } = await ACC.sb.auth.signInWithOtp({ email, options: { data: { ...(S.pc ? { pc: S.pc, radius: S.radius } : {}), ...(mkt ? { marketing: true } : {}) }, emailRedirectTo: location.origin + location.pathname + (pendingInvite() ? "?invite=" + pendingInvite() : "") + (why === "trial" || why === "buy" ? "#pricing" : "") } });
      const sent = $("#accSent"); if (sent) { sent.textContent = error ? L.accErr : L.accSent(email); sent.hidden = false; }
    });
  } else {
    box.innerHTML = `<h3 id="accTitle">${L.accTitle}</h3>${upsell}${inviteHTML(L)}
      ${meHTML(L)}
      <dl class="facts"><dt>${L.accEmail}</dt><dd>${esc(ACC.user.email)}</dd><dt>${L.accPlan}</dt><dd>${esc(planLine())}</dd>
        <dt>${L.accPc}</dt><dd>${S.pc ? esc(`${pcName(S.pc)} · ${S.radius} km`) : "–"} <button type="button" class="linkish" data-acc-pc>${L.accChange}</button></dd></dl>
      ${window.DKDiet ? `<div class="accdiet"><b>${L.dietAcc}</b><small class="muted">${L.dietAccWhy}</small>
        <div class="chips">${DKDiet.KEYS.map(k => `<button type="button" class="chip sm diet" data-diet="${k}" aria-pressed="${S.diet.has(k)}">${esc(L.diets[k])}</button>`).join("")}</div>
        <small class="muted">${L.dietNote}</small></div>` : ""}
      ${subHTML(L)}${FAM.off ? "" : houseHTML(L)}
      <label class="accshop"><span><b>${L.myShop}</b><small class="muted">${L.myShopWhy}</small></span>
        <select id="accShop"><option value="">${L.myShopAny}</option>${shopChoices().map(ch => `<option value="${esc(ch)}"${ch === S.shop ? " selected" : ""}>${esc(ch)}${kmText(ch) ? ` · ${kmText(ch)}` : ""}</option>`).join("")}</select></label>
      ${CFG.vapidPublicKey ? `<label class="alerts"><input type="checkbox" id="accNotify"${S.pushOn ? " checked" : ""}><span><b>${L.accNotify}</b><small class="muted">${L.accNotifyWhy}</small></span></label>
      <p class="pushmsg" id="pushMsg" role="status"${isIOS && !isApp() && !S.pushOn ? "" : " hidden"}>${isIOS && !isApp() ? L.pushIos : ""}</p>` : ""}
      ${CFG.emailAlerts ? `<label class="alerts"><input type="checkbox" id="accAlerts"${S.alerts ? " checked" : ""}><span><b>${L.accAlerts}</b><small class="muted">${L.accAlertsWhy}</small></span></label>` : ""}
      ${"marketing_opt_in" in (ACC.profile || {}) ? `<label class="alerts mkt"><input type="checkbox" id="accMkt"${ACC.profile.marketing_opt_in ? " checked" : ""}><span><b>${L.mkt}</b><small class="muted">${L.mktWhy}</small></span></label>` : ""}
      <div class="cta"><button type="button" class="btn ghost" data-logout>${L.accLogout}</button></div>
      <p class="muted small">${L.accSynced}</p>`;
  }
  paintCc(guessCc(), "accPc");
  if (ACC.user) bindMe(box);
  if (ACC.user) box.querySelector("#accMkt")?.addEventListener("change", async e => {
    const on = e.target.checked, { data, error } = await ACC.sb.rpc("set_marketing", { yes: on });
    if (error) { e.target.checked = !on; toast(L.accErr); return; }
    ACC.profile.marketing_opt_in = !!data; toast(data ? L.mktOn : L.mktOff);
  });
  box.querySelector("#accAlerts")?.addEventListener("change", e => { S.alerts = e.target.checked; store.set("alerts", S.alerts); });
  box.querySelector("#accNotify")?.addEventListener("change", async e => {
    const box = e.target, msg = $("#pushMsg"), say = m => { if (msg) { msg.textContent = m; msg.hidden = !m; } };
    box.disabled = true;
    if (box.checked) { const r = await pushStart(); box.checked = r === "on"; say({ on: L.pushOn, ios: L.pushIos, denied: L.pushDenied, no: L.pushNo }[r]); }
    else { await pushStop(); say(L.pushOff); }
    box.disabled = false;
  });
  box.querySelector("#accShop")?.addEventListener("change", e => { setShop(e.target.value); toast(L.myShopSaved(S.shop)); });
  box.querySelector("[data-acc-pc]")?.addEventListener("click", () => { closeDialogs(); $("#locBtn").click(); });
  if ($("#accDlg").hidden) openDialog($("#accDlg"));
}

// ---------- start ----------
bind();
bindRecipes();
// a click on "to the store" / "directions" in the details (anonymous, only with consent)
document.addEventListener("click", e => { const a = e.target.closest("[data-trk]"); if (a) trk(a.dataset.trk, { store: a.dataset.trkStore, label: a.dataset.trkLabel }); });
load().then(() => { paintSettings(); renderStatic(); render(); showView(); initAccounts(); pushCheck(); });
})();
