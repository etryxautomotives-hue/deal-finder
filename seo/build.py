"""Makes deal'ke findable on Google. Runs in the daily workflow after the site is copied to _site/.

The app itself is JavaScript, so search engines see little text in it. This script writes plain HTML
landing pages from data/deals.json, one per search people actually type (see docs/SEO.md):

  /promoties/                    alle supermarkt promoties deze week     /promos/                     (FR twin)
  /promoties/aldi/ ...           "aldi promoties", "aldi folder"         /promos/aldi/ ...
  /promoties/1-plus-1-gratis/    "1+1 gratis"                            /promos/1-plus-1-gratuit/
  /promoties/vlees-vis/ ...      "vlees promotie"                        /promos/viande-poisson/ ...

plus sitemap.xml, robots.txt, and canonical / hreflang / Open Graph / JSON-LD tags in index.html.

The address of the site comes from --base-url (the workflow passes the SITE_URL repository variable),
so moving to a domain such as dealke.be is one setting, not a code change. Standard library only.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote, urlencode

DEFAULT_BASE_URL = "https://etryxautomotives-hue.github.io/deal-finder"
BRAND = "deal’ke"
MAX_ON_PAGE = 400   # deals listed as text on one page
MAX_IN_JSONLD = 60  # deals described as structured data on one page

MONTHS = {
    "nl": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus",
           "september", "oktober", "november", "december"],
    "fr": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
           "septembre", "octobre", "novembre", "décembre"],
}

CATS = {  # app key -> (NL slug, NL name, FR slug, FR name)
    "fruit_veg": ("groenten-fruit", "groenten en fruit", "fruits-legumes", "fruits et légumes"),
    "meat_fish": ("vlees-vis", "vlees en vis", "viande-poisson", "viande et poisson"),
    "dairy": ("zuivel-eieren", "zuivel en eieren", "produits-laitiers", "produits laitiers et œufs"),
    "bread": ("brood", "brood", "pain", "pain"),
    "pantry": ("voorraad", "voorraadkast en maaltijden", "epicerie", "épicerie et plats préparés"),
    "snacks": ("snacks-snoep", "snacks en snoep", "snacks-bonbons", "snacks et bonbons"),
    "drinks": ("dranken", "dranken", "boissons", "boissons"),
    "household": ("huishouden", "huishouden en verzorging", "entretien", "entretien et hygiène"),
}

# deal kinds people search for by name: key -> (kinds, NL slug, NL label, FR slug, FR label)
KINDS = {
    "1+1": ({"1+1"}, "1-plus-1-gratis", "1+1 gratis", "1-plus-1-gratuit", "1+1 gratuit"),
    "2+1": ({"2+1"}, "2-plus-1-gratis", "2+1 gratis", "2-plus-1-gratuit", "2+1 gratuit"),
    "2nd_half": ({"2nd_half"}, "tweede-halve-prijs", "2de aan halve prijs",
                 "deuxieme-moitie-prix", "2e à moitié prix"),
}

LANG = {
    "nl": {"root": "promoties", "locale": "nl_BE", "app": "nl"},
    "fr": {"root": "promos", "locale": "fr_BE", "app": "fr"},
}


# ---------- helpers ----------

def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def esc(v) -> str:
    return html.escape("" if v is None else str(v), quote=True)


def money(v: float, lang: str) -> str:
    return f"€ {v:,.2f}".replace(",", " ").replace(".", ",") if lang in ("nl", "fr") else f"€{v:.2f}"


def day(d: dt.date, lang: str) -> str:
    return f"{d.day} {MONTHS[lang][d.month - 1]}"


def week_label(today: dt.date, lang: str) -> str:
    """'3 – 9 november' style label for the week the build runs in."""
    end = today + dt.timedelta(days=6)
    if end.month == today.month:
        return f"{today.day} – {end.day} {MONTHS[lang][end.month - 1]}"
    return f"{day(today, lang)} – {day(end, lang)}"


def parse_date(s):
    try:
        return dt.date.fromisoformat(s) if s else None
    except ValueError:
        return None


def is_current(d: dict, today: dt.date) -> bool:
    until = parse_date(d.get("valid_until"))
    return until is None or until >= today


def score(d: dict) -> float:
    """Biggest saving first, so the best deals sit at the top of each page."""
    old, price = d.get("old_price"), d.get("price")
    if old and price and old > price:
        return (old - price) / old
    kind = d.get("deal_kind") or ""
    m = re.fullmatch(r"(\d)\+(\d)", kind)
    if m:
        a, b = int(m[1]), int(m[2])
        return b / (a + b)
    return {"2nd_half": 0.25, "2nd_pct": 0.15}.get(kind, 0.0)


def safe_json(x) -> str:
    """JSON for inside a <script> tag: a product name can never close the tag."""
    return json.dumps(x, ensure_ascii=False).replace("</", "<\\/")


def app_link(base: str, lang: str, **params) -> str:
    q = {k: v for k, v in params.items() if v}
    q["lang"] = LANG[lang]["app"]
    return f"{base}/?{urlencode(q, quote_via=quote, safe='+,')}"


# ---------- page model ----------

class Page:
    def __init__(self, lang, path, title, h1, intro, deals, app_url, twin=None, crumbs=()):
        self.lang, self.path, self.title, self.h1, self.intro = lang, path, title, h1, intro
        self.deals, self.app_url, self.twin, self.crumbs = deals, app_url, twin, crumbs

    @property
    def description(self) -> str:
        return self.intro[:155].rsplit(" ", 1)[0] + "…" if len(self.intro) > 158 else self.intro


def plan_pages(deals: list[dict], base: str, today: dt.date) -> list[Page]:
    deals = sorted((d for d in deals if is_current(d, today)), key=score, reverse=True)
    stores = sorted({d["store"] for d in deals})
    store_list = {"nl": ", ".join(stores[:-1]) + " en " + stores[-1] if len(stores) > 1 else "".join(stores),
                  "fr": ", ".join(stores[:-1]) + " et " + stores[-1] if len(stores) > 1 else "".join(stores)}
    pages: list[Page] = []

    def pair(nl: Page, fr: Page):
        nl.twin, fr.twin = fr, nl
        pages.extend([nl, fr])

    def wk(lang):
        return week_label(today, lang)

    n = len(deals)
    pair(
        Page("nl", "promoties/", f"Alle supermarkt promoties van deze week ({wk('nl')}) | {BRAND}",
             "Alle supermarkt promoties van deze week",
             f"{n} promoties van {store_list['nl']} op één plek, vergeleken op de echte prijs per kilo. "
             f"Elke ochtend bijgewerkt, zonder folders door te bladeren.",
             deals, app_link(base, "nl")),
        Page("fr", "promos/", f"Toutes les promos supermarché de la semaine ({wk('fr')}) | {BRAND}",
             "Toutes les promos supermarché de la semaine",
             f"{n} promos de {store_list['fr']} au même endroit, comparées au vrai prix au kilo. "
             f"Mis à jour chaque matin, sans feuilleter les dépliants.",
             deals, app_link(base, "fr")),
    )

    for s in stores:
        sd = [d for d in deals if d["store"] == s]
        sl = slug(s)
        pair(
            Page("nl", f"promoties/{sl}/", f"{s} promoties deze week ({wk('nl')}) | {s} folder | {BRAND}",
                 f"{s} promoties van deze week",
                 f"Alle {len(sd)} promoties uit de {s} folder van deze week, met 1+1 gratis, "
                 f"2de aan halve prijs en de prijs per kilo. Elke ochtend bijgewerkt.",
                 sd, app_link(base, "nl", store=s), crumbs=[("Promoties", "promoties/")]),
            Page("fr", f"promos/{sl}/", f"Promos {s} cette semaine ({wk('fr')}) | dépliant {s} | {BRAND}",
                 f"Promos {s} de la semaine",
                 f"Les {len(sd)} promos du dépliant {s} de cette semaine, avec 1+1 gratuit, "
                 f"2e à moitié prix et le prix au kilo. Mis à jour chaque matin.",
                 sd, app_link(base, "fr", store=s), crumbs=[("Promos", "promos/")]),
        )

    for key, (kinds, nl_slug, nl_label, fr_slug, fr_label) in KINDS.items():
        kd = [d for d in deals if d.get("deal_kind") in kinds]
        if not kd:
            continue
        pair(
            Page("nl", f"promoties/{nl_slug}/", f"{nl_label} promoties deze week ({wk('nl')}) | {BRAND}",
                 f"{nl_label}: alle promoties van deze week",
                 f"{len(kd)} producten met {nl_label} bij {store_list['nl']} deze week, "
                 f"van groot naar klein voordeel.",
                 kd, app_link(base, "nl", type=key), crumbs=[("Promoties", "promoties/")]),
            Page("fr", f"promos/{fr_slug}/", f"Promos {fr_label} cette semaine ({wk('fr')}) | {BRAND}",
                 f"{fr_label} : toutes les promos de la semaine",
                 f"{len(kd)} produits en {fr_label} chez {store_list['fr']} cette semaine, "
                 f"du plus grand au plus petit avantage.",
                 kd, app_link(base, "fr", type=key), crumbs=[("Promos", "promos/")]),
        )

    for key, (nl_slug, nl_name, fr_slug, fr_name) in CATS.items():
        cd = [d for d in deals if d.get("category") == key]
        if not cd:
            continue
        pair(
            Page("nl", f"promoties/{nl_slug}/", f"Promoties {nl_name} deze week ({wk('nl')}) | {BRAND}",
                 f"Promoties {nl_name} van deze week",
                 f"{len(cd)} promoties op {nl_name} bij {store_list['nl']}, vergeleken op prijs per kilo of liter.",
                 cd, app_link(base, "nl", cat=key), crumbs=[("Promoties", "promoties/")]),
            Page("fr", f"promos/{fr_slug}/", f"Promos {fr_name} cette semaine ({wk('fr')}) | {BRAND}",
                 f"Promos {fr_name} de la semaine",
                 f"{len(cd)} promos {fr_name} chez {store_list['fr']}, comparées au prix au kilo ou au litre.",
                 cd, app_link(base, "fr", cat=key), crumbs=[("Promos", "promos/")]),
        )
    return pages


# ---------- rendering ----------

UI = {
    "nl": {"open": "Open in deal’ke", "openSub": "Filter op jouw winkels in de buurt en zet alles op je boodschappenlijst.",
           "was": "was", "per": "per", "until": "tot", "from": "vanaf", "updated": "Bijgewerkt op",
           "more": "Nog {n} promoties: bekijk ze allemaal in de app", "stores": "Per winkel",
           "kinds": "Soort promotie", "cats": "Per afdeling", "home": "Home", "other": "In het Frans",
           "foot": "Prijzen en foto’s komen van de websites van de winkels. Controleer de prijs in de winkel."},
    "fr": {"open": "Ouvrir dans deal’ke", "openSub": "Filtrez sur vos magasins proches et ajoutez tout à votre liste de courses.",
           "was": "avant", "per": "par", "until": "jusqu’au", "from": "à partir du", "updated": "Mis à jour le",
           "more": "Encore {n} promos : voir tout dans l’app", "stores": "Par magasin",
           "kinds": "Type de promo", "cats": "Par rayon", "home": "Accueil", "other": "En néerlandais",
           "foot": "Prix et photos proviennent des sites des magasins. Vérifiez le prix en magasin."},
}

CSS = """
:root{--bg:#F6F4EE;--card:#fff;--line:#E7E3D9;--ink:#17150F;--muted:#69655B;--lime:#C6F135;--lime-soft:#EEF9CF;
--lime-ink:#2E4300;--mustard-soft:#F7EBD2;--serif:"Libre Baskerville",Georgia,serif;--sans:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 var(--sans)}
a{color:inherit}.wrap{max-width:1100px;margin:0 auto;padding:0 16px}
header{border-bottom:1px solid var(--line);background:var(--bg)}header .wrap{display:flex;align-items:center;gap:16px;min-height:64px}
.logo{font:700 22px var(--serif);text-decoration:none}.lang{margin-left:auto;font-size:14px}
.crumbs{font-size:14px;color:var(--muted);margin:16px 0 0}.crumbs a{color:var(--muted)}
h1{font:700 clamp(26px,4vw,39px)/1.2 var(--serif);margin:12px 0 8px}h2{font:700 20px var(--serif);margin:32px 0 12px}
.intro{color:var(--muted);max-width:60ch;margin:0 0 16px}.upd{font-size:13px;color:var(--muted)}
.cta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;background:var(--mustard-soft);border-radius:14px;padding:16px;margin:16px 0 24px}
.btn{display:inline-flex;align-items:center;min-height:44px;padding:0 24px;border-radius:10px;background:var(--lime);font-weight:700;text-decoration:none}
.cta p{margin:0;font-size:14px;flex:1 1 240px}
ol.deals{list-style:none;padding:0;margin:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.deal{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.deal h3{font-size:15px;margin:0;font-weight:600}.deal .meta{font-size:13px;color:var(--muted)}
.deal .price{font-weight:700}.deal s{color:var(--muted);font-weight:400;margin-left:6px}
.tag{display:inline-block;background:var(--lime-soft);color:var(--lime-ink);font-size:12.8px;font-weight:700;border-radius:999px;padding:1px 8px;margin-right:6px}
nav.links ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}nav.links a{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:14px;text-decoration:none}
.more{margin:16px 0}footer{margin-top:48px;border-top:1px solid var(--line);padding:24px 0;font-size:13px;color:var(--muted)}
"""


def deal_html(d: dict, lang: str) -> str:
    L = UI[lang]
    tag = f'<span class="tag">{esc(d["promo_text"])}</span>' if d.get("promo_text") else ""
    old = f'<s>{L["was"]} {money(d["old_price"], lang)}</s>' if d.get("old_price") else ""
    unit = ""
    if d.get("unit_price") and d.get("unit"):
        unit = f' · {money(d["unit_price"], lang)} {L["per"]} {esc(d["unit"])}'
    until = parse_date(d.get("valid_until"))
    when = f' · {L["until"]} {day(until, lang)}' if until else ""
    brand = f'{esc(d["brand"].title())} · ' if d.get("brand") else ""
    pack = f' · {esc(d["pack_size"])}' if d.get("pack_size") else ""
    return (f'<li class="deal"><h3>{esc(d["name"])}</h3>'
            f'<span class="meta">{brand}{esc(d["store"])}{pack}</span>'
            f'<span>{tag}<span class="price">{money(d["price"], lang)}</span>{old}</span>'
            f'<span class="meta">{unit.lstrip(" ·")}{when}</span></li>')


def jsonld_for(page: Page, base: str) -> list[dict]:
    url = f"{base}/{page.path}"
    items = []
    for i, d in enumerate(page.deals[:MAX_IN_JSONLD], 1):
        offer = {"@type": "Offer", "price": f'{d["price"]:.2f}', "priceCurrency": "EUR",
                 "availability": "https://schema.org/InStock",
                 "seller": {"@type": "Organization", "name": d["store"]}}
        if d.get("valid_until"):
            offer["priceValidUntil"] = d["valid_until"]
        if d.get("source_url"):
            offer["url"] = d["source_url"]
        product = {"@type": "Product", "name": d["name"], "offers": offer}
        if d.get("brand"):
            product["brand"] = {"@type": "Brand", "name": d["brand"].title()}
        if d.get("image_url"):
            product["image"] = d["image_url"]
        items.append({"@type": "ListItem", "position": i, "item": product})
    crumbs = [{"@type": "ListItem", "position": 1, "name": BRAND, "item": f"{base}/"}]
    for name, path in page.crumbs:
        crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": name, "item": f"{base}/{path}"})
    crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": page.h1, "item": url})
    return [
        {"@context": "https://schema.org", "@type": "ItemList", "name": page.h1, "url": url,
         "numberOfItems": len(page.deals), "itemListElement": items},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": crumbs},
    ]


def nav_html(pages: list[Page], lang: str, base: str, current: Page | None = None) -> str:
    L = UI[lang]
    root = LANG[lang]["root"]
    groups = {"stores": [], "kinds": [], "cats": []}
    kind_slugs = {v[1] for v in KINDS.values()} | {v[3] for v in KINDS.values()}
    cat_slugs = {v[0] for v in CATS.values()} | {v[2] for v in CATS.values()}
    for p in pages:
        if p.lang != lang or p.path == f"{root}/":
            continue
        s = p.path.split("/")[1]
        g = "kinds" if s in kind_slugs else "cats" if s in cat_slugs else "stores"
        label = p.h1.split(":")[0] if g == "kinds" else re.sub(
            r"^(Promoties |Promos )|( promoties)? van deze week$|( de la semaine)$", "", p.h1)
        aria = ' aria-current="page"' if p is current else ""
        groups[g].append(f'<li><a href="{base}/{p.path}"{aria}>{esc(label)}</a></li>')
    out = []
    for g in ("stores", "kinds", "cats"):
        if groups[g]:
            out.append(f'<nav class="links" aria-label="{L[g]}"><h2>{L[g]}</h2><ul>{"".join(groups[g])}</ul></nav>')
    return "".join(out)


def render(page: Page, pages: list[Page], base: str, today: dt.date) -> str:
    L, lang = UI[page.lang], page.lang
    url = f"{base}/{page.path}"
    twin_url = f"{base}/{page.twin.path}" if page.twin else url
    nl_url, fr_url = (url, twin_url) if lang == "nl" else (twin_url, url)
    crumbs = "".join(f'<a href="{base}/{p}">{esc(n)}</a> › ' for n, p in page.crumbs)
    shown = page.deals[:MAX_ON_PAGE]
    rest = len(page.deals) - len(shown)
    more = (f'<p class="more"><a class="btn" href="{esc(page.app_url)}">{L["more"].format(n=rest)}</a></p>'
            if rest > 0 else "")
    ld = "".join(f'<script type="application/ld+json">{safe_json(x)}</script>' for x in jsonld_for(page, base))
    return f"""<!doctype html>
<html lang="{lang}-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(page.title)}</title>
<meta name="description" content="{esc(page.description)}">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="nl-BE" href="{nl_url}">
<link rel="alternate" hreflang="fr-BE" href="{fr_url}">
<link rel="alternate" hreflang="x-default" href="{nl_url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="{LANG[lang]['locale']}">
<meta property="og:title" content="{esc(page.title)}">
<meta property="og:description" content="{esc(page.description)}">
<meta property="og:url" content="{url}">
<meta name="theme-color" content="#F6F4EE">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Libre+Baskerville:wght@700&display=swap">
<style>{CSS}</style>
{ld}
</head>
<body>
<header><div class="wrap"><a class="logo" href="{base}/?lang={lang}">{BRAND}</a>
<a class="lang" href="{twin_url}" hreflang="{page.twin.lang if page.twin else lang}">{L['other']}</a></div></header>
<main class="wrap">
<p class="crumbs"><a href="{base}/?lang={lang}">{L['home']}</a> › {crumbs}{esc(page.h1)}</p>
<h1>{esc(page.h1)}</h1>
<p class="intro">{esc(page.intro)}</p>
<p class="upd">{L['updated']} <time datetime="{today.isoformat()}">{day(today, lang)} {today.year}</time></p>
<div class="cta"><a class="btn" href="{esc(page.app_url)}">{L['open']}</a><p>{L['openSub']}</p></div>
<ol class="deals">{"".join(deal_html(d, lang) for d in shown)}</ol>
{more}
{nav_html(pages, lang, base, page)}
</main>
<footer><div class="wrap">{L['foot']}</div></footer>
</body>
</html>
"""


# ---------- the app's own page, sitemap, robots ----------

def patch_index(index_html: str, pages: list[Page], base: str) -> str:
    """Adds canonical, hreflang, Open Graph and JSON-LD to the app page, plus plain links to the landing pages."""
    marker = "<!-- seo:head -->"
    if marker in index_html:
        return index_html  # already patched
    title = re.search(r"<title>(.*?)</title>", index_html, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', index_html)
    title = html.unescape(title[1]) if title else BRAND
    desc = html.unescape(desc[1]) if desc else ""
    site = {"@context": "https://schema.org", "@type": "WebSite", "name": BRAND, "alternateName": "dealke",
            "url": f"{base}/", "inLanguage": ["nl-BE", "fr-BE"],
            "potentialAction": {"@type": "SearchAction", "target": f"{base}/?q={{search_term_string}}",
                                "query-input": "required name=search_term_string"}}
    head = f"""{marker}
<link rel="canonical" href="{base}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="nl_BE">
<meta property="og:locale:alternate" content="fr_BE">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{base}/">
<script type="application/ld+json">{safe_json(site)}</script>
<style>.seo-links{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 32px;font-size:14px;color:var(--muted,#69655B);margin-top:24px}}
.seo-links h2{{font-size:14px;margin:12px 0 4px}}.seo-links p{{margin:0}}
.seo-links ul{{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px 14px}}</style>
"""
    index_html = index_html.replace("</head>", head + "</head>", 1)
    if not pages:
        return index_html
    links = (f'<div class="wrap seo-links">'
             f'<div lang="nl"><p><a href="{base}/promoties/">Alle promoties deze week</a></p>{nav_html(pages, "nl", base)}</div>'
             f'<div lang="fr"><p><a href="{base}/promos/">Toutes les promos de la semaine</a></p>{nav_html(pages, "fr", base)}</div>'
             f'</div>')
    if "</footer>" in index_html:
        index_html = index_html.replace("</footer>", links + "\n</footer>", 1)
    return index_html


def sitemap(pages: list[Page], base: str, today: dt.date) -> str:
    def entry(loc, alts):
        a = "".join(f'<xhtml:link rel="alternate" hreflang="{h}" href="{u}"/>' for h, u in alts)
        return f"<url><loc>{loc}</loc><lastmod>{today.isoformat()}</lastmod><changefreq>daily</changefreq>{a}</url>"
    urls = [entry(f"{base}/", [])]  # the app switches language in place, so it has no language twins
    for p in pages:
        nl, fr = (p, p.twin) if p.lang == "nl" else (p.twin, p)
        urls.append(entry(f"{base}/{p.path}", [("nl-BE", f"{base}/{nl.path}"), ("fr-BE", f"{base}/{fr.path}")]))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(urls) + "\n</urlset>\n")


def robots(base: str) -> str:
    return f"User-agent: *\nAllow: /\n\nSitemap: {base}/sitemap.xml\n"


def build(site_dir: Path, deals_file: Path, base_url: str, today: dt.date | None = None) -> list[Page]:
    today = today or dt.date.today()
    base = base_url.rstrip("/")
    deals = json.loads(deals_file.read_text(encoding="utf-8")) if deals_file.exists() else []
    deals = [d for d in deals if d.get("name") and d.get("store") and d.get("price") is not None]
    pages = plan_pages(deals, base, today) if deals else []
    for p in pages:
        out = site_dir / p.path / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(p, pages, base, today), encoding="utf-8")
    index = site_dir / "index.html"
    if index.exists():
        index.write_text(patch_index(index.read_text(encoding="utf-8"), pages, base), encoding="utf-8")
    (site_dir / "sitemap.xml").write_text(sitemap(pages, base, today), encoding="utf-8")
    (site_dir / "robots.txt").write_text(robots(base), encoding="utf-8")
    return pages


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--site", default="_site", type=Path, help="built site folder to write into")
    ap.add_argument("--deals", default="data/deals.json", type=Path)
    ap.add_argument("--base-url", default="", help=f"public address of the site (default {DEFAULT_BASE_URL})")
    a = ap.parse_args()
    pages = build(a.site, a.deals, a.base_url or DEFAULT_BASE_URL)
    print(f"SEO: {len(pages)} landing pages, sitemap and robots.txt written to {a.site}")


if __name__ == "__main__":
    main()
