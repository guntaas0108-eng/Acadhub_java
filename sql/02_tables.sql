
USE Acadhub_java;

CREATE TABLE USERS (
    user_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('Admin','Faculty','Student'))
);

CREATE TABLE STUDENT (
    roll_no INT PRIMARY KEY,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
        ON DELETE CASCADE
);

CREATE TABLE FACULTY (
    faculty_id INT PRIMARY KEY,
    designation VARCHAR(50),
    department VARCHAR(50),
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
        ON DELETE CASCADE
);

CREATE TABLE ADMIN (
    admin_id INT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    access_level VARCHAR(30) DEFAULT 'Full',
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
        ON DELETE CASCADE
);

CREATE TABLE COURSE (
    course_code VARCHAR(10) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT DEFAULT 4,
    semester INT NOT NULL
);

CREATE TABLE ENROLLMENT (
    enrollment_id INT PRIMARY KEY,
    roll_no INT NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    UNIQUE (roll_no, course_code),
    FOREIGN KEY (roll_no) REFERENCES STUDENT(roll_no)
        ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
        ON DELETE CASCADE
);

CREATE TABLE FACULTY_COURSE (
    id INT PRIMARY KEY,
    faculty_id INT NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id)
        ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
        ON DELETE CASCADE
);

CREATE TABLE PYQ (
    pyq_id INT PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL,
    question TEXT NOT NULL,
    year INT,
    exam_type VARCHAR(50),
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
        ON DELETE CASCADE
);

CREATE TABLE STUDY_MATERIAL (
    material_id INT PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL,
    faculty_id INT NOT NULL,
    title VARCHAR(100),
    material_type ENUM('Notes','Slides','Tutorials','Reference')
        DEFAULT 'Notes',
    content TEXT,
    upload_date DATE,
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
        ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id)
        ON DELETE CASCADE
);

CREATE TABLE ASSESSMENT (
    assessment_id INT PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL,
    assessment_type VARCHAR(50),
    total_marks INT CHECK (total_marks > 0),
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
        ON DELETE CASCADE
);

CREATE TABLE STUDENT_PERFORMANCE (
    performance_id INT PRIMARY KEY,
    roll_no INT NOT NULL,
    assessment_id INT NOT NULL,
    marks_obtained INT CHECK (marks_obtained >= 0),
    UNIQUE (roll_no, assessment_id),
    FOREIGN KEY (roll_no) REFERENCES STUDENT(roll_no)
        ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES ASSESSMENT(assessment_id)
        ON DELETE CASCADE
);

CREATE TABLE ATTENDANCE (
    attendance_id INT PRIMARY KEY,
    roll_no INT NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('Present','Absent') NOT NULL,
    FOREIGN KEY (roll_no) REFERENCES STUDENT(roll_no)
        ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
        ON DELETE CASCADE
);
