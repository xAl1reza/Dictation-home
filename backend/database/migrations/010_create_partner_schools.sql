CREATE TABLE iran_provinces (
    code CHAR(5) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);


CREATE TABLE partner_schools (
    id VARCHAR(64) PRIMARY KEY,

    province_code CHAR(5) NOT NULL,

    name VARCHAR(180) NOT NULL,

    city VARCHAR(120) NOT NULL,

    students INT UNSIGNED NOT NULL DEFAULT 0,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_partner_schools_province
        FOREIGN KEY (province_code)
        REFERENCES iran_provinces(code),

    INDEX idx_partner_schools_province_active (
        province_code,
        is_active
    )
);


/*
|--------------------------------------------------------------------------
| Iran Provinces
|--------------------------------------------------------------------------
| Codes are kept exactly in sync with frontend/API contract.
|--------------------------------------------------------------------------
*/

INSERT INTO iran_provinces (code, name) VALUES
('IR-01', 'آذربایجان شرقی'),
('IR-02', 'آذربایجان غربی'),
('IR-03', 'اردبیل'),
('IR-04', 'اصفهان'),
('IR-05', 'ایلام'),
('IR-06', 'بوشهر'),
('IR-07', 'تهران'),
('IR-08', 'چهار محال و بختیاری'),
('IR-10', 'خوزستان'),
('IR-11', 'زنجان'),
('IR-12', 'سمنان'),
('IR-13', 'سیستان و بلوچستان'),
('IR-14', 'فارس'),
('IR-15', 'کرمان'),
('IR-16', 'کردستان'),
('IR-17', 'کرمانشاه'),
('IR-18', 'کهگیلویه و بویراحمد'),
('IR-19', 'گیلان'),
('IR-20', 'لرستان'),
('IR-21', 'مازندران'),
('IR-22', 'مرکزی'),
('IR-23', 'هرمزگان'),
('IR-24', 'همدان'),
('IR-25', 'یزد'),
('IR-26', 'قم'),
('IR-27', 'گلستان'),
('IR-28', 'قزوین'),
('IR-29', 'خراسان جنوبی'),
('IR-30', 'خراسان رضوی'),
('IR-31', 'خراسان شمالی'),
('IR-32', 'البرز');