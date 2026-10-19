
USE Acadhub_java;

-- Q10: Topper per Course
SELECT c.course_name, u.name, sp.marks_obtained
FROM STUDENT_PERFORMANCE sp
JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id
JOIN COURSE c ON a.course_code = c.course_code
JOIN STUDENT s ON sp.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
WHERE sp.marks_obtained = (
    SELECT MAX(sp2.marks_obtained)
    FROM STUDENT_PERFORMANCE sp2
    JOIN ASSESSMENT a2 ON sp2.assessment_id = a2.assessment_id
    WHERE a2.course_code = c.course_code
);

-- Q11: Students Below Passing Marks
SELECT u.name, s.roll_no, c.course_name,
       sp.marks_obtained, a.passing_marks
FROM STUDENT_PERFORMANCE sp
JOIN STUDENT s ON sp.roll_no = s.roll_no
JOIN USERS u ON s.user_id = u.user_id
JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id
JOIN COURSE c ON a.course_code = c.course_code
WHERE sp.marks_obtained < a.passing_marks;

-- Q12: Student Leaderboard
SELECT s.roll_no, u.name,
       SUM(sp.marks_obtained) AS total_marks
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
JOIN STUDENT_PERFORMANCE sp ON s.roll_no = sp.roll_no
GROUP BY s.roll_no, u.name
ORDER BY total_marks DESC;

-- Q13: Course-wise Average Attendance
SELECT course_code,
       ROUND(AVG(CASE WHEN status='Present' THEN 100 ELSE 0 END),2)
       AS avg_attendance
FROM ATTENDANCE
GROUP BY course_code;

-- Q14: Students Without Attendance Records
SELECT s.roll_no, u.name
FROM STUDENT s
JOIN USERS u ON s.user_id = u.user_id
LEFT JOIN ATTENDANCE a ON s.roll_no = a.roll_no
WHERE a.roll_no IS NULL;
