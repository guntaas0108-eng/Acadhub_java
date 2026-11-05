-- -------------------------------------------------------------
-- 17_advanced_academic_workflow.sql
-- Adds Due Date & Max Marks to Study Materials / Assignments
-- Adds Marks Awarded to Student Submissions
-- Adds Active status to Users
-- Creates Audit Log, Announcements, and Timetable tables
-- -------------------------------------------------------------
USE acadhub_java;

-- 1. Alter study_material to add due_date & max_marks, and support Assignment/Quiz types
ALTER TABLE study_material MODIFY COLUMN material_type VARCHAR(50) DEFAULT 'Notes';
SET @dbname = DATABASE();
SET @tablename = "study_material";

SET @columnname = "due_date";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE study_material ADD COLUMN due_date DATE NULL, ADD COLUMN max_marks INT DEFAULT 100;"
));
PREPARE alterStmt FROM @preparedStatement;
EXECUTE alterStmt;
DEALLOCATE PREPARE alterStmt;

-- 2. Alter student_submission to add marks_awarded
SET @tablename = "student_submission";
SET @columnname = "marks_awarded";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE student_submission ADD COLUMN marks_awarded DECIMAL(5,2) NULL;"
));
PREPARE alterStmt FROM @preparedStatement;
EXECUTE alterStmt;
DEALLOCATE PREPARE alterStmt;

-- 3. Alter users to add is_active
SET @tablename = "users";
SET @columnname = "is_active";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1;"
));
PREPARE alterStmt FROM @preparedStatement;
EXECUTE alterStmt;
DEALLOCATE PREPARE alterStmt;

-- 4. Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(50) NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100) DEFAULT 'Admin',
  category VARCHAR(50) DEFAULT 'University',
  posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1
);

-- 6. Create timetables table
CREATE TABLE IF NOT EXISTS timetables (
  timetable_id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(10) NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  day_of_week VARCHAR(15) NOT NULL,
  start_time VARCHAR(15) NOT NULL,
  end_time VARCHAR(15) NOT NULL,
  room VARCHAR(50) DEFAULT 'Hall A-101',
  faculty_name VARCHAR(100) DEFAULT 'Prof. Rumneek'
);

-- Seed initial announcements if empty
INSERT IGNORE INTO announcements (announcement_id, title, content, author, category) VALUES
(1, 'Mid-Semester Examination Schedule Published', 'Mid-term examinations will commence from next Monday. Please review syllabus and room allotments in timetable.', 'Dean of Academic Affairs', 'Exam'),
(2, 'Guest Lecture on Distributed Systems', 'Dr. Alan Turing memorial lecture on Modern Distributed Consensus at Main Auditorium on Friday 2 PM.', 'CS Department', 'Academic'),
(3, 'Library Book Return & Digital Repository Access', 'All physical library books due for renewal by end of term. Digital IEEE / ACM repository access active.', 'Library Services', 'Notice');

-- Seed initial timetable schedule
INSERT IGNORE INTO timetables (timetable_id, course_code, course_name, day_of_week, start_time, end_time, room, faculty_name) VALUES
(1, 'UCS310', 'Database Management Systems', 'Monday', '09:00 AM', '10:30 AM', 'Lab 302', 'Dr. Rumneek Kaur'),
(2, 'UCS520', 'Computer Networks', 'Monday', '11:00 AM', '12:30 PM', 'Hall 105', 'Dr. Rumneek Kaur'),
(3, 'UCS310', 'Database Management Systems', 'Wednesday', '10:00 AM', '11:30 AM', 'Hall 201', 'Dr. Rumneek Kaur'),
(4, 'UCS503', 'Software Engineering', 'Thursday', '01:00 PM', '02:30 PM', 'Hall 108', 'Prof. Sharma'),
(5, 'UCS520', 'Computer Networks Lab', 'Friday', '02:00 PM', '04:00 PM', 'Networks Lab B', 'Dr. Rumneek Kaur');

-- Seed initial audit log entries
INSERT IGNORE INTO audit_log (log_id, username, action, details) VALUES
(1, 'doaa30', 'System Initialized', 'AcadHub platform version 2.0 active with 360 degree accountability.'),
(2, 'rumneek24', 'Attendance Recorded', 'Daily attendance marked for UCS310 Database Management Systems.'),
(3, 'doaa30', 'Course Enrollment', 'Enrolled student 102403111 in UCS310, UCS520, UCS503.');

-- Update sample study materials with due dates & maximum marks
UPDATE study_material SET due_date = '2026-11-20', max_marks = 20 WHERE material_id = 10;
UPDATE study_material SET due_date = '2026-11-18', max_marks = 25 WHERE material_id = 5;
UPDATE study_material SET due_date = '2026-11-25', max_marks = 30 WHERE material_id = 4;
UPDATE study_material SET due_date = '2026-11-15', max_marks = 20 WHERE material_id = 2;
UPDATE study_material SET due_date = '2026-11-12', max_marks = 20 WHERE material_id = 1;

-- Update sample student submission marks awarded
UPDATE student_submission SET marks_awarded = 19.50, status = 'Approved', feedback = 'Well done! Tree splitting handled properly without overflow.' WHERE submission_id = 2;
UPDATE student_submission SET marks_awarded = 18.00, status = 'Reviewed', feedback = 'Excellent decomposition steps, clear candidate keys identification!' WHERE submission_id = 1;
