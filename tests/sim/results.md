# Search test: 100 simulated shoppers

Deals of 2026-11-07: 1675 products. 100 shoppers (35 family, 32 student, 33 sport; 66 Dutch, 26 French, 8 English), 1273 searches, 134 of them with a typo. Not on promo today, so left out of the first three lines: eggs, strawberries.

| | Before | After |
|---|---|---|
| First result is what they meant | 62% | 100% |
| Right products in the first 5 | 48% | 92% |
| First result is the wrong kind of product | 31% | 0% |
| Nothing found although it is on promo | 7% | 0% |
| With a typo: first result right | 58% | 98% |
| Repeat search: their favourite in the first 3 suggestions | 25% | 91% |

## Per intent

| Intent | Searches | First right, before | First right, after | Right in first 5, before | Right in first 5, after |
|---|---|---|---|---|---|
| chicken | 126 | 59% | 100% | 29% | 98% |
| coffee | 82 | 67% | 100% | 52% | 100% |
| apples | 82 | 22% | 100% | 22% | 56% |
| fish | 62 | 61% | 100% | 48% | 100% |
| cheese | 55 | 82% | 98% | 59% | 97% |
| pasta | 54 | 54% | 100% | 88% | 100% |
| milk | 52 | 54% | 100% | 23% | 83% |
| tomatoes | 45 | 69% | 100% | 37% | 100% |
| yoghurt | 39 | 100% | 100% | 65% | 100% |
| cat food | 39 | 90% | 100% | 74% | 98% |
| water | 38 | 100% | 100% | 94% | 100% |
| minced | 37 | 92% | 100% | 53% | 95% |
| strawberries | 36 | not on promo today | | | |
| beer | 33 | 100% | 100% | 89% | 100% |
| veggie | 32 | 3% | 100% | 1% | 85% |
| potatoes | 31 | 94% | 100% | 28% | 81% |
| beef | 30 | 47% | 100% | 9% | 75% |
| chips | 29 | 83% | 97% | 87% | 97% |
| bread | 29 | 72% | 100% | 63% | 61% |
| onions | 26 | 35% | 100% | 35% | 100% |
| ice cream | 25 | 36% | 100% | 34% | 100% |
| detergent | 24 | 83% | 100% | 61% | 100% |
| carrots | 22 | 55% | 100% | 55% | 100% |
| butter | 21 | 62% | 100% | 21% | 67% |
| pizza | 21 | 100% | 100% | 100% | 100% |
| wine | 21 | 48% | 100% | 34% | 85% |
| spices | 20 | 5% | 100% | 25% | 96% |
| ham | 20 | 65% | 100% | 34% | 100% |
| soup | 19 | 100% | 100% | 74% | 100% |
| chocolate | 18 | 22% | 100% | 34% | 80% |
| eggs | 18 | not on promo today | | | |
| rice | 18 | 100% | 100% | 74% | 100% |
| diapers | 17 | 59% | 94% | 59% | 94% |
| cola | 16 | 25% | 94% | 80% | 94% |
| chicken spices | 13 | 46% | 100% | 23% | 100% |
| meat | 12 | 0% | 100% | 0% | 98% |
| pork | 11 | 27% | 100% | 36% | 100% |

## Borderline cases (first 5 results; ✓ right kind, ✗ wrong kind)

**kip**  
Before (30 found): ✓ Bovenbouten, Kip, Zonder rug · ✗ Friskies Kattenvoeding, Adult, Brokjes, Kip · ✗ Maaltijdbox, Couscous, Kip · ✗ Purina ONE Kattenvoeding, Adult, Brokjes, Kip · ✗ Friskies Kattenvoeding, Adult, Brokjes, Kip  
After (46 found): ✓ Bovenbouten, Kip, Zonder rug · ✓ Cuisses de poulet · ✓ Kippenonderbouten · ✓ Poulet de Wallonie Poulet entier · ✓ Poulet de Wallonie Pilons de pouley

**chicken**  
Before (4 found): ✗ Maaltijdbox, Butter chicken · ✗ Greenway Just Like Chicken, Reepjes, Vegan · ✗ Greenway Just like chicken, Vegan · ✗ Santa Maria Kruiden, Chicken&Steak, Molen  
After (42 found): ✓ Bovenbouten, Kip, Zonder rug · ✓ Cuisses de poulet · ✓ Kippenonderbouten · ✓ Poulet de Wallonie Poulet entier · ✓ Poulet de Wallonie Pilons de pouley

