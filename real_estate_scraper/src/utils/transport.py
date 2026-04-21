from __future__ import annotations

from typing import Any

import requests
from sqlalchemy import text

from src.storage.mysql_utils import ensure_mysql_database_exists, get_mysql_engine


TFL_STOPPOINT_URL = "https://api.tfl.gov.uk/StopPoint"
BUS_STOP_TYPES = {"NaptanPublicBusCoachTram"}
STATION_STOP_TYPES = {"NaptanMetroStation", "NaptanRailStation"}
STATION_MODES = {"tube", "dlr", "elizabeth-line", "national-rail", "overground", "tflrail"}


def get_nearest_transport(postcode: str) -> dict[str, Any]:
    ensure_mysql_database_exists()
    engine = get_mysql_engine()

    try:
        with engine.connect() as connection:
            row = connection.execute(
                text(
                    """
                    SELECT latitude, longitude
                    FROM clean_listings
                    WHERE UPPER(REPLACE(postcode, ' ', '')) = UPPER(REPLACE(:postcode, ' ', ''))
                    LIMIT 1
                    """
                ),
                {"postcode": postcode},
            ).fetchone()
    except Exception as error:
        return {"error": f"Database error: {error}"}

    if row is None:
        return {"error": f"No listing found for postcode: {postcode}"}

    latitude, longitude = row
    if latitude is None or longitude is None:
        return {"error": f"Listing for postcode {postcode} has no latitude/longitude"}

    params = {
        "stopTypes": ["NaptanPublicBusCoachTram", "NaptanMetroStation", "NaptanRailStation"],
        "radius": 1000,
        "location.lat": latitude,
        "location.lon": longitude,
    }

    try:
        response = requests.get(TFL_STOPPOINT_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as error:
        return {"error": f"TfL API request failed: {error}"}
    except ValueError:
        return {"error": "TfL API returned invalid JSON"}

    stop_points = data.get("stopPoints", [])
    nearest_bus_stop = _find_nearest(stop_points, _is_bus_stop)
    nearest_station = _find_nearest(stop_points, _is_station)

    return {
        "postcode": postcode,
        "bus_stop": _get_stop_name(nearest_bus_stop),
        "bus_stop_distance_m": _get_stop_distance(nearest_bus_stop),
        "station": _get_stop_name(nearest_station),
        "station_distance_m": _get_stop_distance(nearest_station),
    }


def _find_nearest(stop_points: list[dict[str, Any]], predicate) -> dict[str, Any] | None:
    matches = [stop for stop in stop_points if predicate(stop) and stop.get("distance") is not None]
    if not matches:
        return None
    return min(matches, key=lambda stop: stop["distance"])


def _is_bus_stop(stop: dict[str, Any]) -> bool:
    modes = set(stop.get("modes", []))
    return stop.get("stopType") in BUS_STOP_TYPES or "bus" in modes


def _is_station(stop: dict[str, Any]) -> bool:
    modes = set(stop.get("modes", []))
    return stop.get("stopType") in STATION_STOP_TYPES or bool(modes & STATION_MODES)


def _get_stop_name(stop: dict[str, Any] | None) -> str | None:
    if stop is None:
        return None

    return stop.get("commonName")


def _get_stop_distance(stop: dict[str, Any] | None) -> float | None:
    if stop is None:
        return None

    return stop.get("distance")
