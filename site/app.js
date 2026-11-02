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
    postcode: "Postcode", showDeals: "Toon mijn promo's", badPc: "Die postcode kennen we niet. Probeer bv. 9000.",
    trust: (n, c) => `<b>${n}</b> promo's van <b>${c}</b> ketens, vanochtend gecheckt`,
    sample: "Voorbeeldpromo's: de echte promo's verschijnen na de eerste automatische ronde van de verzamelaar.",
    dealType: "Soort promo", stores: "Winkels", sortBy: "Sorteer", clearAll: "Wis filters", showMore: "Toon meer",
    all: "Alles", allDeals: "Alle promo's",
    secTitle: "Promo's van deze week", searchTitle: q => `Resultaten voor “${q}”`,
    secSub: (n, pc, r) => `${n} promo's${pc ? ` binnen ${r} km van ${pc}` : ""}`,
    sorts: { value: "Beste prijs per kg/L", price: "Laagste prijs", discount: "Grootste korting", near: "Dichtstbij", ending: "Eindigt binnenkort" },
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
    postcode: "Code postal", showDeals: "Voir mes promos", badPc: "Code postal inconnu. Essayez par ex. 1000.",
    trust: (n, c) => `<b>${n}</b> promos de <b>${c}</b> enseignes vérifiées ce matin`,
    sample: "Promos d’exemple : les vraies promos apparaissent après le premier passage automatique du collecteur.",
    dealType: "Type de promo", stores: "Magasins", sortBy: "Trier", clearAll: "Effacer les filtres", showMore: "Voir plus",
    all: "Tout", allDeals: "Toutes les promos",
    secTitle: "Les promos de la semaine", searchTitle: q => `Résultats pour « ${q} »`,
    secSub: (n, pc, r) => `${n} promos${pc ? ` à moins de ${r} km de ${pc}` : ""}`,
    sorts: { value: "Meilleur prix au kg/L", price: "Prix le plus bas", discount: "Plus grosse remise", near: "Le plus proche", ending: "Se termine bientôt" },
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
    postcode: "Postal code", showDeals: "Show my deals", badPc: "We don't know that postal code. Try 9000, for example.",
    trust: (n, c) => `<b>${n}</b> deals from <b>${c}</b> chains checked this morning`,
    sample: "Example deals: the real deals appear after the collector's first automatic run.",
    dealType: "Deal type", stores: "Stores", sortBy: "Sort", clearAll: "Clear filters", showMore: "Show more",
    all: "All", allDeals: "All deals",
    secTitle: "This week's deals", searchTitle: q => `Results for “${q}”`,
    secSub: (n, pc, r) => `${n} deals${pc ? ` within ${r} km of ${pc}` : ""}`,
    sorts: { value: "Best price per kg/L", price: "Lowest price", discount: "Biggest discount", near: "Nearest", ending: "Ending soon" },
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
Object.assign(T.nl, { nearT: (n, r) => `${n} winkels binnen ${r} km`, nearSub: (n, pc) => `${n} ketens rond ${pc}. Tik op een winkel om hem op de kaart te zien.`, nearNo: "nog geen promo's online", nearRoute: "Route" });
Object.assign(T.fr, { nearT: (n, r) => `${n} magasins à moins de ${r} km`, nearSub: (n, pc) => `${n} enseignes autour de ${pc}. Touchez un magasin pour le voir sur la carte.`, nearNo: "pas encore de promos en ligne", nearRoute: "Itinéraire" });
Object.assign(T.en, { nearT: (n, r) => `${n} shops within ${r} km`, nearSub: (n, pc) => `${n} chains around ${pc}. Tap a shop to see it on the map.`, nearNo: "no promos online yet", nearRoute: "Directions" });
Object.assign(T.nl, { accSignIn: "Inloggen", accTitle: "Mijn account", accEmail: "E-mail", accSend: "Stuur me een inloglink", accWhy: "Geen wachtwoord nodig: je krijgt een link per e-mail. Je lijst en recepten staan dan op al je toestellen.", accSent: e => `Kijk in je mailbox (${e}) en klik op de link.`, accPlan: "Abonnement", accFree: "Gratis", accTrial: d => `Plus, gratis proefperiode tot ${d}`, accActive: d => `Plus, verlengt op ${d}`, accEnds: d => `Plus, stopt op ${d}`, accPastDue: "Plus, betaling mislukt: werk je betaalgegevens bij", accManage: "Beheer abonnement", accSubscribe: "Neem Plus, € 4,99 per maand", accLogout: "Uitloggen", accOut: "Je bent uitgelogd", accErr: "Dat lukte niet. Probeer het zo opnieuw.", accRedirect: "Even geduld, we openen de betaalpagina…", accSynced: "Je lijst en recepten worden bewaard in je account.", accNeed: { plan: "Je week plannen zit in Plus. Probeer het 14 dagen gratis.", recipes: "Meer dan één eigen recept zit in Plus. Probeer het 14 dagen gratis." } });
T.nl.sorts.value = "Goedkoopst per kg / L";
Object.assign(T.nl, { rPick: "Ingrediënten", rPickPh: "Zoek een product, bv. gehakt, pasta, ui", rFree: q => `“${q}” toevoegen als eigen ingrediënt`,
  rSteps: "Zo maak je het (mag leeg)", rAmount: "Hoeveelheid", rNone: "Voeg minstens één ingrediënt toe.", editRecipe: "Bewerk recept",
  stepsTitle: "Zo maak je het", rHint: "Kies uit de producten van alle winkels. Elke week zoeken we de beste promo voor elk ingrediënt.", rSaved: "Recept bewaard" });
