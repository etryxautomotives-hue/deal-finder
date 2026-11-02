"""Intermarché Belgium. The weekly folder is an online flipbook whose shopping-list feature
loads every product of the folder from one JSON file (products.json), with price, promo and photo.

Steps: folder overview page → newest folder page → flipbook address (folders.intermarche.be/.<slug>/)
→ <flipbook>/publication/contents/templates/wishlistV4/products.json
"""
from __future__ import annotations

import html as htmllib
import re
from datetime import date, timedelta

from collector.models import Deal
from collector.parse import parse_quantity
from collector.stores.base import Store

INDEX_URL = "https://www.intermarche.be/folders/"
PRODUCTS = "publication/contents/templates/wishlistV4/products.json"
CONFIG = "publication/contents/templates/wishlistV4/config.json"
_MEDIA = re.compile(r'(https://[a-z]+\.zone-secure\.net/\d+/)\d+/publication/')

_FOLDER_LINK = re.compile(r'href="(https://www\.intermarche\.be/(?:nl/)?folders/[a-z0-9-]*?-(\d\d)-(\d\d)-(\d\d)/)"')
_FLIPBOOK = re.compile(r'(https://folders\.intermarche\.be/\.[A-Za-z0-9_-]+/)')

# Intermarché's aisle ("Rayon") -> our category
_RAYON = {
    "épicerie sucrée": "snacks", "épicerie salée": "pantry", "fruits & légumes frais et secs": "fruit_veg",
    "crèmerie": "dairy", "fromage": "dairy", "softs & bières": "drinks", "vins, bulles & alcools": "drinks",
    "surgelés": "pantry", "droguerie": "household", "hygiène corporelle": "household", "charcuterie": "meat_fish",
    "volaille": "meat_fish", "boucherie": "meat_fish", "poissons & crustacés": "meat_fish",
    "traiteur & plats végétariens": "pantry", "boulangerie & pâtisserie": "bread", "animaux": "other",
    "non-alimentaire": "other",
}
# "Unite" says what the price is for: per kilo, per 100 g, per piece or a pack ("Le filet de 3kg")
_PER_KG = re.compile(r"^(le|la|les)\s+(kilo|kg)$", re.I)
_PER_100G = re.compile(r"^les\s+100\s*g$", re.I)


def folder_pages(index_html: str, today: date) -> list[tuple[date, str]]:
    """Folder pages on the overview, newest first, leaving out folders that start more than 3 days from now."""
    found = {}
    for url, d, m, y in _FOLDER_LINK.findall(index_html):
        try:
            start = date(2000 + int(y), int(m), int(d))
        except ValueError:
            continue
        if start <= today + timedelta(days=3):
            found.setdefault(start, url)
    return sorted(found.items(), reverse=True)


def flipbook_url(folder_html: str) -> str | None:
    m = _FLIPBOOK.search(folder_html)
    return m.group(1) if m else None


def image_dir(book_html: str, config: dict) -> str | None:
    """Where the product photos live: config.json says "${media}<id>/", the flipbook page names the media host."""
    folder = (config.get("products", {}).get("images", {}) or {}).get("folderUrl") or ""
    m = _MEDIA.search(book_html)
    if not m or "${media}" not in folder:
        return None
    return folder.replace("${media}", m.group(1))


def _lines(desc: str | None) -> list[str]:
    text = re.sub(r"</?br\s*/?>", "\n", desc or "", flags=re.I)
    text = htmllib.unescape(re.sub(r"<[^>]+>", "", text))
    return [ln.strip() for ln in text.splitlines() if ln.strip()]


def _num(v) -> float | None:
    try:
        return float(str(v).replace(",", ".")) if v not in (None, "") else None
    except ValueError:
        return None


def parse_products(rows: list[dict], flipbook: str, start: date | None, images: str | None = None) -> list[Deal]:
    deals = []
    until = start + timedelta(days=7) if start else None
    for p in rows:
        price = _num(p.get("Prix"))
        title = (p.get("Nom produit") or "").strip()
        if price is None or not title:
            continue
        promo = (p.get("promo") or "").replace("*", "").strip()
        card = (p.get("promo_carte") or "").replace("*", "").strip()
        old = _num(p.get("Prix barré"))
        if promo:
            text = promo
        elif card:
            text = f"{card} (carte Intermarché)"
        else:
            text = "Prix promo"  # a folder price without a multi-buy: the folder's own reduced price
        lines = _lines(p.get("Descriptif"))
        variety = re.search(r"<b>(.*?)</b>", p.get("Descriptif") or "", re.S)
        variety = htmllib.unescape(re.sub(r"<[^>]+>", "", variety.group(1))).strip() if variety else None
        name = f"{title} {variety}" if variety and variety.lower() not in title.lower() else title
        unit_txt = (p.get("Unite") or "").strip()
        pack = next((ln for ln in lines if parse_quantity(ln)), None) or (unit_txt if parse_quantity(unit_txt) else None)
        quantity = unit = unit_price = None
        # price per kilo or per 100 g: the run step turns it into a price per kg after the promo (3+3 → half)
        if _PER_KG.match(unit_txt):
            quantity, unit, pack = 1.0, "kg", unit_txt   # the price is per kilo, so say so instead of "±250g"
        elif _PER_100G.match(unit_txt):
            quantity, unit, pack = 0.1, "kg", unit_txt
        if "in pack" in promo.lower():  # "10+10 GRATIS IN PACK": the extra is already in the pack you pay for
            q = parse_quantity(pack) or parse_quantity(unit_txt)
            if q:
                quantity, unit = q
                unit_price = round(price / quantity, 2) if quantity else None
        m = re.match(r"^-\s*(\d+)\s*%$", promo)
        if m and old is None:  # "-30%": the shown price already has the discount in it
            old = round(price / (1 - int(m.group(1)) / 100), 2)
        img = (p.get("images") or "").split("|")[0].strip()
        deals.append(Deal(
            store="Intermarché", name=name, brand=title if variety else None, price=price, old_price=old,
            pack_size=pack, quantity=quantity, unit=unit, unit_price=unit_price,
            promo_text=text, category=_RAYON.get((p.get("Rayon") or "").strip().lower()),
            valid_from=start, valid_until=until,
            image_url=f"{images}{img}" if img and images else None,
            source_url=flipbook, language="fr",
        ))
    return deals


class Intermarche(Store):
    name = "Intermarché"

    def collect(self) -> list[Deal]:
        index = self.client.get(INDEX_URL).text
        for start, page in folder_pages(index, date.today())[:3]:
            book = flipbook_url(self.client.get(page).text)
            if not book:
                continue
            rows = self.client.get(book + PRODUCTS).json()
            if not rows:
                continue
            try:
                images = image_dir(self.client.get(book).text, self.client.get(book + CONFIG).json())
            except Exception:  # noqa: BLE001  photos are nice to have; the deals still count without them
                images = None
            return parse_products(rows, book, start, images)
        return []
