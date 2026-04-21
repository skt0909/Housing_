from __future__ import annotations

import json
import re
from typing import Any


SCRIPT_JSON_PATTERN = re.compile(r"<script[^>]*>(.*?)</script>", re.IGNORECASE | re.DOTALL)


def parse_api_response(payload: str) -> dict[str, Any]:
    return json.loads(payload)


def extract_embedded_json(html: str) -> list[dict[str, Any]]:
    objects: list[dict[str, Any]] = []

    for script_body in SCRIPT_JSON_PATTERN.findall(html):
        text = script_body.strip()
        if not text:
            continue

        if text.startswith("{") or text.startswith("["):
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                objects.append(parsed)

    return objects


def find_property_results(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict):
        for key in ("properties", "results", "propertyData", "listings"):
            value = payload.get(key)
            if isinstance(value, list) and value and all(isinstance(item, dict) for item in value):
                return value

        for value in payload.values():
            match = find_property_results(value)
            if match:
                return match

    if isinstance(payload, list):
        for item in payload:
            match = find_property_results(item)
            if match:
                return match

    return []

