-- Query workspace for MySQL
-- Open this file in MySQL Workbench and connect to:
--   localhost:3306
-- Schema:
--   h_db
--
-- Available tables:
--   rightmove_listings
--   clean_listings
--   listings
--   borough_data
--   boroughs
--
-- Helpful indexes:
--   idx_listings_district on listings(district)
--   idx_boroughs_name on boroughs(borough_name)

USE `h_db`;

-- Preview listings
SELECT *
FROM `listings`
LIMIT 20;

-- Preview boroughs
SELECT *
FROM `boroughs`
LIMIT 20;

-- Example join using borough_code
SELECT
    l.listing_id,
    l.address,
    l.district,
    l.borough_code,
    b.borough_name,
    b.avg_price,
    b.population
FROM `listings` AS l
LEFT JOIN `boroughs` AS b
    ON l.borough_code = b.borough_code
LIMIT 20;

DROP VIEW IF EXISTS `listing_enriched`;
DROP VIEW IF EXISTS `listing_metrics`;

SELECT
  MIN(price) AS min_price,
  MAX(price) AS max_price,
  AVG(price) AS avg_price,
  COUNT(*) AS total_listings
FROM `listings`;

SELECT
  CASE
    WHEN price < 200000 THEN '0-200k'
    WHEN price < 400000 THEN '200k-400k'
    WHEN price < 600000 THEN '400k-600k'
    WHEN price < 800000 THEN '600k-800k'
    ELSE '800k+'
  END AS price_range,
  COUNT(*) AS count
FROM `listings`
GROUP BY price_range
ORDER BY price_range;

SELECT
  bedrooms,
  COUNT(*) AS listings,
  AVG(price) AS avg_price
FROM `listings`
GROUP BY bedrooms;

SELECT
  listing_type,
  COUNT(*) AS listings,
  AVG(price) AS avg_price
FROM `listings`
GROUP BY listing_type;

SELECT
  district,
  COUNT(*) AS listings,
  AVG(price) AS avg_price
FROM `listings`
GROUP BY district
ORDER BY avg_price DESC;

SELECT
  l.listing_id,
  l.price,
  b.avg_price AS borough_avg_price,
  (l.price - b.avg_price) AS price_diff
FROM `listings` AS l
LEFT JOIN `boroughs` AS b
  ON LOWER(TRIM(l.district)) = LOWER(TRIM(b.borough_name));

SELECT *,
  CASE
    WHEN price < borough_avg_price THEN 'Undervalued'
    WHEN price > borough_avg_price THEN 'Overpriced'
    ELSE 'Fair'
  END AS price_category
FROM (
  SELECT
    l.price,
    b.avg_price AS borough_avg_price
  FROM `listings` AS l
  LEFT JOIN `boroughs` AS b
    ON LOWER(TRIM(l.district)) = LOWER(TRIM(b.borough_name))
) AS priced_listings;

SELECT *
FROM `listings`
WHERE price > (
  SELECT 3 * AVG(price)
  FROM `listings`
);
