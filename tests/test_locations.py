from collector.locations import chain_of, to_stores


def test_chain_of_reads_brand_then_name():
    assert chain_of({"brand": "Lidl"}) == "Lidl"
    assert chain_of({"name": "AD Delhaize Gent"}) == "Delhaize"
    assert chain_of({"name": "Spar Express"}) == "Spar"
    assert chain_of({"name": "Bakkerij Jan"}) is None
    assert chain_of({"name": "Louis Delhaize Couvin"}) == "Louis Delhaize"
    assert chain_of({"brand": "Alvo"}) == "Alvo"
    assert chain_of({"name": "Eurospar"}) == "Spar"
    assert chain_of({"name": "Délitraiteur Uccle"}) == "Delitraiteur"


def test_to_stores_uses_way_centre_and_builds_address():
    [s] = to_stores([
        {"type": "way", "center": {"lat": 51.04, "lon": 3.72},
         "tags": {"brand": "Colruyt", "name": "Colruyt Gent", "addr:street": "Brusselsesteenweg",
                  "addr:housenumber": "120", "addr:postcode": "9050", "addr:city": "Gent"}},
        {"type": "node", "lat": 51.0, "lon": 3.7, "tags": {"name": "Frituur"}},
    ])
    assert s == {"chain": "Colruyt", "name": "Colruyt Gent", "lat": 51.04, "lon": 3.72,
                 "address": "Brusselsesteenweg 120, 9050 Gent", "cc": "BE"}


def test_zeeuws_vlaanderen_shops_get_nl_and_dutch_chains():
    stores = to_stores([
        {"type": "node", "lat": 51.33, "lon": 3.83, "tags": {"brand": "PLUS", "name": "PLUS Terneuzen"}},
        {"type": "node", "lat": 51.28, "lon": 4.05, "tags": {"brand": "Albert Heijn", "name": "Albert Heijn Hulst"}},
        {"type": "node", "lat": 51.50, "lon": 3.60, "tags": {"brand": "Lidl", "name": "Lidl Vlissingen"}},  # north bank
    ], "NL")
    assert [(s["chain"], s["cc"]) for s in stores] == [("Albert Heijn", "NL"), ("Plus", "NL")]


def test_belgian_shops_get_be_and_skip_dutch_only_chains():
    stores = to_stores([
        {"type": "node", "lat": 51.0, "lon": 3.7, "tags": {"name": "Plus Gent"}},
        {"type": "node", "lat": 51.0, "lon": 3.7, "tags": {"brand": "Lidl"}},
    ])
    assert [(s["chain"], s["cc"]) for s in stores] == [("Lidl", "BE")]


def test_dutch_postcodes_keep_zeeuws_vlaanderen_only():
    from collector.postcodes_nl import parse
    rows = "\n".join("\t".join(r) for r in [
        ["NL", "4531", "Terneuzen", "Zeeland", "10", "Terneuzen", "0715", "", "", "51.3353", "3.8261", "6"],
        ["NL", "4561", "Hulst", "Zeeland", "10", "Hulst", "0677", "", "", "51.2814", "4.0528", "6"],
        ["NL", "4561", "Hulst", "Zeeland", "10", "Hulst", "0677", "", "", "51.2834", "4.0548", "6"],
        ["NL", "4381", "Vlissingen", "Zeeland", "10", "Vlissingen", "0718", "", "", "51.44", "3.57", "6"],
        ["NL", "1012", "Amsterdam", "Noord-Holland", "07", "Amsterdam", "0363", "", "", "52.37", "4.89", "6"],
    ])
    assert parse(rows) == {"4531": [51.3353, 3.8261, "Terneuzen"], "4561": [51.2824, 4.0538, "Hulst"]}
