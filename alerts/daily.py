"""Once a day: the products you like or have on your list that are on promo near you.

Runs on GitHub Actions right after the deals are collected (no Claude involved). For everyone who switched on
the daily notification (on a phone or computer, see alerts/webpush.py) or the daily email in their account it:
  1. takes their list items ("koffie"), saved deals and preferred shop from Supabase,
  2. matches them to today's deals near their postcode, the same way the site does (site/basket.js),
  3. sends one short summary, but only when something is new since yesterday (a new promo, or a better price).

Always needs the GitHub secrets SUPABASE_URL and SUPABASE_SERVICE_KEY (Supabase > Project settings > API keys >
secret key). Notifications also need VAPID_PRIVATE_KEY (docs/SETUP-ALERTS.md); email needs RESEND_API_KEY plus the
variable ALERT_FROM (e.g. "deal'ke <hallo@dealke.be>"). Whatever is missing is skipped.

    python -m alerts.daily --prev /tmp/prev-deals.json            # send
    python -m alerts.daily --prev /tmp/prev-deals.json --dry-run  # only print who would get what
"""
from __future__ import annotations

import argparse
import html
import json
import logging
import math
import os
import re
import sys
import unicodedata
from pathlib import Path

import httpx

from alerts import webpush

log = logging.getLogger("alerts")
ROOT = Path(__file__).resolve().parent.parent
CUTS = re.compile(r"^(s|en|reepjes|blokjes|stukjes|plakjes|schijfjes|sneetjes|tranches|des)$")
MAX_ITEMS = 12


