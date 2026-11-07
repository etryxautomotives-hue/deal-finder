/* deal'ke product types: what a product IS, not just which words are in its name.
   "Santa Maria Kruiden, Kip" is a spice mix (that contains chicken), "Kipfiletreepjes" is chicken,
   "Kattenvoeding, Kip" is cat food. Search uses this so "kip" shows real chicken first and the rest after it.
   Runs in the browser (window.DKConcepts) and in Node for tests. No server, no AI: a word list and a few rules.

   Each line below: id | parent | aisle | flags | words (Dutch, French, English, folded to plain lowercase).
   - parent: "vis" finds zalm, "vlees" finds kip. The aisle comes from the closest ancestor that has one.
   - flags: 3 = not food for people (cleaning, care, pet food): it is the type wherever it appears in the name.
            2 = a dish or form that wins even from a later part of the name ("Kip, Thai, Bouillon" is bouillon).
            f = a form (sauce, soup, chips, juice...): it beats a plain food named in the same breath ("kaassaus").
            v = a marker that turns meat into a meat substitute ("Just like chicken, Vegan").
   - words: the ones before ":" name the idea itself in each language (a search for "kaas", "fromage" or "cheese"
     finds every cheese); the ones after it are kinds ("gouda") that only find products with that word.
     "a_b" is a phrase, "=w" must be the whole word, "^w" must start a word. Words of 2 letters must be
     whole, of 3 letters must start or end a word ("kip" in "kipfilet" and "hoevekip", not "ham" in "champignon"),
     longer words may sit anywhere in a compound ("scharrelkipfiletblokjes"). When matches overlap, the longest wins
     ("pommes de terre" is potato, not apple). */
