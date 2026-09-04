-- 012_add_system_grade_folders.sql
--
-- Enables global, read-only grade folders:
--   user_id IS NULL + grade 1..6  => system folder
--   user_id = users.id + grade NULL => personal folder
--
-- This migration preserves the existing user_id column type and only makes it nullable.

SET @schema_name = DATABASE();

SET @user_id_type = (
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'folders'
      AND COLUMN_NAME = 'user_id'
    LIMIT 1
);

SET @sql = IF(
    @user_id_type IS NULL,
    'SELECT 1',
    CONCAT(
        'ALTER TABLE `folders` MODIFY COLUMN `user_id` ',
        @user_id_type,
        ' NULL'
    )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @grade_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'folders'
      AND COLUMN_NAME = 'grade'
);

SET @sql = IF(
    @grade_exists = 0,
    'ALTER TABLE `folders` ADD COLUMN `grade` TINYINT UNSIGNED NULL AFTER `type`',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'folders'
      AND INDEX_NAME = 'idx_folders_user_grade_type'
);

SET @sql = IF(
    @index_exists = 0,
    'ALTER TABLE `folders` ADD INDEX `idx_folders_user_grade_type` (`user_id`, `grade`, `type`)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Existing personal folders remain personal.
UPDATE folders
SET grade = NULL
WHERE user_id IS NOT NULL;
