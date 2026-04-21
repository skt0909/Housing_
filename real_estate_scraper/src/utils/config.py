from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DATABASE_DIR = BASE_DIR / "database"
LOG_DIR = BASE_DIR / "logs"
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH, override=True)

SCRAPER_MODE = os.getenv("SCRAPER_MODE", "rent")
RENT_URL = os.getenv("RENT_URL", "https://www.rightmove.co.uk/property-to-rent/CV.html")
BUY_URL = os.getenv("BUY_URL", "https://www.rightmove.co.uk/property-for-sale/CV.html")
RENT_SEARCH_URL = "https://www.rightmove.co.uk/property-to-rent/find.html"
BUY_SEARCH_URL = "https://www.rightmove.co.uk/property-for-sale/find.html"
SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", "30"))
SAVE_CSV = os.getenv("SAVE_CSV", "false").lower() == "true"
RIGHTMOVE_MAX_PAGES = int(os.getenv("RIGHTMOVE_MAX_PAGES", "5"))
RIGHTMOVE_PAGE_SIZE = int(os.getenv("RIGHTMOVE_PAGE_SIZE", "24"))
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "septleo@09092107")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "h_db")

RIGHTMOVE_REGION_IDENTIFIERS = {
    "Beckenham": "REGION^126",
    "Bromley": "REGION^225",
    "Central London": "REGION^92824",
    "Hampstead": "REGION^87509",
    "London": "REGION^87490",
    "North London": "REGION^92826",
    "Romford": "REGION^1138",
    "South London": "REGION^92051",
    "Walthamstow": "REGION^85310",
    "Wimbledon": "REGION^87540",
}

PROPERTY_TYPE_ALIASES = {
    "apartment": "flat",
    "bungalow": "bungalow",
    "cottage": "cottage",
    "detached": "detached",
    "flat": "flat",
    "house": "houses",
    "maisonette": "maisonette",
    "park home": "park-home",
    "park-home": "park-home",
    "semi detached": "semi-detached",
    "semi-detached": "semi-detached",
    "terrace": "terraced",
    "terraced": "terraced",
}

MUST_HAVE_ALIASES = {
    "garage": "garage",
    "garden": "garden",
    "parking": "parking",
}


@dataclass(frozen=True)
class RightmoveSearchTarget:
    label: str
    url: str
    params: dict[str, str]


def parse_csv_setting(name: str) -> list[str]:
    raw_value = os.getenv(name, "")
    return [item.strip() for item in raw_value.split(",") if item.strip()]


RIGHTMOVE_AREA_NAMES = parse_csv_setting("RIGHTMOVE_AREA_NAMES")
RIGHTMOVE_PROPERTY_TYPES = parse_csv_setting("RIGHTMOVE_PROPERTY_TYPES")
RIGHTMOVE_MUST_HAVE = parse_csv_setting("RIGHTMOVE_MUST_HAVE")


def build_mysql_url(include_database: bool = True) -> URL:
    database = MYSQL_DATABASE if include_database else None
    return URL.create(
        drivername="mysql+pymysql",
        username=MYSQL_USER,
        password=MYSQL_PASSWORD,
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        database=database,
    )


DATABASE_URL = build_mysql_url(include_database=True)


def build_search_targets(mode: str, fallback_url: str) -> list[RightmoveSearchTarget]:
    base_url = RENT_SEARCH_URL if mode == "rent" else BUY_SEARCH_URL
    shared_params = _build_shared_search_params()

    if not RIGHTMOVE_AREA_NAMES:
        return [RightmoveSearchTarget(label="custom-url", url=fallback_url, params=shared_params)]

    targets: list[RightmoveSearchTarget] = []
    for area_name in RIGHTMOVE_AREA_NAMES:
        identifier = _resolve_region_identifier(area_name)
        params = {"locationIdentifier": identifier, **shared_params}
        targets.append(RightmoveSearchTarget(label=area_name, url=base_url, params=params))
    return targets


def _build_shared_search_params() -> dict[str, str]:
    params: dict[str, str] = {}

    property_types = _normalize_tokens(
        values=RIGHTMOVE_PROPERTY_TYPES,
        alias_map=PROPERTY_TYPE_ALIASES,
        setting_name="RIGHTMOVE_PROPERTY_TYPES",
    )
    if property_types:
        params["propertyTypes"] = ",".join(property_types)

    must_have = _normalize_tokens(
        values=RIGHTMOVE_MUST_HAVE,
        alias_map=MUST_HAVE_ALIASES,
        setting_name="RIGHTMOVE_MUST_HAVE",
    )
    if must_have:
        params["mustHave"] = ",".join(must_have)

    return params


def _resolve_region_identifier(area_name: str) -> str:
    normalized = area_name.strip().casefold()
    for known_name, identifier in RIGHTMOVE_REGION_IDENTIFIERS.items():
        if known_name.casefold() == normalized:
            return identifier

    available_areas = ", ".join(sorted(RIGHTMOVE_REGION_IDENTIFIERS))
    raise ValueError(f"Unsupported RIGHTMOVE_AREA_NAMES value '{area_name}'. Available areas: {available_areas}")


def _normalize_tokens(values: list[str], alias_map: dict[str, str], setting_name: str) -> list[str]:
    normalized_values: list[str] = []

    for value in values:
        lookup_key = value.strip().casefold().replace("_", " ")
        normalized = alias_map.get(lookup_key)
        if not normalized:
            allowed = ", ".join(sorted(alias_map))
            raise ValueError(f"Unsupported {setting_name} value '{value}'. Allowed values: {allowed}")
        if normalized not in normalized_values:
            normalized_values.append(normalized)

    return normalized_values
