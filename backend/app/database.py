import pymysql
import pymysql.cursors
from flask import g, current_app


def get_db() -> pymysql.connections.Connection:
    """Return a per-request MySQL connection."""
    if not hasattr(g, "_db"):
        cfg = current_app.config
        g._db = pymysql.connect(
            host=cfg["MYSQL_HOST"],
            port=cfg["MYSQL_PORT"],
            user=cfg["MYSQL_USER"],
            password=cfg["MYSQL_PASSWORD"],
            database=cfg["MYSQL_DATABASE"],
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True,
        )
    return g._db


def close_db(e=None):  # noqa: ARG001
    conn = g.pop("_db", None)
    if conn is not None:
        conn.close()


def query(sql: str, params: tuple = ()) -> list[dict]:
    with get_db().cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def query_one(sql: str, params: tuple = ()):
    with get_db().cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()
