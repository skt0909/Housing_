from __future__ import annotations

import re
from pathlib import Path

import pandas as pd
from scipy.spatial import KDTree
from sqlalchemy import text
from sqlalchemy.types import BIGINT, DOUBLE, INTEGER, TEXT, VARCHAR

from src.storage.mysql_utils import ensure_mysql_database_exists, get_mysql_engine


BASE_DIR = Path(__file__).resolve().parents[2]
NOTEBOOKS_DIR = BASE_DIR / "notebooks"
POSTCODES_CSV_PATH = NOTEBOOKS_DIR / "df_postcodes.csv"
OSM_CSV_PATH = NOTEBOOKS_DIR / "df_osm.csv"
RAW_TABLE_NAME = "rightmove_listings"
CLEAN_TABLE_NAME = "clean_listings"
LISTINGS_TABLE_NAME = "listings"
BOROUGHS_SOURCE_TABLE_NAME = "borough_data"
BOROUGHS_TABLE_NAME = "boroughs"
AMENITY_RADIUS_DEGREES = 0.01
TRANSPORT_TYPES = {
    "bus_stop",
    "station",
    "subway_entrance",
    "bus_station",
    "train_station_entrance",
}

SELECTED_COLUMNS = [
    "listing_id",
    "listing_type",
    "price",
    "address",
    "bedrooms",
    "bathrooms",
    "latitude",
    "longitude",
    "listing_date",
    "last_updated_date",
]

FINAL_COLUMNS = [
    "listing_id",
    "listing_type",
    "price",
    "address",
    "bedrooms",
    "bathrooms",
    "latitude",
    "longitude",
    "listing_date",
    "last_updated_date",
    "postcode",
    "district",
    "borough_code",
    "num_amenities",
    "num_schools",
    "num_restaurants",
    "num_transport",
    "num_shops",
]

LISTING_DTYPES = {
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
    "borough_code": VARCHAR(length=32),
    "num_amenities": INTEGER(),
    "num_schools": INTEGER(),
    "num_restaurants": INTEGER(),
    "num_transport": INTEGER(),
    "num_shops": INTEGER(),
}

BOROUGH_DTYPES = {
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
}


def extract(table_name: str = RAW_TABLE_NAME) -> pd.DataFrame:
    """Read raw listing data from MySQL."""
    ensure_mysql_database_exists()
    engine = get_mysql_engine()
    print(f"Extracting data from MySQL table: {table_name}")

    query = f"""
        SELECT {", ".join(SELECTED_COLUMNS)}
        FROM `{table_name}`
    """

    with engine.connect() as connection:
        df = pd.read_sql_query(text(query), connection)

    print(f"Extracted {len(df)} rows")
    return df


def transform(df: pd.DataFrame, postcodes_csv_path: Path = POSTCODES_CSV_PATH) -> pd.DataFrame:
    """Clean listing data and add nearest postcode details with a KDTree."""
    print("Transforming data")

    clean_df = df.loc[:, SELECTED_COLUMNS].copy()
    clean_df["price"] = clean_df["price"].apply(_price_to_integer)
    clean_df["latitude"] = pd.to_numeric(clean_df["latitude"], errors="coerce").astype(float)
    clean_df["longitude"] = pd.to_numeric(clean_df["longitude"], errors="coerce").astype(float)
    clean_df["address"] = clean_df["address"].astype("string").str.strip()
    clean_df["bedrooms"] = pd.to_numeric(clean_df["bedrooms"], errors="coerce").astype("Int64")
    clean_df["bathrooms"] = pd.to_numeric(clean_df["bathrooms"], errors="coerce").astype("Int64")
    clean_df["listing_date"] = pd.to_datetime(clean_df["listing_date"], errors="coerce", utc=True)
    clean_df["last_updated_date"] = pd.to_datetime(clean_df["last_updated_date"], errors="coerce", utc=True)

    print(f"Reading postcode data from {postcodes_csv_path}")
    postcodes_df = pd.read_csv(postcodes_csv_path)
    postcodes_df["latitude"] = pd.to_numeric(postcodes_df["latitude"], errors="coerce")
    postcodes_df["longitude"] = pd.to_numeric(postcodes_df["longitude"], errors="coerce")
    postcodes_df = postcodes_df.dropna(subset=["latitude", "longitude"])

    postcode_tree = KDTree(postcodes_df[["latitude", "longitude"]].to_numpy())
    listing_coordinates = clean_df[["latitude", "longitude"]]
    valid_listings = listing_coordinates.notna().all(axis=1)

    clean_df["postcode"] = pd.NA
    clean_df["district"] = pd.NA
    clean_df["borough_code"] = pd.NA

    if valid_listings.any():
        _, nearest_indexes = postcode_tree.query(listing_coordinates.loc[valid_listings].to_numpy())
        nearest_postcodes = postcodes_df.iloc[nearest_indexes].reset_index(drop=True)
        clean_df.loc[valid_listings, "postcode"] = nearest_postcodes["postcode"].to_numpy()
        clean_df.loc[valid_listings, "district"] = nearest_postcodes["district"].to_numpy()

    borough_lookup = _load_borough_lookup()
    if borough_lookup:
        clean_df["borough_code"] = clean_df["district"].map(
            lambda district: borough_lookup.get(_normalize_borough_name(district))
        )

    print(f"Transformed {len(clean_df)} rows")
    return clean_df


