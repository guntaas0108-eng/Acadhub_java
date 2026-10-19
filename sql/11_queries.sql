
USE Acadhub_java;

-- Q1: Full Performance Report
SELECT s.roll_no, u.name, c.course_name, a.assessment_type,
       sp.marks_obtained, sp.grade,
       ROUND(sp.marks_obtained * 100.0 / a.total_marks, 2) AS percentage
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
JOIN STUDENT_PERFORMANCE sp ON sp.roll_no = s.roll_no
JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id
JOIN COURSE c ON a.course_code = c.course_code
ORDER BY s.roll_no;

-- Q2: Class Topper
SELECT u.name, s.roll_no, sp.marks_obtained
FROM STUDENT_PERFORMANCE sp
JOIN STUDENT s ON sp.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
WHERE sp.marks_obtained =
      (SELECT MAX(marks_obtained) FROM STUDENT_PERFORMANCE);

-- Q3: Students Scoring Below 40
SELECT u.name, s.roll_no, c.course_name, sp.marks_obtained
FROM STUDENT_PERFORMANCE sp
JOIN STUDENT s ON sp.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id
JOIN COURSE c ON a.course_code = c.course_code
WHERE sp.marks_obtained < 40;

-- Q4: Attendance Summary
SELECT s.roll_no, u.name, a.course_code,
       COUNT(*) AS total_classes,
       SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) AS present_count,
       ROUND(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END)
       * 100.0 / COUNT(*), 2) AS attendance_percentage,
       CASE
           WHEN SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END)
                * 100.0 / COUNT(*) >= 75
           THEN 'Good'
           ELSE 'Low Attendance'
       END AS status
FROM ATTENDANCE a
JOIN STUDENT s ON a.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
GROUP BY s.roll_no, u.name, a.course_code
ORDER BY attendance_percentage DESC;

-- Q5: Overall Grade per Student per Course
SELECT e.roll_no, u.name AS student_name, e.course_code,
       c.course_name,
       fn_student_grade_letter(e.roll_no, e.course_code) AS overall_grade
FROM ENROLLMENT e
JOIN STUDENT s ON e.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
JOIN COURSE c ON e.course_code = c.course_code
ORDER BY e.roll_no, e.course_code;

-- Q6: Class Average per Assessment
SELECT a.assessment_id, a.course_code, c.course_name,
       a.assessment_type, a.total_marks,
       fn_course_avg_marks(a.assessment_id) AS class_avg,
       a.passing_marks,
       CASE
           WHEN fn_course_avg_marks(a.assessment_id) >= a.passing_marks
           THEN 'Class passing avg met'
           ELSE 'Below passing avg'
       END AS class_status
FROM ASSESSMENT a
JOIN COURSE c ON a.course_code = c.course_code
ORDER BY a.course_code, a.assessment_id;

-- Q7: Exam Eligibility
SELECT e.roll_no, u.name AS student_name, e.course_code,
       c.course_name,
       fn_attendance_percentage(e.roll_no, e.course_code) AS attendance_pct,
       CASE fn_is_eligible_for_exam(e.roll_no, e.course_code)
           WHEN 1 THEN 'Eligible'
           ELSE 'NOT Eligible (< 75%)'
       END AS exam_eligibility
FROM ENROLLMENT e
JOIN STUDENT s ON e.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
JOIN COURSE c ON e.course_code = c.course_code
ORDER BY exam_eligibility, e.roll_no;

-- Q8: Student Dashboard
SELECT s.roll_no, u.name AS student_name, s.cgpa,
       COUNT(DISTINCT e.course_code) AS courses_enrolled,
       fn_total_marks(s.roll_no) AS total_marks_all_assessments,
       MIN(fn_is_eligible_for_exam(e.roll_no, e.course_code))
           AS eligible_all_courses
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
JOIN ENROLLMENT e ON s.roll_no = e.roll_no
GROUP BY s.roll_no, u.name, s.cgpa
ORDER BY s.roll_no;

-- Q9: Faculty Course Load and Average
SELECT u.name AS faculty_name, f.designation,
       fc.course_code, c.course_name, a.assessment_type,
       fn_course_avg_marks(a.assessment_id) AS class_avg_marks,
       a.total_marks,
       ROUND(fn_course_avg_marks(a.assessment_id)
       * 100.0 / a.total_marks, 2) AS avg_percentage
FROM FACULTY_COURSE fc
JOIN FACULTY f ON fc.faculty_id = f.faculty_id
JOIN USERS u ON f.user_id = u.user_id
JOIN COURSE c ON fc.course_code = c.course_code
JOIN ASSESSMENT a ON c.course_code = a.course_code
ORDER BY faculty_name, fc.course_code, a.assessment_id;
