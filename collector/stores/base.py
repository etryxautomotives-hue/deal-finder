"""Shared plumbing for store collectors: a polite HTTP client and product data found in pages."""
from __future__ import annotations

import json
import logging
import time
import urllib.robotparser
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from collector.models import Deal

log = logging.getLogger(__name__)

USER_AGENT = "DealFinderBot/0.1 (+contact: set CONTACT_EMAIL)"


class PoliteClient:
    """Respects robots.txt, waits between requests and identifies itself."""

    def __init__(self, delay: float = 5.0, user_agent: str = USER_AGENT):
        self.delay = delay
        self.user_agent = user_agent
        self._robots: dict[str, urllib.robotparser.RobotFileParser] = {}
        self._last = 0.0
        self.http = httpx.Client(headers={"User-Agent": user_agent, "Accept-Language": "nl-BE,nl;q=0.9,fr;q=0.8"},
                                 follow_redirects=True, timeout=30)

    def allowed(self, url: str) -> bool:
        host = urlparse(url)
        root = f"{host.scheme}://{host.netloc}"
        if root not in self._robots:
            rp = urllib.robotparser.RobotFileParser()
            try:
                r = self.http.get(root + "/robots.txt")
                rp.parse(r.text.splitlines() if r.status_code == 200 else [])
            except httpx.HTTPError:
                rp.parse([])
            self._robots[root] = rp
        return self._robots[root].can_fetch(self.user_agent, url)

    def get(self, url: str) -> httpx.Response:
        if not self.allowed(url):
            raise PermissionError(f"robots.txt disallows {url}")
        wait = self.delay - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        self._last = time.monotonic()
        r = self.http.get(url)
        r.raise_for_status()
        return r


class Store:
    """One chain. Subclasses set `name` and implement `collect`."""

    name: str = ""
    enabled: bool = True

    def __init__(self, client: PoliteClient):
        self.client = client

    def collect(self) -> list[Deal]:
        raise NotImplementedError


def jsonld_products(html: str, page_url: str) -> list[dict]:
    """schema.org Product entries embedded in a page, with image and link made absolute.

    Many shops embed these for Google; they carry name, brand, price and the real product photo.
    """
    soup = BeautifulSoup(html, "html.parser")
    found: list[dict] = []

    def walk(node):
        if isinstance(node, list):
            for n in node:
                walk(n)
        elif isinstance(node, dict):
            kind = node.get("@type")
            if kind == "Product" or (isinstance(kind, list) and "Product" in kind):
                found.append(node)
            for key in ("@graph", "itemListElement", "item"):
                if key in node:
                    walk(node[key])

    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            walk(json.loads(tag.string or ""))
        except json.JSONDecodeError:
            log.debug("bad JSON-LD on %s", page_url)

    for p in found:
        img = p.get("image")
        if isinstance(img, list):
            img = img[0] if img else None
        if isinstance(img, dict):
            img = img.get("url")
        p["image"] = urljoin(page_url, img) if img else None
        p["url"] = urljoin(page_url, p.get("url") or page_url)
    return found