Object.assign(T.fr, {
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
T.fr.sorts.value = "Moins cher au kg / L";
Object.assign(T.fr, { rPick: "Ingrédients", rPickPh: "Cherchez un produit, ex. haché, pâtes, oignon", rFree: q => `Ajouter « ${q} » comme ingrédient`,
  rSteps: "Préparation (facultatif)", rAmount: "Quantité", rNone: "Ajoutez au moins un ingrédient.", editRecipe: "Modifier la recette",
  stepsTitle: "Préparation", rHint: "Choisissez parmi les produits de tous les magasins. Chaque semaine, on cherche la meilleure promo pour chaque ingrédient.", rSaved: "Recette enregistrée" });
Object.assign(T.en, {
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
T.en.sorts.value = "Cheapest per kg / L";
Object.assign(T.en, { rPick: "Ingredients", rPickPh: "Search a product, e.g. mince, pasta, onion", rFree: q => `Add “${q}” as your own ingredient`,
  rSteps: "How to make it (optional)", rAmount: "Amount", rNone: "Add at least one ingredient.", editRecipe: "Edit recipe",
  stepsTitle: "How to make it", rHint: "Pick from every store's products. Each week we find the best deal for each ingredient.", rSaved: "Recipe saved" });
const LOCALE = { nl: "nl-BE", fr: "fr-BE", en: "en-GB" };
const KIND_ORDER = ["1+1", "2+1", "multi", "2nd_half", "2nd_pct", "percent", "bundle", "price_drop", "other"];
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
};

// ---------- state ----------
const SYNCED = new Set(["list", "recipes", "have", "plan"]); // saved to the account when signed in
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
  shown: 48,
};
let DEALS = [], BRANCHES = [], PCS = {}, SAMPLE = false, UPDATED = null;
let nearest = {}; // chain -> {d, branch}

const $ = s => document.querySelector(s);
const t = () => T[S.lang] || T.nl;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = v => v == null ? "" : new Intl.NumberFormat(LOCALE[S.lang], { style: "currency", currency: "EUR" }).format(v);
const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

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
    return { ...d, id: "d" + (id >>> 0).toString(36), kind, group: kindGroup(kind), cat: d.category || "other",
      discount, until: d.valid_until ? new Date(d.valid_until) : null, hay: fold(`${d.name} ${d.brand || ""} ${d.store}`), i };
  });
}

async function getJSON(path) {
  try { const r = await fetch(path, { cache: "no-cache" }); return r.ok ? r.json() : null; } catch { return null; }
}

async function load() {
  const [deals, branches, pcs, meta] = await Promise.all([
    getJSON("data/deals.json"), getJSON("data/stores.json"), getJSON("data/postcodes.json"), getJSON("data/meta.json")]);
  let raw = deals || [];
  if (!raw.length) { raw = (await getJSON("data/sample-deals.json")) || []; SAMPLE = true; }
  DEALS = prepare(raw);
  BRANCHES = branches || [];
  PCS = pcs || {};
  UPDATED = meta?.collected_at || raw.reduce((a, d) => (d.collected_at > a ? d.collected_at : a), "") || null;
  computeNearest();
}

function haversine(a, b, c, d) {
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}
function computeNearest() {
  nearest = {};
  const p = S.pc && PCS[S.pc];
  if (!p || !BRANCHES.length) return;
  for (const b of BRANCHES) {
    const d = haversine(p[0], p[1], b.lat, b.lon);
    if (!nearest[b.chain] || d < nearest[b.chain].d) nearest[b.chain] = { d, b };
  }
}
const dist = chain => nearest[chain]?.d;
const inRadius = d => { const k = dist(d.store); return k == null || k <= S.radius; };

