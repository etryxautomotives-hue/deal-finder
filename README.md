# Deal finder

Finds this week's grocery deals at Belgian supermarkets and ranks them by real price per kg or litre.

## Collector

`collector/` visits each store's promo pages once a day and saves every deal in one format
(`collector/models.py`): price, old price, pack size, price per kg/L, promo type, dates,
the store's product photo and a link back to the store page.

- `collector/parse.py` reads Belgian price, pack-size and promo text in Dutch and French.
- `collector/stores/` holds one collector per chain. Each respects robots.txt and waits 5 s between requests.
- `collector/run.py` runs them all and writes `data/deals.json` (read by the website) and `data/deals.sqlite` (history).
- `.github/workflows/collect.yml` runs it every morning on GitHub, with no Claude involved.

```
pip install -r requirements.txt
python -m pytest -q          # tests
python -m collector.run      # collect now
```

Before enabling a store, check its terms of use. See the design brief for the per-store notes.
