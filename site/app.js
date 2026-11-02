/* deal'ke front end. Plain JavaScript, no build step.
   Reads data/deals.json (written every morning by the collector), data/stores.json (shop locations from
   OpenStreetMap) and data/postcodes.json (Belgian postal code centres). Everything runs in the browser. */
(() => {
"use strict";

// ---------- text ----------
const T = {
  nl: {
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
};

// ---------- state ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem("dk." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("dk." + k, JSON.stringify(v)); } catch { /* private mode */ } },
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
  value: (a, b) => (a.unit_price ?? 1e9) - (b.unit_price ?? 1e9) || a.price - b.price,
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
function logo(chain, big) {
  const c = CHAINS[chain] || { bg: "#1D1B19", fg: "#fff", l: chain };
  return `<span class="slogo" style="background:${c.bg};color:${c.fg};${c.bd ? `box-shadow:inset 0 0 0 1px ${c.bd};` : ""}${big ? "height:26px;font-size:13px" : ""}">${esc(c.l)}</span>`;
}
const kmText = chain => { const d = dist(chain); return d == null ? "" : `${d < 10 ? d.toFixed(1).replace(".", S.lang === "en" ? "." : ",") : Math.round(d)} km`; };
function photo(d, big, extra = "") {
  const img = d.image_url ? `<img src="${esc(d.image_url)}" alt="" loading="${big ? "eager" : "lazy"}" decoding="async" onerror="this.remove()">` : "";
  const cat = t().cats[d.cat] || "";
  return `<div class="photo">${img || `<div class="ph"><b>${esc((d.brand || d.name || "?").trim()[0])}</b><span>${esc(cat)}</span></div>`}
    <span class="tag${/^\d\+\d$/.test(d.kind) ? " multi" : ""}">${esc(tagText(d))}</span>${extra}</div>`;
}
const unitLine = d => d.unit_price ? `<span class="unit"><b>${money(d.unit_price)}</b>/${t().perUnit[d.unit] || d.unit}</span>` : "";
const plus = on => on
  ? `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

function card(d) {
  const on = !!S.list[d.id], L = t();
  return `<article class="card" data-id="${d.id}" tabindex="0" aria-label="${esc(d.name)}, ${money(d.price)}, ${esc(d.store)}">
    ${photo(d, false, `<button type="button" class="add" data-add="${d.id}" aria-pressed="${on}" aria-label="${on ? L.added : L.add}">${plus(on)}</button>`)}
    <div class="body">
      <h3 class="name">${esc(d.name)}</h3>
      <span class="size">${esc(d.pack_size || "")}</span>
      <div class="priceline"><span class="price">${money(d.price)}</span>${d.old_price ? `<span class="old">${money(d.old_price)}</span>` : ""}</div>
      ${unitLine(d)}
      <div class="where">${logo(d.store)}<span>${kmText(d.store)}</span></div>
    </div></article>`;
}

function chipsHTML(items, active, attr) {
  return items.map(([key, label, n, extra]) =>
    `<button type="button" class="chip" ${attr}="${esc(key)}" aria-pressed="${active(key)}">${extra || ""}${esc(label)}${n != null ? ` <span class="n">${n}</span>` : ""}</button>`).join("");
}

function render() {
  const L = t();
  // facet counts: each filter group counts what the *other* filters leave
  const count = (skip, key) => { const m = new Map(); for (const d of DEALS) if (matches(d, skip)) m.set(d[key], (m.get(d[key]) || 0) + 1); return m; };
  const catN = count("cat", "cat"), kindN = count("kind", "group"), chainN = count("chain", "store");
  const totalCat = [...catN.values()].reduce((a, b) => a + b, 0);

  $("#tabs").innerHTML = [`<button type="button" data-cat="" aria-pressed="${!S.cat}">${L.allDeals}<sup>${totalCat}</sup></button>`]
    .concat(CAT_ORDER.filter(c => catN.get(c) || S.cat === c).map(c =>
      `<button type="button" data-cat="${c}" aria-pressed="${S.cat === c}">${L.cats[c]}<sup>${catN.get(c) || 0}</sup></button>`)).join("");

  $("#kinds").innerHTML = chipsHTML(
    KIND_ORDER.filter(k => kindN.get(k) || S.kinds.has(k)).map(k => [k, L.kinds[k], kindN.get(k) || 0]),
    k => S.kinds.has(k), "data-kind");

  const chains = [...new Set(DEALS.map(d => d.store))]
    .filter(c => chainN.get(c) || S.chains.has(c))
    .sort((a, b) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9) || a.localeCompare(b));
  $("#stores").innerHTML = chipsHTML(chains.map(c => {
    const C = CHAINS[c] || { bg: "#1D1B19" };
    return [c, c + (kmText(c) ? ` · ${kmText(c)}` : ""), chainN.get(c) || 0, `<span class="dot" style="background:${C.bg === "#fff" ? C.fg : C.bg}"></span>`];
  }), c => S.chains.has(c), "data-chain");

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
  $("#heroH").innerHTML = L.heroH;
  $("#trust").innerHTML = L.trust(DEALS.length, new Set(DEALS.map(d => d.store)).size);
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
  history.replaceState(null, "", s ? `?${s}` : location.pathname);
}

