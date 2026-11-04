"""One email a day: the products you like or have on your list that are on promo near you.

Runs on GitHub Actions right after the deals are collected (no Claude involved). For everyone who switched
"Daily email" on in their account it:
  1. takes their list items ("koffie"), saved deals and preferred shop from Supabase,
  2. matches them to today's deals near their postcode, the same way the site does (site/basket.js),
  3. sends one short summary, but only when something is new since yesterday (a new promo, or a better price).

Needs three GitHub secrets: SUPABASE_URL, SUPABASE_SERVICE_KEY (Supabase > Project settings > API keys > secret key)
and RESEND_API_KEY, plus the variable ALERT_FROM (e.g. "deal'ke <hallo@dealke.be>"). Missing any: it does nothing.

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
           "new": "nieuw"},
    "fr": {"subject": lambda n: f"{n} de vos produits en promo aujourd'hui", "hi": "Voici ce qui est en promo près de chez vous :",
           "cheaper": "moins cher chez", "until": "jusqu'au", "open": "Ouvrir deal'ke", "off": "Plus d'e-mails ? Désactivez-les dans votre compte.",
           "new": "nouveau"},
    "en": {"subject": lambda n: f"{n} of your products on promo today", "hi": "On promo near you today:",
           "cheaper": "cheaper at", "until": "until", "open": "Open deal'ke", "off": "No more emails? Switch them off in your account.",
           "new": "new"},
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


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prev", help="yesterday's deals.json, to tell what's new")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    url, sk = os.environ.get("SUPABASE_URL", "").rstrip("/"), os.environ.get("SUPABASE_SERVICE_KEY", "")
    resend, sender = os.environ.get("RESEND_API_KEY", ""), os.environ.get("ALERT_FROM", "")
    site = os.environ.get("SITE_URL") or "https://etryxautomotives-hue.github.io/deal-finder/"
    if not (url and sk) or (not a.dry_run and not (resend and sender)):
        log.info("daily email not set up (needs SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, ALERT_FROM): skipped")
        return 0
    data = ROOT / "data"
    deals = json.loads((data / "deals.json").read_text())
    prev = json.loads(Path(a.prev).read_text()) if a.prev and Path(a.prev).exists() else []
    stores = json.loads((data / "stores.json").read_text()) if (data / "stores.json").exists() else []
    pcs = json.loads((ROOT / "site/data/postcodes.json").read_text())
    pcs_nl = json.loads((data / "postcodes-nl.json").read_text()) if (data / "postcodes-nl.json").exists() else {}
    h = {"apikey": sk, "Authorization": f"Bearer {sk}"}
    with httpx.Client(timeout=30) as http:
        users = http.get(f"{url}/rest/v1/user_data", headers=h, params={"select": "user_id,list,prefs", "prefs->>alerts": "eq.true"}).json()
        emails = {p["id"]: p.get("email") for p in http.get(f"{url}/rest/v1/profiles", headers=h, params={"select": "id,email"}).json()}
        sent = 0
        for u in users:
            to = emails.get(u["user_id"])
            prefs = u.get("prefs") or {}
            if not to:
                continue
            at = where(prefs.get("pc"), pcs, pcs_nl)
            radius = float(prefs.get("radius") or 15)
            now = matches_for(u, near_deals(deals, stores, at, radius))
            before = {key(m) for m in matches_for(u, near_deals(prev, stores, at, radius))} if prev else set()
            new = {key(m) for m in now} - before
            if not new:
                continue  # nothing changed since yesterday: no email
            subject, text, body = email(now, new, prefs.get("lang") or "nl", site)
            if a.dry_run:
                log.info("would send to %s: %s\n%s", to, subject, text)
                continue
            r = http.post("https://api.resend.com/emails", headers={"Authorization": f"Bearer {resend}"},
                          json={"from": sender, "to": [to], "subject": subject, "text": text, "html": body})
            if r.status_code >= 300:
                log.warning("email to user %s failed: %s %s", u["user_id"][:8], r.status_code, r.text[:200])
            else:
                sent += 1
    log.info("daily email: %d sent, %d users with it on", sent, len(users))
    return 0


if __name__ == "__main__":
    sys.exit(main())