// ---------- filtering ----------
function matches(d, skip) {
  if (!inRadius(d)) return false;
  if (skip !== "cat" && S.cat && d.cat !== S.cat) return false;
  if (skip !== "kind" && S.kinds.size && !S.kinds.has(d.group)) return false;
  if (skip !== "chain" && S.chains.size && !S.chains.has(d.store)) return false;
  if (S.q) { for (const w of fold(S.q).split(/\s+/)) if (w && !d.hay.includes(w)) return false; }
  return true;
}
const SORTS = {
  value: (a, b) => ((a.unit && a.unit_price) ?? 1e9) - ((b.unit && b.unit_price) ?? 1e9) || a.price - b.price,
  price: (a, b) => a.price - b.price,
  discount: (a, b) => (b.discount ?? effDiscount(b)) - (a.discount ?? effDiscount(a)),
  near: (a, b) => (dist(a.store) ?? 1e9) - (dist(b.store) ?? 1e9) || SORTS.value(a, b),
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
const kmText = chain => { const d = dist(chain); return d == null ? "" : `${d < 10 ? d.toFixed(1).replace(".", S.lang === "en" ? "." : ",") : Math.round(d)} km`; };
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
      <div class="where">${sicon(d.store)}<span>${esc(d.store)}${d.pack_size ? ` · ${esc(d.pack_size)}` : ""}</span></div>
      <div class="priceline"><span class="price">${money(d.price)}</span>${d.old_price ? `<span class="old">${money(d.old_price)}</span>` : ""}</div>
      ${d.unit_price && d.unit ? `<span class="unit">${money(d.unit_price)} / ${L.perUnit[d.unit] || d.unit}</span>` : ""}
      ${save ? `<span class="save">${L.youSave(money(save))}</span>` : ""}
      <div class="foot-row"><span>${kmText(d.store)}</span>
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
  const p = S.pc && PCS[S.pc]; if (!p) return [];
  return BRANCHES.map(b => ({ b, d: haversine(p[0], p[1], b.lat, b.lon) })).filter(x => x.d <= S.radius).sort((x, y) => x.d - y.d);
}
const route = b => `https://www.openstreetmap.org/directions?to=${b.lat},${b.lon}`;
function renderNear() {
  const L = t(), box = $("#near"), p = S.pc && PCS[S.pc];
  const all = branchesNear();
  box.hidden = !all.length; if (!all.length) return;
  const withDeals = new Set(DEALS.map(d => d.store));
  const first = {}; for (const x of all) first[x.b.chain] ??= x;
  const near = Object.values(first);
  $("#nearT").textContent = L.nearT(all.length, S.radius);
  $("#nearSub").textContent = L.nearSub(near.length, `${S.pc} ${p[2]}`);
  $("#nearList").innerHTML = near.map(({ b }, i) => `<li><button type="button" class="near-go" data-near="${i}">${sicon(b.chain, "lg")}<span><b>${esc(b.name)}</b><small>${esc(b.address || b.chain)}${withDeals.has(b.chain) ? "" : ` · ${L.nearNo}`}</small></span><span class="km">${kmText(b.chain)}</span></button>
    <a class="route" href="${route(b)}" target="_blank" rel="noopener">${L.nearRoute}</a></li>`).join("");
  $("#nearList").onclick = e => { const g = e.target.closest("[data-near]"); if (g) focusBranch(near[+g.dataset.near].b); };
  const key = `${S.pc}|${S.radius}|${S.lang}|${BRANCHES.length}`;
  if (key === MAP.key) return;
  MAP.key = key;
  loadLeaflet().then(Lf => drawMap(Lf, p, all, withDeals)).catch(() => { $("#map").hidden = true; });
}
function pin(Lf, chain) {
  const c = CHAINS[chain] || { bg: "#17150F", fg: "#fff", l: chain };
  const s = c.s || c.l.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 1).toUpperCase();
  return Lf.divIcon({ className: "pin", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
    html: `<span style="background:${c.bg};color:${c.fg};${c.bd ? `box-shadow:inset 0 0 0 2px ${c.bd},0 1px 4px rgba(0,0,0,.35);` : ""}">${esc(s)}</span>` });
}
function drawMap(Lf, p, all, withDeals) {
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
  Lf.marker(home, { icon: Lf.divIcon({ className: "pin home", iconSize: [18, 18], iconAnchor: [9, 9] }), title: `${S.pc} ${p[2]}`, keyboard: false }).addTo(MAP.layer);
  for (const { b, d } of all) {
    const km = `${d < 10 ? d.toFixed(1).replace(".", S.lang === "en" ? "." : ",") : Math.round(d)} km`;
    const m = Lf.marker([b.lat, b.lon], { icon: pin(Lf, b.chain), title: b.name })
      .bindPopup(`<b>${esc(b.name)}</b><br>${esc(b.address || "")}${b.address ? "<br>" : ""}${km}${withDeals.has(b.chain) ? "" : ` · ${L.nearNo}`}<br><a href="${route(b)}" target="_blank" rel="noopener">${L.nearRoute}</a>`);
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

  const chains = [...new Set(DEALS.map(d => d.store))]
    .filter(c => chainN.get(c) || S.chains.has(c))
    .sort((a, b) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9) || a.localeCompare(b));
  $("#stores").innerHTML = `<button type="button" class="chip" data-chain="*" aria-pressed="${!S.chains.size}">${L.allStores}</button>` +
    chains.map(c => `<button type="button" class="chip" data-chain="${esc(c)}" aria-pressed="${S.chains.has(c)}">${sicon(c)}${esc(c)}${kmText(c) ? ` <span class="km">${kmText(c)}</span>` : ` <span class="n">${chainN.get(c) || 0}</span>`}</button>`).join("");

  $("#sort").innerHTML = Object.entries(L.sorts)
    .filter(([k]) => k !== "near" || Object.keys(nearest).length)
    .map(([k, v]) => `<option value="${k}"${S.sort === k ? " selected" : ""}>${v}</option>`).join("");

  const list = DEALS.filter(d => matches(d)).sort(SORTS[S.sort] || SORTS.value);
  const pcName = S.pc && PCS[S.pc] ? `${S.pc} ${PCS[S.pc][2]}` : "";
  $("#secTitle").textContent = S.q ? L.searchTitle(S.q) : (S.cat ? L.cats[S.cat] : L.secTitle);
  $("#secSub").textContent = L.secSub(list.length, Object.keys(nearest).length ? pcName : "", S.radius);
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
  document.querySelectorAll("[data-t]").forEach(el => { const v = L[el.dataset.t]; if (typeof v === "string") el.textContent = v; });
  document.querySelectorAll("[data-t-ph]").forEach(el => { el.placeholder = L[el.dataset.tPh]; el.setAttribute("aria-label", L[el.dataset.tPh]); });
  document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === S.lang));
  document.querySelectorAll("[data-t-label]").forEach(el => el.setAttribute("aria-label", L[el.dataset.tLabel]));
  renderHero();
  $("#sampleNote").hidden = !SAMPLE;
  $("#locLbl").textContent = S.pc ? `${S.pc}${PCS[S.pc] ? " " + PCS[S.pc][2] : ""} · ${S.radius} km` : L.setPc;
  $("#footUpdated").textContent = UPDATED ? L.updated(new Date(UPDATED).toLocaleString(LOCALE[S.lang], { dateStyle: "medium", timeStyle: "short" })) : "";
  $("#hero").classList.toggle("compact", !!S.pc && !url.has("hero"));
  $("#listCount").textContent = Object.keys(S.list).length;
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
  $("#trustbar").innerHTML = `<span class="icons">${chains.map(c => sicon(c, "lg")).join("")}</span><span>${L.trustbar(live.length, chains.length)}</span>
    ${avg ? `<span class="pill lime">${L.avgSave(money(avg))}</span>` : ""}`;
  $("#eyebrow").textContent = L.eyebrow(chains.length);
  $("#heroH").innerHTML = L.heroH;
  $("#heroSub").textContent = L.heroSub(chains.length, S.radius);
  $("#heroGo").textContent = L.heroGo(S.pc || ($("#heroPc").value.trim().length === 4 ? $("#heroPc").value.trim() : ""));
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
      <span style="min-width:0"><span class="nm" style="display:block">${esc(d.name)}</span><span class="st">${sicon(d.store)}${esc(d.store)}${kmText(d.store) ? ` · ${kmText(d.store)}` : ""}</span></span>
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
  const L = t(), F = L.facts, on = !!S.list[d.id], n = nearest[d.store];
  const save = d.old_price ? d.old_price - d.price : null;
  const dest = n ? `${n.b.lat},${n.b.lon}` : encodeURIComponent(`${d.store} ${S.pc || ""} Belgium`);
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
        ${n ? `<dt>${F.near}</dt><dd>${esc(n.b.address || n.b.name)} · ${kmText(d.store)}</dd>` : ""}
        ${d.pack_size ? `<dt>${F.pack}</dt><dd>${esc(d.pack_size)}</dd>` : ""}
        ${d.brand ? `<dt>${F.brand}</dt><dd>${esc(d.brand)}</dd>` : ""}
        ${d.until ? `<dt>${F.until}</dt><dd>${d.until.toLocaleDateString(LOCALE[S.lang], { weekday: "short", day: "numeric", month: "long" })}</dd>` : ""}
      </dl>
      <div class="cta">
        <button type="button" class="btn" data-add="${d.id}" aria-pressed="${on}">${plus(on)} ${on ? L.added : L.add}</button>
        <a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${dest}" target="_blank" rel="noopener">${L.directions}</a>
        ${d.source_url && !SAMPLE ? `<a class="btn ghost" href="${esc(d.source_url)}" target="_blank" rel="noopener">${L.seeStore}</a>` : ""}
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
  else { const { hay, until, i, ...keep } = d; S.list[id] = keep; toast(t().addedToast); }
  store.set("list", S.list);
  const c = $("#listCount"); c.textContent = Object.keys(S.list).length; c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  document.querySelectorAll(`[data-add="${id}"]`).forEach(b => {
    const on = !!S.list[id]; b.setAttribute("aria-pressed", on);
    b.innerHTML = b.classList.contains("btn") ? `${plus(on)} ${on ? t().added : t().add}` : plus(on);
    if (!b.classList.contains("btn")) b.setAttribute("aria-label", on ? t().added : t().add);
  });
  if (!$("#listBg").hidden) renderList();
}

