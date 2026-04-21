CREATE DATABASE IF NOT EXISTS `h_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `h_db`;

CREATE TABLE IF NOT EXISTS `rightmove_listings` (
    `listing_id` VARCHAR(255) NOT NULL,
    `listing_type` TEXT NULL,
    `price` TEXT NULL,
    `address` TEXT NULL,
    `location` TEXT NULL,
    `bedrooms` TEXT NULL,
    `bathrooms` TEXT NULL,
    `latitude` TEXT NULL,
    `longitude` TEXT NULL,
    `description` TEXT NULL,
    `detail_url` TEXT NULL,
    `source` VARCHAR(64) NULL,
    `listing_date` VARCHAR(32) NULL,
    `last_updated_date` VARCHAR(32) NULL,
    PRIMARY KEY (`listing_id`)
);

CREATE TABLE IF NOT EXISTS `clean_listings` (
    `listing_id` VARCHAR(255) NOT NULL,
    `listing_type` TEXT NULL,
    `price` BIGINT NULL,
    `address` TEXT NULL,
    `bedrooms` INT NULL,
    `bathrooms` INT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `listing_date` VARCHAR(32) NULL,
    `last_updated_date` VARCHAR(32) NULL,
    `postcode` VARCHAR(32) NULL,
    `district` VARCHAR(255) NULL,
    `num_amenities` INT NULL,
    `num_schools` INT NULL,
    `num_restaurants` INT NULL,
    `num_transport` INT NULL,
    `num_shops` INT NULL,
    `borough_code` VARCHAR(32) NULL,
    PRIMARY KEY (`listing_id`)
);

CREATE TABLE IF NOT EXISTS `listings` LIKE `clean_listings`;

CREATE TABLE IF NOT EXISTS `borough_data` (
    `borough_code` VARCHAR(32) NULL,
    `borough_name` VARCHAR(255) NULL,
    `avg_price` DOUBLE NULL,
    `population` BIGINT NULL,
    `hectares` DOUBLE NULL,
    `population_per_hectare` DOUBLE NULL,
    `crime_count` BIGINT NULL,
    `amenity_count` DOUBLE NULL,
    `amenity_diversity` DOUBLE NULL,
    `crime_per_capita` DOUBLE NULL
);

CREATE TABLE IF NOT EXISTS `boroughs` LIKE `borough_data`;

CREATE INDEX `idx_listings_district` ON `listings` (`district`);
CREATE INDEX `idx_boroughs_name` ON `boroughs` (`borough_name`);
