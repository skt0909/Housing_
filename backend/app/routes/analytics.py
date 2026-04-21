import statistics
from flask import Blueprint, jsonify, request
from ..database import query, query_one

bp = Blueprint("analytics", __name__)


def _compute_buckets(values: list, num_buckets: int = 20) -> list:
    if not values:
        return []
    min_v, max_v = min(values), max(values)
    if min_v == max_v:
        return [{"range_start": min_v, "range_end": max_v, "count": len(values)}]
    width = (max_v - min_v) / num_buckets
    buckets = [
        {"range_start": round(min_v + i * width), "range_end": round(min_v + (i + 1) * width), "count": 0}
        for i in range(num_buckets)
    ]
    for v in values:
        idx = min(int((v - min_v) / width), num_buckets - 1)
        buckets[idx]["count"] += 1
    return buckets


@bp.get("/api/analytics/kpis")
def get_kpis():
    total = query_one("SELECT COUNT(*) as c FROM clean_listings")
    rent_agg = query_one(
        "SELECT COUNT(*) as c, AVG(price) as avg FROM clean_listings WHERE listing_type='rent'"
    )
    buy_agg = query_one(
        "SELECT COUNT(*) as c, AVG(price) as avg FROM clean_listings WHERE listing_type='buy'"
    )
    rent_prices = [r["price"] for r in query(
        "SELECT price FROM clean_listings WHERE listing_type='rent' AND price IS NOT NULL"
    )]
    buy_prices = [r["price"] for r in query(
        "SELECT price FROM clean_listings WHERE listing_type='buy' AND price IS NOT NULL"
    )]
    today = query_one("SELECT COUNT(*) as c FROM clean_listings WHERE DATE(listing_date) = CURDATE()")
    week = query_one(
        "SELECT COUNT(*) as c FROM clean_listings WHERE listing_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    )
    avg_beds = query_one("SELECT AVG(bedrooms) as avg FROM clean_listings WHERE bedrooms IS NOT NULL")

    # Most expensive borough
    most_expensive = query_one("SELECT borough_name, avg_price FROM boroughs ORDER BY avg_price DESC LIMIT 1")

    # Avg price per bedroom
    rent_ppb = query_one("SELECT AVG(price / bedrooms) as avg FROM clean_listings WHERE bedrooms > 0 AND listing_type='rent'")
    buy_ppb = query_one("SELECT AVG(price / bedrooms) as avg FROM clean_listings WHERE bedrooms > 0 AND listing_type='buy'")

    return jsonify({
        "total_listings": total["c"] if total else 0,
        "total_rent": rent_agg["c"] if rent_agg else 0,
        "total_buy": buy_agg["c"] if buy_agg else 0,
        "avg_rent_price": round(float(rent_agg["avg"])) if rent_agg and rent_agg["avg"] else None,
        "avg_buy_price": round(float(buy_agg["avg"])) if buy_agg and buy_agg["avg"] else None,
        "median_rent_price": int(statistics.median(rent_prices)) if rent_prices else None,
        "median_buy_price": int(statistics.median(buy_prices)) if buy_prices else None,
        "new_today": today["c"] if today else 0,
        "new_this_week": week["c"] if week else 0,
        "avg_bedrooms": round(float(avg_beds["avg"]), 1) if avg_beds and avg_beds["avg"] else None,
        "most_expensive_borough": most_expensive["borough_name"] if most_expensive else None,
        "avg_price_per_bedroom_rent": round(float(rent_ppb["avg"])) if rent_ppb and rent_ppb["avg"] else None,
        "avg_price_per_bedroom_buy": round(float(buy_ppb["avg"])) if buy_ppb and buy_ppb["avg"] else None,
    })


@bp.get("/api/analytics/price-distribution")
def price_distribution():
    args = request.args
    listing_type = args.get("listing_type")
    borough = args.get("borough")
    bedrooms = args.get("bedrooms")
    num_buckets = min(50, max(5, int(args.get("buckets", 20))))

    where, params = ["price IS NOT NULL"], []
    if listing_type:
        where.append("listing_type = %s")
        params.append(listing_type)
    if borough:
        where.append("borough_code = %s")
        params.append(borough)
    if bedrooms:
        where.append("bedrooms = %s")
        params.append(int(bedrooms))

    clause = "WHERE " + " AND ".join(where)
    rows = query(f"SELECT price FROM clean_listings {clause}", tuple(params))
    values = [r["price"] for r in rows]

    stats = {}
    if values:
        sv = sorted(values)
        stats = {
            "mean": round(statistics.mean(values)),
            "median": round(statistics.median(values)),
            "min": min(values),
            "max": max(values),
            "p25": sv[len(sv) // 4],
            "p75": sv[3 * len(sv) // 4],
        }

    return jsonify({
        "listing_type": listing_type,
        "buckets": _compute_buckets(values, num_buckets),
        "stats": stats,
    })


@bp.get("/api/analytics/price-by-borough")
def price_by_borough():
    args = request.args
    listing_type = args.get("type")

    where = ["price IS NOT NULL", "district IS NOT NULL"]
    params = []
    if listing_type:
        where.append("listing_type = %s")
        params.append(listing_type)

    clause = "WHERE " + " AND ".join(where) if where else ""
    rows = query(
        f"""
        SELECT district as borough_name,
               ROUND(AVG(price)) as avg_price,
               COUNT(*) as count
        FROM clean_listings
        {clause}
        GROUP BY district
        ORDER BY avg_price DESC
        """,
        tuple(params)
    )
    return jsonify({"data": rows})


@bp.get("/api/analytics/map-borough-stats")
def map_borough_stats():
    import sys; print("[MAP-BOROUGH] ENDPOINT CALLED", flush=True, file=sys.stderr)
    rows = query(
        """
        SELECT
            cl.district AS borough_name,
            ROUND(AVG(CASE WHEN cl.listing_type='rent' THEN cl.price END)) AS avg_price_rent,
            ROUND(AVG(CASE WHEN cl.listing_type='buy'  THEN cl.price END)) AS avg_price_buy,
            ROUND(AVG(cl.price)) AS avg_price_all,
            COUNT(*) AS total_count,
            COUNT(CASE WHEN cl.listing_type='rent' THEN 1 END) AS count_rent,
            COUNT(CASE WHEN cl.listing_type='buy'  THEN 1 END) AS count_buy,
            MAX(b.crime_per_capita) AS crime_per_capita
        FROM clean_listings cl
        LEFT JOIN (
            SELECT borough_name, MAX(crime_per_capita) AS crime_per_capita
            FROM boroughs
            GROUP BY borough_name
        ) b ON cl.district = b.borough_name
        WHERE cl.district IS NOT NULL
        GROUP BY cl.district
        ORDER BY avg_price_all DESC
        """
    )

    prices = [float(r["avg_price_all"]) for r in rows if r["avg_price_all"]]
    crimes = [float(r["crime_per_capita"]) for r in rows if r["crime_per_capita"]]
    min_p, max_p = (min(prices), max(prices)) if prices else (0, 1)
    min_c, max_c = (min(crimes), max(crimes)) if crimes else (0, 1)

    result = []
    for r in rows:
        p = float(r["avg_price_all"] or 0)
        c = float(r["crime_per_capita"] or 0)
        price_inv = 1 - (p - min_p) / (max_p - min_p + 1)
        crime_inv = 1 - (c - min_c) / (max_c - min_c + 1e-9)
        raw = 0.5 * price_inv + 0.3 * crime_inv + 0.2 * 0.5
        composite = round(2 + raw * 3, 2)
        result.append({**r, "composite_score": composite})

    return jsonify({"data": result})


@bp.get("/api/analytics/price-by-bedrooms")
def price_by_bedrooms():
    args = request.args
    listing_type = args.get("type")

    where = ["price IS NOT NULL", "bedrooms IS NOT NULL"]
    params = []
    if listing_type:
        where.append("listing_type = %s")
        params.append(listing_type)

    clause = "WHERE " + " AND ".join(where) if where else ""
    rows = query(
        f"""
        SELECT bedrooms,
               ROUND(AVG(price)) as avg_price,
               COUNT(*) as count
        FROM clean_listings
        {clause}
        GROUP BY bedrooms
        ORDER BY bedrooms ASC
        """,
        tuple(params)
    )
    return jsonify({"data": rows})
