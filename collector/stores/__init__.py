"""Registry of store collectors. Add a store by importing its class here."""
from collector.stores.base import Store

STORES: dict[str, type[Store]] = {}
