"""One-off: look at how each store's promo pages are built, so we know how to collect from them.

Run on GitHub Actions (the dev sandbox can't reach store sites). Saves raw pages and a summary in probe/.
Uses the same polite client as the collector (robots.txt, 5 s between requests).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

from collector.stores.base import PoliteClient

OUT = Path("probe")
CANDIDATES = {
    "im-img": ["https://folders.intermarche.be/.2026-s45fr/publication/contents/media/2730193/24710470.webp",
               "https://folders.intermarche.be/.2026-s45fr/publication/contents/media-epub/2730193/24710470.webp",
               "https://fr.zone-secure.net/863887/2730193/24710470.webp"],
}
SITEMAPS = {}
PROMO_WORDS = re.compile(r"promo|aanbied|bonus|actie|offre|folder", re.I)


def summarize(url: str, r) -> dict:
    html = r.text
    return {
        "url": url, "final_url": str(r.url), "status": r.status_code, "bytes": len(html),
        "jsonld_blocks": len(re.findall(r'application/ld\+json', html)),
        "jsonld_products": len(re.findall(r'"@type"\s*:\s*"Product"', html)),
        "next_data": "__NEXT_DATA__" in html, "nuxt": "__NUXT__" in html,
        "window_state": sorted(set(re.findall(r"window\.(__[A-Z_]+__)", html)))[:10],
        "price_mentions": len(re.findall(r"€\s?\d|\d,\d\d\s?€", html)),
        "api_urls": sorted(set(re.findall(r'https?://[^"\'\s<>]*api[^"\'\s<>]*', html)))[:40],
        "json_urls": sorted(set(re.findall(r'[^"\'\s<>]+\.json[^"\'\s<>]*', html)))[:40],
        "server": r.headers.get("server"),
        "promo_links": sorted({urljoin(url, h) for h in re.findall(r'href="([^"]+)"', html) if PROMO_WORDS.search(h)})[:60],
    }


def main() -> int:
    OUT.mkdir(exist_ok=True)
    c = PoliteClient(delay=4)
    report = {}
    for store, urls in CANDIDATES.items():
        for i, url in enumerate(urls):
            key = f"{store}-{i}"
            try:
                r = c.get(url)
                report[key] = summarize(url, r)
                report[key]["type"] = r.headers.get("content-type")
                (OUT / f"{key}.html").write_text(r.text[:8_000_000])
            except Exception as e:  # noqa: BLE001
                report[key] = {"url": url, "error": repr(e)[:300]}
            print(key, json.dumps(report[key])[:300], flush=True)
    for store, url in SITEMAPS.items():
        try:
            r = c.get(url)
            locs = re.findall(r"<loc>([^<]+)</loc>", r.text)
            report[f"sitemap-{store}"] = {"count": len(locs), "promo": [u for u in locs if PROMO_WORDS.search(u)][:80],
                                          "sub": [u for u in locs if u.endswith(".xml")][:40]}
        except Exception as e:  # noqa: BLE001
            report[f"sitemap-{store}"] = {"error": repr(e)[:300]}
    (OUT / "report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