**poulet**  
Before (11 found): ✗ Liebig Cubes - Bouillon de poulet · ✓ Cuisses de poulet · ✓ Poulet de Wallonie Poulet entier · ✓ Poulet de Wallonie Pilons de pouley · ✓ Poulet de Wallonie Cuisses de poulet  
After (43 found): ✓ Bovenbouten, Kip, Zonder rug · ✓ Cuisses de poulet · ✓ Kippenonderbouten · ✓ Poulet de Wallonie Poulet entier · ✓ Poulet de Wallonie Pilons de pouley

**kipkruiden**  
Before (82 found): ✓ Santa Maria Kruiden, Kip, Mix · ✗ Santa Maria Kruiden, Zout, Berg, Molen · ✗ Santa Maria Kruiden, Mosterd, Zaad · ✗ Santa Maria Kruiden, Selderijzout · ✗ Santa Maria Kruiden, Peper, Black & White, Molen  
After (6 found): ✓ Santa Maria Kruiden, Kip, Mix · ✓ Santa Maria Kruiden, Kip · ✓ Santa Maria Kruiden, Kip, Mix · ✓ Santa Maria Kruiden, Chicken&Steak, Molen · ✓ Santa Maria Kruiden, Kip, Mix

**kruiden**  
Before (88 found): ✗ Lay's Ajuin & Fijne Kruiden, Snacks, Chips · ✗ Groentenfrieten, Kruiden · ✓ Gehakt, Lam, Zonder kruiden · ✗ Ardeens gebraad, Kruiden, Sneden · ✓ Santa Maria Kruiden, Kip, Mix  
After (94 found): ✓ Oîkos appel-kaneel Danone · ✓ DELUXE Himalaya bergzout · ✓ Santa Maria Kruiden, Kip, Mix · ✓ Santa Maria Kruiden, Zout, Berg, Molen · ✓ Santa Maria Kruiden, Mosterd, Zaad

**vis**  
Before (5 found): ✓ Gepaneerde alaskakoolvis, 5 st. Golden Seafood · ✗ Borotalco Invisible Deo Spray, 150ml · ✗ Nivea Spray, Invisible For Black & White, Original, 150ml · ✗ Nivea Deo, Roll, Invisible for black&white · ✗ Nivea Roll, Invisible For Black & White, Original, 50ml  
After (29 found): ✓ Huîtres creuses de Zélande · ✓ Taste of Inspirations Zeeboerderij mosselen · ✓ Iglo Fish Sticks, A l'Ancienne, 13 stuks · ✓ Iglo Fish Sticks Omega 3, 10 stuks · ✓ Gepaneerde alaskakoolvis, 5 st. Golden Seafood

**zalm**  
Before (6 found): ✗ Friskies Kattenvoeding, Adult, Brokjes, Zalm · ✓ Gevulde pannenkoeken met gerookte zalm en spinazie, 6 st. Chimay Sélection · ✓ Gerookte zalm XXL Golden Seafood · ✓ Gerookte zalm Gourmet Finest Cuisine · ✓ Crumble, Zalmforel Asperges  
After (9 found): ✓ Filet de saumon sans peau · ✓ Gerookte zalm Gourmet Finest Cuisine · ✓ Iglo 2 filets de saumon atlantique · ✓ Gabriel Saumon fumé de Norvège · ✓ Taste of Inspirations Zalm, Gerookt, Orkney

**kaas**  
Before (14 found): ✓ Goudse kaas jong belegen 48+ stuk Molenland · ✓ De Lelie Ambachtelijk, Verse plattekaas, Mager · ✓ De Lelie Ambachtelijk, Verse plattekaas, Vol · ✗ Lay's Paprika Kaas, Snacks, Chips · ✓ Goudsekaas komijn stuk 48+ Molenland  
After (50 found): ✓ Gouda, Belegen, Blok · ✓ Gouda, Jong, Blok · ✓ Goudsekaas komijn stuk 48+ Molenland · ✓ Gouda, Oud, Blok · ✓ Kaas, Gouda, Jong, Blokjes

