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
    m = re.search(r"\b(\d+)\s*(?:voor|pour|for)\s*(?:€\s*)?(\d+(?:[.,]\d+)?)\s*(?:€|eur)", t) or \
        re.search(r"\b(\d+)\s*(?:voor|pour|for)\s*€\s*(\d+(?:[.,]\d+)?)", t)
    if m and int(m.group(1)) > 0:
        each = to_float(m.group(2)) / int(m.group(1))
        if each < price:
            return round(each, 2)
    if re.search(r"\b2(?:de|e|ème)\b", t):
        if "halve prijs" in t or "moitié prix" in t:
            return round(price * 0.75, 2)
        m = re.search(r"(\d+)\s*%", t)
        if m:
            return round(price * (1 - int(m.group(1)) / 200), 2)
    return price


def deal_kind(text: str | None) -> str | None:
    """The deal type people filter on, in one canonical key.

    '1+1' (also '2 voor 1'), '2+1' (also '3 voor 2'), any 'N+M', 'bundle' ('2 voor € 5'),
    '2nd_half' ('2de aan halve prijs'), '2nd_pct' ('2e à -30%'), 'percent', 'price_drop', 'other'.
    """
    if not text:
        return None
    t = text.lower().replace("\xa0", " ")
    m = re.search(r"\b(\d)\s*\+\s*(\d)\b", t)
    if m:
        return f"{int(m.group(1))}+{int(m.group(2))}"
    m = re.search(r"\b(\d+)\s*(?:voor|pour|for)\s*(€\s*)?(\d+(?:[.,]\d+)?)\s*(€|eur)?", t)
    if m:
        if m.group(2) or m.group(4) or re.search(r"[.,]", m.group(3)):
            return "bundle"
        get, pay = int(m.group(1)), int(m.group(3))
        if get > pay > 0:
            return f"{pay}+{get - pay}"
    if re.search(r"\b2(?:de|e|ème|nd)\b", t):
        if re.search(r"halve prijs|moitié prix|half price|-?\s*50\s*%", t):
            return "2nd_half"
        if re.search(r"\d+\s*%", t):
            return "2nd_pct"
    if re.search(r"-\s*\d+\s*%|\d+\s*%\s*(?:korting|réduction|off)", t):
        return "percent"
    if re.search(r"prijsdaling|baisse de prix|price drop|nieuwe lage prijs|bonus|actieprijs|prix promo", t):
        return "price_drop"
    return "other"


# category -> words in Dutch, French and English (lowercase, matched on word starts)
_CATEGORIES = {
    "household": "wasmiddel lessive detergent afwas vaisselle toiletpapier papier_toilette wc-papier keukenrol essuie-tout "
                 "schoonmaak nettoyant vuilniszak sacs_poubelle tandpasta dentifrice shampoo douchegel gel_douche luiers langes deo",
    "drinks": "coca-cola glühwein sinaasappelsap appelsap fruitsap jus_d'orange bier bière beer wijn wine cola frisdrank soda limonade water eau sap jus juice koffie café coffee thee thé tea "
              "pils cava champagne spuitwater smoothie",
    "dairy": "yaourt danio skyr soja melk lait milk kaas fromage cheese yoghurt yaourt yogurt boter beurre butter room crème cream eieren oeufs eggs "
             "gouda emmental mozzarella skyr platte_kaas fromage_blanc",
    "bread": "brood pain bread croissant pistolet stokbrood baguette sandwich koffiekoek wraps tortilla beschuit toast",
    "meat_fish": "cordon_bleu falafel nuggets koolvis kaasburger vlees viande meat gehakt haché kip poulet chicken varken porc pork rund boeuf bœuf beef worst saucisse sausage "
                 "ham jambon spek lard bacon steak filet zalm saumon salmon vis poisson fish tonijn thon tuna garnalen crevettes "
                 "scampi kabeljauw cabillaud salami",
    "fruit_veg": "appel pomme apple peer poire pear banaan banane banana sinaas orange mandarijn mandarine druiven raisin grapes "
                 "aardbei fraise strawberr ananas pineapple meloen melon kiwi citroen citron lemon tomaat tomate tomato "
                 "komkommer concombre cucumber sla salade lettuce wortel carotte carrot uien oignon onion aardappel pomme_de_terre "
                 "potato broccoli champignon paprika poivron pepper courgette prei poireau spinazie épinard groente légume "
                 "vegetable fruit avocado",
    "snacks": "éclair pastel_de_nata gaufre speculoos snoepjes marshmallow guimauve panettone chips chocolade chocolat chocolate koek biscuit cookie snoep bonbon candy chupa noten noix nuts ijs glace ice_cream "
              "praline wafel gaufre chips",
    "pantry": "haricot sel_de huile tortelloni zuurkool tafelsaus bolognesesaus srirachasaus paté pâté fond olijfolie zonnebloemolie pasta pâtes spaghetti penne rijst riz rice saus sauce soep soupe soup olie huile oil bloem farine flour suiker sucre "
              "sugar ontbijtgranen céréales cereal muesli conserven blik choco confituur confiture jam mayonaise ketchup pizza lasagne "
              "maaltijd plat_préparé meal noedels nouilles noodles",
}
_CAT_WORDS = [(w.replace("_", " "), c) for c, words in _CATEGORIES.items() for w in words.split()]


def categorize(name: str | None) -> str | None:
    """Rough aisle for a product name, so people can browse by category. None if unsure.

    Dutch glues words together ("melkchocolade", "roomboter"), so longer keywords may match inside a word
    and the longest matching keyword wins; short keywords (4 letters or fewer) must start a word.
    """
    if not name:
        return None
    t = name.lower()
    best, best_len = None, 0
    for w, c in _CAT_WORDS:
        if len(w) <= best_len:
            continue
        hit = re.search(r"\b" + re.escape(w), t) if len(w) <= 4 else w in t
        if hit:
            best, best_len = c, len(w)
    return best