(function (root) {
  const RAW = `
meat||meat_fish||vlees =viande =viandes meat
poultry|meat|||gevogelte volaille poultry
chicken|poultry|||kip kippen poulet poulets chicken : kipfilet kippenbout kippenbouten hoevekip pilons cuisses aiguillettes aiguilettes nuggets cordon_bleu kippenhaasjes =pouley
turkey|poultry|||kalkoen dinde turkey
duck|poultry|||eend canard
beef|meat|||rund runds rundvlees rundsvlees boeuf beef : chateaubriand contrefilet biefstuk steak entrecote stoofvlees carbonnade ribeye rosbief roastbeef
veal|meat|||kalfs kalfsvlees veau
pork|meat|||varken varkens varkensvlees porc pork : spareribs ribbetjes varkenshaasje filet_mignon schouder =cotelette kotelet koteletten
lamb|meat|||=lam lams lamsvlees agneau lamb
minced|meat|||gehakt hache =haches hachis steak_hache mince : balletjes gehaktballetjes boulettes burger burgers hamburger hamburgers kaasburger frikandel =oiseaux_sans_tete vogeltjes_zonder_kop viandelles poulycroc
game|meat|||: wild wildpate hert =ree everzwijn konijn lapin
sausage|meat|||worst worsten worstjes saucisse saucisses : chipolata knacki fuet saucisson merguez bratwurst braadworst cervela =bifi
cold_cuts|meat|||charcuterie vleeswaren beleg : salami pate rillette rillettes kipwit gebraad =filet_de_saxe americain prepare mortadella chorizo pancetta =lomo cacciatore
ham|cold_cuts|||ham =hesp jambon : beenham serrano jamon prosciutto
bacon|cold_cuts|||spek =lard lardons bacon
fish||meat_fish||vis =poisson poissons fish : vissticks visstick fish_sticks kibbeling
salmon|fish|||zalm saumon salmon
cod|fish|||fletan heilbot kabeljauw cabillaud =cod : koolvis lieu pangasius tilapia witvis
tuna|fish|||tonijn =thon tuna
trout|fish|||forel truite
mackerel|fish|||makreel maquereau : haring hareng sardine sardines ansjovis anchois
seafood|fish|||zeevruchten fruits_de_mer seafood : garnaal garnalen grijze_garnalen crevette crevettes scampi scampis shrimp mosselen moules mussels inktvis calamar calamars surimi oesters huitres
meat_sub||meat_fish||vegaburger : falafel tofu tempeh seitan quorn vleesvervanger
veggie_mark|||v|=plant vegan vegetarisch vegetarische veggie vegetarien vegetarienne vegetarian vegetal plantaardig plantaardige just_like vemondo greenway garden_gourmet
dairy||dairy||zuivel laitier laitiers
milk|dairy|||melk =lait milk : halfvolle volle_melk magere_melk karnemelk babeurre
cheese|dairy|||kaas kazen fromage fromages cheese : gouda emmental emmentaler =brie camembert mozzarella parmezaan parmigiano parmesan grana_padano feta cheddar mascarpone ricotta comte raclette gruyere maasdam edam smeerkaas geitenkaas chevre roquefort morbier reblochon herve passendale mimolette boursin philadelphia burrata halloumi oudendijk old_amsterdam saint_paulin queso brugge_jong =postel mi-vieux coeur_de_lion violife =clemont pere_joseph
yoghurt|dairy|||yoghurt yogurt yaourt yaourts : skyr kwark platte_kaas fromage_blanc fromage_frais danio activia
butter|dairy|||boter roomboter beurre butter =becel
cream|dairy|||=room : slagroom kookroom creme_fraiche =creme_fraiche =creme_liquide alternatief_voor_room creme_entiere
egg|dairy|||=ei eieren eitjes =oeuf =oeufs =egg eggs
dessert|dairy||f|semoule pudding dessert desserts : mousse rijstpap tiramisu creme_brulee panna_cotta flan
plant_drink|dairy|||sojadrink haverdrink amandeldrink rijstdrink : alpro oatly =soja boisson_vegetale
bread||bread||brood broden =pain pains bread : baguette stokbrood pistolet pistolets sandwich sandwiches toast boterham ciabatta =bagel bagels meergranenbrood volkorenbrood grilletine
pastry|bread|||croissant croissants : koffiekoek koffiekoeken viennoiserie pain_au_chocolat pastel_de_nata eclair eclairs cake cakes taart taartje tarte gateau =gateaux brownie brownies muffin muffins donut donuts wafel wafels gaufre gaufres panettone stollen kerststol paniers_feuilletes feuilletes bladerdeeg pasteitjes bouchees =pitch
wrap|bread|||wrap wraps tortilla tortillas : pita naan
fruit||fruit_veg||fruit =fruits granaatappel grenade kokosnoot kokosnoten kaki persimon
apple|fruit|||appel appels =pomme =pommes apple apples : kanzi jonagold jazz_appel pink_lady elstar
pear|fruit|||peer peren poire poires conference
banana|fruit|||banaan bananen banane bananes banana bananas
orange|fruit|||sinaasappel sinaasappelen appelsien appelsienen : =orange =oranges
mandarin|fruit|||mandarijn mandarijnen mandarine mandarines : clementine clementines nectarine
lemon|fruit|||citroen citroenen =citron citrons =lemon : limoen limoenen =citron_vert lime pompelmoes pamplemousse
grape|fruit|||druif druiven =raisin =raisins grapes
strawberry|fruit|||aardbei aardbeien fraise fraises strawberry strawberries
berry|fruit|||bessen : framboos frambozen framboise framboises blauwe_bes blauwe_bessen bosbessen myrtille myrtilles blueberries
kiwi|fruit|||kiwi kiwis
mango|fruit|||mango mangos mangue mangues
pineapple|fruit|||ananas pineapple
melon|fruit|||meloen meloenen melon watermeloen pasteque
stone_fruit|fruit|||perzik perziken peche peches : pruim pruimen prune prunes kers kersen cerise cerises abrikoos abrikozen abricot abricots krieken dadels
avocado|fruit|||avocado avocados avocats
veg||fruit_veg||groente groenten =legume =legumes vegetables : soepgroenten groentemix wokgroenten roerbakgroenten asperges schorseneren
potato|veg|||aardappel aardappelen aardappels pommes_de_terre pomme_de_terre =patat =patates potatoes : krieltjes grenailles
tomato|veg|||pelati cubettata tomaat tomaten tomate tomates tomato tomatoes : kerstomaat kerstomaten pomodorini cherrytomaten
cucumber|veg|||komkommer komkommers concombre cucumber
pepper|veg|||paprika paprikas poivron poivrons bell_pepper
onion|veg|||ajuin ajuinen =ui uien =oignon oignons onion onions : sjalot sjalotten echalote echalotes =lente-ui
carrot|veg|||wortel wortelen wortels worteltjes carotte carottes carrot carrots
broccoli|veg|||broccoli brocoli
cauliflower|veg|||bloemkool chou-fleur chou_fleur cauliflower
cabbage|veg|||=kool : spruitjes savooi rodekool witte_kool =chou =choux choux_de_bruxelles zuurkool wijnzuurkool choucroute spruiten koolsla
spinach|veg|||spinazie epinard epinards spinach
lettuce|veg|||=sla slaatje kropsla ijsbergsla : rucola veldsla =salade_verte laitue mache lettuce
endive|veg|||witloof chicon chicons endive endives
leek|veg|||prei preien poireau poireaux
mushroom|veg|||champignon champignons paddenstoelen mushrooms oesterzwammen
zucchini|veg|||courgette courgettes zucchini : aubergine aubergines
green_beans|veg|||sperziebonen boontjes haricots_verts prinsessenbonen
peas|veg|||erwten erwtjes petits_pois doperwten
corn|veg|||=mais suikermais
garlic|veg|||knoflook =ail garlic
beet|veg|||biet bieten rode_biet betterave betteraves
fresh_herbs|veg|||: basilicum peterselie bieslook koriander munt persil ciboulette basilic
fries||pantry|f|frieten friet frietjes =frites pommes_frites groentenfrieten : kroketten kroket croquettes_de_pommes aardappelpartjes wedges rosti
pasta||pantry||pasta =pates : spaghetti penne tagliatelle macaroni fusilli farfalle lasagne lasagnes tortellini tortelloni ravioli gnocchi noedels nouilles noodles mie vermicelli =carbonara
rice||pantry||rijst =riz rice : basmati jasmijnrijst risotto
grains||pantry||: couscous bulgur quinoa havermout flocons_d_avoine
flour||pantry||bloem =meel =farine flour : bakpoeder paneermeel
sugar||pantry||suiker =sucre
oil||pantry||olie =huile huiles =oil : olijfolie zonnebloemolie frituurvet azijn vinaigre
sauce||pantry|f|saus sauzen =sauce =sauces : ketchup mayonaise mayonnaise =mayo mosterd moutarde pesto passata tomatensaus sojasaus dressing vinaigrette bearnaise andalouse samurai pickles tafelsaus tartaar
soup||pantry|2f|soep soepen =soupe =soupes potage veloute soup
stock||pantry|2f|bouillon bouillons =fond fonds bouillonblokjes : =cubes
spices||pantry|f|kruiden kruidenmix kruidenmolen specerijen epices =epice : zout =sel =poivre peper peperkorrels nootmuskaat kaneel cannelle seasoning paprikapoeder currypoeder zoutmolen =herbes
legumes||pantry||bonen =haricots linzen lentilles : kikkererwten pois_chiches kidneybonen witte_bonen
cereal||pantry|f|ontbijtgranen =cereales cereals : granola muesli cornflakes havervlokken brinta graanontbijt
spread||pantry|f|: confituur confiture =jam jams honing =miel honey pindakaas peanut_butter speculoospasta =choco chocopasta nutella pate_a_tartiner
coffee||drinks|f|koffie =cafe coffee latte macchiato =starbucks =cafe coffee : espresso cappuccino capsules =caps =pods dolce_gusto nespresso senseo
tea||drinks|f|thee =the_vert infusion =tea : kruidenthee
ready_meal||pantry|2f|maaltijdbox maaltijd maaltijden =plat_prepare plats_prepares kant-en-klaar ready_to_heat : lasagne_bolognese =croque =croques quiche quiches vol-au-vent stoemp hachis_parmentier paella hutsepot stoverij stoofpotje bowl salad_bowl sin_carne =bami =nasi nasi_goreng pierrade fondue
pizza||pantry|2f|pizza pizzas flammkuchen
snacks||snacks|f|snack snacks tussendoortje : aperitief =apero
chips||snacks|2f|chips crisps : =pringles tortillachips nachos popcorn zoute_stokjes =bretzels =lays =lay
chocolate||snacks|f|chocolade chocolat chocolate =choc : pralines praline bonbons_de_chocolat chocoladereep toblerone =leonidas =cote_d_or =milka minibouchees =delichoc knoppers =kinder mon_cheri
biscuits||snacks|f|=sultana koekjes koekje =koek koeken biscuit biscuits cookies cookie : speculoos speculaas sintspeculoos peperkoek crackers =biscoff =lu =delacre petit_beurre
candy||snacks|f|snoep snoepjes snoepmix bonbons =bonbon candy : raffaello winegums spekken marshmallow guimauve drop dropjes kauwgom lolly lollies chupa haribo sinterklaas sinterklaasstaf sinterklaaskoffertje mijter adventskalender calendrier_de_l_avent dragees
nuts||snacks|f|noten =noix nuts : pinda pindas cacahuetes cashew amandelen amandes pistache hazelnoten noisettes walnoten
icecream||snacks|f|=ijs ijsjes roomijs =glace =glaces ice_cream : =magnum ijsboerke =icy cornetto =ola
bars||snacks|f|repen =reep mueslireep =barres
drinks||drinks||dranken drank =boisson =boissons
water|drinks|||water =eau : mineraalwater spuitwater bruisend_water eau_minerale =spa chaudfontaine evian =vittel
soda|drinks||f|frisdrank frisdranken =soda zero_sugar =oasis : ^cola coca-cola limonade fruitlimonade tonic sprite fanta =ice_tea ijsthee bruisende_ijsthee schweppes =pepsi kombucha =kidibul lemonade arancia limonata capri-sun =mate
juice|drinks||f|=sap sappen =jus fruitsap : appelsap sinaasappelsap jus_d_orange juice smoothie smoothies
beer|drinks|||bier bieren =biere =bieres beer : pils pilsener abdijbier tripel =blond =kriek =geuze leffe duvel jupiler stella_artois karmeliet westmalle grimbergen fruitbier =maes =ale
wine|drinks|||wijn wijnen =vin =vins wine : rode_wijn witte_wijn =rose cava prosecco champagne cremant chardonnay sauvignon merlot cabernet tempranillo malbec pinot =cotes_du_rhone bordeaux bourgogne saint-emilion saint_emilion bergerac =aop =aoc =doc chateau gigondas beaujolais glühwein gluhwein =porto tavel vinsobres luberon clairette sparkling =crimes 
spirits|drinks|||: jenever graanjenever bessenjenever vodka whisky =whiskey =rhum =rum =gin likeur liqueur cognac =calvados aperol tequila tequilla amaretto bacardi eristoff =ricard premix mojito
sports_drink|drinks||f|energiedrank energy_drink : =red_bull =monster isostar sportdrank sport_drink elektrolyten
chocmilk|drinks||f|=fristi chocolademelk chocomelk chocomel : =cecemel lait_chocolate
supplements||other|3|proteinepoeder proteine eiwitshake eiwitshakes eiwitrepen : creatine collageen pre-workout koolhydraatgel vitamine vitamines vitamines_c supplement maaltijdvervanger maaltijddrank drinkmaaltijd spirulina spiruline magnesium zinktabletten matcha matchapoeder psyllium dextro =barre
baby||household|3|luiers luierbroekjes langes babydoekjes : =pampers babyvoeding flesvoeding
pet||household|3|hondenbrokken kattenbrokken =kitten =puppy royal_canin gourmet_gold dierenvoeding cat_food dog_food pet_food nourriture_pour_chat nourriture_pour_chien kattenvoeding kattenvoer hondenvoeding hondenvoer : kattenbak kattensnoepjes =croquettes_pour =nourriture_chat =nourriture_chien =chat =chien =kat =hond =sheba =whiskas =felix =friskies =purina =pedigree =cesar =perfect_fit =catsan =vitakraft
cleaning||household|3|schoonmaak nettoyage cleaning : =carolin kalkaanslag =silan =dreft =lenor reiniger reinigingsmiddel allesreiniger allesreinigerspray nettoyant toiletreiniger schoonmaak ontkalker javel bleekwater sponzen schuursponzen sponsdoek =vileda microvezel microfibres vuilniszakken handschoenen =sanytol wasparfum ontstopper stijfsel bleekpoeder ontvlekker ontvetter anti_mug bloc_wc venster wc_net
laundry|cleaning||3|wasmiddel lessive detergent laundry : wasverzachter adoucissant =dash =ariel =dixan wasparfum vlekverwijderaar
dishes|cleaning||3|afwasmiddel vaatwas vaisselle : vaatwascapsules vaatwastabletten liquide_vaisselle
paper||household|3|toiletpapier wc-papier papier_toilette : keukenrol essuie-tout zakdoeken mouchoirs =tissues
care||household|3|: shampoo conditioner douchegel =douche gel_douche zeep =savon deo deodorant deospray tandpasta dentifrice tandenborstel opzetborsteltjes mondspoeling dagcreme nachtcreme gezichtscreme handcreme bodymelk bodylotion lotion =nivea =dove =elseve =ultra_doux =loreal =l_oreal haarkleuring =garnier scheerschuim scheermesjes =gillette after_shave make-up remover micellair ontschminkschijfjes ontschminkingsschijfjes reinigingsdoekjes =bodyspray =borotalco =atrix =oral-b =oral_b =sun_protect zonnecreme maandverbanden maandverband verbanden inlegkruisjes =tampons tampax =always urineverlies pleisters hansaplast =elmex labello zwitsal corega demak schuimbad zalf mesjes =wilkinson
`;
  const fold = s => String(s || "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`´]/g, " ");
  const C = {};        // id -> { id, parent, aisle, strong, override, form, marker }
  const WORDS = [];    // { w, c, mode }  mode: "=" whole, "^" start, "" by length
  for (const line of RAW.trim().split("\n")) {
    const [id, parent, aisle, flags, words] = line.split("|");
    C[id] = { id, parent: parent || null, aisle: aisle || null, strong: flags.includes("3"), override: flags.includes("2"),
      form: flags.includes("f") || flags.includes("2"), marker: flags.includes("v") };
    let specific = false;
    for (let w of words.split(/\s+/).filter(Boolean)) {
      if (w === ":") { specific = true; continue; }
      const mode = w[0] === "=" || w[0] === "^" ? w[0] : ""; if (mode) w = w.slice(1);
      WORDS.push({ w: fold(w).replace(/_/g, " "), c: id, mode, specific });
    }
  }
  for (const c of Object.values(C)) { let a = c; while (a && !a.aisle) a = C[a.parent]; c.aisle = a ? a.aisle : "other"; }
  WORDS.sort((a, b) => b.w.length - a.w.length);
  // speed: only try the words whose first three letters occur in the name (about 30 instead of 1,000)
  const BY3 = new Map(), SHORT = [];
  for (const e of WORDS) { if (e.w.length < 3) { SHORT.push(e); continue; } const k = e.w.slice(0, 3); if (!BY3.has(k)) BY3.set(k, []); BY3.get(k).push(e); }
  // is c the same as anc, or below it ("salmon" is under "fish")?
  const isA = (c, anc) => { for (let x = C[c]; x; x = C[x.parent]) if (x.id === anc) return true; return false; };
  const isFood = c => !!c && !C[c].strong;

  // where each word ends and which part of the name it sits in: "Brand Product, variant - variant" and
  // "Filet de poulet" / "Kaasburger met spek" (the part before the preposition is the product)
  const SEG = /\s*(?:,|\s-\s|\||\/|;|\(|\))\s*/g;
  const PREP = /\s(?:met|in|op|voor|van|en|with|and|de|du|des|d|au|aux|a la|a l|avec|pour|sur|&|\+)\s/g;
  function findAll(text) {
    const toks = []; text.replace(/[a-z0-9-]+/g, (t, at) => { toks.push([at, at + t.length]); return t; });
    const tokAt = new Map(); toks.forEach(([s, e], i) => { for (let k = s; k < e; k++) tokAt.set(k, i); });
    const hits = [], cand = new Set();
    for (let i = 0; i + 2 < text.length; i++) { const l = BY3.get(text.slice(i, i + 3)); if (l) for (const e of l) cand.add(e); }
    for (const e of SHORT) cand.add(e);
    for (const { w, c, mode } of cand) {
      for (let at = text.indexOf(w); at !== -1; at = text.indexOf(w, at + 1)) {
        const end = at + w.length, ti = tokAt.get(at), tj = tokAt.get(end - 1);
        if (ti == null || tj == null) continue;
        const startsTok = toks[ti][0] === at || text[at - 1] === "-", endsTok = toks[tj][1] === end || text[end] === "-";   // "vanille-ijs"
        if (w.includes(" ")) { if (!startsTok || !endsTok) continue; }
        else if (mode === "=" || w.length <= 2) { if (!startsTok || !endsTok) continue; }
        else if (mode === "^") { if (!startsTok) continue; }
        else if (w.length === 3) { if (!startsTok && !endsTok) continue; }
        hits.push({ c, s: at, e: end });
      }
    }
    // longest first; drop matches overlapping a longer one
    hits.sort((a, b) => (b.e - b.s) - (a.e - a.s) || a.s - b.s);
    const keep = [];
    for (const h of hits) if (!keep.some(k => h.s < k.e && k.s < h.e)) keep.push(h);
    return keep.sort((a, b) => a.s - b.s);
  }
  const cuts = (text, re) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(text))) out.push(m.index); return out; };

  // The product's type and everything it contains. lang "fr" reads the first food of a phrase ("filet de poulet",
  // "sauce tomate"); Dutch the last ("halfvolle melk", "kipkruiden").
  function analyse(name, brand, lang) {
    let text = fold(name).replace(/\s+/g, " ").trim();
    const b = fold(brand).trim();
    let hits = [];
    let brandForm = null;
    if (b && b.length > 2 && text.startsWith(b + " ")) {         // "Poulet de Wallonie Pilons de pouley": skip the brand
      const rest = findAll(text.slice(b.length + 1));
      if (rest.some(h => !C[h.c].marker)) {
        brandForm = findAll(b).find(h => C[h.c].form && !C[h.c].marker);   // "Côte d'Or Mini bouchée - Au lait" is chocolate
        text = text.slice(b.length + 1); hits = rest;
      }
    }
    const full = findAll(fold(name).replace(/\s+/g, " ").trim());
    if (!hits.length) hits = full;
    else for (const h of full) if (C[h.c].strong && !hits.some(x => x.c === h.c)) hits.push({ ...h, s: -1, e: -1 });   // "Sheba Snack": the brand says pet food
    const all = new Set(hits.map(h => h.c));
    const food = hits.filter(h => !C[h.c].marker);
    let type = null;
    const strong = food.find(h => C[h.c].strong);
    if (strong) type = strong.c;
    else if (food.length) {
      const segCuts = cuts(text, SEG), partCuts = [...segCuts, ...cuts(text, PREP)];
      const idx = (list, s) => list.filter(x => x < s).length;
      const seg0 = Math.min(...food.map(h => idx(segCuts, h.s)));
      const inSeg = food.filter(h => idx(segCuts, h.s) === seg0);
      const part0 = Math.min(...inSeg.map(h => idx(partCuts, h.s)));
      const inPart = inSeg.filter(h => idx(partCuts, h.s) === part0);
      const forms = inPart.filter(h => C[h.c].form);
      let pick = forms.length === 1 ? forms[0] : (lang === "fr" ? inPart[0] : inPart[inPart.length - 1]);
      const finer = inPart.find(h => h.c !== pick.c && isA(h.c, pick.c));          // "rundsvlees": beef, not just meat
      if (finer) pick = finer;
      if (pick.c === "minced") { const f = inPart.find(h => isA(h.c, "fish")); if (f) pick = f; }   // "visburgers" are fish
      type = pick.c;
      // "Brothway Kip, Thai, Bouillon": a soup, stock, pizza, chips or meal named later still wins over a plain food
      if (!C[type].form) { const o = food.find(h => C[h.c].override && h.c !== type); if (o) type = o.c; }
      if (brandForm && !C[type].form) type = brandForm.c;
      if (isA(type, "meat") || isA(type, "fish")) if (hits.some(h => C[h.c].marker)) type = "meat_sub";
    }
    if (!type && /\b(19|20)\d\d\b/.test(text) && !/\d\s?(g|kg|ml|cl|l)\b/.test(text)) type = "wine";   // "Bergerac, 2022"
    if (brandForm) all.add(brandForm.c);
    if (type) all.add(type);
    // cat food with salmon or shampoo with avocado: not food for people, so it is only its type
    const kept = type && C[type].strong ? [type] : [...all].filter(c => !C[c].marker);
    const marks = type && C[type].strong ? [] : [...new Set(hits.filter(h => C[h.c].marker).map(h => h.c))];   // "vegan"
    return { type, all: kept, marks, aisle: type ? C[type].aisle : null };
  }
  // edit distance between two whole words, a swap of two letters counts as one
  function lev(a, b) {
    const m = a.length, n = b.length, D = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) D[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) D[i][j] = Math.min(D[i][j], D[i - 2][j - 2] + 1);
    }
    return D[m][n];
  }
  // The concepts one query word stands for: exact words, compounds ("kipkruiden") and the same word with a typo
  function conceptsOfWord(w, editIn) {
    const x = fold(w).trim(); if (!x) return [];
    const same = WORDS.filter(e => e.w === x);
    if (same.length) return [...new Set(same.filter(e => !e.specific).map(e => e.c))];   // "gouda": just the word, see kindOf
    const a = analyse(x, "", "nl"); if (a.type) return [a.type];
    if (editIn && x.length >= 4) {
      const k = x.length >= 8 ? 2 : 1, near = new Map();
      for (const e of WORDS) if (!e.specific && !e.w.includes(" ") && e.w[0] === x[0] && Math.abs(e.w.length - x.length) <= k && e.w.length >= 4) {
        const d = lev(x, e.w) - (e.w.length > x.length ? 0.1 : 0); if (d <= k && (!near.has(e.c) || d < near.get(e.c))) near.set(e.c, d);
      }
      if (near.size) { const best = Math.min(...near.values()); return [...near].filter(([, d]) => d === best).map(([c]) => c); }
    }
    return [];
  }
  // The idea behind a kind-word: "gouda" -> cheese, "stoofvlees" -> beef (similar products, shown after the word itself)
  const kindOf = w => { const x = fold(w).trim(); return [...new Set(WORDS.filter(e => e.w === x && e.specific).map(e => e.c))]; };
  // What the whole query is about: the head ("kip kruiden" is about spices, "filet de poulet" about chicken)
  function queryHead(q, perWord) {
    const a = analyse(q, "", /\b(de|du|des|au|aux|a la)\b/.test(fold(q)) ? "fr" : "nl");
    if (a.type === "meat_sub") return a.type;                                   // "vegan kip"
    const flat = perWord.flat().filter(c => C[c] && !C[c].marker);              // one idea per word, typos fixed
    if (!flat.length) return a.type;
    const forms = [...new Set(flat.filter(c => C[c].form))];
    if (forms.length === 1) return forms[0];                                     // "kip kruiden", "sauce tomate"
    return a.type && flat.includes(a.type) ? a.type : flat[flat.length - 1];
  }

  const WORD_SET = new Set(WORDS.map(e => e.w));
  const api = { WORD_SET, kindOf, analyse, conceptsOfWord, queryHead, isA, isFood, C, fold };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKConcepts = api;
})(typeof window !== "undefined" ? window : globalThis);