def enrich_amenities(
    df: pd.DataFrame,
    osm_csv_path: Path = OSM_CSV_PATH,
    radius: float = AMENITY_RADIUS_DEGREES,
) -> pd.DataFrame:
    """Add nearby OSM amenity counts using a KDTree."""
    print(f"Enriching amenities from {osm_csv_path}")

    enriched_df = df.copy()
    for column in ["num_amenities", "num_schools", "num_restaurants", "num_transport", "num_shops"]:
        enriched_df[column] = 0

    osm_df = pd.read_csv(osm_csv_path)
    osm_df["lat"] = pd.to_numeric(osm_df["lat"], errors="coerce")
    osm_df["lon"] = pd.to_numeric(osm_df["lon"], errors="coerce")
    osm_df = osm_df.dropna(subset=["lat", "lon"]).reset_index(drop=True)

    if osm_df.empty:
        print("No valid OSM rows found")
        return enriched_df.loc[:, FINAL_COLUMNS]

    osm_tree = KDTree(osm_df[["lat", "lon"]].to_numpy())
    listing_coordinates = enriched_df[["latitude", "longitude"]]
    valid_listings = listing_coordinates.notna().all(axis=1)

    for row_index, coordinates in listing_coordinates.loc[valid_listings].iterrows():
        nearby_indexes = osm_tree.query_ball_point(coordinates.to_numpy(), r=radius)
        nearby_osm = osm_df.iloc[nearby_indexes]
        nearby_types = nearby_osm["osm_type"]

        enriched_df.at[row_index, "num_amenities"] = len(nearby_osm)
        enriched_df.at[row_index, "num_schools"] = int((nearby_types == "school").sum())
        enriched_df.at[row_index, "num_restaurants"] = int((nearby_types == "restaurant").sum())
        enriched_df.at[row_index, "num_transport"] = int(nearby_types.isin(TRANSPORT_TYPES).sum())
        enriched_df.at[row_index, "num_shops"] = int((nearby_types == "supermarket").sum())

    print(f"Added amenity features for {int(valid_listings.sum())} listings")
    return enriched_df.loc[:, FINAL_COLUMNS]


def load(df: pd.DataFrame, table_name: str = CLEAN_TABLE_NAME) -> None:
    """Save cleaned listing data to MySQL, replacing the existing table."""
    ensure_mysql_database_exists()
    engine = get_mysql_engine()
    print(f"Loading data into MySQL table: {table_name}")

    mysql_df = df.copy()
    for column in ["listing_date", "last_updated_date"]:
        if column in mysql_df.columns:
            mysql_df[column] = _serialize_datetime_column(mysql_df[column])

    with engine.begin() as connection:
        mysql_df.to_sql(table_name, connection, if_exists="replace", index=False, dtype=LISTING_DTYPES)
        mysql_df.to_sql(LISTINGS_TABLE_NAME, connection, if_exists="replace", index=False, dtype=LISTING_DTYPES)
        _sync_boroughs_table(connection)
        _ensure_listing_primary_key(connection, table_name)
        _ensure_listing_primary_key(connection, LISTINGS_TABLE_NAME)
        connection.execute(text(f"CREATE INDEX idx_listings_district ON `{LISTINGS_TABLE_NAME}` (`district`)"))
        connection.execute(text(f"CREATE INDEX idx_boroughs_name ON `{BOROUGHS_TABLE_NAME}` (`borough_name`)"))

    print(f"Loaded {len(df)} rows")


def _load_borough_lookup(table_name: str = BOROUGHS_SOURCE_TABLE_NAME) -> dict[str, str]:
    ensure_mysql_database_exists()
    engine = get_mysql_engine()
    query = f"""
        SELECT borough_name, MIN(borough_code) AS borough_code
        FROM `{table_name}`
        WHERE borough_name IS NOT NULL AND borough_code IS NOT NULL
        GROUP BY borough_name
    """

    try:
        with engine.connect() as connection:
            borough_df = pd.read_sql_query(text(query), connection)
    except Exception:
        return {}

    borough_df["borough_name"] = borough_df["borough_name"].map(_normalize_borough_name)
    borough_df = borough_df.dropna(subset=["borough_name", "borough_code"])
    return dict(zip(borough_df["borough_name"], borough_df["borough_code"]))


def _sync_boroughs_table(connection, source_table_name: str = BOROUGHS_SOURCE_TABLE_NAME, target_table_name: str = BOROUGHS_TABLE_NAME) -> None:
    try:
        borough_df = pd.read_sql_query(text(f"SELECT * FROM `{source_table_name}`"), connection)
    except Exception:
        return

    borough_df.to_sql(target_table_name, connection, if_exists="replace", index=False, dtype=BOROUGH_DTYPES)


def _ensure_listing_primary_key(connection, table_name: str) -> None:
    connection.execute(text(f"ALTER TABLE `{table_name}` MODIFY `listing_id` VARCHAR(255) NOT NULL"))
    connection.execute(text(f"ALTER TABLE `{table_name}` ADD PRIMARY KEY (`listing_id`)"))


def _serialize_datetime_column(series: pd.Series) -> pd.Series:
    if not pd.api.types.is_datetime64_any_dtype(series):
        series = pd.to_datetime(series, errors="coerce", utc=True)

    formatted = series.dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return formatted.where(series.notna(), None)


def _normalize_borough_name(value: object) -> str | None:
    if pd.isna(value):
        return None

    normalized = str(value).strip()
    if not normalized:
        return None

    return normalized.casefold()


def _price_to_integer(value: object) -> int | None:
    if pd.isna(value):
        return None

    cleaned_value = re.sub(r"[^\d.-]", "", str(value))
    if not cleaned_value:
        return None

    return int(float(cleaned_value))


def main() -> None:
    raw_df = extract()
    clean_df = transform(raw_df)
    enriched_df = enrich_amenities(clean_df)
    load(enriched_df)
    print("ETL pipeline completed successfully")


if __name__ == "__main__":
    main()