def fold(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", str(s or "").lower()) if not unicodedata.combining(c))


def words(s: str) -> list[str]:
    return [w for w in re.split(r"[^a-z0-9%]+", fold(s)) if w]


def fits(item: str, deal: dict) -> bool:
    """Same rule as site/basket.js: every word is a whole word of the name, the end of a compound
    ("koffie" in "oploskoffie"), or the start of one when the rest only says how it's cut ("kipfiletreepjes")."""
    name = words(f"{deal.get('name', '')} {deal.get('brand') or ''}")
    ws = words(item)
    return bool(ws) and all(
        w in name or any(len(t) > len(w) and (t.endswith(w) or (t.startswith(w) and CUTS.match(t[len(w):]))) for t in name)
        for w in ws)


def km(a, b, c, d) -> float:
    r = math.pi / 180
    x = math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


def where(pc: str, pcs: dict, pcs_nl: dict):
    """Postcode as the site stores it: "9000", "NL-4501" or "@BE|lat|lon|street"."""
    if not pc:
        return None
    if pc.startswith("@"):
        cc, lat, lon, *_ = pc[1:].split("|")
        return float(lat), float(lon)
    p = pcs_nl.get(pc[3:]) if pc.startswith("NL-") else pcs.get(pc)
    return (p[0], p[1]) if p else None


def near_deals(deals: list[dict], stores: list[dict], at, radius: float) -> list[dict]:
    if not at:
        return [d for d in deals if (d.get("cc") or "BE") == "BE"]
    nearest: dict[str, float] = {}
    for b in stores:
        k = f"{b.get('cc') or 'BE'}|{b['chain']}"
        dist = km(at[0], at[1], b["lat"], b["lon"])
        if dist < nearest.get(k, 1e9):
            nearest[k] = dist
    out = []
    for d in deals:
        k = f"{d.get('cc') or 'BE'}|{d['store']}"
        if k in nearest:
            if nearest[k] <= radius:
                out.append({**d, "km": round(nearest[k], 1)})
        elif (d.get("cc") or "BE") == "BE":
            out.append(d)
    return out


def matches_for(user: dict, deals: list[dict]) -> list[dict]:
    """One line per thing the user wants: the cheapest fitting deal (their own shop first if it has one)."""
    prefs = user.get("prefs") or {}
    shop = prefs.get("shop") or ""
    wanted = [w.get("q", "") for w in prefs.get("wants") or [] if w.get("q")]
    wanted += [d.get("name", "") for d in (user.get("list") or {}).values() if isinstance(d, dict) and d.get("name")]
    seen, out = set(), []
    for q in wanted:
        if fold(q) in seen:
            continue
        seen.add(fold(q))
        hits = sorted((d for d in deals if fits(q, d)), key=lambda d: d["price"])
        if not hits:
            continue
        mine = next((d for d in hits if d["store"] == shop), None)
        best = hits[0]
        out.append({"q": q, "deal": mine or best, "cheaper": best if mine and best["price"] < mine["price"] - 0.01 else None})
    return out


def key(m: dict) -> str:
    d = m["deal"]
    return f"{fold(m['q'])}|{d['store']}|{d['price']}"


TEXT = {
    "nl": {"subject": lambda n: f"{n} van je producten in promo vandaag", "hi": "Dit is vandaag in promo in je buurt:",
           "cheaper": "goedkoper bij", "until": "tot", "open": "Open deal'ke", "off": "Geen e-mail meer? Zet het uit in je account.",
           "new": "nieuw", "push": lambda n: f"{n} van je lijst in promo", "at": "bij", "more": lambda n: f"+{n} meer"},
    "fr": {"subject": lambda n: f"{n} de vos produits en promo aujourd'hui", "hi": "Voici ce qui est en promo près de chez vous :",
           "cheaper": "moins cher chez", "until": "jusqu'au", "open": "Ouvrir deal'ke", "off": "Plus d'e-mails ? Désactivez-les dans votre compte.",
           "new": "nouveau", "push": lambda n: f"{n} de votre liste en promo", "at": "chez", "more": lambda n: f"+{n} autres"},
    "en": {"subject": lambda n: f"{n} of your products on promo today", "hi": "On promo near you today:",
           "cheaper": "cheaper at", "until": "until", "open": "Open deal'ke", "off": "No more emails? Switch them off in your account.",
           "new": "new", "push": lambda n: f"{n} from your list on promo", "at": "at", "more": lambda n: f"+{n} more"},
}


def money(v: float, lang: str) -> str:
    s = f"{v:.2f}"
    return f"€{s}" if lang == "en" else f"€ {s.replace('.', ',')}"


def email(ms: list[dict], new: set[str], lang: str, site: str) -> tuple[str, str, str]:
    T = TEXT.get(lang, TEXT["nl"])
    ms = sorted(ms, key=lambda m: key(m) not in new)[:MAX_ITEMS]   # new ones first
    rows, lines = [], []
    for m in ms:
        d = m["deal"]
        bits = [d["store"]] + ([d["promo_text"]] if d.get("promo_text") else []) + \
               ([f"{T['until']} {d['valid_until'][8:10]}/{d['valid_until'][5:7]}"] if d.get("valid_until") else [])
        extra = f" · {T['cheaper']} {m['cheaper']['store']} {money(m['cheaper']['price'], lang)}" if m.get("cheaper") else ""
        tag = f" ({T['new']})" if key(m) in new else ""
        lines.append(f"- {m['q']}: {d['name']}, {money(d['price'], lang)} · {' · '.join(bits)}{extra}{tag}")
        badge = (' <span style="background:#EEF8C6;color:#2E4300;border-radius:99px;padding:1px 8px;font-size:12px">'
                 + T["new"] + "</span>") if tag else ""
        rows.append(
            f'<tr><td style="padding:8px 0;border-top:1px solid #E8E4DA"><b>{html.escape(m["q"])}</b>{badge}<br>'
            f'<span style="color:#69655B;font-size:14px">{html.escape(d["name"])} · {html.escape(" · ".join(bits))}{html.escape(extra)}</span></td>'
            f'<td style="padding:8px 0 8px 12px;border-top:1px solid #E8E4DA;text-align:right;font-weight:700;white-space:nowrap">{money(d["price"], lang)}</td></tr>')
    subject = T["subject"](len(ms))
    text = f"{T['hi']}\n\n" + "\n".join(lines) + f"\n\n{T['open']}: {site}\n{T['off']}"
    body = (f'<div style="font-family:Inter,Arial,sans-serif;color:#17150F;max-width:560px;margin:auto;padding:16px">'
            f'<p style="font-size:16px">{T["hi"]}</p><table style="width:100%;border-collapse:collapse;font-size:15px">{"".join(rows)}</table>'
            f'<p style="margin:24px 0"><a href="{site}" style="background:#C6F135;color:#17150F;padding:12px 20px;border-radius:12px;'
            f'text-decoration:none;font-weight:700">{T["open"]}</a></p>'
            f'<p style="color:#69655B;font-size:13px"><a href="{site}#account" style="color:#69655B">{T["off"]}</a></p></div>')
    return subject, text, body


def notification(ms: list[dict], new: set[str], lang: str, site: str) -> dict:
    """What the phone shows: the new ones first, three at most, then "+2 more". Tapping it opens the list."""
    T = TEXT.get(lang, TEXT["nl"])
    fresh = [m for m in ms if key(m) in new]
    bits = [f"{m['q']} {money(m['deal']['price'], lang)} {T['at']} {m['deal']['store']}" for m in fresh[:3]]
    if len(fresh) > 3:
        bits.append(T["more"](len(fresh) - 3))
    return {"title": T["push"](len(fresh)), "body": " · ".join(bits), "url": site.rstrip("/") + "/#list", "tag": "daily"}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prev", help="yesterday's deals.json, to tell what's new")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    url, sk = os.environ.get("SUPABASE_URL", "").rstrip("/"), os.environ.get("SUPABASE_SERVICE_KEY", "")
    resend, sender = os.environ.get("RESEND_API_KEY", ""), os.environ.get("ALERT_FROM", "")
    vapid = os.environ.get("VAPID_PRIVATE_KEY", "")
    site = os.environ.get("SITE_URL") or "https://etryxautomotives-hue.github.io/deal-finder/"
    by_mail, by_push = bool(resend and sender), bool(vapid)
    if not (url and sk) or (not a.dry_run and not (by_mail or by_push)):
        log.info("daily notification not set up (needs SUPABASE_URL, SUPABASE_SERVICE_KEY and VAPID_PRIVATE_KEY "
                 "or RESEND_API_KEY + ALERT_FROM): skipped")
        return 0
    contact = os.environ.get("VAPID_CONTACT") or site
    data = ROOT / "data"
    deals = json.loads((data / "deals.json").read_text())
    prev = json.loads(Path(a.prev).read_text()) if a.prev and Path(a.prev).exists() else []
    stores = json.loads((data / "stores.json").read_text()) if (data / "stores.json").exists() else []
    pcs = json.loads((ROOT / "site/data/postcodes.json").read_text())
    pcs_nl = json.loads((data / "postcodes-nl.json").read_text()) if (data / "postcodes-nl.json").exists() else {}
    # New Supabase secret keys (sb_secret_...) go in the apikey header only; the older service_role key is a JWT
    # and also goes in Authorization.
    h = {"apikey": sk, **({"Authorization": f"Bearer {sk}"} if sk.startswith("eyJ") else {})}
    with httpx.Client(timeout=30) as http:
        rows = http.get(f"{url}/rest/v1/user_data", headers=h, params={"select": "user_id,list,prefs"}).json()
        users = [u for u in rows if (u.get("prefs") or {}).get("alerts") or (u.get("prefs") or {}).get("push")]
        emails = {}
        if by_mail and any((u.get("prefs") or {}).get("alerts") for u in users):
            emails = {p["id"]: p.get("email") for p in http.get(f"{url}/rest/v1/profiles", headers=h, params={"select": "id,email"}).json()}
        mails = pushes = 0
        for u in users:
            prefs = u.get("prefs") or {}
            at = where(prefs.get("pc"), pcs, pcs_nl)
            radius = float(prefs.get("radius") or 15)
            now = matches_for(u, near_deals(deals, stores, at, radius))
            before = {key(m) for m in matches_for(u, near_deals(prev, stores, at, radius))} if prev else set()
            new = {key(m) for m in now} - before
            if not new:
                continue  # nothing changed since yesterday: nothing sent
            lang = prefs.get("lang") or "nl"
            subs = [p for p in prefs.get("push") or [] if isinstance(p, dict) and p.get("endpoint") and p.get("keys")]
            if subs:
                msg = notification(now, new, lang, site)
                if a.dry_run:
                    log.info("would notify user %s on %d device(s): %s: %s", u["user_id"][:8], len(subs), msg["title"], msg["body"])
                elif by_push:
                    gone = []
                    for p in subs:
                        try:
                            code = webpush.send(http, p, msg, vapid, contact)
                        except Exception as e:  # one broken subscription must not stop the rest
                            log.warning("push to user %s failed: %s", u["user_id"][:8], e)
                            continue
                        if code in (404, 410):
                            gone.append(p["endpoint"])   # the browser unsubscribed or the app was removed
                        elif code >= 300:
                            log.warning("push to user %s: %s", u["user_id"][:8], code)
                        else:
                            pushes += 1
                    if gone:
                        keep = [p for p in prefs.get("push") or [] if p.get("endpoint") not in gone]
                        http.patch(f"{url}/rest/v1/user_data", headers={**h, "Prefer": "return=minimal"},
                                   params={"user_id": f"eq.{u['user_id']}"}, json={"prefs": {**prefs, "push": keep}})
            to = emails.get(u["user_id"])
            if prefs.get("alerts") and (to or a.dry_run):
                subject, text, body = email(now, new, lang, site)
                if a.dry_run:
                    log.info("would email user %s: %s\n%s", u["user_id"][:8], subject, text)
                    continue
                r = http.post("https://api.resend.com/emails", headers={"Authorization": f"Bearer {resend}"},
                              json={"from": sender, "to": [to], "subject": subject, "text": text, "html": body})
                if r.status_code >= 300:
                    log.warning("email to user %s failed: %s %s", u["user_id"][:8], r.status_code, r.text[:200])
                else:
                    mails += 1
    log.info("daily: %d notifications, %d emails sent, %d users with it on", pushes, mails, len(users))
    return 0


if __name__ == "__main__":
    sys.exit(main())