**fromage**  
Before (6 found): ✓ Danio Fromage frais - Exotic · ✓ Danio Fromage frais - Vanille · ✓ Danio Fromage frais - Cerise · ✓ Danio Fromage frais - Fraise · ✓ Danio Fromage frais - Pêche  
After (55 found): ✓ Gouda, Belegen, Blok · ✓ Gouda, Jong, Blok · ✓ Goudsekaas komijn stuk 48+ Molenland · ✓ Gouda, Oud, Blok · ✓ Kaas, Gouda, Jong, Blokjes

**gouda**  
Before (11 found): ✓ Gouda, Belegen, Blok · ✓ Gouda, Jong, Blok · ✓ Gouda, Oud, Blok · ✓ Kaas, Gouda, Jong, Blokjes · ✓ Violife Goudasmaak, Sneden  
After (49 found): ✓ Gouda, Belegen, Blok · ✓ Gouda, Jong, Blok · ✓ Gouda, Oud, Blok · ✓ Kaas, Gouda, Jong, Blokjes · ✓ Violife Goudasmaak, Sneden

**melk**  
Before (23 found): ✗ Chocolademelk Chocomel · ✓ Lactel Melk, Halfvolle, Gevitamineerd · ✗ Fristi Melk, Rode vruchten · ✗ Chocomel Chocolademelk · ✗ Chocolademelk, 6 st. Chocomel  
After (28 found): ✓ Campina Lait - Demi-écrémé · ✓ Campina Lait - Entier · ✓ Lactel Melk, Lichte start, 0% Lactose · ✓ Lactel Bio, Melk, Lichte start, Bio · ✓ Lactel Lactel geitemelk

**lait**  
Before (16 found): ✓ Campina Lait - Demi-écrémé · ✓ Campina Lait - Entier · ✗ La Laitière Riz au lait - Sur lit de caramel · ✗ La Laitière Riz au lait - Chocolat · ✗ La Laitière Semoule au lait - vanille  
After (27 found): ✓ Campina Lait - Demi-écrémé · ✓ Campina Lait - Entier · ✓ Lactel Melk, Lichte start, 0% Lactose · ✓ Lactel Bio, Melk, Lichte start, Bio · ✓ Lactel Lactel geitemelk

**appel**  
Before (32 found): ✗ Aardappelen · ✓ Aardappelsparretjes Gourmet Finest Cuisine · ✗ Schweppes Sinaasappel passievrucht · ✗ Appel-mango- of appel-rabarbersap Bio · ✗ TROPICANA Sinaasappelsap  
After (18 found): ✓ Pomme Jonagold · ✗ Appel-mango- of appel-rabarbersap Bio · ✓ Kanzi Appel, Kanzi, 4st · ✗ Hak Rode kool, Stukjes appel · ✓ Hak Mousseline, Appel

**tomaat**  
Before (9 found): ✗ Knorr Soep in brik, Tomaat en mozzarella, 1 L · ✗ Knorr Soep, Tomaat, Vermicelli, Brik · ✓ Tomaat, Orzo, Comfort Bowl · ✗ Linzen, Tomaat, Basilicum, Ready to Heat · ✗ Heinz Saus, Tomaat & Basilicum  
After (38 found): ✓ Gargano Rosso Pelati di Puglia · ✓ Gargano Rosso Cubettata di Puglia · ✓ Cirio Tomaten, Blokjes, Basilicum · ✓ Cirio Tomaten, Blokjes, Look · ✓ Gargano Rosso Pomodorini di Puglia

**tomaten**  
Before (16 found): ✓ Cirio Tomaten, Blokjes, Basilicum · ✓ Cirio Tomaten, Blokjes, Look · ✗ Heinz Witte bonen, Tomatensaus, Blik · ✓ Heinz Tomaten, Gepelde · ✗ Heinz Saus, Tomaten, Blok  
After (43 found): ✓ Gargano Rosso Pelati di Puglia · ✓ Gargano Rosso Cubettata di Puglia · ✓ Cirio Tomaten, Blokjes, Basilicum · ✓ Cirio Tomaten, Blokjes, Look · ✓ Gargano Rosso Pomodorini di Puglia

**ei**  
Before (205 found): ✗ Nivea Reinigingsdoekjes, normal · ✗ Hansaplast Pleisters, Finger strips, Extra lang · ✗ Nivea Reinigingsdoekjes, dry · ✗ Hansaplast Pleisters, Universal, Water resistant · ✗ Demak'Up Reinigingsdoekjes, Sensitive  
After (1 found): ✗ Tortuovo Pâtes fraîches - Fettuccine aux oeufs

