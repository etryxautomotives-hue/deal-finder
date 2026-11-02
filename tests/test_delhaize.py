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


def test_paging_survives_one_repeated_page():
    from collector.stores.delhaize import Delhaize, PROMO_URL

    class FakeResp:
        def __init__(self, text): self.text = text

    pages = {0: HTML, 1: HTML, 2: HTML.replace("/p/", "/p/x"), 3: "", 4: ""}

    class FakeClient:
        def get(self, url):
            n = 0 if url == PROMO_URL else int(url.rsplit("=", 1)[1])
            return FakeResp(pages.get(n, ""))

    store = Delhaize.__new__(Delhaize)
    store.client = FakeClient()
    deals = store.collect()
    first = parse_page(HTML)
    assert len(deals) == 2 * len(first)


def test_paging_keeps_pages_when_a_later_page_fails():
    from collector.stores.delhaize import Delhaize, PROMO_URL

    class FakeResp:
        def __init__(self, text): self.text = text

    class FakeClient:
        def get(self, url):
            if url == PROMO_URL:
                return FakeResp(HTML)
            raise RuntimeError("503 Service Unavailable")

    store = Delhaize.__new__(Delhaize)
    store.client = FakeClient()
    assert len(store.collect()) == len(parse_page(HTML))
