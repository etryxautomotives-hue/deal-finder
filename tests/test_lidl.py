from pathlib import Path

from collector.run import enrich
from collector.stores.lidl import _promo, parse_offers

HTML = (Path(__file__).parent / "fixtures_lidl.html").read_text()


def test_parse_offers_reads_price_pack_and_deal_type():
    deals = {d.name: enrich(d) for d in parse_offers(HTML, "https://www.lidl.be/c/fr-BE/x/a1")}
    juice = deals["TROPICANA Jus d'orange"]
    assert (juice.price, juice.old_price, juice.pack_size) == (4.09, 8.18, "2 x 1 l")
    assert juice.deal_kind == "1+1" and (juice.unit_price, juice.unit) == (2.05, "L")
    assert juice.source_url.startswith("https://www.lidl.be/p/")
    assert deals["Brocoli"].deal_kind == "percent"
    assert "Kaki" not in deals  # no price on the card: skipped


def test_promo_from_percentage_and_count():
    assert _promo(50, "8,18 € - 4,09 € pour 2 bouteilles", "nl") == "1+1 gratis"
    assert _promo(25, "5,80 € - 4,35 € pour 2 pièces", "fr") == "2e à moitié prix"
    assert _promo(25, "10,76 € - 8,07 € pour 4 pièces", "nl") == "3+1 gratis"
    assert _promo(23, "préemballées", "nl") == "-23%"


def test_dutch_lidl_price_per_kg_and_country():
    from collector.stores.lidl import _per_unit
    assert _per_unit("500 g - 1,98 EUR/kg") == (1.98, "kg")
    assert _per_unit("Per 500 g (1 kg = € 3,96)") == (3.96, "kg")
    assert _per_unit("1,5 L | 1 l = 0,66") == (0.66, "L")
    [d] = [d for d in parse_offers(HTML, "https://www.lidl.nl/c/aanbiedingen/a1") if d.name == "TROPICANA Jus d'orange"]
    assert d.cc == "NL" and d.source_url.startswith("https://www.lidl.nl/p/")


def test_dutch_offer_links_relative_and_absolute():
    from collector.stores.lidl import offer_links
    page = ('<a href="https://www.lidl.nl/c/aanbiedingen/a10008785">x</a>'
            '<a href="/c/vanaf-maandag-02-11/a10091234">x</a>'
            '<a href="https://www.lidl.nl/c/deze-week-alleen/a10095678">x</a>'
            '<a href="/c/vanaf-maandag-02-11/a10091234">dup</a>'
            '<a href="/c/service-contact-folders/s10008124">folder</a>')
    assert offer_links(page, "https://www.lidl.nl/c/aanbiedingen/a10008785") == [
        "/c/vanaf-maandag-02-11/a10091234", "/c/deze-week-alleen/a10095678"]
