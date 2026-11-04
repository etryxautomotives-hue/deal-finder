"""Web push: decrypt the way a browser does (RFC 8291) and check the VAPID token, so a wrong byte shows up here."""
import json

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from alerts import webpush as W
from alerts.daily import key, notification


def browser():
    k = ec.generate_private_key(ec.SECP256R1())
    return k, W.b64u(W._point(k.public_key())), W.b64u(b"0123456789abcdef")


def decrypt(body: bytes, ua_key, auth: str) -> bytes:
    salt, rs, n = body[:16], int.from_bytes(body[16:20], "big"), body[20]
    as_pub = body[21:21 + n]
    assert rs == 4096 and n == 65
    secret = ua_key.exchange(ec.ECDH(), ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), as_pub))
    ua_pub = W._point(ua_key.public_key())
    ikm = W._hkdf(W.unb64u(auth), secret, b"WebPush: info\x00" + ua_pub + as_pub, 32)
    cek = W._hkdf(salt, ikm, b"Content-Encoding: aes128gcm\x00", 16)
    nonce = W._hkdf(salt, ikm, b"Content-Encoding: nonce\x00", 12)
    plain = AESGCM(cek).decrypt(nonce, body[21 + n:], None)
    assert plain.endswith(b"\x02")
    return plain[:-1]


def test_message_decrypts_in_the_browser():
    ua, p256dh, auth = browser()
    msg = json.dumps({"title": "3 van je lijst in promo", "body": "koffie € 3,99 bij Aldi"}).encode()
    assert decrypt(W.encrypt(msg, p256dh, auth), ua, auth) == msg


def test_rfc8291_example():
    # The worked example in RFC 8291 section 5, so we match the standard and not only ourselves
    as_priv = ec.derive_private_key(int.from_bytes(W.unb64u("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw"), "big"), ec.SECP256R1())
    body = W.encrypt(b"When I grow up, I want to be a watermelon",
                     "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
                     "BTBZMqHH6r4Tts7J_aSIgg", _salt=W.unb64u("DGv6ra1nlYgDCS1FRnbzlw"), _key=as_priv)
    assert W.b64u(body) == ("DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN")


def test_vapid_token_is_signed_with_our_key():
    priv, pub = W.new_keys()
    assert W.public_key_of(priv) == pub
    h = W.vapid_header("https://fcm.googleapis.com/fcm/send/abc", priv, "https://x.be/", now=1000)
    t, k = h.removeprefix("vapid t=").split(", k=")
    assert k == pub
    head, claims, sig = t.split(".")
    assert json.loads(W.unb64u(claims)) == {"aud": "https://fcm.googleapis.com", "exp": 1000 + 12 * 3600, "sub": "https://x.be/"}
    raw = W.unb64u(sig)
    key = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), W.unb64u(pub))
    key.verify(encode_dss_signature(int.from_bytes(raw[:32], "big"), int.from_bytes(raw[32:], "big")),
               f"{head}.{claims}".encode(), ec.ECDSA(hashes.SHA256()))  # raises if wrong


def test_notification_shows_new_items_first_and_opens_the_list():
    d = lambda q, s, p: {"q": q, "deal": {"name": q, "store": s, "price": p}, "cheaper": None}
    ms = [d("melk", "Lidl", 0.99), d("koffie", "Aldi", 3.99), d("kaas", "Lidl", 2), d("brood", "Aldi", 1), d("eieren", "Lidl", 2.5)]
    new = {key(m) for m in ms[1:]}
    n = notification(ms, new, "nl", "https://x.be/")
    assert n["title"] == "4 van je lijst in promo"
    assert n["body"] == "koffie € 3,99 bij Aldi · kaas € 2,00 bij Lidl · brood € 1,00 bij Aldi · +1 meer"
    assert n["url"] == "https://x.be/#list"
