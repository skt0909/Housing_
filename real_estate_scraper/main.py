from __future__ import annotations

from pathlib import Path

from src.scraper.buy_scraper import BuyScraper
from src.scraper.rent_scraper import RentScraper
from src.storage.csv_handler import write_csv
from src.storage.db_handler import DatabaseHandler
from src.storage.mysql_utils import ensure_mysql_database_exists
from src.utils.config import (
    BUY_URL,
    DATA_DIR,
    LOG_DIR,
    MYSQL_DATABASE,
    MYSQL_HOST,
    MYSQL_PORT,
    RENT_URL,
    RIGHTMOVE_AREA_NAMES,
    RIGHTMOVE_MAX_PAGES,
    RIGHTMOVE_MUST_HAVE,
    RIGHTMOVE_PAGE_SIZE,
    RIGHTMOVE_PROPERTY_TYPES,
    SAVE_CSV,
    SCRAPER_MODE,
    SCRAPER_TIMEOUT,
    RightmoveSearchTarget,
    build_search_targets,
)
from src.utils.helpers import utc_timestamp
from src.utils.logger import get_logger


RAW_TABLE_NAME = "rightmove_listings"
VALID_MODES = {"rent", "buy", "both"}


def main() -> None:
    logger = get_logger("scraper", LOG_DIR)

    print(f"RUNNING_FILE={Path(__file__).resolve()}")
    print(f"WORKING_DIR={Path.cwd()}")
    print(f"SCRAPER_MODE={SCRAPER_MODE}")
    print(f"RENT_URL={RENT_URL}")
    print(f"BUY_URL={BUY_URL}")
    print(f"SAVE_CSV={SAVE_CSV}")
    print(f"RIGHTMOVE_AREA_NAMES={RIGHTMOVE_AREA_NAMES}")
    print(f"RIGHTMOVE_PROPERTY_TYPES={RIGHTMOVE_PROPERTY_TYPES}")
    print(f"RIGHTMOVE_MUST_HAVE={RIGHTMOVE_MUST_HAVE}")
    print(f"RIGHTMOVE_MAX_PAGES={RIGHTMOVE_MAX_PAGES}")
    print(f"RIGHTMOVE_PAGE_SIZE={RIGHTMOVE_PAGE_SIZE}")

    if SCRAPER_MODE not in VALID_MODES:
        raise ValueError(f"SCRAPER_MODE must be one of: {', '.join(sorted(VALID_MODES))}")

    ensure_mysql_database_exists()
    db_handler = DatabaseHandler()

    if SCRAPER_MODE in {"rent", "both"}:
        _run_single_mode(
            mode="rent",
            targets=build_search_targets("rent", RENT_URL),
            db_handler=db_handler,
            logger=logger,
        )

    if SCRAPER_MODE in {"buy", "both"}:
        _run_single_mode(
            mode="buy",
            targets=build_search_targets("buy", BUY_URL),
            db_handler=db_handler,
            logger=logger,
        )


def _run_single_mode(mode: str, targets: list[RightmoveSearchTarget], db_handler: DatabaseHandler, logger) -> None:
    records = _scrape_targets(mode, targets, logger)
    print(f"Scraped {len(records)} unique records using {mode} mode from Rightmove.")

    if not records:
        print(f"No {mode} records found, so nothing was written to disk.")
        return

    inserted_count, updated_count = db_handler.upsert_many(RAW_TABLE_NAME, records)

    logger.info(
        "Inserted %s new %s rows into MySQL %s on %s:%s and refreshed %s existing rows",
        inserted_count,
        mode,
        MYSQL_DATABASE,
        MYSQL_HOST,
        MYSQL_PORT,
        updated_count,
    )
    print(f"Saved MySQL rows to: {MYSQL_DATABASE}.{RAW_TABLE_NAME} on {MYSQL_HOST}:{MYSQL_PORT}")
    print(f"Mode: {mode} | Inserted new rows: {inserted_count} | Refreshed existing rows: {updated_count}")

    if SAVE_CSV:
        timestamp = _safe_timestamp(utc_timestamp())
        csv_path = DATA_DIR / "raw" / mode / f"rightmove_{mode}_{timestamp}.csv"
        write_csv(csv_path, records)
        logger.info("Saved %s %s records to CSV %s", len(records), mode, csv_path)
        print(f"Saved CSV: {csv_path}")

    print(records[0])


def _scrape_targets(mode: str, targets: list[RightmoveSearchTarget], logger) -> list[dict]:
    deduped_records: dict[str, dict] = {}

    for target in targets:
        if "rightmove.co.uk" not in target.url:
            raise ValueError(f"{mode.upper()} URL must be a Rightmove search results URL.")

        for page_number in range(1, RIGHTMOVE_MAX_PAGES + 1):
            page_params = dict(target.params)
            page_params["index"] = str((page_number - 1) * RIGHTMOVE_PAGE_SIZE)

            scraper = _build_scraper(mode=mode, target=target, request_params=page_params)
            scraped_records = scraper.scrape()

            logger.info(
                "Scrape finished with %s records in %s mode for target '%s' page %s from %s with params=%s",
                len(scraped_records),
                mode,
                target.label,
                page_number,
                target.url,
                page_params,
            )
            print(f"[{mode}] {target.label} page {page_number}: scraped {len(scraped_records)} records")

            for record in scraped_records:
                deduped_records.setdefault(record["listing_id"], record)

    return list(deduped_records.values())


def _build_scraper(mode: str, target: RightmoveSearchTarget, request_params: dict[str, str]) -> RentScraper | BuyScraper:
    scraper_class = RentScraper if mode == "rent" else BuyScraper
    return scraper_class(target.url, timeout=SCRAPER_TIMEOUT, request_params=request_params)


def _safe_timestamp(value: str) -> str:
    return value.replace(":", "-")


if __name__ == "__main__":
    main()
