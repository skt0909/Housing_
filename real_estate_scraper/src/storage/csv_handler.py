from __future__ import annotations

import csv
from pathlib import Path
from typing import Any


def write_csv(path: str | Path, records: list[dict[str, Any]]) -> None:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)

    if not records:
        destination.write_text("", encoding="utf-8")
        return

    fieldnames = list(records[0].keys())
    with destination.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