function listText() {
  const L = t(), by = groupList();
  return Object.entries(by).map(([c, items]) => `${c}${kmText(c) ? ` (${kmText(c)})` : ""}\n` +
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
  const L = t(), by = groupList(), n = Object.keys(S.list).length, { total, saved } = listTotals();
  const x = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const shops = Object.entries(by).map(([c, items]) => ({ c, items,
    sum: items.reduce((a, d) => a + d.price, 0), save: items.reduce((a, d) => a + (d.old_price > d.price ? d.old_price - d.price : 0), 0) }));
  // start where you save the most; ties go to the nearest store
  const best = [...shops].sort((a, b) => b.save - a.save || b.items.length - a.items.length || (dist(a.c) ?? 1e9) - (dist(b.c) ?? 1e9))[0];
  if (best) shops.sort((a, b) => (b === best) - (a === best));
  $("#drawer").innerHTML = `
    <div class="drawer-head"><div><h3 id="listTitle">${L.listTitle}</h3>${n ? `<p>${L.listSub}</p>` : ""}</div>
      <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
    <div class="drawer-body">${n ? `
      ${shops.length > 1 || best ? `<div class="starthere">${sicon(best.c)}<div><small>${L.startHere}</small><b>${esc(best.c)}</b>
        <div class="sub">${L.ofItems(best.items.length, n)}${kmText(best.c) ? ` · ${kmText(best.c)}` : ""}</div></div>
        <div class="tot"><b>${money(best.sum)}</b>${best.save ? L.totalSave(money(best.save)) : ""}</div></div>` : ""}
      ${shops.map(s => `<section class="shop${s === best && shops.length > 1 ? " best" : ""}"><div class="shop-h">${sicon(s.c, "lg")}${esc(s.c)}
          ${kmText(s.c) ? `<span class="km">${kmText(s.c)}</span>` : ""}
          ${s === best && shops.length > 1 ? `<span class="pill lime">${L.bestStore}</span>` : ""}<span class="sum">${money(s.sum)}</span></div>
        <ul>${s.items.map(d => `<li><span>${esc(d.name)}${d.promo_text || d.pack_size ? `<span class="unit">${esc([d.pack_size, d.promo_text].filter(Boolean).join(" · "))}</span>` : ""}</span>
          <span class="p">${money(d.price)}</span>
          <button type="button" data-add="${d.id}" aria-label="${L.remove}">${x}</button></li>`).join("")}</ul></section>`).join("")}`
      : `<p class="drawer-empty">${L.listEmpty}</p>`}</div>
    ${n ? `<div class="drawer-foot">
      <div class="total"><span>${L.total}</span><b>${money(total)}</b></div>
      ${saved > 0 ? `<div class="total"><span>${L.saved}</span><span class="good">${money(saved)}</span></div>` : ""}
      <button type="button" class="btn block" id="shareList">${L.share}</button>
      <button type="button" class="btn ghost" id="clearList">${L.clearList}</button></div>` : ""}`;
}

let toastTimer;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("on"), 1800); }

