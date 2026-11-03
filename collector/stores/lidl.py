"""Lidl Belgium and Lidl Netherlands. The weekly offers page puts each product's data, as JSON, in a data-grid-data attribute."""
from __future__ import annotations

import html as htmllib
import json
import re
from datetime import datetime, timezone

from collector.models import Deal
from collector.parse import to_float
from collector.stores.base import Store

OFFERS_URL = "https://www.lidl.be/c/nl-BE/store/acties-deze-week/a10082242"
_COUNT = re.compile(r"(?:pour|voor|à l.achat de|bij aankoop van)\s+(\d+)", re.I)


def _date(ts) -> datetime | None:
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc).date() if ts else None
    except (TypeError, ValueError):
        return None


def _promo(pct: int | None, note: str, lang: str) -> str | None:
    """Lidl gives the % off and, in the note, how many you must buy ("... pour 2 pièces")."""
    if not pct:
        return None
    m = _COUNT.search(note or "")
    n = int(m.group(1)) if m else 1
    free = n * pct / 100
    if n > 1 and abs(free - round(free)) < 0.02 and round(free) >= 1:
        paid, free = n - round(free), round(free)
        return f"{paid}+{free} " + ("gratis" if lang == "nl" else "gratuit")
    if n == 2 and pct == 25:
        return "2de aan halve prijs" if lang == "nl" else "2e à moitié prix"
    return f"-{pct}%"


_PER = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:EUR|€)?\s*/\s*(kg|l)\b", re.I)            # "1,98 EUR/kg" (BE)
_PER_NL = re.compile(r"\b1?\s*(kg|l)\s*=\s*(?:€|EUR)?\s*(\d+(?:[.,]\d+)?)", re.I)   # "1 kg = € 3,96" (NL)


def _per_unit(text: str) -> tuple[float, str] | None:
    if m := _PER.search(text):
        return to_float(m.group(1)), "kg" if m.group(2).lower() == "kg" else "L"
    if m := _PER_NL.search(text):
        return to_float(m.group(2)), "kg" if m.group(1).lower() == "kg" else "L"
    return None


def parse_offers(page: str, page_url: str = OFFERS_URL) -> list[Deal]:
    lang = "fr" if "/fr-BE/" in page_url else "nl"
    host = "https://www.lidl.nl" if "lidl.nl" in page_url else "https://www.lidl.be"
    deals, seen = [], set()
    for raw in re.findall(r'data-grid-data="([^"]+)"', page):
        try:
            p = json.loads(htmllib.unescape(raw))
        except json.JSONDecodeError:
            continue
        price = p.get("price") or {}
        disc = price.get("discount") or {}
        base = (price.get("basePrice") or {}).get("text") or ""
        if not price.get("price") or not disc.get("percentageDiscount") or p.get("productId") in seen:
            continue
        # groceries show a price per kg or litre; flowers, clothes and gadgets don't
        per = _per_unit(base)
        if not per:
            continue
        seen.add(p.get("productId"))
        pack = base.split(" - ")[0].strip() or None
        note = (p.get("keyfacts") or {}).get("supplementalDescription") or ""
        old = price.get("oldPrice") or disc.get("deletedPrice")
        brand = (p.get("brand") or {}).get("name") if isinstance(p.get("brand"), dict) else None
        deals.append(Deal(
            store="Lidl", name=p.get("fullTitle") or p.get("title"), brand=(brand or "").replace("®", "").strip() or None,
            price=float(price["price"]), old_price=float(old) if old else None, pack_size=pack,
            promo_text=_promo(disc.get("percentageDiscount"), note, lang),
            # Lidl's price covers the whole offer (e.g. both packs), so its own per-kg price is the right one
            unit_price=per[0], unit=per[1],
            valid_from=_date(p.get("storeStartDate")), valid_until=_date(p.get("storeEndDate")),
            image_url=p.get("image"), source_url=host + (p.get("canonicalUrl") or ""),
            language=lang, cc="NL" if "lidl.nl" in host else "BE",
        ))
    return deals


class Lidl(Store):
    name = "Lidl"

    def collect(self) -> list[Deal]:
        return parse_offers(self.client.get(OFFERS_URL).text)


class LidlNL(Store):
    """Lidl Nederland, for the shops in Zeeuws-Vlaanderen (robots.txt allows these pages).

    The offers hub (/c/aanbiedingen/a10008785) links to this week's sub-pages ("vanaf maandag", ...) whose
    addresses change every week, so we read the hub and follow its offer links."""
    name = "Lidl NL"
    hub = "https://www.lidl.nl/c/aanbiedingen/a10008785"
    max_pages = 6

    def collect(self) -> list[Deal]:
        page = self.client.get(self.hub).text
        deals = parse_offers(page, self.hub)
        for path in offer_links(page, self.hub)[: self.max_pages]:
            deals += parse_offers(self.client.get("https://www.lidl.nl" + path).text, "https://www.lidl.nl" + path)
        seen, out = set(), []
        for d in deals:
            if (d.name, d.price) not in seen:
                seen.add((d.name, d.price))
                out.append(d)
        return out


_OFFER_WORDS = ("aanbieding", "deze-week", "vanaf", "actie", "week", "korting")


def offer_links(page: str, current: str) -> list[str]:
    """Offer sub-pages linked from a Lidl NL page, relative or absolute, without the page itself."""
    here = current.replace("https://www.lidl.nl", "")
    found = re.findall(r'href="(?:https://www\.lidl\.nl)?(/c/[^"?#]+/[as]\d+)"', page)
    return [p for p in dict.fromkeys(found) if p != here and any(w in p.lower() for w in _OFFER_WORDS)]