**ham**  
Before (31 found): ✗ Foire aux hamburgers · ✗ Champignons blancs · ✗ Varkenshamburgers, 4 st. · ✗ Hamburgerbroodje, Sesam, Bio · ✗ Ultra Doux Kamille, Shampoo, EcoPack  
After (11 found): ✓ Jambon à l'os Grand-Mère · ✓ Jamón Serrano Tesoros Del Sur · ✓ Jambon Serrano · ✓ Ham, 3 sneden Herta · ✓ HERTA Superieur ham

**cola**  
Before (101 found): ✗ Chocolademelk Chocomel · ✓ Coca-Cola Zero sugar · ✓ Coca-Cola Original · ✓ Coca-Cola Zero Sugar en zonder cafeïne, PET · ✓ Saint Eloi Pommes de terre - Nicola  
After (108 found): ✓ Coca-Cola Zero sugar · ✓ Coca-Cola Original · ✓ Coca-Cola Zero Sugar en zonder cafeïne, PET · ✓ Coca-Cola lemon zero, 6 st. Coca-Cola · ✓ Coca-Cola Zero Sugar en zonder cafeïne, Blik

**bier**  
Before (45 found): ✓ Maes Blond bier, Pils, 5.2% ALC, Bak · ✓ Maes Maes, Bld bier, Pils, 5.2%, 14+10, Bak · ✓ Cristal Cristal, Bld bier, Pils, 5%ALC, 18+6 · ✓ Stella Artois Blond Bier, Pils, 5,2% Alc., Bak · ✓ Jupiler Blond Bier, Pils, 5,2% alc., Blik  
After (51 found): ✓ Maes Blond bier, Pils, 5.2% ALC, Bak · ✓ Premium pilsener 6-pack Schultenbräu · ✓ Maes Maes, Bld bier, Pils, 5.2%, 14+10, Bak · ✓ Stella Artois · ✓ Jupiler

**ijs**  
Before (16 found): ✗ Lipton Bruisende Ijsthee, Original, Caloriearm, PET · ✗ Lipton Ijsthee, Groene thee, Zonder suiker · ✓ Ijsboerke Vanille, Roomijs · ✓ Ijsboerke Mokka, Roomijs · ✓ Ijsboerke Icy, Vanille  
After (5 found): ✓ Ijsboerke Vanille, Roomijs · ✓ Ijsboerke Mokka, Roomijs · ✓ Ijsboerke Icy, Vanille · ✓ 6-pack Cornetto classico Ola · ✓ Magnum Ijs, Bonbon, Kers

**kattenvoer**  
Before (6 found): ✓ Friskies Kattenvoeding, Adult, Brokjes, Rund · ✓ Friskies Kattenvoeding, Adult, Brokjes, Kip · ✓ Purina ONE Kattenvoeding, Adult, Brokjes, Kip · ✓ Friskies Kattenvoeding, Adult, Brokjes, Kip · ✓ Friskies Kattenvoeding, Adult, Brokjes, Zalm  
After (17 found): ✓ Friskies Kattenvoeding, Adult, Brokjes, Rund · ✓ Friskies Kattenvoeding, Adult, Brokjes, Kip · ✓ Purina ONE Kattenvoeding, Adult, Brokjes, Kip · ✓ Friskies Kattenvoeding, Adult, Brokjes, Kip · ✓ Friskies Kattenvoeding, Adult, Brokjes, Zalm

**vegan kip**  
Before (0 found): nothing  
After (3 found): ✓ Greenway Just Like Chicken, Reepjes, Vegan · ✓ Greenway Just like chicken, Vegan · ✓ Greenway Cordon bleu, Vegan

**vlees**  
Before (1 found): ✗ Santa Maria Kruiden, Stoofvlees, Mix  
After (136 found): ✓ Herta Knacki · ✓ Saucisses sèches Nature · ✓ Saucisses porc et bœuf · ✓ Bovenbouten, Kip, Zonder rug · ✓ Foire aux hamburgers

