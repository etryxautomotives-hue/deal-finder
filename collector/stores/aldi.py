"""ALDI Belgium. The offers page embeds every product as JSON in Next.js data (__NEXT_DATA__ → apiData)."""
from __future__ import annotations

import json
import re
from datetime import date

from collector.models import Deal
from collector.stores.base import Store

OFFERS_URL = "https://www.aldi.be/nl/aanbiedingen.html"
_UNITS = {"per kg": "kg", "per l": "L", "per st.": "piece", "per stuk": "piece"}


def _products(html: str) -> list[dict]:
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return []
    data = json.loads(m.group(1))
    api = data.get("props", {}).get("pageProps", {}).get("apiData")
    if isinstance(api, str):
        api = json.loads(api)
    found: list[dict] = []

    def walk(node):
        if isinstance(node, dict):
            if "currentPrice" in node and "name" in node:
                found.append(node)
                return
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(api)
    seen, out = set(), []
    for p in found:  # the same product can appear in several page blocks
        key = p.get("objectID") or p["name"]
        if key not in seen:
            seen.add(key)
            out.append(p)
    return out


def _date(s: str | None) -> date | None:
    try:
        return date.fromisoformat(s) if s else None
    except ValueError:
        return None


def parse_offers(html: str, page_url: str = OFFERS_URL) -> list[Deal]:
    deals = []
    for p in _products(html):
        price = p.get("currentPrice") or {}
        base = (price.get("basePrice") or [{}])[0]
        label = (price.get("priceTagLabels") or {}).get("promoText1")
        old = (price.get("strikePrice") or {}).get("strikePriceValue")
        # Groceries carry a price per kg/L by law; clothes, toys and gadgets don't. We only want groceries.
        if not base.get("basePriceValue") or (not label and not old) or price.get("priceValue") is None:
            continue
        promo = (p.get("promotionPrices") or [{}])[0]
        scale = (base.get("basePriceScale") or "").split(":")[-1].strip().lower()
        if label and label.strip().lower() == "2 voor":
            label = f"2 voor € {price['priceValue']:.2f}".replace(".", ",")
        img = next((a["url"] for a in p.get("assets", []) if a.get("type") == "primary"), None)
        brand = (p.get("brandName") or "").replace("®", "").strip() or None
        name = p["name"] if not brand else f"{p['name']} {brand.title()}"
        deals.append(Deal(
            store="Aldi", name=name, brand=brand, price=float(price["priceValue"]),
            old_price=float(old) if old else None, pack_size=p.get("salesUnit"),
            promo_text=label if label and label.upper() not in ("PROMO",) else ("Prijsdaling" if old else None),
            # ALDI's price already covers the whole offer (e.g. both packs of a 1+1), so its own per-kg price is right
            unit_price=float(base["basePriceValue"]), unit=_UNITS.get(scale),
            valid_from=_date(promo.get("validFromLocalDate")), valid_until=_date(promo.get("validUntilLocalDate")),
            image_url=f"{img}?wid=600&hei=600&fit=fit" if img else None,
            source_url=page_url, language="nl",
        ))
    return deals


class Aldi(Store):
    name = "Aldi"

    def collect(self) -> list[Deal]:
        return parse_offers(self.client.get(OFFERS_URL).text)
