
USE Acadhub_java;

DROP TABLE IF EXISTS performance_log;

CREATE TABLE performance_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no INT,
    assessment_id INT,
    marks INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_sp_before_insert;
DROP TRIGGER IF EXISTS trg_sp_before_update;
DROP TRIGGER IF EXISTS trg_sp_after_insert;

DELIMITER $$

CREATE TRIGGER trg_sp_before_insert
BEFORE INSERT ON STUDENT_PERFORMANCE
FOR EACH ROW
BEGIN
    DECLARE v_total INT;

    SELECT total_marks INTO v_total
    FROM ASSESSMENT
    WHERE assessment_id = NEW.assessment_id
    LIMIT 1;

    IF v_total IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid assessment_id';
    END IF;

    IF NEW.marks_obtained IS NULL THEN
        SET NEW.marks_obtained = 0;
    END IF;

    IF NEW.marks_obtained < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Marks cannot be negative';
    END IF;

    IF NEW.marks_obtained > v_total THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Marks cannot exceed total marks';
    END IF;

    SET NEW.grade = CASE
        WHEN NEW.marks_obtained >= 90 THEN 'O'
        WHEN NEW.marks_obtained >= 80 THEN 'A+'
        WHEN NEW.marks_obtained >= 70 THEN 'A'
        WHEN NEW.marks_obtained >= 60 THEN 'B+'
        WHEN NEW.marks_obtained >= 50 THEN 'B'
        WHEN NEW.marks_obtained >= 40 THEN 'C'
        ELSE 'F'
    END;

    SET NEW.result = CASE
        WHEN NEW.marks_obtained >= (v_total * 0.4) THEN 'Pass'
        ELSE 'Fail'
    END;
END $$

CREATE TRIGGER trg_sp_before_update
BEFORE UPDATE ON STUDENT_PERFORMANCE
FOR EACH ROW
BEGIN
    DECLARE v_total INT;

    SELECT total_marks INTO v_total
    FROM ASSESSMENT
    WHERE assessment_id = NEW.assessment_id
    LIMIT 1;

    IF v_total IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid assessment_id';
    END IF;

    IF NEW.marks_obtained < 0 OR NEW.marks_obtained > v_total THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid marks';
    END IF;

    SET NEW.grade = CASE
        WHEN NEW.marks_obtained >= 90 THEN 'O'
        WHEN NEW.marks_obtained >= 80 THEN 'A+'
        WHEN NEW.marks_obtained >= 70 THEN 'A'
        WHEN NEW.marks_obtained >= 60 THEN 'B+'
        WHEN NEW.marks_obtained >= 50 THEN 'B'
        WHEN NEW.marks_obtained >= 40 THEN 'C'
        ELSE 'F'
    END;

    SET NEW.result = CASE
        WHEN NEW.marks_obtained >= (v_total * 0.4) THEN 'Pass'
        ELSE 'Fail'
    END;
END $$

CREATE TRIGGER trg_sp_after_insert
AFTER INSERT ON STUDENT_PERFORMANCE
FOR EACH ROW
BEGIN
    INSERT INTO performance_log (roll_no, assessment_id, marks)
    VALUES (NEW.roll_no, NEW.assessment_id, NEW.marks_obtained);
END $$

DELIMITER ;
