
USE Acadhub_java;

INSERT INTO USERS
(user_id, name, username, password, role, phone)
VALUES
(1,'Kriti','kriti16','kri16','Student','9876501001'),
(2,'Lavdeep','lavdeep23','lav23','Student','9876501002'),
(3,'Rumneek','rumneek24','rum24','Faculty','9876501003'),
(4,'Aman','aman10','ama10','Student','9876501004'),
(5,'Simran','sim90','ravi90','Student','9876501005'),
(6,'Raj','raj19','pass12903','Faculty','9876501006'),
(7,'Admin1','doaa30','adm@123','Admin','9876501007');

INSERT INTO STUDENT
(roll_no, department, branch, semester, user_id, cgpa)
VALUES
(1024030111,'CSE','COE',4,1,8.5),
(1024030107,'CSE','COE',4,2,7.8),
(1024030100,'CSE','COE',4,4,9.1),
(1024030101,'CSE','COE',4,5,6.9);

INSERT INTO FACULTY
(faculty_id, designation, department, user_id)
VALUES
(201,'Professor','CSE',3),
(202,'Asst. Professor','CSE',6);

INSERT INTO ADMIN (admin_id, user_id)
VALUES (301,7);

INSERT INTO COURSE
(course_code, course_name, credits, semester, description)
VALUES
('UCS310','Database Management Systems',4,4,
 'Covers SQL, normalization, transactions and DB design'),
('CS102','Operating Systems',4,4,
 'Covers processes, memory management, scheduling and deadlock'),
('UCS520','Computer Networks',4,4,
 'Covers OSI model, TCP/IP, routing and network security');

INSERT INTO ENROLLMENT
(enrollment_id, roll_no, course_code)
VALUES
(1,1024030111,'UCS310'),
(2,1024030107,'UCS310'),
(3,1024030100,'UCS520'),
(4,1024030101,'UCS520'),
(5,1024030111,'CS102'),
(6,1024030107,'CS102');

INSERT INTO FACULTY_COURSE (id, faculty_id, course_code)
VALUES
(1,201,'UCS310'),
(2,202,'CS102'),
(3,201,'UCS520');

INSERT INTO PYQ
(pyq_id, course_code, question, year, exam_type)
VALUES
(1,'UCS310','Explain normalization up to 3NF with example.',
 2023,'End Term'),
(2,'UCS310','Write SQL query to find the class topper.',
 2022,'Mid Term'),
(3,'CS102','Explain deadlock and prevention techniques.',
 2023,'End Term'),
(4,'UCS520','Draw ER diagram for a student-course system.',
 2021,'Mid Term');

INSERT INTO STUDY_MATERIAL
(material_id, course_code, faculty_id, title,
 material_type, content, upload_date)
VALUES
(1,'UCS310',201,'Normalization Notes','Notes',
 '1NF, 2NF, 3NF explained','2025-04-10'),
(2,'UCS310',201,'SQL Joins','Tutorials',
 'JOIN concepts','2025-04-11'),
(3,'CS102',202,'Deadlock Notes','Notes',
 'Deadlock explanation','2025-04-12'),
(4,'UCS520',201,'ER Diagram Guide','Slides',
 'ER diagrams','2025-04-13');

INSERT INTO ASSESSMENT
(assessment_id, course_code, assessment_type, total_marks, passing_marks)
VALUES
(1,'UCS310','Mid Term',50,20),
(2,'UCS310','End Term',100,40),
(3,'CS102','Mid Term',50,20),
(4,'UCS520','Mid Term',50,20);

INSERT INTO STUDENT_PERFORMANCE
(performance_id, roll_no, assessment_id, marks_obtained, grade)
VALUES
(1,1024030111,1,42,'C'),
(2,1024030107,1,35,'F'),
(3,1024030100,1,48,'C'),
(4,1024030101,1,28,'F'),
(5,1024030111,2,78,'A'),
(6,1024030107,2,65,'B+'),
(7,1024030100,2,88,'A+'),
(8,1024030101,2,40,'C'),
(9,1024030111,3,38,'F'),
(10,1024030107,3,45,'C'),
(11,1024030100,4,49,'A'),
(12,1024030101,4,40,'B+');

INSERT INTO ATTENDANCE
(attendance_id, roll_no, course_code, attendance_date, status, remarks)
VALUES
(1,1024030111,'UCS310','2026-04-01','Present',NULL),
(2,1024030111,'UCS310','2026-04-02','Absent','sick leave'),
(3,1024030111,'UCS310','2026-04-03','Present',NULL),
(4,1024030107,'UCS310','2026-04-01','Present',NULL),
(5,1024030107,'UCS310','2026-04-02','Present',NULL),
(6,1024030107,'UCS310','2026-04-03','Absent',NULL);
