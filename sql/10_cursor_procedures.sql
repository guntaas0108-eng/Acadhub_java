
USE Acadhub_java;

DROP PROCEDURE IF EXISTS proc_generate_report;
DELIMITER $$

CREATE PROCEDURE proc_generate_report()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_roll INT;
    DECLARE v_name VARCHAR(100);
    DECLARE v_marks INT;
    DECLARE max_marks INT DEFAULT 0;

    DECLARE cur CURSOR FOR
        SELECT sp.roll_no, u.name, sp.marks_obtained
        FROM STUDENT_PERFORMANCE sp
        JOIN STUDENT s ON sp.roll_no = s.roll_no
        JOIN USERS u ON s.user_id = u.user_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    SELECT MAX(marks_obtained) INTO max_marks
    FROM STUDENT_PERFORMANCE;

    DROP TEMPORARY TABLE IF EXISTS report_table;

    CREATE TEMPORARY TABLE report_table (
        roll_no INT,
        name VARCHAR(100),
        marks INT,
        status VARCHAR(20)
    );

    OPEN cur;

    loop1: LOOP
        FETCH cur INTO v_roll, v_name, v_marks;

        IF done THEN
            LEAVE loop1;
        END IF;

        INSERT INTO report_table
        VALUES (
            v_roll, v_name, v_marks,
            CASE
                WHEN v_marks = max_marks THEN 'Topper'
                WHEN v_marks < 40 THEN 'Fail'
                ELSE 'Normal'
            END
        );
    END LOOP;

    CLOSE cur;
    SELECT * FROM report_table;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_low_attendance;
DELIMITER $$

CREATE PROCEDURE proc_low_attendance()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_roll INT;
    DECLARE v_name VARCHAR(100);
    DECLARE v_course VARCHAR(10);
    DECLARE v_pct DECIMAL(5,2);

    DECLARE cur CURSOR FOR
        SELECT s.roll_no, u.name, a.course_code,
               ROUND(SUM(CASE WHEN a.status='Present'
               THEN 1 ELSE 0 END)*100.0/COUNT(*),2)
        FROM ATTENDANCE a
        JOIN STUDENT s ON a.roll_no = s.roll_no
        JOIN USERS u ON s.user_id = u.user_id
        GROUP BY s.roll_no, u.name, a.course_code;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    DROP TEMPORARY TABLE IF EXISTS low_att_table;

    CREATE TEMPORARY TABLE low_att_table (
        roll_no INT,
        name VARCHAR(100),
        course VARCHAR(10),
        percentage DECIMAL(5,2),
        status VARCHAR(20)
    );

    OPEN cur;

    loop2: LOOP
        FETCH cur INTO v_roll, v_name, v_course, v_pct;

        IF done THEN
            LEAVE loop2;
        END IF;

        INSERT INTO low_att_table
        VALUES (
            v_roll, v_name, v_course, v_pct,
            CASE WHEN v_pct < 75
                 THEN 'Low Attendance'
                 ELSE 'Safe'
            END
        );
    END LOOP;

    CLOSE cur;
    SELECT * FROM low_att_table;
END $$

DELIMITER ;

CALL proc_generate_report();
CALL proc_low_attendance();
