import datetime as dt
import json
import re

from seo.build import build, slug, week_label

TODAY = dt.date(2026, 11, 3)


def deal(**kw):
    d = {"store": "Aldi", "name": "Kippenfilet", "price": 5.0, "old_price": 10.0, "brand": "X",
         "category": "meat_fish", "deal_kind": "1+1", "promo_text": "1+1 gratis", "pack_size": "500 g",
         "unit": "kg", "unit_price": 10.0, "valid_until": "2026-11-09", "image_url": "https://img/1.jpg",
         "source_url": "https://www.aldi.be/nl/aanbiedingen.html"}
    d.update(kw)
    return d


def make(tmp_path, deals, base="https://dealke.be/"):
    site = tmp_path / "_site"
    site.mkdir()
    (site / "index.html").write_text("<html><head><title>deal'ke</title>"
                                     '<meta name="description" content="d"></head>'
                                     "<body><footer><div class=\"wrap\">x</div></footer></body></html>")
    f = tmp_path / "deals.json"
    f.write_text(json.dumps(deals))
    return site, build(site, f, base, TODAY)


def test_landing_pages_per_store_kind_and_category_in_both_languages(tmp_path):
    site, pages = make(tmp_path, [deal(), deal(store="Intermarché", name="Pommes", category="fruit_veg",
                                               deal_kind="percent", old_price=None)])
    for path in ["promoties", "promos", "promoties/aldi", "promos/intermarche", "promoties/1-plus-1-gratis",
                 "promos/1-plus-1-gratuit", "promoties/vlees-vis", "promos/fruits-legumes"]:
        assert (site / path / "index.html").exists(), path
    assert not (site / "promoties/2-plus-1-gratis").exists()  # no empty pages
    aldi = (site / "promoties/aldi/index.html").read_text()
    assert "<title>Aldi promoties deze week (3 – 9 november)" in aldi
    assert '<link rel="canonical" href="https://dealke.be/promoties/aldi/">' in aldi
    assert 'hreflang="fr-BE" href="https://dealke.be/promos/aldi/"' in aldi
    assert "Kippenfilet" in aldi and "€ 5,00" in aldi


def test_structured_data_is_valid_json_and_cannot_break_out_of_script(tmp_path):
    site, _ = make(tmp_path, [deal(name="Evil </script><script>alert(1)</script>")])
    page = (site / "promoties/aldi/index.html").read_text()
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', page, re.S)
    data = [json.loads(b) for b in blocks]
    item = data[0]["itemListElement"][0]["item"]
    assert item["offers"]["price"] == "5.00" and item["offers"]["priceValidUntil"] == "2026-11-09"
    assert "</script><script>alert" not in page  # escaped in JSON-LD and in the visible list


def test_expired_deals_left_out(tmp_path):
    site, _ = make(tmp_path, [deal(), deal(name="Oud", valid_until="2026-11-01")])
    assert "Oud" not in (site / "promoties/index.html").read_text()


def test_sitemap_robots_and_app_page(tmp_path):
    site, pages = make(tmp_path, [deal()])
    sm = (site / "sitemap.xml").read_text()
    assert sm.count("<url>") == len(pages) + 1 and "https://dealke.be/promos/aldi/" in sm
    assert "Sitemap: https://dealke.be/sitemap.xml" in (site / "robots.txt").read_text()
    index = (site / "index.html").read_text()
    assert '<link rel="canonical" href="https://dealke.be/">' in index
    assert 'href="https://dealke.be/promoties/aldi/"' in index  # crawlable links in the footer
    assert index.index("seo-links") < index.index("</footer>")
    # running twice does not add the tags twice
    f = tmp_path / "deals.json"
    build(site, f, "https://dealke.be", TODAY)
    assert (site / "index.html").read_text().count("seo:head") == 1


def test_no_deals_still_writes_robots_and_sitemap(tmp_path):
    site, pages = make(tmp_path, [])
    assert pages == [] and (site / "robots.txt").exists() and "<loc>https://dealke.be/</loc>" in (site / "sitemap.xml").read_text()


def test_helpers():
    assert slug("Intermarché") == "intermarche"
    assert week_label(dt.date(2026, 11, 28), "fr") == "28 novembre – 4 décembre"
