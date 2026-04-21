from __future__ import annotations

from typing import Any


REQUIRED_FIELDS = ("listing_id", "price", "location")


def validate_record(record: dict[str, Any]) -> bool:
    return all(field in record and record[field] not in (None, "") for field in REQUIRED_FIELDS)
