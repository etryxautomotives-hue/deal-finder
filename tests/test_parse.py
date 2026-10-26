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
