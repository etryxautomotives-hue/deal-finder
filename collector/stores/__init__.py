"""Registry of store collectors. Add a store by importing its class here."""
from collector.stores.aldi import Aldi
from collector.stores.base import Store
from collector.stores.delhaize import Delhaize
from collector.stores.lidl import Lidl

STORES: dict[str, type[Store]] = {
    "aldi": Aldi,
    "lidl": Lidl,
    "delhaize": Delhaize,
}
