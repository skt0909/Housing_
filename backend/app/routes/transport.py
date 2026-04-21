import requests
from flask import Blueprint, jsonify, request

bp = Blueprint("transport", __name__)

TFL_URL = "https://api.tfl.gov.uk/StopPoint"
BUS_STOP_TYPES = {"NaptanPublicBusCoachTram"}
STATION_STOP_TYPES = {"NaptanMetroStation", "NaptanRailStation"}
STATION_MODES = {"tube", "dlr", "elizabeth-line", "national-rail", "overground", "tflrail"}


@bp.get("/api/transport-nearby")
def transport_nearby():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is None or lon is None:
        return jsonify({"error": "lat and lon are required"}), 400

    try:
        resp = requests.get(
            TFL_URL,
            params={
                "stopTypes": "NaptanPublicBusCoachTram,NaptanMetroStation,NaptanRailStation",
                "radius": 1000,
                "lat": lat,
                "lon": lon,
            },
            timeout=8,
        )
        resp.raise_for_status()
        stops = resp.json().get("stopPoints", [])
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

    bus = _nearest(stops, _is_bus)
    station = _nearest(stops, _is_station)

    return jsonify({
        "bus_stop": bus.get("commonName") if bus else None,
        "bus_stop_distance_m": round(bus["distance"]) if bus else None,
        "station": station.get("commonName") if station else None,
        "station_distance_m": round(station["distance"]) if station else None,
    })


def _is_bus(stop):
    return stop.get("stopType") in BUS_STOP_TYPES or "bus" in stop.get("modes", [])


def _is_station(stop):
    modes = set(stop.get("modes", []))
    return stop.get("stopType") in STATION_STOP_TYPES or bool(modes & STATION_MODES)


def _nearest(stops, predicate):
    matches = [s for s in stops if predicate(s) and s.get("distance") is not None]
    return min(matches, key=lambda s: s["distance"]) if matches else None