// ---------- location ----------
function renderRadius(sel) {
  $("#radiusSeg").innerHTML = RADII.map(r => `<button type="button" data-r="${r}" aria-pressed="${r === sel}">${r} km</button>`).join("");
}
function setPc(pc, errEl) {
  pc = String(pc || "").trim();
  if (!PCS[pc] && Object.keys(PCS).length) { errEl.textContent = t().badPc; errEl.hidden = false; return false; }
  errEl.hidden = true; S.pc = pc; store.set("pc", pc); computeNearest(); return true;
}

// ---------- events ----------
function bind() {
  let qTimer;
  $("#q").value = S.q;
  $("#q").addEventListener("input", e => { clearTimeout(qTimer); qTimer = setTimeout(() => { S.q = e.target.value.trim(); S.shown = 48; render(); }, 120); });
  $("#searchForm").addEventListener("submit", e => { e.preventDefault(); $("#q").blur(); $("#results").scrollIntoView({ behavior: "smooth" }); });

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
    if (el.dataset.lang) { S.lang = el.dataset.lang; store.set("lang", S.lang); renderStatic(); render(); showView(); paintAccount(); return; }
    if ("soon" in el.dataset) { if (PAY()) startTrial(); else toast(t().soon); return; }
    if ("account" in el.dataset) { openAccount(); return; }
    if ("portal" in el.dataset) { openPortal(); return; }
    if ("logout" in el.dataset) { signOut(); return; }
    if (el.dataset.cat != null && el.closest("#tabs")) { S.cat = el.dataset.cat; S.shown = 48; render(); return; }
    if (el.dataset.kind) { S.kinds.has(el.dataset.kind) ? S.kinds.delete(el.dataset.kind) : S.kinds.add(el.dataset.kind); S.shown = 48; render(); return; }
    if (el.dataset.chain === "*") { S.chains.clear(); S.shown = 48; render(); return; }
    if (el.dataset.chain) { S.chains.has(el.dataset.chain) ? S.chains.delete(el.dataset.chain) : S.chains.add(el.dataset.chain); S.shown = 48; render(); return; }
    if (el.dataset.r) { document.querySelectorAll("#radiusSeg button").forEach(b => b.setAttribute("aria-pressed", b === el)); return; }
    if (el.classList.contains("card")) { openDeal(el.dataset.id); return; }
  });

  $("#sort").addEventListener("change", e => { S.sort = e.target.value; store.set("sort", S.sort); render(); });
  $("#clearAll").addEventListener("click", () => { S.q = ""; $("#q").value = ""; S.cat = ""; S.kinds.clear(); S.chains.clear(); render(); });
  $("#moreBtn").addEventListener("click", () => { S.shown += 48; render(); });

  $("#heroForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!setPc($("#heroPc").value, $("#heroErr"))) return;
    renderStatic(); render(); $("#results").scrollIntoView({ behavior: "smooth" });
  });
  $("#locBtn").addEventListener("click", () => { $("#locPc").value = S.pc || ""; $("#locErr").hidden = true; renderRadius(S.radius); openDialog($("#locDlg"), $("#locPc")); });
  $("#locForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!setPc($("#locPc").value, $("#locErr"))) return;
    const r = +($("#radiusSeg [aria-pressed=true]")?.dataset.r || S.radius); S.radius = r; store.set("radius", r);
    computeNearest(); closeDialogs(); renderStatic(); render();
  });
  $("#listBtn").addEventListener("click", () => { renderList(); openDialog($("#listBg"), $("#drawer .x")); });
  $("#drawer").addEventListener("click", async e => {
    if (e.target.closest("#clearList")) { S.list = {}; store.set("list", S.list); $("#listCount").textContent = 0; renderList(); render(); }
    if (e.target.closest("#shareList")) {
      const text = listText();
      try { await navigator.share({ title: t().listTitle, text }); return; } catch (err) { if (err?.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(text); toast(t().copied); } catch { /* no clipboard either */ }
    }
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
  plan: new Set(store.get("plan", [])),     // recipe ids planned this week
};
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
  const key = ing.k.join("|") + "#" + (ing.c || "") + "#" + S.pc + S.radius;
  if (matchCache.has(key)) return matchCache.get(key);
  const ks = ing.k.map(fold);
  const d = DEALS.filter(x => inRadius(x) && (!ing.c || x.cat === ing.c) && ks.some(k => wordStart(x.hay, k)))
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
    if (!hasIt(r, i)) { buy++; if (d) { cost += d.price; deals.push(d); } }
  });
  return { promo, buy, cost, deals };
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
  const planned = list.filter(x => R.plan.has(x.r.id));
  if (!planned.length) { $("#plan").innerHTML = ""; return; }
  const deals = new Map();
  for (const { st } of planned) for (const d of st.deals) deals.set(d.id, d);
  const est = [...deals.values()].reduce((a, d) => a + d.price, 0);
  $("#plan").innerHTML = `<div class="plan-in">
    <div><h3>${L.planTitle}</h3><p>${L.planSum(planned.length, deals.size, money(est))}</p>
      <div class="plan-chips">${planned.map(({ r }) => `<button type="button" class="chip" data-recipe="${esc(r.id)}">${esc(rTitle(r))}</button>`).join("")}</div></div>
    <button type="button" class="btn" data-planadd ${deals.size ? "" : "disabled"}>${L.planAdd}</button></div>`;
}

