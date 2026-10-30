-- -------------------------------------------------------------
-- 14_study_material_submissions.sql
-- Dedicated schema for student submissions sent to faculty
-- -------------------------------------------------------------
USE acadhub_java;

CREATE TABLE IF NOT EXISTS student_submission (
    submission_id INT NOT NULL,
    material_id INT NULL,
    course_code VARCHAR(10) NOT NULL,
    roll_no INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    submission_text TEXT NOT NULL,
    file_url VARCHAR(255) NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Submitted',
    feedback TEXT NULL,
    PRIMARY KEY (submission_id),
    KEY (course_code),
    KEY (roll_no),
    KEY (material_id),
    CONSTRAINT fk_sub_course FOREIGN KEY (course_code) REFERENCES course (course_code) ON DELETE CASCADE,
    CONSTRAINT fk_sub_student FOREIGN KEY (roll_no) REFERENCES student (roll_no) ON DELETE CASCADE,
    CONSTRAINT fk_sub_material FOREIGN KEY (material_id) REFERENCES study_material (material_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sample initial submission for testing
INSERT IGNORE INTO student_submission (submission_id, material_id, course_code, roll_no, title, submission_text, file_url, submitted_at, status, feedback)
VALUES (
    1, 
    1, 
    'UCS310', 
    1024030111, 
    'Normalization 3NF Practice Exercise', 
    'Here are my solutions for the BCNF and 3NF dependency preservation decomposition problems. All functional dependencies have been verified.', 
    'https://drive.google.com/sample/normalization-kriti.pdf', 
    NOW(), 
    'Reviewed', 
    'Excellent decomposition steps, clear candidate keys identification!'
);
