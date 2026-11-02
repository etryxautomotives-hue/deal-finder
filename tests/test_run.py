import json
from datetime import date

from collector.models import Deal
from collector.run import enrich, is_current, save
from collector.stores.base import jsonld_products


def test_enrich_computes_unit_price_with_promo():
    d = enrich(Deal(store="Lidl", name="Spaghetti", price=2.0, pack_size="500 g",
                    promo_text="1+1 gratis", source_url="https://example.be/p"))
    assert (d.quantity, d.unit) == (0.5, "kg")
    assert d.promo_type == "multi_buy"
    assert d.unit_price == 2.0  # 1.00 a pack when you take two, 500 g each


def test_enrich_reads_size_from_name_when_missing():
    d = enrich(Deal(store="Aldi", name="Water 6 x 1,5 L", price=3.0, source_url="x"))
    assert d.unit_price == 0.33


def test_is_current_drops_expired():
    assert not is_current(Deal(store="s", name="n", price=1, source_url="x", valid_until=date(2026, 1, 1)), date(2026, 10, 26))
    assert is_current(Deal(store="s", name="n", price=1, source_url="x"), date(2026, 10, 26))


def test_save_writes_json_with_image_and_source(tmp_path):
    save([Deal(store="Lidl", name="Oranges", price=2.49, old_price=3.99, source_url="https://lidl.be/p/1",
               image_url="https://lidl.be/img/1.jpg")], tmp_path)
    row = json.loads((tmp_path / "deals.json").read_text())[0]
    assert row["image_url"] == "https://lidl.be/img/1.jpg"
    assert row["source_url"] == "https://lidl.be/p/1"
    assert row["saving"] == 1.5
    assert (tmp_path / "deals.sqlite").exists()


def test_jsonld_products_makes_links_absolute():
    html = """<script type="application/ld+json">{"@graph":[{"@type":"Product","name":"Gouda",
      "image":["/img/gouda.jpg"],"url":"/p/gouda","offers":{"price":"3.79"}}]}</script>"""
    [p] = jsonld_products(html, "https://shop.be/promos")
    assert p["image"] == "https://shop.be/img/gouda.jpg"
    assert p["url"] == "https://shop.be/p/gouda"
