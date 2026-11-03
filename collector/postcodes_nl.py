"""Dutch postal codes (PC4) for Zeeuws-Vlaanderen, so people around Terneuzen, Hulst and Sluis can use the site.

    python -m collector.postcodes_nl    # writes data/postcodes-nl.json

Source: GeoNames postal codes (CC BY 4.0, credit "GeoNames"). Zeeuws-Vlaanderen uses 4500-4589.
Those numbers overlap with Belgian codes around Huy/Liège (4500, 4530 ...), so the site keeps the
two lists apart. Postcodes hardly ever change: run it once, or when the file is missing.
"""
from __future__ import annotations

import io
import json
import logging
import sys
import zipfile
from pathlib import Path

import httpx

from collector.locations import ZV_BOX

log = logging.getLogger("postcodes_nl")
DATA = Path(__file__).resolve().parent.parent / "data"
SOURCE = "https://download.geonames.org/export/zip/NL.zip"
FIRST, LAST = 4500, 4589


def parse(text: str) -> dict[str, list]:
    """GeoNames rows -> {"4531": [lat, lon, "Terneuzen"]}; several rows per code are averaged."""
    rows: dict[str, list] = {}
    for line in text.splitlines():
        f = line.split("\t")
        if len(f) < 11 or f[0] != "NL":
            continue
        pc = f[1].strip()[:4]
        try:
            lat, lon = float(f[9]), float(f[10])
        except ValueError:
            continue
        if not (pc.isdigit() and FIRST <= int(pc) <= LAST):
            continue
        if not (ZV_BOX[0] <= lat <= ZV_BOX[2] and ZV_BOX[1] <= lon <= ZV_BOX[3]):
            continue
        rows.setdefault(pc, []).append((lat, lon, f[2].strip()))
    out = {}
    for pc in sorted(rows):
        r = rows[pc]
        out[pc] = [round(sum(x[0] for x in r) / len(r), 4), round(sum(x[1] for x in r) / len(r), 4), r[0][2]]
    return out


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        r = httpx.get(SOURCE, timeout=120, follow_redirects=True,
                      headers={"User-Agent": "DealFinderBot/0.1 (postal codes)"})
        r.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            pcs = parse(z.read("NL.txt").decode("utf-8"))
    except (httpx.HTTPError, zipfile.BadZipFile, KeyError) as e:
        log.error("download failed: %s", e)
        return 1
    if len(pcs) < 30:
        log.error("only %d postal codes found, not saving", len(pcs))
        return 1
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "postcodes-nl.json").write_text(json.dumps(pcs, ensure_ascii=False, separators=(",", ":")))
    log.info("saved %d Zeeuws-Vlaanderen postal codes", len(pcs))
    return 0


if __name__ == "__main__":
    sys.exit(main())