function openRecipe(id, keepFocus) {
  const r = allRecipes().find(x => x.id === id); if (!r) return;
  const L = t(), on = R.plan.has(r.id);
  matchCache.clear();
  const st = recipeStats(r);
  $("#sheet").innerHTML = `
    <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <div class="rsheet">
      <p class="rtop"><span>${r.own ? L.mine : [r.serves && L.persons(r.serves), r.min && L.minutes(r.min)].filter(Boolean).join(" · ")}</span></p>
      <h2 id="sheetTitle">${esc(rTitle(r))}</h2>
      <p class="rmeta">${L.onPromo(st.promo, r.i.length)}${st.cost ? ` · ${L.toBuy(st.buy)} ≈ <b>${money(st.cost)}</b>` : ""}</p>
      <ul class="ings">${r.i.map((ing, i) => {
        const have = hasIt(r, i), d = bestDeal(ing), inList = d && S.list[d.id];
        return `<li class="${have ? "had" : ""}">
          <label class="have"><input type="checkbox" data-have="${esc(r.id)}|${i}" ${have ? "checked" : ""}><span>${L.haveIt}</span></label>
          <div class="iname"><b>${esc(iName(ing))}</b>${ing.a ? ` <span class="unit">${esc(ing.a)}</span>` : ""}</div>
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
  $("#listCount").textContent = Object.keys(S.list).length;
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

function renderPricing() {
  const L = t(), c = new Set(DEALS.map(d => d.store)).size;
  const li = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  $("#pricing").innerHTML = `<h2>${L.prTitle}</h2><p>${L.prSub(c, S.radius)}</p>
    <div class="plans">
      <div class="plancard"><h3>${L.free}</h3><p>${L.freeSub}</p><div class="amount">${money(0).replace(/[.,]00/, "")}</div>${li(L.freeList(c))}
        <a class="btn ghost block" href="#deals">${L.freeBtn}</a></div>
      <div class="plancard plus"><span class="pill">${L.trialBadge}</span><h3>${L.plus}</h3><p>${L.plusSub}</p>
        <div class="amount">${money(4.99)} <small>${L.perMonth}</small></div>${li(L.plusList(c))}
        <button type="button" class="btn block" data-soon>${L.trial}</button><p class="fine">${L.trialNote}</p></div>
    </div>`;
}
function showView() {
  if (location.hash === "#account") { history.replaceState(null, "", location.pathname + location.search); openAccount(); }
  const v = location.hash === "#recipes" ? "recipes" : location.hash === "#pricing" ? "pricing" : "deals";
  $("#viewDeals").hidden = v !== "deals";
  $("#viewRecipes").hidden = v !== "recipes";
  $("#viewPricing").hidden = v !== "pricing";
  document.querySelectorAll("[data-view]").forEach(a => a.setAttribute("aria-current", a.dataset.view === v ? "page" : "false"));
  if (v === "recipes") renderRecipes();
  if (v === "pricing") renderPricing();
}

function bindRecipes() {
  window.addEventListener("hashchange", () => { showView(); window.scrollTo(0, 0); });
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-recipe],[data-plan],[data-addmissing],[data-planadd],[data-delrecipe],[data-editrecipe]"); if (!el) return;
    if (el.dataset.plan) {
      e.stopPropagation();
      if (!R.plan.has(el.dataset.plan) && !allowed("plan")) return;
      R.plan.has(el.dataset.plan) ? R.plan.delete(el.dataset.plan) : R.plan.add(el.dataset.plan);
      store.set("plan", [...R.plan]); renderRecipes();
      if (!$("#sheetBg").hidden && el.closest("#sheet")) openRecipe(el.dataset.plan);
    } else if (el.dataset.addmissing) {
      const r = allRecipes().find(x => x.id === el.dataset.addmissing); addDeals(recipeStats(r).deals); openRecipe(r.id); renderRecipes();
    } else if ("planadd" in el.dataset) {
      addDeals(allRecipes().filter(r => R.plan.has(r.id)).flatMap(r => recipeStats(r).deals)); renderRecipes();
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
const ACC = { on: !!(CFG.supabaseUrl && CFG.supabaseAnonKey), sb: null, user: null, profile: null, pulling: false };
const PAY = () => ACC.on && CFG.payments === true;  // Plus is only sold (and locked) once Stripe is connected
const isPlus = () => ["trialing", "active"].includes(ACC.profile?.subscription_status);
// Free: every deal, my list, one own recipe. Plus: unlimited recipes and the weekly plan.
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
  if (url.has("paid")) { await refreshProfile(); openAccount(); }  // back from Stripe checkout
}
async function setUser(user) {
  if ((user?.id || null) === (ACC.user?.id || null) && ACC.profile) return;
  ACC.user = user; ACC.profile = null;
  if (user) { await refreshProfile(); await pull(); }
  paintAccount();
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
  store.set("list", S.list); store.set("recipes", R.own); store.set("have", R.have); store.set("plan", [...R.plan]);
  ACC.pulling = false;
  $("#listCount").textContent = Object.keys(S.list).length;
  render(); if (location.hash === "#recipes") renderRecipes();
  push();
}
let syncTimer;
function queueSync() { if (!ACC.user || ACC.pulling) return; clearTimeout(syncTimer); syncTimer = setTimeout(push, 800); }
async function push() {
  if (!ACC.user) return;
  await ACC.sb.from("user_data").upsert({ user_id: ACC.user.id, list: S.list, recipes: R.own, have: R.have, plan: [...R.plan], updated_at: new Date().toISOString() });
}
async function callFn(name) {
  const { data, error } = await ACC.sb.functions.invoke(name, { body: {} });
  if (error || !data?.url) { toast(t().accErr); return; }
  location.href = data.url;
}
function startTrial() { if (!ACC.user) { openAccount("trial"); return; } toast(t().accRedirect); callFn("create-checkout"); }
function openPortal() { toast(t().accRedirect); callFn("customer-portal"); }
async function signOut() { await ACC.sb.auth.signOut(); closeDialogs(); toast(t().accOut); }
function paintAccount() {
  const b = $("#accBtn"); if (!b) return;
  b.classList.toggle("in", !!ACC.user);
  $("#accLbl").textContent = ACC.user ? "" : t().accSignIn;   // signed out: say "Inloggen" next to the icon so it is easy to find
  b.setAttribute("aria-label", ACC.user ? t().accTitle : t().accSignIn);
  if (!$("#accDlg").hidden) openAccount(ACC.why);
}
function planLine() {
  const L = t(), p = ACC.profile || {}, d = x => x ? new Date(x).toLocaleDateString(LOCALE[S.lang], { day: "numeric", month: "long" }) : "";
  if (p.subscription_status === "trialing") return L.accTrial(d(p.trial_end));
  if (p.subscription_status === "active") return p.cancel_at_period_end ? L.accEnds(d(p.current_period_end)) : L.accActive(d(p.current_period_end));
  if (p.subscription_status === "past_due") return L.accPastDue;
  return L.accFree;
}
function openAccount(why) {
  const L = t(); ACC.why = why;
  const box = $("#accBox");
  const upsell = why && why !== "trial" ? `<p class="upsell">${L.accNeed[why] || ""}</p>` : "";
  if (!ACC.user) {
    box.innerHTML = `<h3 id="accTitle">${L.accSignIn}</h3>${upsell}<p class="muted">${L.accWhy}</p>
      <form id="accForm" class="acc-form"><label class="field"><span>${L.accEmail}</span><input id="accEmail" type="email" required autocomplete="email" inputmode="email"></label>
      <button class="btn block" type="submit">${L.accSend}</button></form>
      <p class="muted small" id="accSent" hidden></p>
      <div class="pop-actions"><button type="button" class="btn ghost" data-close>${L.close}</button></div>`;
    $("#accForm").addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#accEmail").value.trim();
      const { error } = await ACC.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname + (why === "trial" ? "#pricing" : "") } });
      const sent = $("#accSent"); if (sent) { sent.textContent = error ? L.accErr : L.accSent(email); sent.hidden = false; }
    });
  } else {
    box.innerHTML = `<h3 id="accTitle">${L.accTitle}</h3>${upsell}
      <dl class="facts"><dt>${L.accEmail}</dt><dd>${esc(ACC.user.email)}</dd><dt>${L.accPlan}</dt><dd>${esc(planLine())}</dd></dl>
      <div class="cta">${!PAY() ? "" : isPlus() || ACC.profile?.subscription_status === "past_due"
        ? `<button type="button" class="btn" data-portal>${L.accManage}</button>`
        : `<button type="button" class="btn" data-soon>${ACC.profile?.trial_end ? L.accSubscribe : L.trial}</button>`}
        <button type="button" class="btn ghost" data-logout>${L.accLogout}</button></div>
      <p class="muted small">${L.accSynced}</p>`;
  }
  if ($("#accDlg").hidden) openDialog($("#accDlg"));
}

// ---------- start ----------
bind();
bindRecipes();
load().then(() => { renderStatic(); render(); showView(); initAccounts(); });
})();
