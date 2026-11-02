from pathlib import Path

from collector.run import enrich
from collector.stores.aldi import parse_offers

HTML = (Path(__file__).parent / "fixtures_aldi.html").read_text()


def test_parse_offers_keeps_groceries_on_promo():
    deals = {d.name: enrich(d) for d in parse_offers(HTML)}
    assert "Lichtgewatteerde jas Up2Fashion" not in deals  # clothes have no price per kg: skipped
    coffee = deals["Cappuccino-oploskoffie Barissimo"]
    assert (coffee.price, coffee.old_price, coffee.pack_size) == (5.69, 11.38, "2 x 500 g")
    assert coffee.deal_kind == "1+1"
    assert (coffee.unit_price, coffee.unit) == (5.69, "kg")  # ALDI's own per-kg price, not halved again
    assert coffee.image_url.startswith("https://s7g10.scene7.com/")
    cookies = deals["Glazuurkoekjes Biscotto"]
    assert cookies.promo_text == "2 voor € 4,00" and cookies.deal_kind == "bundle"
