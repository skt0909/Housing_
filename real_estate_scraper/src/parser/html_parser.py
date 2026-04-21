from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from .api_parser import extract_embedded_json, find_property_results

PRICE_RE = re.compile(r"\u00a3[\d,]+(?:\s*(?:pcm|pw|per\s+month|per\s+week))?", re.IGNORECASE)
BED_RE = re.compile(r"(\d+)\s*(?:bed|bedroom)", re.IGNORECASE)
BATH_RE = re.compile(r"(\d+)\s*(?:bath|bathroom)", re.IGNORECASE)
PROPERTY_ID_RE = re.compile(r"/properties/(\d+)")


def parse_html(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


def extract_rightmove_listings(html: str, base_url: str, listing_type: str) -> list[dict[str, Any]]:
    html_records = _extract_from_html_cards(html, base_url, listing_type)
    html_by_id = {record["listing_id"]: record for record in html_records}

    structured = _extract_from_embedded_json(html, base_url, listing_type)
    if not structured:
        return html_records

    merged_records: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for record in structured:
        listing_id = record["listing_id"]
        html_record = html_by_id.get(listing_id, {})
        merged = _merge_record(record, html_record)
        if listing_id not in seen_ids:
            seen_ids.add(listing_id)
            merged_records.append(merged)

    for record in html_records:
        listing_id = record["listing_id"]
        if listing_id not in seen_ids:
            seen_ids.add(listing_id)
            merged_records.append(record)

    return merged_records


def _extract_from_embedded_json(html: str, base_url: str, listing_type: str) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for payload in extract_embedded_json(html):
        for item in find_property_results(payload):
            record = _normalize_structured_listing(item, base_url, listing_type)
            if not record:
                continue

            listing_id = record["listing_id"]
            if listing_id in seen_ids:
                continue

            seen_ids.add(listing_id)
            records.append(record)

    return records


def _extract_from_html_cards(html: str, base_url: str, listing_type: str) -> list[dict[str, Any]]:
    soup = parse_html(html)
    records: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for anchor in soup.select('a[href*="/properties/"]'):
        href = anchor.get("href")
        if not href:
            continue

        property_match = PROPERTY_ID_RE.search(href)
        if not property_match:
            continue

        listing_id = property_match.group(1)
        if listing_id in seen_ids:
            continue

        card = _find_card_container(anchor)
        text_blocks = _collect_visible_text(card)
        text_blob = " ".join(text_blocks)
        title = _best_title(anchor, text_blocks)

        if not title:
            continue

        seen_ids.add(listing_id)
        records.append(
            {
                "listing_id": listing_id,
                "listing_type": listing_type,
                "price": _match_text(PRICE_RE, text_blob),
                "address": title,
                "location": title,
                "bedrooms": _match_number(BED_RE, text_blob),
                "bathrooms": _match_number(BATH_RE, text_blob),
                "latitude": None,
                "longitude": None,
                "listing_date": None,
                "last_updated_date": None,
                "description": _best_description(text_blocks),
                "detail_url": urljoin(base_url, href),
                "source": "rightmove",
            }
        )

    return records


def _normalize_structured_listing(item: dict[str, Any], base_url: str, listing_type: str) -> dict[str, Any] | None:
    listing_id = item.get("id") or item.get("propertyId") or item.get("listingId")
    if not listing_id:
        return None

    detail_path = item.get("propertyUrl") or item.get("detailUrl") or item.get("url") or f"/properties/{listing_id}"
    address = (
        item.get("displayAddress")
        or _get_nested(item, "address", "displayAddress")
        or _get_nested(item, "address", "summary")
        or item.get("title")
    )
    description = item.get("summary") or item.get("description")
    price = _extract_price_from_structured(item)
    latitude, longitude = _extract_coordinates(item)
    listing_date = _extract_listing_date(item)
    last_updated_date = _extract_last_updated_date(item)

    return {
        "listing_id": str(listing_id),
        "listing_type": listing_type,
        "price": price,
        "address": address,
        "location": address,
        "bedrooms": item.get("bedrooms") or item.get("bedroomsCount"),
        "bathrooms": item.get("bathrooms") or item.get("bathroomsCount"),
        "latitude": latitude,
        "longitude": longitude,
        "listing_date": listing_date,
        "last_updated_date": last_updated_date,
        "description": description,
        "detail_url": urljoin(base_url, str(detail_path)),
        "source": "rightmove",
    }


def _extract_coordinates(item: dict[str, Any]) -> tuple[float | None, float | None]:
    latitude = _coerce_coordinate(_get_nested(item, "location", "latitude"))
    longitude = _coerce_coordinate(_get_nested(item, "location", "longitude"))

    if latitude is not None or longitude is not None:
        return latitude, longitude

    latitude = _coerce_coordinate(_search_for_key(item, "latitude"))
    longitude = _coerce_coordinate(_search_for_key(item, "longitude"))
    return latitude, longitude


def _extract_listing_date(item: dict[str, Any]) -> str | None:
    for key_path in (
        ("firstVisibleDate",),
        ("listingDate",),
        ("dateAdded",),
        ("addedOn",),
    ):
        value = _get_nested(item, *key_path)
        normalized = _coerce_date_string(value)
        if normalized:
            return normalized

    return _coerce_date_string(_search_for_key(item, "firstVisibleDate"))


def _extract_last_updated_date(item: dict[str, Any]) -> str | None:
    for key_path in (
        ("listingUpdate", "listingUpdateDate"),
        ("updateDate",),
        ("lastUpdatedDate",),
        ("modifiedDate",),
    ):
        value = _get_nested(item, *key_path)
        normalized = _coerce_date_string(value)
        if normalized:
            return normalized

    return (
        _coerce_date_string(_search_for_key(item, "listingUpdateDate"))
        or _coerce_date_string(_search_for_key(item, "updateDate"))
    )


def _coerce_date_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        normalized = value.strip()
        return normalized or None
    return str(value)


def _coerce_coordinate(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None


def _search_for_key(payload: Any, target_key: str) -> Any:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if key == target_key:
                return value
            nested = _search_for_key(value, target_key)
            if nested is not None:
                return nested
    elif isinstance(payload, list):
        for item in payload:
            nested = _search_for_key(item, target_key)
            if nested is not None:
                return nested
    return None


def _extract_price_from_structured(item: dict[str, Any]) -> str | None:
    direct_paths = (
        ("price", "displayPrices", "displayPrice"),
        ("price", "displayPrice"),
        ("price", "amount"),
        ("price",),
        ("prices", "primaryPrice"),
        ("prices", "displayPrice"),
        ("rent", "price"),
    )

    for key_path in direct_paths:
        value = _get_nested(item, *key_path)
        price = _coerce_price(value)
        if price:
            return price

    return _search_for_price(item)


def _coerce_price(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        match = PRICE_RE.search(value)
        return match.group(0) if match else None
    if isinstance(value, (int, float)):
        return f"\u00a3{int(value):,}"
    if isinstance(value, dict):
        for key in ("displayPrice", "primaryPrice", "amount", "value"):
            nested = value.get(key)
            price = _coerce_price(nested)
            if price:
                return price
    return None


def _search_for_price(payload: Any) -> str | None:
    if isinstance(payload, dict):
        for value in payload.values():
            price = _search_for_price(value)
            if price:
                return price
    elif isinstance(payload, list):
        for item in payload:
            price = _search_for_price(item)
            if price:
                return price
    else:
        return _coerce_price(payload)
    return None


def _merge_record(primary: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    merged = dict(primary)
    for key, value in fallback.items():
        if merged.get(key) in (None, "", []):
            merged[key] = value
    return merged


def _get_nested(payload: dict[str, Any], *keys: str) -> Any:
    current: Any = payload
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _find_card_container(node: Tag) -> Tag:
    current: Tag | None = node
    while current is not None:
        if current.name in {"article", "section", "li", "div"}:
            classes = current.get("class", [])
            class_text = " ".join(classes) if isinstance(classes, list) else str(classes)
            if any(token in class_text.lower() for token in ("property", "card", "result", "l-searchresult")):
                return current
        parent = current.parent
        current = parent if isinstance(parent, Tag) else None
    return node


def _collect_visible_text(node: Tag) -> list[str]:
    text_blocks: list[str] = []
    for child in node.find_all(["h2", "h3", "h4", "p", "span", "div"], recursive=True):
        text = child.get_text(" ", strip=True)
        if text and text not in text_blocks:
            text_blocks.append(text)
    return text_blocks


def _best_title(anchor: Tag, text_blocks: list[str]) -> str | None:
    anchor_text = anchor.get_text(" ", strip=True)
    if anchor_text and not PRICE_RE.fullmatch(anchor_text):
        return anchor_text

    for text in text_blocks:
        if PRICE_RE.search(text):
            continue
        if len(text) < 12:
            continue
        return text

    return None


def _best_description(text_blocks: list[str]) -> str | None:
    candidates = [text for text in text_blocks if len(text) > 40 and not PRICE_RE.search(text)]
    return max(candidates, key=len, default=None)


def _match_text(pattern: re.Pattern[str], text: str) -> str | None:
    match = pattern.search(text)
    return match.group(0) if match else None


def _match_number(pattern: re.Pattern[str], text: str) -> int | None:
    match = pattern.search(text)
    return int(match.group(1)) if match else None
