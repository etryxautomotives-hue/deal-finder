import json
from datetime import date
from pathlib import Path

from collector.run import enrich
from collector.stores.intermarche import flipbook_url, folder_pages, image_dir, parse_products

HERE = Path(__file__).parent
ROWS = json.loads((HERE / "fixtures_intermarche.json").read_text())
BOOK = "https://folders.intermarche.be/.2026-s45fr/"


def deals():
    return [enrich(d) for d in parse_products(ROWS, BOOK, date(2026, 11, 3), "https://fr.zone-secure.net/863887/2730193/")]


def test_newest_folder_first_and_not_too_far_ahead():
    pages = folder_pages((HERE / "fixtures_intermarche_index.html").read_text(), date(2026, 11, 2))
    assert pages[0] == (date(2026, 11, 3), "https://www.intermarche.be/folders/decouvrez-notre-folder-du-03-11-26/")
    assert folder_pages((HERE / "fixtures_intermarche_index.html").read_text(), date(2026, 10, 20))[0][0] < date(2026, 11, 3)


def test_flipbook_and_image_folder():
    assert flipbook_url('<iframe src="https://folders.intermarche.be/.2026-s45fr/#page=1">') == BOOK
    page = '<meta property="og:image" content="https://fr.zone-secure.net/863887/2728685/publication/contents/media-epub/pages/1/page.jpg">'
    assert image_dir(page, {"products": {"images": {"folderUrl": "${media}2730193/"}}}) == "https://fr.zone-secure.net/863887/2730193/"
    assert image_dir("<html>", {}) is None


def test_every_product_with_a_price_becomes_a_deal():
    ds = deals()
    assert len(ds) == len([r for r in ROWS if r.get("Prix") and r.get("Nom produit")]) > 150
    assert all(d.store == "Intermarché" and d.valid_until == date(2026, 11, 10) for d in ds)


def test_multi_buy_uses_shelf_price_and_variety_in_name():
    d = next(d for d in deals() if d.name.startswith("McCain"))
    assert d.name == "McCain Rösti" and d.price == 5.99 and d.deal_kind == "1+1"
    assert d.quantity == 0.8 and d.unit_price == 3.75  # 3.00 a pack (1+1) for 800 g
    assert d.image_url == "https://fr.zone-secure.net/863887/2730193/8710438081275.webp"


def test_percent_price_is_final_and_per_100g_becomes_per_kg():
    d = next(d for d in deals() if d.name.startswith("Filet de saumon"))
    assert d.deal_kind == "percent" and d.price == 1.52 and d.old_price == 3.04
    assert d.unit == "kg" and d.unit_price == 15.2 and d.category == "meat_fish"


def test_card_only_promo_is_labelled():
    d = next(d for d in deals() if d.name == "Lay's Oven baked - Naturel")
    assert d.promo_text == "2+2 GRATIS AU CHOIX (carte Intermarché)" and d.deal_kind == "2+2"
