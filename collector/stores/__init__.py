"""Registry of store collectors. Add a store by importing its class here."""
from collector.stores.aldi import Aldi, AldiNL
from collector.stores.base import Store
from collector.stores.delhaize import Delhaize
from collector.stores.intermarche import Intermarche
from collector.stores.lidl import Lidl, LidlNL

STORES: dict[str, type[Store]] = {
    "aldi": Aldi,
    "lidl": Lidl,
    "delhaize": Delhaize,
    "intermarche": Intermarche,
    # Zeeuws-Vlaanderen (NL). Jumbo, PLUS/Coop forbid copying in their terms; AH and the rest: see README.
    "aldi-nl": AldiNL,
    "lidl-nl": LidlNL,
}
