-- -------------------------------------------------------------
-- 15_accountability_seed.sql
-- Rich demo data connecting Admins, Faculty, Courses & Students
-- for Total Accountability and Visual Enrollment Graphs
-- -------------------------------------------------------------
USE acadhub_java;

-- 1. Insert Additional Faculty & Admin Users
INSERT IGNORE INTO USERS (user_id, name, username, password, role, phone) VALUES
(10, 'Prof. Meera Nair', 'meera05', 'meera@123', 'Faculty', '9876501010'),
(11, 'Dr. Vikram Malhotra', 'vikram08', 'vikram@123', 'Faculty', '9876501011'),
(12, 'Ananya Verma', 'ananya21', 'ana21', 'Student', '9876501012'),
(13, 'Rohan Mehta', 'rohan22', 'roh22', 'Student', '9876501013'),
(14, 'Priya Patel', 'priya23', 'pri23', 'Student', '9876501014');

-- 2. Faculty Profiles
INSERT IGNORE INTO FACULTY (faculty_id, designation, department, user_id) VALUES
(203, 'Associate Professor', 'AI & DS', 10),
(204, 'Professor', 'CSE', 11);

-- 3. Student Profiles
INSERT IGNORE INTO STUDENT (roll_no, department, branch, semester, user_id, cgpa) VALUES
(1024030201, 'CSE', 'COE', 6, 12, 8.90),
(1024030202, 'CSE', 'COE', 5, 13, 7.65),
(1024030203, 'CSE', 'COE', 4, 14, 8.40);

-- 4. Additional Courses
INSERT IGNORE INTO COURSE (course_code, course_name, credits, semester, description) VALUES
('AIML401', 'Artificial Intelligence & Machine Learning', 4, 6, 'Covers neural networks, supervised learning, heuristics, search algorithms and NLP'),
('SWE305', 'Software Engineering & Agile Systems', 4, 5, 'Covers agile development, CI/CD pipelines, design patterns, microservices and software testing');

-- 5. Faculty Course Assignments (Every course has an accountable faculty instructor!)
INSERT IGNORE INTO FACULTY_COURSE (id, faculty_id, course_code) VALUES
(4, 203, 'AIML401'),
(5, 204, 'SWE305');

-- 6. Comprehensive Student Enrollments
-- Connect each student to their respective courses so every course has active enrolled students
INSERT IGNORE INTO ENROLLMENT (enrollment_id, roll_no, course_code) VALUES
(10, 1024030201, 'AIML401'),
(11, 1024030201, 'UCS520'),
(12, 1024030202, 'SWE305'),
(13, 1024030202, 'CS102'),
(14, 1024030203, 'AIML401'),
(15, 1024030203, 'UCS310'),
(16, 1024030108, 'CS102'),
(17, 1024030108, 'UCS310'),
(18, 1024030199, 'UCS310');

-- 7. Add Study Materials for new courses
INSERT IGNORE INTO study_material (material_id, course_code, faculty_id, title, material_type, content, upload_date) VALUES
(6, 'AIML401', 203, 'Neural Networks & Gradient Descent', 'Notes', 'Fundamental concepts of activation functions, forward propagation and backpropagation.', '2026-10-15'),
(7, 'AIML401', 203, 'Supervised Learning Code Notebooks', 'Tutorials', 'Python Jupyter notebook walk-through for linear regression and classification algorithms.', '2026-10-20'),
(8, 'SWE305', 204, 'Design Patterns (Factory, Observer, Singleton)', 'Slides', 'Presentation slides covering Gang of Four design patterns and architectural best practices.', '2026-10-18'),
(9, 'SWE305', 204, 'CI/CD Pipeline Setup & Testing Guide', 'Reference', 'Documentation on GitHub Actions, unit testing and automated build pipelines.', '2026-10-22');

-- 8. Add Assessments for new courses
INSERT IGNORE INTO ASSESSMENT (assessment_id, course_code, assessment_type, total_marks, passing_marks) VALUES
(6, 'AIML401', 'Mid Term Examination', 50, 20),
(7, 'AIML401', 'Machine Learning Lab Project', 25, 10),
(8, 'SWE305', 'Agile Architecture Quiz', 20, 8),
(9, 'SWE305', 'Mid Term Assessment', 50, 20);

-- 9. Add Sample Student Performance Marks
INSERT IGNORE INTO STUDENT_PERFORMANCE (performance_id, roll_no, assessment_id, marks_obtained, grade, result) VALUES
(10, 1024030201, 6, 46, 'O', 'Pass'),
(11, 1024030201, 7, 24, 'O', 'Pass'),
(12, 1024030202, 8, 16, 'A', 'Pass'),
(13, 1024030202, 9, 39, 'A', 'Pass'),
(14, 1024030203, 6, 42, 'A+', 'Pass'),
(15, 1024030203, 7, 21, 'A', 'Pass'),
(16, 1024030199, 1, 44, 'A+', 'Pass');

-- 10. Attendance Records for full coverage
INSERT IGNORE INTO ATTENDANCE (attendance_id, roll_no, course_code, attendance_date, status) VALUES
(100, 1024030201, 'AIML401', '2026-10-28', 'Present'),
(101, 1024030201, 'AIML401', '2026-10-29', 'Present'),
(102, 1024030202, 'SWE305', '2026-10-28', 'Present'),
(103, 1024030202, 'SWE305', '2026-10-29', 'Present'),
(104, 1024030203, 'AIML401', '2026-10-28', 'Present'),
(105, 1024030203, 'AIML401', '2026-10-29', 'Absent'),
(106, 1024030199, 'CS102', '2026-10-28', 'Present'),
(107, 1024030199, 'CS102', '2026-10-29', 'Present'),
(108, 1024030108, 'CS102', '2026-10-28', 'Present'),
(109, 1024030108, 'CS102', '2026-10-29', 'Present');
