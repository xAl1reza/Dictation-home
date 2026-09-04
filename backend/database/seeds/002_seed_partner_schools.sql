-- ============================================================================
-- Dikteh Khooneh
-- Seed: legacy frontend partner schools + Iran province code/name records
--
-- Prerequisite:
--   Migration 010 (iran_provinces + partner_schools)
--   must already be applied.
--
-- Source:
--   frontend/public/js/modules/iran-map-data.js
--   frontend/public/js/modules/iran-schools-map.js
--
-- Result:
--   31 province code/name rows
--   9 active partner schools in 5 provinces
--
-- Notes:
--   - SVG paths / coordinates stay in the frontend.
--   - Provinces with no school remain in iran_provinces so API summary
--     can return schoolCount=0 and studentCount=0.
--   - Safe to run more than once.
-- ============================================================================

SET NAMES utf8mb4;

START TRANSACTION;


-- --------------------------------------------------------------------------
-- Provinces
-- --------------------------------------------------------------------------

INSERT INTO iran_provinces
(
    code,
    name
)
VALUES
('IR-32', 'البرز'),
('IR-15', 'کرمان'),
('IR-13', 'سیستان و بلوچستان'),
('IR-31', 'خراسان شمالی'),
('IR-30', 'خراسان رضوی'),
('IR-29', 'خراسان جنوبی'),
('IR-16', 'کردستان'),
('IR-19', 'گیلان'),
('IR-17', 'کرمانشاه'),
('IR-01', 'آذربایجان شرقی'),
('IR-02', 'آذربایجان غربی'),
('IR-28', 'قزوین'),
('IR-11', 'زنجان'),
('IR-24', 'همدان'),
('IR-26', 'قم'),
('IR-22', 'مرکزی'),
('IR-03', 'اردبیل'),
('IR-23', 'هرمزگان'),
('IR-05', 'ایلام'),
('IR-20', 'لرستان'),
('IR-10', 'خوزستان'),
('IR-08', 'چهار محال و بختیاری'),
('IR-25', 'یزد'),
('IR-07', 'تهران'),
('IR-12', 'سمنان'),
('IR-21', 'مازندران'),
('IR-27', 'گلستان'),
('IR-14', 'فارس'),
('IR-04', 'اصفهان'),
('IR-06', 'بوشهر'),
('IR-18', 'کهکیلویه و بویر احمد')
ON DUPLICATE KEY UPDATE
    name = VALUES(name);


-- --------------------------------------------------------------------------
-- Partner schools
--
-- Remove only the legacy frontend sample-school IDs first, then recreate them.
-- This makes the seed deterministic without touching future real schools.
-- --------------------------------------------------------------------------

DELETE FROM partner_schools
WHERE id IN
(
    'school-001', 'school-002', 'school-003', 'school-004', 'school-005', 'school-006', 'school-007', 'school-008', 'school-009'
);


INSERT INTO partner_schools
(
    id,
    province_code,
    name,
    city,
    students,
    is_active
)
VALUES
('school-001', 'IR-07', 'مدرسه نمونه تهران ۱', 'تهران', 120, 1),
('school-002', 'IR-07', 'مدرسه نمونه تهران ۲', 'تهران', 85, 1),
('school-003', 'IR-07', 'مدرسه نمونه تهران ۳', 'ری', 64, 1),
('school-004', 'IR-04', 'مدرسه نمونه اصفهان ۱', 'اصفهان', 90, 1),
('school-005', 'IR-04', 'مدرسه نمونه اصفهان ۲', 'کاشان', 72, 1),
('school-006', 'IR-30', 'مدرسه نمونه خراسان ۱', 'مشهد', 110, 1),
('school-007', 'IR-30', 'مدرسه نمونه خراسان ۲', 'نیشابور', 68, 1),
('school-008', 'IR-14', 'مدرسه نمونه فارس', 'شیراز', 95, 1),
('school-009', 'IR-15', 'مدرسه نمونه کرمان', 'کرمان', 74, 1);


COMMIT;


-- --------------------------------------------------------------------------
-- Verification
-- --------------------------------------------------------------------------

SELECT
    COUNT(*) AS province_count
FROM iran_provinces;


SELECT
    COUNT(*) AS seeded_school_count,
    COALESCE(SUM(students), 0) AS seeded_student_count
FROM partner_schools
WHERE id IN
(
    'school-001', 'school-002', 'school-003', 'school-004', 'school-005', 'school-006', 'school-007', 'school-008', 'school-009'
);


SELECT
    province_code,
    COUNT(*) AS school_count,
    SUM(students) AS student_count
FROM partner_schools
WHERE id IN
(
    'school-001', 'school-002', 'school-003', 'school-004', 'school-005', 'school-006', 'school-007', 'school-008', 'school-009'
)
GROUP BY province_code
ORDER BY province_code;

-- Expected:
-- province_count       = at least 31
-- seeded_school_count  = 9
-- seeded_student_count = 778
--
-- Expected seeded province summaries:
-- IR-04 => 2 schools / 162 students
-- IR-07 => 3 schools / 269 students
-- IR-14 => 1 school  / 95 students
-- IR-15 => 1 school  / 74 students
-- IR-30 => 2 schools / 178 students
