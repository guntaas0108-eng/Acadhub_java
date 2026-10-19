
USE Acadhub_java;

DROP FUNCTION IF EXISTS fn_attendance_percentage;
DELIMITER $$

CREATE FUNCTION fn_attendance_percentage(
    p_roll INT,
    p_code VARCHAR(10)
)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total INT DEFAULT 0;
    DECLARE present INT DEFAULT 0;

    SELECT COUNT(*) INTO total
    FROM ATTENDANCE
    WHERE roll_no = p_roll AND course_code = p_code;

    SELECT COUNT(*) INTO present
    FROM ATTENDANCE
    WHERE roll_no = p_roll
      AND course_code = p_code
      AND status = 'Present';

    IF total = 0 THEN
        RETURN 0.00;
    END IF;

    RETURN ROUND(present * 100.0 / total, 2);
END $$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_total_marks;
DELIMITER $$

CREATE FUNCTION fn_total_marks(p_roll INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v INT DEFAULT 0;

    SELECT COALESCE(SUM(marks_obtained), 0)
    INTO v
    FROM STUDENT_PERFORMANCE
    WHERE roll_no = p_roll;

    RETURN v;
END $$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_student_grade_letter;
DELIMITER $$

CREATE FUNCTION fn_student_grade_letter(
    p_roll INT,
    p_code VARCHAR(10)
)
RETURNS VARCHAR(3)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_avg_pct DECIMAL(6,2) DEFAULT NULL;
    DECLARE v_enrolled INT DEFAULT 0;
    DECLARE v_grade VARCHAR(3) DEFAULT 'N/A';

    SELECT COUNT(*) INTO v_enrolled
    FROM ENROLLMENT
    WHERE roll_no = p_roll AND course_code = p_code;

    IF v_enrolled = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student is not enrolled in this course';
    END IF;

    SELECT AVG(sp.marks_obtained * 100.0 / a.total_marks)
    INTO v_avg_pct
    FROM STUDENT_PERFORMANCE sp
    JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id
    WHERE sp.roll_no = p_roll AND a.course_code = p_code;

    IF v_avg_pct IS NULL THEN
        RETURN 'NE';
    END IF;

    SET v_grade = CASE
        WHEN v_avg_pct >= 90 THEN 'O'
        WHEN v_avg_pct >= 80 THEN 'A+'
        WHEN v_avg_pct >= 70 THEN 'A'
        WHEN v_avg_pct >= 60 THEN 'B+'
        WHEN v_avg_pct >= 50 THEN 'B'
        WHEN v_avg_pct >= 40 THEN 'C'
        ELSE 'F'
    END;

    RETURN v_grade;
END $$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_course_avg_marks;
DELIMITER $$

CREATE FUNCTION fn_course_avg_marks(p_assessment_id INT)
RETURNS DECIMAL(6,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_avg DECIMAL(6,2) DEFAULT 0.00;

    SELECT COUNT(*) INTO v_exists
    FROM ASSESSMENT
    WHERE assessment_id = p_assessment_id;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assessment ID does not exist';
    END IF;

    SELECT COALESCE(AVG(marks_obtained), 0.00)
    INTO v_avg
    FROM STUDENT_PERFORMANCE
    WHERE assessment_id = p_assessment_id;

    RETURN ROUND(v_avg, 2);
END $$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_is_eligible_for_exam;
DELIMITER $$

CREATE FUNCTION fn_is_eligible_for_exam(
    p_roll INT,
    p_code VARCHAR(10)
)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_enrolled INT DEFAULT 0;
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_present INT DEFAULT 0;
    DECLARE v_pct DECIMAL(5,2) DEFAULT 0.00;

    SELECT COUNT(*) INTO v_enrolled
    FROM ENROLLMENT
    WHERE roll_no = p_roll AND course_code = p_code;

    IF v_enrolled = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student not enrolled - eligibility check impossible';
    END IF;

    SELECT COUNT(*) INTO v_total
    FROM ATTENDANCE
    WHERE roll_no = p_roll AND course_code = p_code;

    IF v_total = 0 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO v_present
    FROM ATTENDANCE
    WHERE roll_no = p_roll
      AND course_code = p_code
      AND status = 'Present';

    SET v_pct = ROUND(v_present * 100.0 / v_total, 2);

    RETURN IF(v_pct >= 75, 1, 0);
END $$

DELIMITER ;
