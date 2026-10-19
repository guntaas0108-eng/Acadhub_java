
USE Acadhub_java;

DROP PROCEDURE IF EXISTS proc_safe_insert_student;
DELIMITER $$

CREATE PROCEDURE proc_safe_insert_student(
    IN p_roll INT,
    IN p_dept VARCHAR(50),
    IN p_branch VARCHAR(50),
    IN p_sem INT,
    IN p_uid INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: student not inserted' AS message;
    END;

    START TRANSACTION;

    INSERT INTO STUDENT (roll_no, department, branch, semester, user_id)
    VALUES (p_roll, p_dept, p_branch, p_sem, p_uid);

    COMMIT;
    SELECT 'Student inserted successfully' AS message;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_update_marks;
DELIMITER $$

CREATE PROCEDURE proc_update_marks(
    IN p_roll INT,
    IN p_asmt INT,
    IN p_marks INT
)
BEGIN
    DECLARE v_total INT DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Update failed' AS message;
    END;

    START TRANSACTION;

    SELECT total_marks INTO v_total
    FROM ASSESSMENT
    WHERE assessment_id = p_asmt;

    IF v_total IS NULL THEN
        ROLLBACK;
        SELECT 'Assessment not found' AS message;
    ELSEIF p_marks < 0 OR p_marks > v_total THEN
        ROLLBACK;
        SELECT 'Invalid marks entered' AS message;
    ELSE
        UPDATE STUDENT_PERFORMANCE
        SET marks_obtained = p_marks
        WHERE roll_no = p_roll AND assessment_id = p_asmt;

        COMMIT;
        SELECT 'Marks updated' AS message;
    END IF;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_add_user;
DELIMITER $$

CREATE PROCEDURE proc_add_user(
    IN p_id INT,
    IN p_name VARCHAR(100),
    IN p_uname VARCHAR(50),
    IN p_pass VARCHAR(100),
    IN p_role VARCHAR(20)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'User creation failed' AS message;
    END;

    START TRANSACTION;

    INSERT INTO USERS (user_id, name, username, password, role)
    VALUES (p_id, p_name, p_uname, p_pass, p_role);

    COMMIT;
    SELECT CONCAT(p_name, ' added as ', p_role) AS message;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_enroll_student;
DELIMITER $$

CREATE PROCEDURE proc_enroll_student(
    IN p_enrollment_id INT,
    IN p_roll INT,
    IN p_code VARCHAR(10)
)
BEGIN
    DECLARE v_student_exists INT DEFAULT 0;
    DECLARE v_course_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLSTATE '23000'
    BEGIN
        ROLLBACK;
        SELECT 'Enrollment skipped: duplicate or invalid reference'
        AS message;
    END;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Unexpected error: enrollment not completed' AS message;
    END;

    SELECT COUNT(*) INTO v_student_exists
    FROM STUDENT WHERE roll_no = p_roll;

    SELECT COUNT(*) INTO v_course_exists
    FROM COURSE WHERE course_code = p_code;

    IF v_student_exists = 0 THEN
        SELECT CONCAT('Error: student with roll_no ', p_roll,
                      ' does not exist') AS message;
    ELSEIF v_course_exists = 0 THEN
        SELECT CONCAT('Error: course ', p_code,
                      ' does not exist') AS message;
    ELSE
        START TRANSACTION;

        INSERT INTO ENROLLMENT (enrollment_id, roll_no, course_code)
        VALUES (p_enrollment_id, p_roll, p_code);

        COMMIT;
        SELECT CONCAT('Student ', p_roll, ' enrolled in ', p_code)
        AS message;
    END IF;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_record_attendance;
DELIMITER $$

CREATE PROCEDURE proc_record_attendance(
    IN p_att_id INT,
    IN p_roll INT,
    IN p_code VARCHAR(10),
    IN p_date DATE,
    IN p_status VARCHAR(10),
    IN p_remarks VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLSTATE '23000'
    BEGIN
        ROLLBACK;
        SELECT 'Invalid reference or duplicate attendance' AS message;
    END;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: attendance not recorded' AS message;
    END;

    IF p_status NOT IN ('Present', 'Absent') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid status: must be Present or Absent';
    END IF;

    START TRANSACTION;

    INSERT INTO ATTENDANCE
    (attendance_id, roll_no, course_code, attendance_date, status, remarks)
    VALUES (p_att_id, p_roll, p_code, p_date, p_status, p_remarks);

    COMMIT;
    SELECT 'Attendance recorded successfully' AS message;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_mark_performance_safe;
DELIMITER $$

CREATE PROCEDURE proc_mark_performance_safe(
    IN p_perf_id INT,
    IN p_roll INT,
    IN p_asmt_id INT,
    IN p_marks INT
)
BEGIN
    DECLARE v_total INT DEFAULT NULL;
    DECLARE v_student INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLSTATE '23000'
    BEGIN
        ROLLBACK;
        SELECT 'Performance record already exists or reference is invalid'
        AS message;
    END;

    DECLARE EXIT HANDLER FOR SQLSTATE '45000'
    BEGIN
        ROLLBACK;
        SELECT 'Validation error: check marks range' AS message;
    END;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Unexpected error: performance not recorded' AS message;
    END;

    SELECT COUNT(*) INTO v_student
    FROM STUDENT WHERE roll_no = p_roll;

    SELECT total_marks INTO v_total
    FROM ASSESSMENT WHERE assessment_id = p_asmt_id;

    IF v_student = 0 THEN
        SELECT CONCAT('No student with roll_no = ', p_roll) AS message;
    ELSEIF v_total IS NULL THEN
        SELECT CONCAT('No assessment with id = ', p_asmt_id) AS message;
    ELSEIF p_marks < 0 OR p_marks > v_total THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Marks out of range';
    ELSE
        START TRANSACTION;

        INSERT INTO STUDENT_PERFORMANCE
        (performance_id, roll_no, assessment_id, marks_obtained)
        VALUES (p_perf_id, p_roll, p_asmt_id, p_marks);

        COMMIT;
        SELECT 'Performance recorded - grade auto-assigned' AS message;
    END IF;
END $$

DELIMITER ;
