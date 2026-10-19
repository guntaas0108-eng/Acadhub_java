
USE Acadhub_java;

CREATE OR REPLACE VIEW student_performance_report AS
SELECT s.roll_no, u.name, c.course_name,
       a.assessment_type, sp.marks_obtained, a.total_marks,
       ROUND(sp.marks_obtained * 100.0 / a.total_marks, 2) AS percentage
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
JOIN STUDENT_PERFORMANCE sp ON sp.roll_no = s.roll_no
JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id
JOIN COURSE c ON a.course_code = c.course_code;

CREATE OR REPLACE VIEW attendance_summary AS
SELECT s.roll_no, u.name, a.course_code,
       COUNT(*) AS total_classes,
       SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) AS present_count,
       ROUND(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END)
       * 100.0 / COUNT(*), 2) AS attendance_pct
FROM ATTENDANCE a
JOIN STUDENT s ON a.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
GROUP BY s.roll_no, u.name, a.course_code;

CREATE OR REPLACE VIEW faculty_course_view AS
SELECT u.name AS faculty_name, f.designation,
       c.course_code, c.course_name
FROM FACULTY_COURSE fc
JOIN FACULTY f ON fc.faculty_id = f.faculty_id
JOIN USERS u ON f.user_id = u.user_id
JOIN COURSE c ON fc.course_code = c.course_code;

CREATE OR REPLACE VIEW student_dashboard AS
SELECT s.roll_no, u.name, s.cgpa,
       COUNT(DISTINCT e.course_code) AS total_courses,
       SUM(sp.marks_obtained) AS total_marks,
       ROUND(AVG(sp.marks_obtained),2) AS avg_marks
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
LEFT JOIN ENROLLMENT e ON s.roll_no = e.roll_no
LEFT JOIN STUDENT_PERFORMANCE sp ON s.roll_no = sp.roll_no
GROUP BY s.roll_no, u.name, s.cgpa;

CREATE OR REPLACE VIEW course_analytics AS
SELECT c.course_code, c.course_name,
       COUNT(DISTINCT e.roll_no) AS total_students,
       ROUND(AVG(sp.marks_obtained),2) AS avg_marks,
       MAX(sp.marks_obtained) AS highest_marks,
       MIN(sp.marks_obtained) AS lowest_marks,
       SUM(CASE WHEN sp.marks_obtained < a.passing_marks
           THEN 1 ELSE 0 END) AS fail_count
FROM COURSE c
LEFT JOIN ENROLLMENT e ON c.course_code = e.course_code
LEFT JOIN ASSESSMENT a ON c.course_code = a.course_code
LEFT JOIN STUDENT_PERFORMANCE sp ON a.assessment_id = sp.assessment_id
GROUP BY c.course_code, c.course_name;

CREATE OR REPLACE VIEW at_risk_students AS
SELECT s.roll_no, u.name, c.course_code, c.course_name,
       ROUND(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END)
       * 100.0 / COUNT(*),2) AS attendance_pct,
       AVG(sp.marks_obtained) AS avg_marks,
       CASE
           WHEN AVG(sp.marks_obtained) < 40
             OR (SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END)
             * 100.0 / COUNT(*)) < 75
           THEN 'At Risk'
           ELSE 'Safe'
       END AS risk_status
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
JOIN ENROLLMENT e ON s.roll_no = e.roll_no
JOIN COURSE c ON e.course_code = c.course_code
LEFT JOIN STUDENT_PERFORMANCE sp ON s.roll_no = sp.roll_no
LEFT JOIN ATTENDANCE a
       ON s.roll_no = a.roll_no AND a.course_code = c.course_code
GROUP BY s.roll_no, u.name, c.course_code, c.course_name;