**chiken**  
Before (4 found): ✗ Maaltijdbox, Butter chicken · ✗ Greenway Just Like Chicken, Reepjes, Vegan · ✗ Greenway Just like chicken, Vegan · ✗ Santa Maria Kruiden, Chicken&Steak, Molen  
After (42 found): ✓ Bovenbouten, Kip, Zonder rug · ✓ Cuisses de poulet · ✓ Kippenonderbouten · ✓ Poulet de Wallonie Poulet entier · ✓ Poulet de Wallonie Pilons de pouley

**kipfillet**  
Before (1 found): ✓ Kipfiletreepjes  
After (42 found): ✓ Bovenbouten, Kip, Zonder rug · ✓ Cuisses de poulet · ✓ Kippenonderbouten · ✓ Poulet de Wallonie Poulet entier · ✓ Poulet de Wallonie Pilons de pouley

**yoghurth**  
Before (5 found): ✓ Inex Yoghurt, Framboos · ✓ Inex Yoghurt, Natuur · ✓ Inex Yoghurt, Bananen · ✓ Inex Yoghurt, Aardbeien · ✓ De Lelie Ambachtelijke yoghurt, Natuur  
After (15 found): ✓ Danone Yaourt à la grecque - Nature · ✓ Danone Yaourt à la grecque - Citron · ✓ Inex Yoghurt, Framboos · ✓ Inex Yoghurt, Natuur · ✓ Inex Yoghurt, Bananen

**aardapelen**  
Before (1 found): ✓ Aardappelen  
After (10 found): ✓ Aardappelen · ✓ Aardappelsparretjes Gourmet Finest Cuisine · ✓ Saint Eloi Pommes de terre - Nicola · ✓ Saint Eloi Pommes de terre - Charlotte · ✗ Saint Eloi Pommes de terre - Frites-Purée

**spagetti**  
Before (6 found): ✓ Panzani Pâtes - Spaghetti · ✓ Panzani Pâtes - 3 minutes Spaghetti · ✓ Spaghettigroenten · ✓ Courgette, Spaghetti · ✓ Fitmeals XXL Nutrition Spaghetti, Bolognaise  
After (6 found): ✓ Panzani Pâtes - Spaghetti · ✓ Panzani Pâtes - 3 minutes Spaghetti · ✓ Spaghettigroenten · ✓ Courgette, Spaghetti · ✓ Fitmeals XXL Nutrition Spaghetti, Bolognaise

**chocolat**  
Before (10 found): ✓ La Laitière Riz au lait - Chocolat · ✓ BN Mini - Chocolat · ✓ Filliers FILLIERS CHOCOLATE 17 · ✓ Gechocolateerde guimauves, 3 st. · ✓ Torsades Pépites de chocolat  
After (91 found): ✓ Ferrero Mon chéri · ✓ Chocomel Chocolade melk, Zonder lactose · ✓ Snickers Chocolade, Repen, Pinda's, 7 Packs · ✓ Twix Chocolade, Repen, 7 Pack · ✗ Delacre Délichoc - Lait

**koffie**  
Before (36 found): ✓ Yfood Maaltijddrink, Koffie · ✗ NXT Level Sports Nutrition Proteinen, Shake, Koffie · ✓ Cappuccino-oploskoffie Barissimo · ✓ Koffie, Cappuccino, Instant, Zakjes · ✗ Gerlinéa Drinkmaaltijd, Ijskoffie  
After (46 found): ✓ Cappuccino-oploskoffie Barissimo · ✓ De Lelie Ambachtelijk, Verse plattekaas, Mager · ✓ De Lelie Ambachtelijk, Verse plattekaas, Vol · ✓ Koffie, Cappuccino, Instant, Zakjes · ✓ Koffie, Latte Macchiato, Oplos, Sticks

**wortelen**  
Before (2 found): ✓ Hak Doperwtjes-Wortelen, Extra fijn, Bokaal · ✓ Hak Wortelen, Extra fijn  
After (4 found): ✓ Hak Doperwtjes-Wortelen, Extra fijn, Bokaal · ✓ Hak Wortelen, Extra fijn · ✗ Liebig Soupe - Carottes-potiron · ✗ Bonduelle Petits pois & carottes

**boter**  
Before (1 found): ✓ Ultra Doux Conditioner, Avocado Kariteboter  
After (4 found): ✓ Becel Original · ✓ Becel Gourmet · ✗ Maaltijdbox, Butter chicken · ✗ Brets Chips - Beurre Persillé
