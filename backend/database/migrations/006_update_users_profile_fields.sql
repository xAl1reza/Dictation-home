-- Development migration:
-- Existing test users are removed first because the old schema used username.
-- ON DELETE CASCADE removes their auth_tokens, folders, words and game_results.

DELETE FROM users;

ALTER TABLE users
    DROP COLUMN username,
    ADD COLUMN national_code CHAR(10) NOT NULL AFTER id,
    ADD COLUMN first_name VARCHAR(50) NOT NULL AFTER national_code,
    ADD COLUMN last_name VARCHAR(80) NOT NULL AFTER first_name,
    ADD COLUMN mother_phone VARCHAR(11) NOT NULL AFTER last_name,
    ADD COLUMN father_phone VARCHAR(11) NOT NULL AFTER mother_phone,
    ADD COLUMN birth_date DATE NOT NULL AFTER father_phone,
    ADD UNIQUE KEY uq_users_national_code (national_code);
