"""Delhaize. The promotions page is rendered on the server: each product is a data-testid="product-block" tile.

The page shows 20 products at a time; we walk the pages with ?pageNumber= until a page adds nothing new.
"""
from __future__ import annotations

import logging
import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from collector.models import Deal
from collector.parse import parse_price
from collector.stores.base import Store

log = logging.getLogger(__name__)
PROMO_URL = "https://www.delhaize.be/nl/Promolandingpage"
MAX_PAGES = 80  # 20 per page; Delhaize lists about 1,300 promotions


def _text(node, testid: str) -> str | None:
    el = node.find(attrs={"data-testid": testid})
    return el.get_text(" ", strip=True) if el else None


def parse_page(html: str, page_url: str = PROMO_URL) -> list[Deal]:
    soup = BeautifulSoup(html, "html.parser")
    deals = []
    for block in soup.find_all(attrs={"data-testid": "product-block"}):
        price_el = block.find(attrs={"data-testid": "product-block-price"})
        # aria-label reads "Prijs: 2 euro 25 cent"; the visible text is split into € / 2 / 25
        price = None
        if price_el is not None:
            m = re.search(r"(\d+)\s*euro(?:\s*(\d+)\s*cent)?", price_el.get("aria-label") or "")
            price = int(m.group(1)) + int(m.group(2) or 0) / 100 if m else parse_price(price_el.get_text("", strip=True))
        name = re.sub(r"\s*\|\s*", ", ", _text(block, "product-name") or "").strip(", ") or None
        if not price or not name:
            continue
        label = _text(block, "tag-promo-label")
        tag = block.find(attrs={"data-testid": "tag-promo"})
        member = tag is not None and tag.get("data-promo-type") == "MEMBER"
        if label and re.fullmatch(r"€\s*\d+[.,]\d+", label):  # a plain new price, e.g. "€1.49"
            label = "Actieprijs"
        unit = _text(block, "product-block-price-per-unit") or ""
        um = re.search(r"(\d+(?:,\d+)?)\s*€\s*/\s*(kg|l|st)", unit, re.I)
        link = block.find(attrs={"data-testid": "product-block-image-link"})
        img = block.find("img")
        brand = (_text(block, "product-brand") or "").strip() or None
        deals.append(Deal(
            store="Delhaize", name=f"{brand} {name}" if brand and brand.lower() != "delhaize" else name, brand=brand,
            price=round(price, 2), pack_size=_text(block, "product-block-supplementary-price"),
            promo_text=(f"{label} (SuperPlus)" if member and label else label),
            unit_price=float(um.group(1).replace(",", ".")) if um and not label else None,
            unit={"kg": "kg", "l": "L", "st": "piece"}.get(um.group(2).lower()) if um else None,
            image_url=img.get("src") if img else None,
            source_url=urljoin(page_url, link.get("href")) if link and link.get("href") else page_url,
            language="nl",
        ))
    return deals


class Delhaize(Store):
    name = "Delhaize"

    def collect(self) -> list[Deal]:
        deals, seen = [], set()
        for page in range(MAX_PAGES):
            url = PROMO_URL if page == 0 else f"{PROMO_URL}?pageNumber={page}"
            new = [d for d in parse_page(self.client.get(url).text, url) if d.source_url not in seen]
            if not new:
                break
            seen.update(d.source_url for d in new)
            deals += new
        log.info("Delhaize: %d promotions over %d pages", len(deals), page + 1)
        return deals
