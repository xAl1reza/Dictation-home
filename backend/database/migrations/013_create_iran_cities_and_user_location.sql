-- 013_create_iran_cities_and_user_location.sql
-- Adds city reference data and optional location columns for existing users.
-- Registration/API validation makes province/city mandatory for NEW registrations.
-- Columns stay nullable so existing production users are not broken during rollout.

CREATE TABLE iran_cities (
    id INT UNSIGNED PRIMARY KEY,
    province_code CHAR(5) NOT NULL,
    name VARCHAR(120) NOT NULL,

    UNIQUE KEY uq_iran_cities_province_name (province_code, name),
    INDEX idx_iran_cities_province_name (province_code, name)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

ALTER TABLE users
    ADD COLUMN province_code CHAR(5) NULL AFTER school_name,
    ADD COLUMN city_id INT UNSIGNED NULL AFTER province_code,
    ADD INDEX idx_users_province_code (province_code),
    ADD INDEX idx_users_city_id (city_id),
    ADD CONSTRAINT fk_users_city
        FOREIGN KEY (city_id)
        REFERENCES iran_cities(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;
