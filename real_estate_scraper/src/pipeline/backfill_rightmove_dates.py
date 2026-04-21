from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

import requests

from src.storage.mysql_utils import ensure_mysql_database_exists, get_mysql_engine


RAW_TABLE_NAME = "rightmove_listings"
ADDED_ON_RE = re.compile(r"Added on\s*(\d{2}/\d{2}/\d{4})", re.IGNORECASE)
REDUCED_ON_RE = re.compile(r"Reduced on\s*(\d{2}/\d{2}/\d{4})", re.IGNORECASE)
DEFAULT_TIMEOUT = 20
MAX_WORKERS = 8
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-GB,en;q=0.9",
}


@dataclass(frozen=True)
class PendingListing:
    listing_id: str
    detail_url: str
    listing_date: str | None
    last_updated_date: str | None


@dataclass(frozen=True)
class BackfillResult:
    listing_id: str
    scraped_listing_date: str | None
    scraped_last_updated_date: str | None


def main() -> None:
    pending_rows = load_pending_rows()
    print(f"Found {len(pending_rows)} rightmove rows needing date backfill")
    if not pending_rows:
        return

    results = scrape_pending_rows(pending_rows)
    applied_count = apply_updates(results)

    print(f"Scraped {len(results)} rows with at least one backfillable date")
    print(f"Updated {applied_count} database rows")


def load_pending_rows(table_name: str = RAW_TABLE_NAME) -> list[PendingListing]:
    ensure_mysql_database_exists()
    engine = get_mysql_engine()
    query = f"""
        SELECT listing_id, detail_url, listing_date, last_updated_date
        FROM `{table_name}`
        WHERE source = 'rightmove'
          AND detail_url IS NOT NULL
          AND detail_url <> ''
          AND (listing_date IS NULL OR listing_date = '' OR last_updated_date IS NULL OR last_updated_date = '')
    """

    with engine.connect() as connection:
        rows = connection.exec_driver_sql(query).fetchall()

    return [PendingListing(*row) for row in rows]


def scrape_pending_rows(rows: Iterable[PendingListing]) -> list[BackfillResult]:
    results: list[BackfillResult] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(scrape_detail_page, row) for row in rows]
        for future in as_completed(futures):
            result = future.result()
            if result and (result.scraped_listing_date or result.scraped_last_updated_date):
                results.append(result)
    return results


def scrape_detail_page(row: PendingListing) -> BackfillResult | None:
    try:
        response = requests.get(row.detail_url, headers=HEADERS, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException:
        return None

    html = response.text
    added_on = extract_date(ADDED_ON_RE, html)
    reduced_on = extract_date(REDUCED_ON_RE, html)

    scraped_listing_date = normalize_date(added_on) if row.listing_date in (None, "") else None
    scraped_last_updated_date = None
    if row.last_updated_date in (None, ""):
        scraped_last_updated_date = normalize_date(reduced_on or added_on)

    if not scraped_listing_date and not scraped_last_updated_date:
        return None

    return BackfillResult(
        listing_id=row.listing_id,
        scraped_listing_date=scraped_listing_date,
        scraped_last_updated_date=scraped_last_updated_date,
    )


def extract_date(pattern: re.Pattern[str], html: str) -> str | None:
    match = pattern.search(html)
    return match.group(1) if match else None


def normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    parsed = datetime.strptime(value, "%d/%m/%Y")
    return parsed.strftime("%Y-%m-%dT00:00:00Z")


def apply_updates(results: list[BackfillResult], table_name: str = RAW_TABLE_NAME) -> int:
    if not results:
        return 0

    query = f"""
        UPDATE `{table_name}`
        SET listing_date = COALESCE(listing_date, %s),
            last_updated_date = COALESCE(last_updated_date, %s)
        WHERE listing_id = %s
    """
    values = [
        (result.scraped_listing_date, result.scraped_last_updated_date, result.listing_id)
        for result in results
    ]

    engine = get_mysql_engine()
    raw_connection = engine.raw_connection()
    try:
        cursor = raw_connection.cursor()
        cursor.executemany(query, values)
        raw_connection.commit()
        return cursor.rowcount if cursor.rowcount != -1 else len(values)
    finally:
        raw_connection.close()


if __name__ == "__main__":
    main()