// ---------- details sheet ----------
let lastFocus = null;
function openDialog(bg, focusEl) { lastFocus = document.activeElement; bg.hidden = false; document.body.style.overflow = "hidden"; (focusEl || bg.querySelector("button,input,a"))?.focus(); }
function closeDialogs() {
  for (const id of ["#sheetBg", "#listBg", "#locDlg"]) $(id).hidden = true;
  document.body.style.overflow = ""; lastFocus?.focus?.();
}

function openDeal(id) {
  const d = DEALS.find(x => x.id === id) || S.list[id]; if (!d) return;
  const L = t(), F = L.facts, on = !!S.list[d.id], n = nearest[d.store];
  const save = d.old_price ? d.old_price - d.price : null;
  const dest = n ? `${n.b.lat},${n.b.lon}` : encodeURIComponent(`${d.store} ${S.pc || ""} Belgium`);
  const others = DEALS.filter(x => x.id !== d.id && x.cat === d.cat && x.cat !== "other" && inRadius(x) && x.unit === d.unit && x.unit_price)
    .sort(SORTS.value).slice(0, 4);
  $("#sheet").innerHTML = `
    <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    ${photo(d, true).replace('<span class="tag', '<span hidden class="tag')}
    <div>
      <span class="tag${/^\d\+\d$/.test(d.kind) ? " multi" : ""}">${esc(tagText(d))}</span>
      <h2 id="sheetTitle">${esc(d.name)}</h2>
      <div class="priceline"><span class="price">${money(d.price)}</span>${d.old_price ? `<span class="old">${money(d.old_price)}</span>` : ""}</div>
      <dl class="facts">
        ${d.unit_price ? `<dt>${F.unit} ${L.perUnit[d.unit] || d.unit}</dt><dd><b>${money(d.unit_price)}</b> <span class="unit">${L.effective}</span></dd>` : ""}
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
  openDialog($("#sheetBg"), $("#sheet .btn"));
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
  $("#drawer").innerHTML = `
    <div class="drawer-head"><h3 id="listTitle">${L.listTitle}</h3>
      <button type="button" class="x" data-close aria-label="${L.close}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
    <div class="drawer-body">${n ? Object.entries(by).map(([c, items]) => `<section><h4>${logo(c)} ${kmText(c) ? `· ${kmText(c)}` : ""}</h4><ul>${items.map(d =>
      `<li><span>${esc(d.name)}${d.promo_text ? ` <span class="unit">· ${esc(d.promo_text)}</span>` : ""}</span><span class="p">${money(d.price)}</span>
        <button type="button" data-add="${d.id}" aria-label="${L.remove}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></li>`).join("")}</ul></section>`).join("")
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
    if (el.dataset.lang) { S.lang = el.dataset.lang; store.set("lang", S.lang); renderStatic(); render(); return; }
    if (el.dataset.cat != null && el.closest("#tabs")) { S.cat = el.dataset.cat; S.shown = 48; render(); return; }
    if (el.dataset.kind) { S.kinds.has(el.dataset.kind) ? S.kinds.delete(el.dataset.kind) : S.kinds.add(el.dataset.kind); S.shown = 48; render(); return; }
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
  // hero photos fade in once loaded
  // hero photos fade in once loaded; if they can't load, the hero falls back to text only
  const imgs = [...document.querySelectorAll(".mosaic img")];
  let failed = 0;
  const fail = () => { if (++failed === imgs.length) $("#hero").classList.add("nophotos"); };
  imgs.forEach(img => {
    const on = () => img.classList.add("on");
    if (img.complete) img.naturalWidth ? on() : fail();
    else { img.addEventListener("load", on); img.addEventListener("error", fail); }
  });
}
function trap(e, root) {
  const f = [...root.querySelectorAll("button,a[href],input,select")].filter(x => !x.hidden && x.offsetParent);
  if (!f.length) return; const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ---------- start ----------
bind();
load().then(() => { renderStatic(); render(); });
})();
