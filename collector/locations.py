"""Supermarket branches in Belgium and Zeeuws-Vlaanderen (NL) from OpenStreetMap, so the site can show
the nearest shop.

    python -m collector.locations    # writes data/stores.json

Zeeuws-Vlaanderen is the Dutch strip south of the Westerschelde (municipalities Sluis, Terneuzen and Hulst),
between Knokke-Heist and Antwerp. Each shop gets "cc": "BE" or "NL".

Uses the public Overpass API (OpenStreetMap data, ODbL licence: credit "© OpenStreetMap contributors").
Run weekly; shops rarely move.
"""
from __future__ import annotations

import json
import time
import logging
import re
import sys
from pathlib import Path

import httpx

log = logging.getLogger("locations")
DATA = Path(__file__).resolve().parent.parent / "data"
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
SHOPS = 'nwr["shop"~"^(supermarket|convenience|wholesale)$"]'
QUERY_BE = f"""[out:json][timeout:180];
area["ISO3166-1"="BE"][admin_level=2]->.be;
({SHOPS}(area.be););
out center tags;"""
ZV_MUNICIPALITIES = ("Sluis", "Terneuzen", "Hulst")  # together they are Zeeuws-Vlaanderen
QUERY_NL = f"""[out:json][timeout:120];
area["ISO3166-1"="NL"][admin_level=2]->.nl;
area["boundary"="administrative"]["admin_level"="8"]["name"~"^({'|'.join(ZV_MUNICIPALITIES)})$"]->.zv;
({SHOPS}(area.zv)(area.nl););
out center tags;"""
# Rough box around Zeeuws-Vlaanderen, a safety net in case a name above ever matches another place
ZV_BOX = (51.17, 3.35, 51.46, 4.30)  # south, west, north, east

# chain name on the site -> patterns matched against OSM brand/name tags (lowercase)
CHAINS = {  # order matters: the first match wins ("Louis Delhaize" before "Delhaize")
    "Colruyt": r"^colruyt", "Okay": r"^okay", "Bio-Planet": r"bio-?planet",
    "Louis Delhaize": r"^louis delhaize", "Alvo": r"^alvo\b", "Renmans": r"^renmans", "Ekoplaza": r"^ekoplaza",
    "Delitraiteur": r"^d[eé]litraiteur", "Cru": r"^cru\b",
    "Delhaize": r"delhaize|^proxy|shop.?n.?go", "Lidl": r"^lidl", "Aldi": r"^aldi",
    "Carrefour": r"carrefour", "Albert Heijn": r"albert heijn|^ah\b", "Intermarché": r"intermarch",
    "Spar": r"^(euro)?spar\b", "Match": r"^s?match\b", "Cora": r"^cora\b", "Jumbo": r"^jumbo\b", "Sligro": r"^sligro",
}
CHAINS_NL = {**CHAINS, "Plus": r"^plus\b", "Coop": r"^coop\b", "Dirk": r"^dirk\b", "Hoogvliet": r"^hoogvliet",
             "DekaMarkt": r"^deka ?markt"}  # Dutch-only chains, matched in Zeeuws-Vlaanderen only


def chain_of(tags: dict, chains: dict = CHAINS) -> str | None:
    for text in (tags.get("brand"), tags.get("name"), tags.get("operator")):
        t = (text or "").strip().lower()
        for chain, pattern in chains.items():
            if t and re.search(pattern, t):
                return chain
    return None


def to_stores(elements: list[dict], cc: str = "BE") -> list[dict]:
    out = []
    for el in elements:
        tags = el.get("tags", {})
        chain = chain_of(tags, CHAINS_NL if cc == "NL" else CHAINS)
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if not chain or lat is None or lon is None:
            continue
        if cc == "NL" and not (ZV_BOX[0] <= lat <= ZV_BOX[2] and ZV_BOX[1] <= lon <= ZV_BOX[3]):
            continue
        street = " ".join(x for x in (tags.get("addr:street"), tags.get("addr:housenumber")) if x)
        town = " ".join(x for x in (tags.get("addr:postcode"), tags.get("addr:city")) if x)
        out.append({"chain": chain, "name": tags.get("name") or chain, "lat": round(lat, 5), "lon": round(lon, 5),
                    "address": ", ".join(x for x in (street, town) if x) or None, "cc": cc})
    out.sort(key=lambda s: (s["cc"], s["chain"], s["name"]))
    return out


def fetch(query: str, cc: str) -> list[dict]:
    """Ask the public Overpass mirrors, two rounds; the main one is often busy."""
    for url in OVERPASS * 2:
        try:
            r = httpx.post(url, data={"data": query}, timeout=240,
                           headers={"User-Agent": "DealFinderBot/0.1 (store locations)"})
            r.raise_for_status()
            stores = to_stores(r.json().get("elements", []), cc)
            if stores:
                return stores
        except (httpx.HTTPError, ValueError) as e:
            log.warning("%s failed: %s", url, e)
        time.sleep(30)
    return []


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    path = DATA / "stores.json"
    old = json.loads(path.read_text()) if path.exists() else []
    be = fetch(QUERY_BE, "BE")
    if len(be) < 500:  # Belgium has thousands; a tiny result means Overpass had a bad day
        log.error("only %d Belgian stores found, keeping the old ones", len(be))
        be = [s for s in old if s.get("cc", "BE") == "BE"]
    nl = fetch(QUERY_NL, "NL")
    if len(nl) < 10:  # Zeeuws-Vlaanderen has a few dozen supermarkets
        log.error("only %d Zeeuws-Vlaanderen stores found, keeping the old ones", len(nl))
        nl = [s for s in old if s.get("cc") == "NL"]
    if not be:
        return 1
    for s in be:
        s.setdefault("cc", "BE")
    DATA.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(be + nl, ensure_ascii=False, separators=(",", ":")))
    log.info("saved %d Belgian and %d Zeeuws-Vlaanderen stores", len(be), len(nl))
    return 0


if __name__ == "__main__":
    sys.exit(main())
