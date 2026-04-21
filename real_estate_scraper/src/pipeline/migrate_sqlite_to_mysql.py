from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd
from sqlalchemy import text
from sqlalchemy.types import BIGINT, DOUBLE, INTEGER, TEXT, VARCHAR

from src.storage.mysql_utils import ensure_mysql_database_exists, get_mysql_engine
from src.utils.config import BASE_DIR, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PORT


DATABASE_DIR = BASE_DIR / "database"
SQLITE_SOURCES = {
    DATABASE_DIR / "raw_data.db": ["rightmove_listings"],
    DATABASE_DIR / "clean_data.db": ["clean_listings", "listings", "boroughs"],
    DATABASE_DIR / "borough_data.db": ["borough_data"],
}

TABLE_DTYPES = {
    "rightmove_listings": {
        "listing_id": VARCHAR(length=255),
        "listing_type": TEXT(),
        "price": TEXT(),
        "address": TEXT(),
        "location": TEXT(),
        "bedrooms": TEXT(),
        "bathrooms": TEXT(),
        "latitude": TEXT(),
        "longitude": TEXT(),
        "description": TEXT(),
        "detail_url": TEXT(),
        "source": VARCHAR(length=64),
        "listing_date": VARCHAR(length=32),
        "last_updated_date": VARCHAR(length=32),
    },
    "clean_listings": {
        "listing_id": VARCHAR(length=255),
        "listing_type": TEXT(),
        "price": BIGINT(),
        "address": TEXT(),
        "bedrooms": INTEGER(),
        "bathrooms": INTEGER(),
        "latitude": DOUBLE(),
        "longitude": DOUBLE(),
        "listing_date": VARCHAR(length=32),
        "last_updated_date": VARCHAR(length=32),
        "postcode": VARCHAR(length=32),
        "district": VARCHAR(length=255),
        "num_amenities": INTEGER(),
        "num_schools": INTEGER(),
        "num_restaurants": INTEGER(),
        "num_transport": INTEGER(),
        "num_shops": INTEGER(),
        "borough_code": VARCHAR(length=32),
    },
    "listings": {
        "listing_id": VARCHAR(length=255),
        "listing_type": TEXT(),
        "price": BIGINT(),
        "address": TEXT(),
        "bedrooms": INTEGER(),
        "bathrooms": INTEGER(),
        "latitude": DOUBLE(),
        "longitude": DOUBLE(),
        "listing_date": VARCHAR(length=32),
        "last_updated_date": VARCHAR(length=32),
        "postcode": VARCHAR(length=32),
        "district": VARCHAR(length=255),
        "num_amenities": INTEGER(),
        "num_schools": INTEGER(),
        "num_restaurants": INTEGER(),
        "num_transport": INTEGER(),
        "num_shops": INTEGER(),
        "borough_code": VARCHAR(length=32),
    },
    "boroughs": {
        "borough_code": VARCHAR(length=32),
        "borough_name": VARCHAR(length=255),
        "avg_price": DOUBLE(),
        "population": BIGINT(),
        "hectares": DOUBLE(),
        "population_per_hectare": DOUBLE(),
        "crime_count": BIGINT(),
        "amenity_count": DOUBLE(),
        "amenity_diversity": DOUBLE(),
        "crime_per_capita": DOUBLE(),
    },
    "borough_data": {
        "borough_code": VARCHAR(length=32),
        "borough_name": VARCHAR(length=255),
        "avg_price": DOUBLE(),
        "population": BIGINT(),
        "hectares": DOUBLE(),
        "population_per_hectare": DOUBLE(),
        "crime_count": BIGINT(),
        "amenity_count": DOUBLE(),
        "amenity_diversity": DOUBLE(),
        "crime_per_capita": DOUBLE(),
    },
}


def migrate_all() -> None:
    ensure_mysql_database_exists()
    engine = get_mysql_engine()

    migrated_counts: dict[str, int] = {}
    with engine.begin() as mysql_connection:
        for sqlite_path, table_names in SQLITE_SOURCES.items():
            with sqlite3.connect(sqlite_path) as sqlite_connection:
                for table_name in table_names:
                    dataframe = pd.read_sql_query(f'SELECT * FROM "{table_name}"', sqlite_connection)
                    dataframe.to_sql(
                        table_name,
                        mysql_connection,
                        if_exists="replace",
                        index=False,
                        dtype=TABLE_DTYPES[table_name],
                    )
                    migrated_counts[table_name] = len(dataframe)

        _apply_mysql_constraints(mysql_connection)

    print(f"Migrated SQLite data into MySQL database `{MYSQL_DATABASE}` on {MYSQL_HOST}:{MYSQL_PORT}")
    for table_name, row_count in migrated_counts.items():
        print(f"  {table_name}: {row_count} rows")


def _apply_mysql_constraints(connection) -> None:
    for table_name in ("rightmove_listings", "clean_listings", "listings"):
        connection.execute(text(f"ALTER TABLE `{table_name}` MODIFY `listing_id` VARCHAR(255) NOT NULL"))
        connection.execute(text(f"ALTER TABLE `{table_name}` ADD PRIMARY KEY (`listing_id`)"))

    connection.execute(text("CREATE INDEX idx_listings_district ON `listings` (`district`)"))
    connection.execute(text("CREATE INDEX idx_boroughs_name ON `boroughs` (`borough_name`)"))


if __name__ == "__main__":
    migrate_all()
