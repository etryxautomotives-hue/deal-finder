from collector.locations import chain_of, to_stores


def test_chain_of_reads_brand_then_name():
    assert chain_of({"brand": "Lidl"}) == "Lidl"
    assert chain_of({"name": "AD Delhaize Gent"}) == "Delhaize"
    assert chain_of({"name": "Spar Express"}) == "Spar"
    assert chain_of({"name": "Bakkerij Jan"}) is None


def test_to_stores_uses_way_centre_and_builds_address():
    [s] = to_stores([
        {"type": "way", "center": {"lat": 51.04, "lon": 3.72},
         "tags": {"brand": "Colruyt", "name": "Colruyt Gent", "addr:street": "Brusselsesteenweg",
                  "addr:housenumber": "120", "addr:postcode": "9050", "addr:city": "Gent"}},
        {"type": "node", "lat": 51.0, "lon": 3.7, "tags": {"name": "Frituur"}},
    ])
    assert s == {"chain": "Colruyt", "name": "Colruyt Gent", "lat": 51.04, "lon": 3.72,
                 "address": "Brusselsesteenweg 120, 9050 Gent"}
