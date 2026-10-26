"""Turn the text stores print into numbers: prices, pack sizes and promo types.

Belgian stores write prices as "2,49", "€ 2,49", "2.49" or "2,-", and pack
sizes as "500 g", "1,5 kg", "6 x 1 L", "6x33cl" or "8 st". Promos come in
Dutch and French.
"""
from __future__ import annotations

import re

_NUM = r"\d+(?:[.,]\d+)?"


def to_float(text: str) -> float:
    return float(text.replace(",", "."))


def parse_price(text: str | None) -> float | None:
    """'€ 2,49' -> 2.49, '2,-' -> 2.0, '1.299,00' -> 1299.0. None if no price."""
    if not text:
        return None
    t = text.replace("€", " ").replace("EUR", " ").replace("\xa0", " ").strip()
    t = re.sub(r"(\d)[,.]-", r"\1", t)  # "2,-" means 2 euro
    m = re.search(r"\d{1,3}(?:[. ]\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?", t)
    if not m:
        return None
    raw = m.group(0)
    if re.fullmatch(r"\d{1,3}(?:[. ]\d{3})+(?:,\d{1,2})?", raw):
        raw = raw.replace(".", "").replace(" ", "")  # thousands separators
    return round(to_float(raw), 2)


# unit text -> (base unit, factor to base)
_UNITS = {
    "kg": ("kg", 1), "g": ("kg", 0.001), "gr": ("kg", 0.001),
    "l": ("L", 1), "ltr": ("L", 1), "liter": ("L", 1), "litre": ("L", 1),
    "cl": ("L", 0.01), "ml": ("L", 0.001),
    "st": ("piece", 1), "stuk": ("piece", 1), "stuks": ("piece", 1),
    "pc": ("piece", 1), "pcs": ("piece", 1), "pièce": ("piece", 1), "pièces": ("piece", 1),
    "rol": ("piece", 1), "rollen": ("piece", 1), "rouleaux": ("piece", 1), "rolls": ("piece", 1),
}
_UNIT_RE = "|".join(sorted((re.escape(u) for u in _UNITS), key=len, reverse=True))


def parse_quantity(text: str | None) -> tuple[float, str] | None:
    """'6 x 1 L' -> (6.0, 'L'), '500 g' -> (0.5, 'kg'), '6x33cl' -> (1.98, 'L')."""
    if not text:
        return None
    t = text.lower().replace("\xa0", " ")
    m = re.search(rf"({_NUM})\s*[x×]\s*({_NUM})\s*({_UNIT_RE})\b", t)
    if m:
        count, size, unit = to_float(m.group(1)), to_float(m.group(2)), m.group(3)
    else:
        m = re.search(rf"({_NUM})\s*({_UNIT_RE})\b", t)
        if not m:
            return None
        count, size, unit = 1.0, to_float(m.group(1)), m.group(2)
    base, factor = _UNITS[unit]
    return round(count * size * factor, 4), base


def unit_price(price: float, quantity: float | None) -> float | None:
    if not quantity:
        return None
    return round(price / quantity, 2)


_PROMO_RULES = [
    ("multi_buy", r"\b\d\s*\+\s*\d\b|\d\s*(?:voor|pour)\s*\d"),            # 1+1, 2+1 gratis, 3 voor 2
    ("second_discount", r"\b2(?:de|e|ème)\b.*?(?:halve prijs|moitié prix|-?\s*\d+\s*%)"),
    ("percent", r"-\s*\d+\s*%|\d+\s*%\s*(?:korting|réduction|off)"),
    ("price_drop", r"prijsdaling|baisse de prix|price drop|nieuwe lage prijs|bonus"),
]


def promo_type(text: str | None) -> str | None:
    if not text:
        return None
    t = text.lower()
    for kind, pattern in _PROMO_RULES:
        if re.search(pattern, t):
            return kind
    return "other"


def effective_price(price: float, promo: str | None) -> float:
    """Price per pack when you buy the minimum the promo needs.

    '1+1 gratis' at 2.00 -> 1.00 a pack; '2de aan halve prijs' at 2.00 -> 1.50.
    Anything we don't understand keeps the shelf price, so we never overstate a saving.
    """
    if not promo:
        return price
    t = promo.lower()
    m = re.search(r"\b(\d)\s*\+\s*(\d)\b", t)
    if m:
        paid, free = int(m.group(1)), int(m.group(2))
        return round(price * paid / (paid + free), 2)
    m = re.search(r"\b(\d)\s*(?:voor|pour)\s*(\d)\b", t)
    if m:
        get, pay = int(m.group(1)), int(m.group(2))
        if get > pay:
            return round(price * pay / get, 2)
    if re.search(r"\b2(?:de|e|ème)\b", t):
        if "halve prijs" in t or "moitié prix" in t:
            return round(price * 0.75, 2)
        m = re.search(r"(\d+)\s*%", t)
        if m:
            return round(price * (1 - int(m.group(1)) / 200), 2)
    return price
