from flask import Blueprint, jsonify
from ..database import query_one

bp = Blueprint("status", __name__)


@bp.get("/api/status")
def status():
    print("Status route called", flush=True)
    try:
        row = query_one(
            "SELECT MAX(listing_date) as last_updated, COUNT(*) as total_listings FROM clean_listings"
        )
        return jsonify(
            {
                "last_updated": str(row["last_updated"]) if row and row["last_updated"] else None,
                "total_listings": row["total_listings"] if row else 0,
                "db_reachable": True,
            }
        )
    except Exception as exc:
        return jsonify({"db_reachable": False, "error": str(exc)}), 500
