from flask import Blueprint, jsonify
from ..database import query, query_one

bp = Blueprint("boroughs", __name__)


@bp.get("/api/boroughs")
def get_boroughs():
    rows = query(
        """
        SELECT borough_name, avg_price, population, crime_per_capita, amenity_count, amenity_diversity
        FROM boroughs
        ORDER BY borough_name
        """
    )
    return jsonify({"data": rows})


@bp.get("/api/boroughs/<borough_code>")
def get_borough(borough_code):
    row = query_one(
        "SELECT * FROM boroughs WHERE borough_code = %s",
        (borough_code,),
    )
    if not row:
        return jsonify({"error": "Borough not found"}), 404
    return jsonify(row)
