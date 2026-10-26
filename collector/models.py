"""The one format every store's deals are converted into."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timezone


@dataclass
class Deal:
    store: str                      # chain name, e.g. "Lidl"
    name: str                       # product name as the store writes it
    price: float                    # what you pay for one pack during the promo, in euro
    source_url: str                 # store page where the deal was found
    brand: str | None = None
    category: str | None = None
    old_price: float | None = None  # regular price, if the store shows it
    pack_size: str | None = None    # raw text, e.g. "6 x 1 L"
    quantity: float | None = None   # pack size in base units (kg, L or pieces)
    unit: str | None = None         # "kg", "L" or "piece"
    unit_price: float | None = None # euro per kg / L / piece, computed by us
    promo_text: str | None = None   # raw promo label, e.g. "2de aan halve prijs"
    promo_type: str | None = None   # normalised: percent, multi_buy, second_discount, price_drop
    valid_from: date | None = None
    valid_until: date | None = None
    image_url: str | None = None    # the store's own product photo
    language: str = "nl"
    collected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def saving(self) -> float | None:
        if self.old_price is None:
            return None
        return round(self.old_price - self.price, 2)

    def to_dict(self) -> dict:
        d = asdict(self)
        for k, v in d.items():
            if isinstance(v, (date, datetime)):
                d[k] = v.isoformat()
        d["saving"] = self.saving
        return d
