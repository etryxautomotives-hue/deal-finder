// Search check with 100 simulated shoppers on a real day of deals (data/deals.json).
// Run: node tests/sim/search-sim.mjs            -> prints a summary, writes tests/sim/results.md
// "before" is the search from before product types (tests/sim/search-before.cjs, kept for this comparison);
// "after" is site/search.js. The judge below only looks at product names (hand-written per intent), so it
// does not reuse concepts.js and can catch its mistakes.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const req = createRequire(import.meta.url);
const NEW = req("../../site/search.js");
const OLD = req("./search-before.cjs");
const RAW = req(process.env.DEALS || "../../data/deals.json");

// ---------- intents: what a shopper means, how they type it, and which names are a right answer ----------
// want: a right product's name matches it; not: ...and doesn't match this (things that only contain or taste of it)
const I = (id, qs, want, not, weight = 1, groups = ["all"]) => ({ id, qs, want, not, weight, groups });
const INTENTS = [
  I("chicken", { nl: ["kip", "kipfilet", "kippenbout"], fr: ["poulet", "filet de poulet"], en: ["chicken"] },
    /\b(kip|kippen|poulet|chicken)|kip|scharrelkip|hoevekip|cuisses|pilons/i, /kruid|soep|soupe|bouillon|chips|katten|sheba|snack|pizza|maaltijd|just like|vegan|épice|epice|knorr|fitmeals|liebig/i, 3, ["family", "student", "sport"]),
  I("minced", { nl: ["gehakt", "balletjes"], fr: ["haché", "boulettes"], en: ["minced meat"] },
    /gehakt|hach|burger|balletjes|boulettes|vogeltjes|oiseaux/i, /kruid|maaltijd|plant|vegan|eiwit|butcher/i, 2, ["family"]),
  I("beef", { nl: ["rundvlees", "steak", "stoofvlees"], fr: ["boeuf", "steak"], en: ["beef"] },
    /rund|boeuf|bœuf|steak|stoofvlees|entrecote|contrefilet|biefstuk/i, /kruid|maaltijd|soep|bouillon|plant|vegan/i, 2, ["family"]),
  I("pork", { nl: ["varkensvlees", "varken"], fr: ["porc"], en: ["pork"] },
    /varken|porc|pork|spareribs|ardeens gebraad/i, /kruid|maaltijd|plant|vegan|rillette|pizza/i, 1, ["family"]),
  I("fish", { nl: ["vis", "zalm", "kabeljauw"], fr: ["poisson", "saumon"], en: ["fish", "salmon"] },
    /zalm|saumon|kabeljauw|cabillaud|koolvis|lieu|tonijn|thon|\bvis|poisson|forel|truite|scampi|garna|crevette|flétan|fletan|seafood|fruits de mer|mossel|moule|saint-jacques|huîtres|huitres|oester|fish/i,
    /kruid|katten|pour chat|whiskas|friskies|vitakraft|snack|pizza/i, 2, ["family", "sport"]),
  I("cheese", { nl: ["kaas", "gouda", "geitenkaas"], fr: ["fromage", "emmental"], en: ["cheese"] },
    /kaas|fromage|cheese|gouda|emmental|brie|camembert|mozzarella|parme|feta|cheddar|morbier|old amsterdam|paulin|queso|mini portie|clémont|mimolette|oudendijk|postel|mi-vieux|cœur de lion|chèvre|raclette|violife/i,
    /chips|pizza|saus|sauce|maaltijd|cheesecake|eiwit|nacho|cubes|tomatensaus|dorito/i, 2, ["family", "student"]),
  I("milk", { nl: ["melk", "halfvolle melk"], fr: ["lait", "lait demi-écrémé"], en: ["milk"] },
    /melk|lait|milk/i, /chocola|bodymilk|body|creme|crème|semoule|bouchée|bouchee|fristi|choco|laitière|nivea|délichoc|delichoc/i, 2, ["family", "student"]),
  I("eggs", { nl: ["eieren"], fr: ["oeufs"], en: ["eggs"] }, /eieren|oeufs|œufs|\beggs\b/i, /pâtes|pates|fettuccine/i, 1, ["family"]),
  I("yoghurt", { nl: ["yoghurt", "skyr"], fr: ["yaourt"], en: ["yogurt"] }, /yoghurt|yaourt|skyr|yogurt|danio|activia/i, /reep|eiwit|chips|isostar/i, 1, ["family", "sport"]),
  I("butter", { nl: ["boter"], fr: ["beurre"], en: ["butter"] }, /boter|beurre|butter|becel/i, /chips|koek|pindakaas|peanut|maaltijd|persillé|croissant|biscuit|butter chicken/i, 1, ["family"]),
  I("apples", { nl: ["appels", "appel"], fr: ["pommes"], en: ["apples"] }, /\bappel|appels|\bpomme\b|apple|kanzi|jonagold/i,
    /sap|jus|jenever|kool|afwas|dreft|granaat|pommes de terre|compote|collageen|prote|shampoo|appelmoes|oasis|kidibul|limonade|saveur|sultana|salade|rabarber/i, 2, ["family", "student", "sport"]),
  I("tomatoes", { nl: ["tomaten", "tomaat"], fr: ["tomates"], en: ["tomatoes"] }, /tomaat|tomaten|tomate|tomato|pomodorini|pelati|cubettata/i,
    /soep|soupe|saus|sauce|ketchup|chips|pizza|boulettes|frito|linzen|farcis|puree/i, 2, ["family", "student"]),
  I("potatoes", { nl: ["aardappelen"], fr: ["pommes de terre"], en: ["potatoes"] }, /aardappel|pommes de terre|krieltjes|grenaille/i, /chips|frieten|frites|kroket|puree/i, 2, ["family"]),
  I("onions", { nl: ["uien", "ajuin"], fr: ["oignons"], en: ["onions"] }, /\buien|oignon|ajuin|sjalot|échalote/i, /chips|soep|soupe|kruid/i, 1, ["family"]),
  I("carrots", { nl: ["wortelen"], fr: ["carottes"], en: ["carrots"] }, /wortel|carott/i, /soep|soupe|salade|petits pois|potiron|julienne/i, 1, ["family"]),
  I("strawberries", { nl: ["aardbeien"], fr: ["fraises"], en: ["strawberries"] }, /aardbei|fraise/i, /yoghurt|skyr|isostar|limonade|koek|jam|confit|smaak|eiwit|shake|fristi|fromage|danio|ontbijtgranen|prote/i, 1, ["family", "sport"]),
  I("pasta", { nl: ["pasta", "spaghetti"], fr: ["pâtes", "spaghetti"], en: ["pasta"] }, /pasta|pâtes|pates|spaghetti|penne|tagliatelle|fusilli|macaroni|fettuccine|tortellini|tortelloni/i,
    /saus|sauce|maaltijd|kruid|bolognese|bowl/i, 2, ["student", "family"]),
  I("rice", { nl: ["rijst"], fr: ["riz"], en: ["rice"] }, /rijst|\briz\b|basmati|rice/i, /maaltijd|fitmeals|wafel|galette|pap|crisp/i, 1, ["student"]),
  I("bread", { nl: ["brood"], fr: ["pain"], en: ["bread"] }, /brood|\bpain\b|baguette|pistolet|grilletine/i, /beleg|kruid|pain d'épices|sinterklaas/i, 1, ["family", "student"]),
  I("coffee", { nl: ["koffie"], fr: ["café"], en: ["coffee"] }, /koffie|café|coffee|espresso|caps|latte/i, /ijskoffie|drinkmaaltijd|reep|prote|eiwit|chocolade|delonghi|magnifica/i, 2, ["all"]),
  I("beer", { nl: ["bier", "pils"], fr: ["bière"], en: ["beer"] }, /bier|bière|biere|beer|pils|jupiler|leffe|stella|maes|karmeliet|duvel|hoegaarden|scotch ale/i, /haarkleuring|shampoo/i, 2, ["student"]),
  I("wine", { nl: ["wijn", "rode wijn"], fr: ["vin", "vin rouge"], en: ["wine"] }, /wijn|\bvin\b|wine|ch[aâ]teau|bordeaux|\bcru\b|rood|rouge|wit\b|blanc|rosé|cava|champagne|aop|côtes|cotes|saint-émilion|bergerac|sauvignon|chardonnay|ermitage|glühwein|gluhwein|lubéron|crimes|tavel|vinsobres/i,
    /azijn|vinaigre|saus|sauce/i, 1, ["family"]),
  I("cola", { nl: ["cola"], fr: ["coca"], en: ["coke"] }, /cola/i, /chocola|whisky/i, 1, ["student"]),
  I("water", { nl: ["water", "mineraalwater"], fr: ["eau"], en: ["water"] }, /water|eau\b|spa\b|chaudfontaine/i, /tonic|toilet|micellair|eau de|limonade|smaak/i, 1, ["family", "sport"]),
  I("chips", { nl: ["chips"], fr: ["chips"], en: ["crisps"] }, /chips|lay'?s|pringles|crisps/i, /elektrolyt|stick/i, 1, ["student"]),
  I("chocolate", { nl: ["chocolade"], fr: ["chocolat"], en: ["chocolate"] }, /chocolade|chocolat|toblerone|milka|côte d'or|pralines|bouchée|mon chéri|kinder|snickers|twix|leonidas/i,
    /prote|eiwit|shake|chocolademelk|collageen|whey|reep, prote|drinkmaaltijd|koekjes|cookies|donut/i, 1, ["student"]),
  I("spices", { nl: ["kruiden"], fr: ["épices"], en: ["spices"] }, /kruiden|épices|epices|kruidenmix|peper|zout|kaneel|ras el hanout|curry/i, /chips|frieten|gebraad|groenten|douche|shampoo|tajine/i, 1, ["family"]),
  I("chicken spices", { nl: ["kipkruiden", "kruiden kip"], fr: ["épices poulet"], en: ["chicken seasoning"] }, /kruiden.*(kip|chicken)|épices.*poulet/i, /chips|tajine/i, 1, ["family"]),
  I("soup", { nl: ["soep"], fr: ["soupe"], en: ["soup"] }, /soep|soupe|potage|velouté/i, /groenten,? (?!soep)|kruid/i, 1, ["student"]),
  I("cat food", { nl: ["kattenvoer"], fr: ["nourriture chat"], en: ["cat food"] }, /katten|chat\b|sheba|whiskas|friskies|felix|purina|vitakraft/i, /^$/, 1, ["all"]),
  I("diapers", { nl: ["luiers"], fr: ["langes"], en: ["diapers"] }, /luier|lange|pampers/i, /^$/, 1, ["family"]),
  I("detergent", { nl: ["wasmiddel"], fr: ["lessive"], en: ["detergent"] }, /wasmiddel|lessive|dash|ariel|dixan|vloeibaar wasmiddel/i, /afwas|vaisselle|wasverzachter|wasparfum/i, 1, ["family"]),
  I("pizza", { nl: ["pizza"], fr: ["pizza"], en: ["pizza"] }, /pizza|flammkuchen/i, /kruiden/i, 1, ["student"]),
  I("ice cream", { nl: ["ijs", "roomijs"], fr: ["glace"], en: ["ice cream"] }, /\bijs|glace|magnum|cornetto|ola\b|icy|roomijs/i, /ijsthee|ijskoffie|ijsberg/i, 1, ["student", "family"]),
  I("ham", { nl: ["ham", "hesp"], fr: ["jambon"], en: ["ham"] }, /\bham\b|beenham|jambon|hesp|serrano|jamon/i, /champignon|hamburger|shampoo/i, 1, ["family"]),
  I("veggie", { nl: ["vegan kip", "vegetarische burger"], fr: ["végétarien"], en: ["vegan chicken"] }, /vegan|vegetar|végétar|veggie|plantaardig|plant\.|just like|greenway|falafel/i, /^$/, 1, ["sport"]),
  I("meat", { nl: ["vlees"], fr: ["viande"], en: ["meat"] }, /kip|poulet|rund|boeuf|bœuf|varken|porc|gehakt|haché|steak|worst|saucisse|spek|\bham\b|jambon|gebraad|filet|burger|balletjes|lapin|konijn|kalkoen|dinde|cordon|gyros|bouten|contrefilet|chipolata|rillette|knacki/i,
    /kruid|vegan|plant|katten|chat|maaltijd|pizza|chips|zalm|saumon|vis\b|poisson|soep|bouillon|just like/i, 1, ["family"]),
];

// ---------- the app's order of results, before and after ----------
const value = (a, b) => ((a.unit && a.unit_price) ?? 1e9) - ((b.unit && b.unit_price) ?? 1e9) || a.price - b.price;
function prepare(S, raw) {   // what app.js does on load
  const K = S === NEW ? req("../../site/concepts.js") : null;
  return raw.map((d, i) => { const k = K ? K.analyse(d.name, d.brand, d.language) : null;
    return { ...d, id: "d" + i, cat: (k && k.aisle) || d.category || "other", ...(k ? { pk: k } : {}) }; });
}
const DEALS = { old: prepare(OLD, RAW), new: prepare(NEW, RAW) };
function resultsList(which, q, hist, now) {
  const S = which === "old" ? OLD : NEW, deals = DEALS[which], res = S.search(deals, q);
  const list = deals.filter(d => res.hits.has(d.id));
  if (which === "old") return list.sort(value);
  const topQ = S.topQueries(hist, now), fav = new Map();
  const likes = d => { if (!fav.has(d.id)) fav.set(d.id, S.personal(hist, d, now, topQ) >= 1 ? 1 : 0); return fav.get(d.id); };
  return list.sort((a, b) => S.group(res, b) - S.group(res, a) || likes(b) - likes(a) || value(a, b));
}
const dropdown = (which, q, hist, now) => (which === "old" ? OLD : NEW).suggest(DEALS[which], q, hist, now, { n: 6 }).deals;

// ---------- 100 shoppers ----------
let seed = 20261107; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const KEYS = "azertyuiopqsdfghjklmwxcvbn";
function typo(q) {   // one realistic slip: swapped, missing, doubled or wrong letter (never the first letter)
  const ws = q.split(" "), i = ws.findIndex(w => w.length >= 5); if (i < 0) return q;
  let w = ws[i]; const p = 1 + Math.floor(rnd() * (w.length - 2)), kind = Math.floor(rnd() * 4);
  if (kind === 0) w = w.slice(0, p) + w[p + 1] + w[p] + w.slice(p + 2);
  else if (kind === 1) w = w.slice(0, p) + w.slice(p + 1);
  else if (kind === 2) w = w.slice(0, p) + w[p] + w.slice(p);
  else w = w.slice(0, p) + pick(KEYS) + w.slice(p + 1);
  ws[i] = w; return ws.join(" ");
}
const TYPES = ["family", "student", "sport"];
const users = Array.from({ length: 100 }, (_, n) => {
  const r = rnd();
  return { n, type: pick(TYPES), lang: r < 0.6 ? "nl" : r < 0.9 ? "fr" : "en", typos: pick([0, 0, 0.1, 0.2, 0.35]), searches: 10 + Math.floor(rnd() * 6) };
});
const ok = (it, d) => it.want.test(d.name) && !it.not.test(d.name);
const anyRight = new Map(INTENTS.map(it => [it.id, RAW.filter(d => ok(it, d)).length]));

const stats = { old: [], new: [] }, perIntent = {}, repeats = { old: [], new: [] };
const DAY = 864e5;
for (const u of users) {
  const hist = { old: OLD.empty(), new: NEW.empty() };
  const mine = INTENTS.filter(it => it.groups.includes("all") || it.groups.includes(u.type) || rnd() < 0.25);
  const done = [];
  let now = Date.parse("2026-11-07T08:00:00Z");
  for (let s = 0; s < u.searches; s++) {
    now += DAY / 3;
    const it = pick(mine.flatMap(x => Array(x.weight).fill(x)));
    let q = pick(it.qs[u.lang] || it.qs.nl); const typed = rnd() < u.typos ? typo(q) : q;
    for (const w of ["old", "new"]) {
      const list = resultsList(w, typed, hist[w], now), top = list.slice(0, 5);
      const right = top.filter(d => ok(it, d)).length;
      const row = { user: u.n, intent: it.id, q: typed, typo: typed !== q, n: list.length, top1: !!top[0] && ok(it, top[0]),
        p5: top.length ? right / Math.min(5, Math.max(1, Math.min(anyRight.get(it.id), 5))) : 0, empty: !list.length && anyRight.get(it.id) > 0,
        wrongTop: !!top[0] && !ok(it, top[0]) };
      row.p5 = Math.min(1, row.p5);
      stats[w].push(row);
      (perIntent[it.id] ??= { old: [], new: [] })[w].push(row);
      // the shopper opens a right product they like (each has a favourite: not always the cheapest) and adds it
      const rightOnes = list.filter(d => ok(it, d));
      const fav = rightOnes.length ? rightOnes[(u.n * 7 + it.id.length) % Math.min(rightOnes.length, 6)] : null;
      if (fav) { const S = w === "old" ? OLD : NEW; S.bump(hist[w], "q", S.qwords(typed).join(" "), 1, now); S.bump(hist[w], "p", S.productKey(fav), 2, now); }
      if (w === "new" && fav) done.push({ it, q, fav: fav.name });
    }
  }
  // a week later they search the same things again: is their favourite in the first 3 suggestions?
  now += 7 * DAY;
  for (const r of done.slice(-4)) for (const w of ["old", "new"]) {
    const sug = dropdown(w, r.q, hist[w], now).slice(0, 3).map(d => d.name);
    repeats[w].push(sug.includes(r.fav));
  }
}
const pct = (a, f) => a.length ? Math.round(100 * a.filter(f).length / a.length) : 0;
const avg = (a, f) => a.length ? Math.round(100 * a.reduce((s, x) => s + f(x), 0) / a.length) : 0;
const has = r => anyRight.get(r.intent) > 0;
const sum = w => ({ searches: stats[w].length, top1: pct(stats[w].filter(has), r => r.top1), p5: avg(stats[w].filter(has), r => r.p5),
  wrongTop: pct(stats[w].filter(has), r => r.wrongTop), noneShown: pct(stats[w].filter(r => !has(r)), r => r.n === 0), empty: pct(stats[w], r => r.empty),
  typoTop1: pct(stats[w].filter(r => r.typo && has(r)), r => r.top1), favTop3: pct(repeats[w], x => x) });
const S0 = sum("old"), S1 = sum("new");

// ---------- borderline cases: the first 5 results, before and after ----------
const BORDER = [["kip", "chicken"], ["chicken", "chicken"], ["poulet", "chicken"], ["kipkruiden", "chicken spices"], ["kruiden", "spices"],
  ["vis", "fish"], ["zalm", "fish"], ["kaas", "cheese"], ["fromage", "cheese"], ["gouda", "cheese"], ["melk", "milk"], ["lait", "milk"], ["appel", "apples"],
  ["tomaat", "tomatoes"], ["tomaten", "tomatoes"], ["ei", "eggs"], ["ham", "ham"], ["cola", "cola"], ["bier", "beer"], ["ijs", "ice cream"],
  ["kattenvoer", "cat food"], ["vegan kip", "veggie"], ["vlees", "meat"], ["chiken", "chicken"], ["kipfillet", "chicken"], ["yoghurth", "yoghurt"],
  ["aardapelen", "potatoes"], ["spagetti", "pasta"], ["chocolat", "chocolate"], ["koffie", "coffee"], ["wortelen", "carrots"], ["boter", "butter"]];
const empty = { old: OLD.empty(), new: NEW.empty() };
const border = BORDER.map(([q, id]) => { const it = INTENTS.find(x => x.id === id);
  const row = { q, id };
  for (const w of ["old", "new"]) { const l = resultsList(w, q, empty[w], Date.now()); row[w] = { n: l.length, top: l.slice(0, 5).map(d => [d.name, ok(it, d)]) }; }
  return row; });

// ---------- report ----------
const line = (k, label, unit = "%") => `| ${label} | ${S0[k]}${unit} | ${S1[k]}${unit} |`;
let md = `# Search test: 100 simulated shoppers\n\nDeals of ${RAW[0]?.collected_at?.slice(0, 10) || "today"}: ${RAW.length} products. ` +
  `${users.length} shoppers (${TYPES.map(t => `${users.filter(u => u.type === t).length} ${t}`).join(", ")}; ` +
  `${users.filter(u => u.lang === "nl").length} Dutch, ${users.filter(u => u.lang === "fr").length} French, ${users.filter(u => u.lang === "en").length} English), ` +
  `${S1.searches} searches, ${stats.new.filter(r => r.typo).length} of them with a typo. ` +
  `Not on promo today, so left out of the first three lines: ${INTENTS.filter(it => !anyRight.get(it.id)).map(it => it.id).join(", ") || "none"}.\n\n` +
  `| | Before | After |\n|---|---|---|\n` +
  line("top1", "First result is what they meant") + "\n" + line("p5", "Right products in the first 5") + "\n" +
  line("wrongTop", "First result is the wrong kind of product") + "\n" + line("empty", "Nothing found although it is on promo") + "\n" +
  line("typoTop1", "With a typo: first result right") + "\n" + line("favTop3", "Repeat search: their favourite in the first 3 suggestions") + "\n\n";
md += `## Per intent\n\n| Intent | Searches | First right, before | First right, after | Right in first 5, before | Right in first 5, after |\n|---|---|---|---|---|---|\n` +
  Object.entries(perIntent).sort((a, b) => b[1].new.length - a[1].new.length)
    .map(([id, r]) => anyRight.get(id) ? `| ${id} | ${r.new.length} | ${pct(r.old, x => x.top1)}% | ${pct(r.new, x => x.top1)}% | ${avg(r.old, x => x.p5)}% | ${avg(r.new, x => x.p5)}% |` : `| ${id} | ${r.new.length} | not on promo today | | | |`).join("\n") + "\n\n";
md += `## Borderline cases (first 5 results; ✓ right kind, ✗ wrong kind)\n\n` + border.map(b =>
  `**${b.q}**  \nBefore (${b.old.n} found): ${b.old.top.map(([n, g]) => `${g ? "✓" : "✗"} ${n}`).join(" · ") || "nothing"}  \n` +
  `After (${b.new.n} found): ${b.new.top.map(([n, g]) => `${g ? "✓" : "✗"} ${n}`).join(" · ") || "nothing"}\n`).join("\n");
writeFileSync(new URL("./results.md", import.meta.url), md);
console.log(JSON.stringify({ before: S0, after: S1 }, null, 1));
const bad = Object.entries(perIntent).filter(([id]) => anyRight.get(id)).map(([id, r]) => [id, pct(r.new, x => x.top1), r.new.length]).filter(x => x[1] < 90);
console.log("intents under 90% after:", bad.map(x => x.join(" ")).join(" | "));
if (process.env.DEBUG) for (const id of process.env.DEBUG.split(",")) {
  const it = INTENTS.find(x => x.id === id); console.log("\n###", id, "right on promo:", anyRight.get(id));
  const seen = new Set();
  for (const r of perIntent[id]?.new || []) { if (r.top1 || seen.has(r.q)) continue; seen.add(r.q);
    console.log(" q:", r.q, "->", resultsList("new", r.q, NEW.empty(), Date.now()).slice(0, 4).map(d => (ok(it, d) ? "✓" : "✗") + d.name).join(" | ")); }
}
