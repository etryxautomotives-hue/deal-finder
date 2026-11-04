"""Web push without a third-party service: the browser's own push service (Google, Mozilla, Apple) delivers it.

Two standards, both small:
  - RFC 8291 + 8188 (aes128gcm): the message is encrypted for that one browser, so the push service can't read it.
  - RFC 8292 (VAPID): a short signed token proves the message comes from us (the key pair in config.js / secrets).

Keys: the public key sits in site/config.js (vapidPublicKey), the private key only in the GitHub secret
VAPID_PRIVATE_KEY. Both are base64url: the public key is the 65-byte uncompressed point, the private key the
32-byte number. Make a new pair with:  python -m alerts.webpush --new-keys
"""
from __future__ import annotations

import base64
import json
import os
import sys
import time
from urllib.parse import urlsplit

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

RS = 4096  # record size; one record is plenty for a few hundred bytes


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def unb64u(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _hkdf(salt: bytes, ikm: bytes, info: bytes, n: int) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=n, salt=salt, info=info).derive(ikm)


def _point(key: ec.EllipticCurvePublicKey) -> bytes:
    return key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)


def private_key(b64: str) -> ec.EllipticCurvePrivateKey:
    return ec.derive_private_key(int.from_bytes(unb64u(b64), "big"), ec.SECP256R1())


def public_key_of(b64_private: str) -> str:
    return b64u(_point(private_key(b64_private).public_key()))


def new_keys() -> tuple[str, str]:
    k = ec.generate_private_key(ec.SECP256R1())
    return b64u(k.private_numbers().private_value.to_bytes(32, "big")), b64u(_point(k.public_key()))


def encrypt(payload: bytes, p256dh: str, auth: str, *, _salt: bytes | None = None,
            _key: ec.EllipticCurvePrivateKey | None = None) -> bytes:
    """aes128gcm body for one subscription (keys.p256dh and keys.auth as the browser gave them)."""
    ua_pub_bytes = unb64u(p256dh)
    ua_pub = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), ua_pub_bytes)
    as_key = _key or ec.generate_private_key(ec.SECP256R1())
    as_pub_bytes = _point(as_key.public_key())
    secret = as_key.exchange(ec.ECDH(), ua_pub)
    ikm = _hkdf(unb64u(auth), secret, b"WebPush: info\x00" + ua_pub_bytes + as_pub_bytes, 32)
    salt = _salt or os.urandom(16)
    cek = _hkdf(salt, ikm, b"Content-Encoding: aes128gcm\x00", 16)
    nonce = _hkdf(salt, ikm, b"Content-Encoding: nonce\x00", 12)
    body = AESGCM(cek).encrypt(nonce, payload + b"\x02", None)  # \x02 = last (and only) record
    return salt + RS.to_bytes(4, "big") + bytes([len(as_pub_bytes)]) + as_pub_bytes + body


def vapid_header(endpoint: str, b64_private: str, contact: str, now: float | None = None) -> str:
    """Authorization header value: 'vapid t=<signed token>, k=<public key>'."""
    u = urlsplit(endpoint)
    claims = {"aud": f"{u.scheme}://{u.netloc}", "exp": int((now or time.time()) + 12 * 3600), "sub": contact}
    head = b64u(json.dumps({"typ": "JWT", "alg": "ES256"}, separators=(",", ":")).encode())
    body = b64u(json.dumps(claims, separators=(",", ":")).encode())
    key = private_key(b64_private)
    r, s = decode_dss_signature(key.sign(f"{head}.{body}".encode(), ec.ECDSA(hashes.SHA256())))
    sig = b64u(r.to_bytes(32, "big") + s.to_bytes(32, "big"))
    return f"vapid t={head}.{body}.{sig}, k={b64u(_point(key.public_key()))}"


def send(http, sub: dict, message: dict, b64_private: str, contact: str, ttl: int = 20 * 3600) -> int:
    """POST one push. Returns the status code: 201 = delivered to the push service, 404/410 = subscription is gone."""
    body = encrypt(json.dumps(message, ensure_ascii=False).encode(), sub["keys"]["p256dh"], sub["keys"]["auth"])
    r = http.post(sub["endpoint"], content=body, headers={
        "Authorization": vapid_header(sub["endpoint"], b64_private, contact),
        "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream",
        "TTL": str(ttl), "Urgency": "normal", "Topic": "daily"})
    return r.status_code


if __name__ == "__main__":
    if "--new-keys" in sys.argv:
        priv, pub = new_keys()
        print(f"public  (site/config.js vapidPublicKey): {pub}\nprivate (GitHub secret VAPID_PRIVATE_KEY): {priv}")
