from pathlib import Path

from collector.run import enrich
from collector.stores.delhaize import parse_page

HTML = (Path(__file__).parent / "fixtures_delhaize.html").read_text()


def test_parse_page_reads_tiles():
    deals = [enrich(d) for d in parse_page(HTML)]
    fruit, pomegranate, box = deals
    assert fruit.name == "Fruities mini Meloen, Mango, Appel"
    assert (fruit.price, fruit.pack_size) == (2.25, "130 gr")
    assert fruit.promo_text == "3 voor €5 (SuperPlus)" and fruit.deal_kind == "bundle"
    assert fruit.unit_price == 12.85  # €5 for 3 packs of 130 g
    assert fruit.image_url.startswith("https://static.delhaize.be/")
    assert fruit.source_url.startswith("https://www.delhaize.be/nl/shop/")
    assert pomegranate.deal_kind == "price_drop"
    assert box.deal_kind == "bundle"
