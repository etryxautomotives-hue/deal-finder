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
