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

-- Seed sample downloadable materials if files not populated
UPDATE study_material 
SET file_name = 'Unit4_BPlus_Trees_Guide.pdf', 
    file_path = 'materials/Unit4_BPlus_Trees_Guide.pdf', 
    file_size = '1.8 MB' 
WHERE material_id = 5 AND (file_name IS NULL OR file_name = '');

UPDATE study_material 
SET file_name = 'ER_Diagrams_Reference_Slides.pdf', 
    file_path = 'materials/ER_Diagrams_Reference_Slides.pdf', 
    file_size = '2.4 MB' 
WHERE material_id = 4 AND (file_name IS NULL OR file_name = '');

UPDATE study_material 
SET file_name = 'SQL_Joins_Cheatsheet.pdf', 
    file_path = 'materials/SQL_Joins_Cheatsheet.pdf', 
    file_size = '950 KB' 
WHERE material_id = 2 AND (file_name IS NULL OR file_name = '');

UPDATE study_material 
SET file_name = 'Normalization_1NF_2NF_3NF_Guide.pdf', 
    file_path = 'materials/Normalization_1NF_2NF_3NF_Guide.pdf', 
    file_size = '1.2 MB' 
WHERE material_id = 1 AND (file_name IS NULL OR file_name = '');

-- Seed sample student submission files
UPDATE student_submission 
SET file_name = 'Kriti_BTree_Node_Splitting_Solutions.pdf', 
    file_url = 'submissions/Kriti_BTree_Node_Splitting_Solutions.pdf', 
    file_size = '1.4 MB' 
WHERE submission_id = 2 AND (file_name IS NULL OR file_name = '');

UPDATE student_submission 
SET file_name = 'Kriti_Normalization_3NF_Practice.pdf', 
    file_url = 'submissions/Kriti_Normalization_3NF_Practice.pdf', 
    file_size = '820 KB' 
WHERE submission_id = 1 AND (file_name IS NULL OR file_name = '');


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

-- Seed sample downloadable materials if files not populated
UPDATE study_material 
SET file_name = 'Unit4_BPlus_Trees_Guide.pdf', 
    file_path = 'materials/Unit4_BPlus_Trees_Guide.pdf', 
    file_size = '1.8 MB' 
WHERE material_id = 5 AND (file_name IS NULL OR file_name = '');

UPDATE study_material 
SET file_name = 'ER_Diagrams_Reference_Slides.pdf', 
    file_path = 'materials/ER_Diagrams_Reference_Slides.pdf', 
    file_size = '2.4 MB' 
WHERE material_id = 4 AND (file_name IS NULL OR file_name = '');

UPDATE study_material 
SET file_name = 'SQL_Joins_Cheatsheet.pdf', 
    file_path = 'materials/SQL_Joins_Cheatsheet.pdf', 
    file_size = '950 KB' 
WHERE material_id = 2 AND (file_name IS NULL OR file_name = '');

UPDATE study_material 
SET file_name = 'Normalization_1NF_2NF_3NF_Guide.pdf', 
    file_path = 'materials/Normalization_1NF_2NF_3NF_Guide.pdf', 
    file_size = '1.2 MB' 
WHERE material_id = 1 AND (file_name IS NULL OR file_name = '');

-- Seed sample student submission files
UPDATE student_submission 
SET file_name = 'Kriti_BTree_Node_Splitting_Solutions.pdf', 
    file_url = 'submissions/Kriti_BTree_Node_Splitting_Solutions.pdf', 
    file_size = '1.4 MB' 
WHERE submission_id = 2 AND (file_name IS NULL OR file_name = '');

UPDATE student_submission 
SET file_name = 'Kriti_Normalization_3NF_Practice.pdf', 
    file_url = 'submissions/Kriti_Normalization_3NF_Practice.pdf', 
    file_size = '820 KB' 
WHERE submission_id = 1 AND (file_name IS NULL OR file_name = '');

