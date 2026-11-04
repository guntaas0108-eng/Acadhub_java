-- -------------------------------------------------------------
-- 16_file_upload_support.sql
-- Adds file upload & storage metadata columns to study_material
-- and student_submission tables for PC/laptop file uploads
-- -------------------------------------------------------------
USE acadhub_java;

-- Add file columns to study_material if they don't exist
SET @dbname = DATABASE();
SET @tablename = "study_material";
SET @columnname = "file_name";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE study_material ADD COLUMN file_name VARCHAR(255) NULL, ADD COLUMN file_path VARCHAR(500) NULL, ADD COLUMN file_size VARCHAR(50) NULL;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add file columns to student_submission if they don't exist
SET @tablename = "student_submission";
SET @columnname = "file_name";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE student_submission ADD COLUMN file_name VARCHAR(255) NULL, ADD COLUMN file_size VARCHAR(50) NULL;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
