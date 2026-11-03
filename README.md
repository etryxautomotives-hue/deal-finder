# deal'ke

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

## Website

`site/` is the website: plain HTML, CSS and JavaScript, no build step, so it loads fast and can be hosted anywhere static
(GitHub Pages is set up in the workflow). It reads:

- `data/deals.json`, written every morning by the collector
- `data/stores.json`, shop locations from OpenStreetMap (`python -m collector.locations`, refreshed weekly)
- `data/postcodes-nl.json`, Dutch postal codes for Zeeuws-Vlaanderen (Sluis, Terneuzen, Hulst) from GeoNames (`python -m collector.postcodes_nl`, made once). Shops there are in `stores.json` with `"cc": "NL"`.
- `data/postcodes.json`, Belgian postal code centres (from github.com/jief/zipcode-belgium)

Until the first real collection, it shows `site/data/sample-deals.json` with a clear "example deals" note.

Try it locally:

```
cp data/*.json site/data/ 2>/dev/null; cd site && python -m http.server 8000   # open http://localhost:8000
```

The design rules it follows, and the research behind them, are in `site/DESIGN-RULES.md`.

## Accounts and payments

Off until `site/config.js` has the Supabase keys. Step-by-step setup (Supabase login, Stripe €4,99/month with 14-day trial, webhook): [docs/SETUP-PAYMENTS.md](docs/SETUP-PAYMENTS.md).

## Search engines

`seo/build.py` runs in the workflow after the site is built. It writes Dutch and French landing pages
(per store, deal type and product group) from `data/deals.json`, plus `sitemap.xml`, `robots.txt` and
canonical, hreflang and structured-data tags. The public address comes from the `SITE_URL` repository
variable. See `docs/SEO.md` for the keyword research and how to change the address.

```
python -m seo.build --site _site --base-url https://dealke.be   # after copying site/ and data/ to _site/
```
