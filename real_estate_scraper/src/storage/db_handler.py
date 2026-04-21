from __future__ import annotations

from typing import Any

from sqlalchemy import text

from src.storage.mysql_utils import ensure_mysql_database_exists, get_mysql_engine


class DatabaseHandler:
    def __init__(self) -> None:
        ensure_mysql_database_exists()
        self.engine = get_mysql_engine()
        self.database_label = str(self.engine.url).replace(self.engine.url.password or "", "***")

    def connect(self):
        return self.engine.begin()

    def create_table_if_not_exists(self, table_name: str, records: list[dict[str, Any]]) -> None:
        if not records:
            return

        columns_sql_parts: list[str] = []
        for column in records[0].keys():
            if column == "listing_id":
                columns_sql_parts.append("`listing_id` VARCHAR(255) PRIMARY KEY")
            else:
                columns_sql_parts.append(f"{self._quote_identifier(column)} TEXT")

        columns_sql = ", ".join(columns_sql_parts)
        query = f"CREATE TABLE IF NOT EXISTS {self._quote_identifier(table_name)} ({columns_sql})"

        with self.connect() as connection:
            connection.execute(text(query))

    def ensure_columns_exist(self, table_name: str, records: list[dict[str, Any]]) -> None:
        if not records:
            return

        expected_columns = list(records[0].keys())

        with self.connect() as connection:
            existing_columns = {
                row[0]
                for row in connection.execute(text(f"SHOW COLUMNS FROM {self._quote_identifier(table_name)}")).fetchall()
            }

            for column in expected_columns:
                if column not in existing_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE {self._quote_identifier(table_name)} "
                            f"ADD COLUMN {self._quote_identifier(column)} TEXT"
                        )
                    )

    def insert_many(self, table_name: str, records: list[dict[str, Any]]) -> int:
        if not records:
            return 0

        self.create_table_if_not_exists(table_name, records)
        self.ensure_columns_exist(table_name, records)

        columns = list(records[0].keys())
        column_sql = ", ".join(self._quote_identifier(column) for column in columns)
        placeholders = ", ".join("%s" for _ in columns)
        query = (
            f"INSERT IGNORE INTO {self._quote_identifier(table_name)} "
            f"({column_sql}) VALUES ({placeholders})"
        )
        values = [tuple(self._normalize_value(record.get(column)) for column in columns) for record in records]

        raw_connection = self.engine.raw_connection()
        try:
            cursor = raw_connection.cursor()
            cursor.executemany(query, values)
            raw_connection.commit()
            return cursor.rowcount if cursor.rowcount != -1 else 0
        finally:
            raw_connection.close()

    def upsert_many(self, table_name: str, records: list[dict[str, Any]]) -> tuple[int, int]:
        if not records:
            return 0, 0

        self.create_table_if_not_exists(table_name, records)
        self.ensure_columns_exist(table_name, records)

        columns = list(records[0].keys())
        existing_ids = self._fetch_existing_ids(table_name, [str(record["listing_id"]) for record in records])
        inserted_count = sum(1 for record in records if str(record["listing_id"]) not in existing_ids)
        updated_count = len(records) - inserted_count

        column_sql = ", ".join(self._quote_identifier(column) for column in columns)
        placeholders = ", ".join("%s" for _ in columns)
        update_sql = ", ".join(
            f"{self._quote_identifier(column)} = new.{self._quote_identifier(column)}"
            for column in columns
            if column != "listing_id"
        )
        query = (
            f"INSERT INTO {self._quote_identifier(table_name)} ({column_sql}) "
            f"VALUES ({placeholders}) AS new "
            f"ON DUPLICATE KEY UPDATE {update_sql}"
        )
        values = [tuple(self._normalize_value(record.get(column)) for column in columns) for record in records]

        raw_connection = self.engine.raw_connection()
        try:
            cursor = raw_connection.cursor()
            cursor.executemany(query, values)
            raw_connection.commit()
        finally:
            raw_connection.close()

        return inserted_count, updated_count

    def _fetch_existing_ids(self, table_name: str, listing_ids: list[str]) -> set[str]:
        if not listing_ids:
            return set()

        placeholders = ", ".join("%s" for _ in listing_ids)
        query = (
            f"SELECT `listing_id` FROM {self._quote_identifier(table_name)} "
            f"WHERE `listing_id` IN ({placeholders})"
        )

        raw_connection = self.engine.raw_connection()
        try:
            cursor = raw_connection.cursor()
            cursor.execute(query, listing_ids)
            rows = cursor.fetchall()
        finally:
            raw_connection.close()

        return {str(row[0]) for row in rows}

    @staticmethod
    def _normalize_value(value: Any) -> str | None:
        if value is None:
            return None
        return str(value)

    @staticmethod
    def _quote_identifier(identifier: str) -> str:
        escaped = identifier.replace("`", "``")
        return f"`{escaped}`"
