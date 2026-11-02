"""Run every enabled store collector and save this week's deals.

    python -m collector.run            # all stores
    python -m collector.run lidl aldi  # only these

Output: data/deals.json (for the website) and data/deals.sqlite (history).
"""
from __future__ import annotations

import json
import logging
import sqlite3
import sys
from datetime import date, datetime, timezone
from pathlib import Path

from collector.models import Deal
from collector.parse import categorize, deal_kind, effective_price, parse_quantity, promo_type, unit_price
from collector.stores import STORES
from collector.stores.base import PoliteClient

log = logging.getLogger("collector")
DATA = Path(__file__).resolve().parent.parent / "data"


def enrich(deal: Deal) -> Deal:
    """Fill in what we can compute: pack size, price per kg/L and promo type."""
    if deal.quantity is None:
        q = parse_quantity(deal.pack_size) or parse_quantity(deal.name)
        if q:
            deal.quantity, deal.unit = q
    deal.promo_type = deal.promo_type or promo_type(deal.promo_text)
    deal.deal_kind = deal.deal_kind or deal_kind(deal.promo_text)
    deal.category = deal.category or categorize(deal.name)
    if deal.unit_price is None:  # some stores give their own (more reliable) price per kg/L
        deal.unit_price = unit_price(effective_price(deal.price, deal.promo_text), deal.quantity)
    return deal


def is_current(deal: Deal, today: date) -> bool:
    if deal.valid_until and deal.valid_until < today:
        return False
    return True


def save(deals: list[Deal], data_dir: Path = DATA) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    rows = [d.to_dict() for d in deals]
    (data_dir / "deals.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    meta = {"collected_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "deals": len(rows),
            "stores": sorted({r["store"] for r in rows})}
    (data_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False))
    db = sqlite3.connect(data_dir / "deals.sqlite")
    db.execute("""CREATE TABLE IF NOT EXISTS deals (
        store TEXT, name TEXT, brand TEXT, category TEXT, price REAL, old_price REAL,
        pack_size TEXT, quantity REAL, unit TEXT, unit_price REAL, promo_text TEXT, promo_type TEXT, deal_kind TEXT,
        valid_from TEXT, valid_until TEXT, image_url TEXT, source_url TEXT, language TEXT, collected_at TEXT)""")
    cols = ["store", "name", "brand", "category", "price", "old_price", "pack_size", "quantity", "unit",
            "unit_price", "promo_text", "promo_type", "deal_kind", "valid_from", "valid_until", "image_url",
            "source_url", "language", "collected_at"]
    db.executemany(f"INSERT INTO deals VALUES ({','.join('?' * len(cols))})",
                   [[r[c] for c in cols] for r in rows])
    db.commit()
    db.close()


def main(only: list[str]) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    client = PoliteClient()
    today = date.today()
    all_deals: list[Deal] = []
    failed = []
    for key, cls in STORES.items():
        if (only and key not in only) or (not only and not cls.enabled):
            continue
        try:
            deals = [enrich(d) for d in cls(client).collect()]
            deals = [d for d in deals if is_current(d, today)]
            log.info("%s: %d deals", cls.name, len(deals))
            all_deals += deals
        except Exception:  # one broken store must not stop the others
            log.exception("%s failed", cls.name)
            failed.append(cls.name)
    save(all_deals)
    log.info("saved %d deals, failed stores: %s", len(all_deals), failed or "none")
    return 1 if failed and not all_deals else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
