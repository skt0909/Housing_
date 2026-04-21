from flask import Blueprint, jsonify, request
from ..database import query, query_one

bp = Blueprint("listings", __name__)

VALID_SORT = {"price", "listing_date", "bedrooms"}
VALID_DIR = {"asc", "desc"}


def _build_filters(args):
    where, params = [], []

    if lt := args.get("listing_type"):
        where.append("listing_type = %s")
        params.append(lt)

    if beds := args.get("bedrooms"):
        bed_list = [int(b) for b in beds.split(",") if b.strip().isdigit()]
        if bed_list:
            placeholders = ",".join(["%s"] * len(bed_list))
            where.append(f"bedrooms IN ({placeholders})")
            params.extend(bed_list)

    if borough := args.get("borough"):
        where.append("borough_code = %s")
        params.append(borough)

    if min_p := args.get("min_price"):
        where.append("price >= %s")
        params.append(int(min_p))

    if max_p := args.get("max_price"):
        where.append("price <= %s")
        params.append(int(max_p))

    if postcode := args.get("postcode"):
        where.append("postcode LIKE %s")
        params.append(postcode.upper().strip() + "%")

    clause = "WHERE " + " AND ".join(where) if where else ""
    return clause, params


@bp.get("/api/listings")
def get_listings():
    args = request.args
    page = max(1, int(args.get("page", 1)))
    per_page = min(200, max(1, int(args.get("per_page", 50))))
    sort_by = args.get("sort_by", "listing_date")
    sort_dir = args.get("sort_dir", "desc")

    if sort_by not in VALID_SORT:
        sort_by = "listing_date"
    if sort_dir not in VALID_DIR:
        sort_dir = "desc"

    where_clause, params = _build_filters(args)

    count_row = query_one(
        f"SELECT COUNT(*) as total FROM clean_listings {where_clause}",
        tuple(params),
    )
    total = count_row["total"] if count_row else 0

    offset = (page - 1) * per_page
    rows = query(
        f"""
        SELECT listing_id, listing_type, price, address, bedrooms, bathrooms,
               latitude, longitude, listing_date, last_updated_date, postcode, district, borough_code,
               num_amenities, num_schools, num_restaurants, num_transport, num_shops
        FROM clean_listings
        {where_clause}
        ORDER BY {sort_by} {sort_dir}
        LIMIT %s OFFSET %s
        """,
        tuple(params) + (per_page, offset),
    )

    # Serialize date objects
    for r in rows:
        if r.get("listing_date"):
            r["listing_date"] = str(r["listing_date"])

    return jsonify(
        {
            "data": rows,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": max(1, -(-total // per_page)),
            },
        }
    )


@bp.get("/api/listings/map")
def get_map_listings():
    args = request.args
    where_clause, params = _build_filters(args)

    # Append latitude/longitude filter
    lat_filter = "latitude IS NOT NULL AND longitude IS NOT NULL"
    if where_clause:
        full_where = where_clause + f" AND {lat_filter}"
    else:
        full_where = f"WHERE {lat_filter}"

    rows = query(
        f"""
        SELECT listing_id, listing_type, price, bedrooms, latitude, longitude,
               borough_code, address, postcode, district
        FROM clean_listings
        {full_where}
        LIMIT 2000
        """,
        tuple(params),
    )
    return jsonify({"data": rows})
