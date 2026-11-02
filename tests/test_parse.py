import pytest

from collector.parse import effective_price, parse_price, parse_quantity, promo_type, unit_price


@pytest.mark.parametrize("text,expected", [
    ("€ 2,49", 2.49), ("2,49 €", 2.49), ("2.49", 2.49), ("2,-", 2.0),
    ("€1.299,00", 1299.0), ("Nu 0,69", 0.69), ("", None), ("gratis", None),
])
def test_parse_price(text, expected):
    assert parse_price(text) == expected


@pytest.mark.parametrize("text,expected", [
    ("500 g", (0.5, "kg")), ("1,5 kg", (1.5, "kg")), ("6 x 1 L", (6.0, "L")),
    ("6x33cl", (1.98, "L")), ("750ml", (0.75, "L")), ("8 st", (8.0, "piece")),
    ("16 rollen", (16.0, "piece")), ("Barilla spaghetti 1kg", (1.0, "kg")), ("per stuk", None),
])
def test_parse_quantity(text, expected):
    assert parse_quantity(text) == expected


def test_unit_price():
    assert unit_price(2.49, 2.0) == 1.25
    assert unit_price(2.49, None) is None


@pytest.mark.parametrize("text,expected", [
    ("1+1 gratis", "multi_buy"), ("2+1 offert", "multi_buy"), ("3 voor 2", "multi_buy"),
    ("2de aan halve prijs", "second_discount"), ("2e à -50%", "second_discount"),
    ("-30%", "percent"), ("25% korting", "percent"), ("Prijsdaling", "price_drop"),
    ("Nieuw", "other"), (None, None),
])
def test_promo_type(text, expected):
    assert promo_type(text) == expected


@pytest.mark.parametrize("promo,expected", [
    ("1+1 gratis", 1.0), ("2+1 gratis", 1.33), ("3 voor 2", 1.33),
    ("2de aan halve prijs", 1.5), ("2e à -50%", 1.5), ("-30%", 2.0), (None, 2.0),
])
def test_effective_price(promo, expected):
    assert effective_price(2.0, promo) == expected


from collector.parse import deal_kind  # noqa: E402


@pytest.mark.parametrize("text,expected", [
    ("1+1 gratis", "1+1"), ("2 voor 1", "1+1"), ("2+1 offert", "2+1"), ("3 voor 2", "2+1"),
    ("3 pour 2", "2+1"), ("4 voor 3", "3+1"), ("2 voor € 5", "bundle"), ("2 pour 4,50 €", "bundle"),
    ("2de aan halve prijs", "2nd_half"), ("2e à -50%", "2nd_half"), ("2de -30%", "2nd_pct"),
    ("-30%", "percent"), ("25% korting", "percent"), ("Prijsdaling", "price_drop"),
    ("Nieuw", "other"), (None, None),
])
def test_deal_kind(text, expected):
    assert deal_kind(text) == expected


from collector.parse import categorize  # noqa: E402


@pytest.mark.parametrize("name,expected", [
    ("Halfvolle melk 1 L", "dairy"), ("Rundergehakt 500 g", "meat_fish"), ("Bananen", "fruit_veg"),
    ("Pâtes fraîches", "pantry"), ("Jupiler pils 24 x 25 cl", "drinks"), ("Dash wasmiddel", "household"),
    ("Something unknown", None),
])
def test_categorize(name, expected):
    assert categorize(name) == expected


@pytest.mark.parametrize("name,expected", [
    ("Côte d'Or melkchocolade", "snacks"), ("Croissants roomboter", "bread"), ("Olijfolie extra vierge", "pantry"),
    ("Vers sinaasappelsap", "drinks"), ("Stoofvlees, kant-en-klare maaltijd", "pantry"), ("Toiletpapier 3-laags", "household"),
])
def test_categorize_compound_words(name, expected):
    assert categorize(name) == expected


def test_effective_price_bundle():
    assert effective_price(4.79, "2 voor € 8") == 4.0
    assert effective_price(2.79, "2 pour 4,50 €") == 2.25
    assert effective_price(1.0, "2 voor € 8") == 1.0  # never makes a deal look better than the shelf price
