import json

from alerts.daily import email, fits, key, matches_for, near_deals, where


def d(name, store, price, cc="BE", **kw):
    return {"name": name, "store": store, "price": price, "cc": cc, **kw}


def test_fits_follows_the_site_rules():
    assert fits("melk", d("Halfvolle melk 1 L", "Lidl", 1))
    assert not fits("melk", d("Melkchocolade", "Lidl", 1))
    assert fits("koffie", d("Oploskoffie", "Aldi", 3))
    assert fits("kipfilet", d("Kipfiletreepjes", "Aldi", 3))
    assert not fits("mlek", d("Halfvolle melk", "Lidl", 1))


def test_matches_prefer_own_shop_and_say_when_cheaper():
    deals = [d("Halfvolle melk", "Lidl", 1.2), d("Volle melk", "Aldi", 0.9)]
    user = {"prefs": {"shop": "Lidl", "wants": [{"q": "melk"}]}, "list": {}}
    [m] = matches_for(user, deals)
    assert m["deal"]["store"] == "Lidl" and m["cheaper"]["store"] == "Aldi"


def test_saved_deals_count_as_liked_products():
    user = {"prefs": {}, "list": {"x": {"name": "Halfvolle melk"}}}
    assert len(matches_for(user, [d("Halfvolle melk", "Aldi", 1)])) == 1


def test_near_deals_uses_radius_per_chain_and_country():
    stores = [{"chain": "Lidl", "lat": 51.05, "lon": 3.72, "cc": "BE"}, {"chain": "Aldi", "lat": 50.85, "lon": 4.35, "cc": "BE"}]
    deals = [d("a", "Lidl", 1), d("b", "Aldi", 1), d("c", "Colruyt", 1), d("e", "Aldi", 1, cc="NL")]
    got = {x["name"] for x in near_deals(deals, stores, (51.05, 3.72), 15)}
    assert got == {"a", "c"}   # Aldi is 50 km away; unknown Belgian chain kept as on the site; no Dutch branch near


def test_where_reads_all_postcode_forms():
    assert where("9000", {"9000": [51.0, 3.7, "Gent"]}, {}) == (51.0, 3.7)
    assert where("NL-4501", {}, {"4501": [51.3, 3.5, "Oostburg"]}) == (51.3, 3.5)
    assert where("@BE|51.1|3.8|Veldstraat 1", {}, {}) == (51.1, 3.8)


def test_email_puts_new_first_and_is_in_the_users_language():
    ms = [{"q": "melk", "deal": d("Halfvolle melk", "Lidl", 0.99), "cheaper": None},
          {"q": "koffie", "deal": d("Koffie", "Aldi", 4.5, promo_text="1+1 gratis", valid_until="2026-11-10"), "cheaper": None}]
    subject, text, body = email(ms, {key(ms[1])}, "nl", "https://x.be/")
    assert subject == "2 van je producten in promo vandaag"
    assert text.index("koffie") < text.index("melk") and "tot 10/11" in text and "€ 4,50" in text
    assert "https://x.be/#account" in body


def test_main_sends_notifications_and_forgets_dead_devices(tmp_path, monkeypatch):
    import httpx
    from alerts import daily, webpush
    from tests.test_webpush import browser, decrypt

    ua, p256dh, auth = browser()
    live = {"endpoint": "https://push.example/live", "keys": {"p256dh": p256dh, "auth": auth}}
    dead = {"endpoint": "https://push.example/dead", "keys": {"p256dh": p256dh, "auth": auth}}
    user = {"user_id": "u1", "list": {}, "prefs": {"wants": [{"q": "melk"}], "push": [live, dead], "lang": "nl"}}
    seen = {"push": [], "patch": None}

    def handler(req: httpx.Request):
        if req.url.path == "/rest/v1/user_data" and req.method == "GET":
            return httpx.Response(200, json=[user, {"user_id": "u2", "prefs": {"wants": [{"q": "melk"}]}}])
        if req.method == "PATCH":
            seen["patch"] = json.loads(req.content)
            return httpx.Response(204)
        if req.url.host == "push.example":
            seen["push"].append(json.loads(decrypt(req.content, ua, auth)))
            assert req.headers["authorization"].startswith("vapid t=")
            return httpx.Response(410 if req.url.path == "/dead" else 201)
        raise AssertionError(req.url)

    real = httpx.Client
    monkeypatch.setattr(daily.httpx, "Client", lambda **kw: real(transport=httpx.MockTransport(handler)))
    prev = tmp_path / "prev.json"; prev.write_text("[]")
    priv, _ = webpush.new_keys()
    for k, v in {"SUPABASE_URL": "https://sb.example", "SUPABASE_SERVICE_KEY": "x", "VAPID_PRIVATE_KEY": priv}.items():
        monkeypatch.setenv(k, v)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setattr(daily, "near_deals", lambda deals, *a: [d("Halfvolle melk", "Lidl", 0.99)] if deals else [])
    assert daily.main(["--prev", str(prev)]) == 0
    assert len(seen["push"]) == 2 and seen["push"][0]["title"] == "1 van je lijst in promo"
    assert seen["patch"]["prefs"]["push"] == [live]          # the dead device is forgotten, the rest kept
    assert seen["patch"]["prefs"]["wants"] == [{"q": "melk"}]
