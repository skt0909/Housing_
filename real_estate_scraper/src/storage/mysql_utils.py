from __future__ import annotations

from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from src.utils.config import DATABASE_URL, MYSQL_DATABASE, build_mysql_url


@lru_cache(maxsize=1)
def get_mysql_engine() -> Engine:
    return create_engine(DATABASE_URL, future=True, pool_pre_ping=True)


def get_mysql_server_engine() -> Engine:
    return create_engine(build_mysql_url(include_database=False), future=True, pool_pre_ping=True)


def ensure_mysql_database_exists() -> None:
    server_engine = get_mysql_server_engine()
    with server_engine.begin() as connection:
        connection.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
    server_engine.dispose()


def reset_mysql_engine_cache() -> None:
    get_mysql_engine.cache_clear()
