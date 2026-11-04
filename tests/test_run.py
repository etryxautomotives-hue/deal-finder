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


def _row(store, name, price=1.0, cc="BE", until="2026-11-10", seen="2026-11-03T06:00:00+00:00"):
    return {"store": store, "name": name, "price": price, "cc": cc, "valid_until": until, "collected_at": seen}


def test_carry_over_keeps_a_failed_shops_valid_deals():
    from collector.run import carry_over
    prev = [_row("Delhaize", f"p{i}") for i in range(10)] + [_row("Delhaize", "old", until="2026-11-01"),
                                                             _row("Aldi", "a")]
    fresh = [_row("Aldi", "a")]
    kept, shops = carry_over(prev, fresh, date(2026, 11, 4))
    assert shops == ["Delhaize BE"]
    assert len(kept) == 10 and all(r["name"] != "old" for r in kept)


def test_carry_over_leaves_normal_days_alone():
    from collector.run import carry_over
    prev = [_row("Lidl", f"p{i}") for i in range(10)]
    fresh = [_row("Lidl", f"q{i}") for i in range(6)]  # a new week with a bit fewer deals is fine
    assert carry_over(prev, fresh, date(2026, 11, 4)) == ([], [])


def test_carry_over_drops_undated_deals_after_a_few_days():
    from collector.run import carry_over
    prev = [_row("Delhaize", "x", until=None, seen="2026-11-03T06:00:00+00:00"),
            _row("Delhaize", "y", until=None, seen="2026-10-30T06:00:00+00:00")]
    kept, _ = carry_over(prev, [], date(2026, 11, 4))
    assert [r["name"] for r in kept] == ["x"]


def test_carry_over_does_not_duplicate_and_keeps_countries_apart():
    from collector.run import carry_over
    prev = [_row("Aldi", "a", cc="NL"), _row("Aldi", "b", cc="NL"), _row("Aldi", "a")]
    fresh = [_row("Aldi", "a")]
    kept, shops = carry_over(prev, fresh, date(2026, 11, 4))
    assert shops == ["Aldi NL"] and len(kept) == 2


def test_save_writes_per_shop_counts_and_kept_shops(tmp_path):
    save([Deal(store="Aldi", name="x", price=1, source_url="u")], tmp_path,
         kept=[_row("Delhaize", "d")], kept_shops=["Delhaize BE"], counts={"Delhaize": "failed"})
    meta = json.loads((tmp_path / "meta.json").read_text())
    assert meta["per_shop"] == {"Aldi BE": 1, "Delhaize BE": 1}
    assert meta["kept_from_before"] == ["Delhaize BE"]
    assert len(json.loads((tmp_path / "deals.json").read_text())) == 2
