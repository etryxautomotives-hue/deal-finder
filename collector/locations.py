"""Supermarket branches in Belgium from OpenStreetMap, so the site can show the nearest shop.

    python -m collector.locations    # writes data/stores.json

Uses the public Overpass API (OpenStreetMap data, ODbL licence: credit "© OpenStreetMap contributors").
Run weekly; shops rarely move.
"""
from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path

import httpx

log = logging.getLogger("locations")
DATA = Path(__file__).resolve().parent.parent / "data"
OVERPASS = "https://overpass-api.de/api/interpreter"
QUERY = """[out:json][timeout:180];
area["ISO3166-1"="BE"][admin_level=2]->.be;
(nwr["shop"~"^(supermarket|convenience|wholesale)$"](area.be););
out center tags;"""

# chain name on the site -> patterns matched against OSM brand/name tags (lowercase)
CHAINS = {
    "Colruyt": r"^colruyt", "Okay": r"^okay", "Bio-Planet": r"bio-?planet",
    "Delhaize": r"delhaize|^proxy|shop.?n.?go", "Lidl": r"^lidl", "Aldi": r"^aldi",
    "Carrefour": r"carrefour", "Albert Heijn": r"albert heijn|^ah\b", "Intermarché": r"intermarch",
    "Spar": r"^spar\b", "Match": r"^s?match\b", "Cora": r"^cora\b", "Jumbo": r"^jumbo\b", "Sligro": r"^sligro",
}


def chain_of(tags: dict) -> str | None:
    for text in (tags.get("brand"), tags.get("name"), tags.get("operator")):
        t = (text or "").strip().lower()
        for chain, pattern in CHAINS.items():
            if t and re.search(pattern, t):
                return chain
    return None


def to_stores(elements: list[dict]) -> list[dict]:
    out = []
    for el in elements:
        tags = el.get("tags", {})
        chain = chain_of(tags)
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if not chain or lat is None or lon is None:
            continue
        street = " ".join(x for x in (tags.get("addr:street"), tags.get("addr:housenumber")) if x)
        town = " ".join(x for x in (tags.get("addr:postcode"), tags.get("addr:city")) if x)
        out.append({"chain": chain, "name": tags.get("name") or chain, "lat": round(lat, 5), "lon": round(lon, 5),
                    "address": ", ".join(x for x in (street, town) if x) or None})
    out.sort(key=lambda s: (s["chain"], s["name"]))
    return out


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    r = httpx.post(OVERPASS, data={"data": QUERY}, timeout=240,
                   headers={"User-Agent": "DealFinderBot/0.1 (store locations)"})
    r.raise_for_status()
    stores = to_stores(r.json().get("elements", []))
    if len(stores) < 500:  # Belgium has thousands; a tiny result means Overpass had a bad day
        log.error("only %d stores found, keeping the old file", len(stores))
        return 1
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "stores.json").write_text(json.dumps(stores, ensure_ascii=False, separators=(",", ":")))
    log.info("saved %d stores", len(stores))
    return 0


if __name__ == "__main__":
    sys.exit(main())
