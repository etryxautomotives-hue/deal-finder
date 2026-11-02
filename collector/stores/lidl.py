"""Lidl Belgium. The weekly offers page puts each product's data, as JSON, in a data-grid-data attribute."""
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


def parse_offers(page: str, page_url: str = OFFERS_URL) -> list[Deal]:
    lang = "fr" if "/fr-BE/" in page_url else "nl"
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
        m = re.search(r"(\d+(?:,\d+)?)\s*EUR/(kg|l)\b", base, re.I)
        if not m:
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
            unit_price=to_float(m.group(1)), unit="kg" if m.group(2).lower() == "kg" else "L",
            valid_from=_date(p.get("storeStartDate")), valid_until=_date(p.get("storeEndDate")),
            image_url=p.get("image"), source_url="https://www.lidl.be" + (p.get("canonicalUrl") or ""),
            language=lang,
        ))
    return deals


class Lidl(Store):
    name = "Lidl"

    def collect(self) -> list[Deal]:
        return parse_offers(self.client.get(OFFERS_URL).text)
