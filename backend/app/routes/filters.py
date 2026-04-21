from flask import Blueprint, jsonify
from ..database import query

bp = Blueprint("filters", __name__)


@bp.get("/api/filters/options")
def get_options():
    types = query("SELECT DISTINCT listing_type FROM clean_listings ORDER BY listing_type")
    beds = query(
        "SELECT DISTINCT bedrooms FROM clean_listings WHERE bedrooms IS NOT NULL ORDER BY bedrooms"
    )
    boroughs = query(
        "SELECT DISTINCT borough_code FROM clean_listings WHERE borough_code IS NOT NULL ORDER BY borough_code"
    )
    price_ranges = query(
        "SELECT listing_type, MIN(price) as min_price, MAX(price) as max_price FROM clean_listings GROUP BY listing_type"
    )

    pr_map = {
        r["listing_type"]: {"min": r["min_price"], "max": r["max_price"]}
        for r in price_ranges
    }

    return jsonify(
        {
            "listing_types": [r["listing_type"] for r in types],
            "bedrooms": [r["bedrooms"] for r in beds],
            "boroughs": [r["borough_code"] for r in boroughs],
            "price_ranges": pr_map,
        }
    )
