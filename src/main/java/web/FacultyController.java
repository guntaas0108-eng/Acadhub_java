package web;

import db.DBConnection;
import db.Rows;
import jakarta.servlet.http.HttpSession;
import model.User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    private final FileStorageService storageService;

    public FacultyController(FileStorageService storageService) {
        this.storageService = storageService;
    }

    public record MarkReq(int rollNo, int assessmentId, int marks) {}
    public record AttRow(int rollNo, String status) {}
    public record AttReq(String course, String date, List<AttRow> records) {}

    public record StudentReq(String name, String username, String password, String phone,
                             Integer rollNo, String department, String branch,
                             Integer semester, Double cgpa, String course) {}
    public record EnrollReq(Integer rollNo, String course) {}
    public record AssessReq(String course, String assessmentType, Integer totalMarks, Integer passingMarks) {}

    public record MaterialReq(String course, String title, String type, String content, String dueDate, Integer maxMarks) {}
    public record GradeSubmissionReq(int submissionId, String status, String feedback, Double marksAwarded) {}

    // ---------- helpers ----------
    private User getFaculty(HttpSession session) {
        Object o = session.getAttribute("user");
        if (o instanceof User u && "Faculty".equals(u.getRole())) return u;
        return null;
    }

    private ResponseEntity<?> notLoggedIn() {
        return ResponseEntity.status(401).body(Map.of("error", "Faculty login required"));
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }

    private ResponseEntity<?> dbError(SQLException e) {
        e.printStackTrace();
        if ("45000".equals(e.getSQLState())) return bad(e.getMessage());
        if (e.getErrorCode() == 1062) return bad("That record already exists (duplicate value)");
        if (e.getErrorCode() == 1452) return bad("Related record not found");
        return ResponseEntity.status(500).body(Map.of("error", "Server error"));
    }

    private static boolean blank(String s) { return s == null || s.trim().isEmpty(); }

    private boolean teaches(int userId, String course) throws SQLException {
        return !Rows.query(
            "SELECT 1 FROM FACULTY f JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
          + "WHERE f.user_id = ? AND fc.course_code = ?", userId, course).isEmpty();
    }

    private boolean enrolled(int rollNo, String course) throws SQLException {
        return !Rows.query("SELECT 1 FROM ENROLLMENT WHERE roll_no = ? AND course_code = ?",
                rollNo, course).isEmpty();
    }

    private int nextId(String table, String col) throws SQLException {
        Object n = Rows.query("SELECT COALESCE(MAX(" + col + "), 0) + 1 AS n FROM " + table).get(0).get("n");
        return ((Number) n).intValue();
    }

    private static void run(Connection con, String sql, Object... params) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
            ps.executeUpdate();
        }
    }

    private static int nextId(Connection con, String table, String col) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement("SELECT COALESCE(MAX(" + col + "), 0) + 1 FROM " + table);
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getInt(1);
        }
    }

    // ---------- dashboard (profile + courses + overview statistics) ----------
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            var profileList = Rows.query("SELECT faculty_id, designation, department FROM FACULTY WHERE user_id = ?",
                    user.getUserId());
            var coursesList = Rows.query("SELECT c.course_code, c.course_name, c.credits, c.semester, "
                    + "COALESCE(ca.total_students, (SELECT COUNT(*) FROM ENROLLMENT e WHERE e.course_code = c.course_code)) AS total_students, "
                    + "ca.avg_marks, ca.highest_marks, ca.lowest_marks, ca.fail_count "
                    + "FROM FACULTY f JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
                    + "JOIN COURSE c ON fc.course_code = c.course_code "
                    + "LEFT JOIN course_analytics ca ON c.course_code = ca.course_code "
                    + "WHERE f.user_id = ?", user.getUserId());

            return ResponseEntity.ok(Map.of(
                "profile", profileList,
                "courses", coursesList
            ));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- students + assessments + existing marks of one course ----------
    @GetMapping("/course-data")
    public ResponseEntity<?> courseData(@RequestParam String course, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            if (!teaches(user.getUserId(), course)) return bad("You do not teach " + course);

            return ResponseEntity.ok(Map.of(
                "students", Rows.query(
                    "SELECT s.roll_no, u.name, s.department, s.branch, s.semester "
                  + "FROM ENROLLMENT e "
                  + "JOIN STUDENT s ON e.roll_no = s.roll_no JOIN USERS u ON s.user_id = u.user_id "
                  + "WHERE e.course_code = ? ORDER BY s.roll_no", course),
                "assessments", Rows.query(
                    "SELECT assessment_id, assessment_type, total_marks, passing_marks FROM ASSESSMENT "
                  + "WHERE course_code = ? ORDER BY assessment_id", course),
                "marks", Rows.query(
                    "SELECT sp.roll_no, sp.assessment_id, sp.marks_obtained, sp.grade, sp.result "
                  + "FROM STUDENT_PERFORMANCE sp "
                  + "JOIN ASSESSMENT a ON sp.assessment_id = a.assessment_id WHERE a.course_code = ?", course)
            ));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- add a NEW student and enroll them in one of my courses ----------
    @PostMapping("/student")
    public ResponseEntity<?> addStudent(@RequestBody StudentReq r, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        if (blank(r.name()) || blank(r.username()) || blank(r.password()))
            return bad("Name, username and password are required");
        if (r.rollNo() == null) return bad("Roll number is required");
        if (blank(r.department()) || blank(r.branch())) return bad("Department and branch are required");
        if (r.semester() == null || r.semester() < 1 || r.semester() > 8) return bad("Semester must be between 1 and 8");
        if (blank(r.course())) return bad("Choose a course");

        try {
            if (!teaches(user.getUserId(), r.course())) return bad("You do not teach " + r.course());

            try (Connection con = DBConnection.getConnection()) {
                con.setAutoCommit(false);
                try {
                    int userId = nextId(con, "USERS", "user_id");
                    run(con, "INSERT INTO USERS (user_id, name, username, password, role, phone) VALUES (?,?,?,?,'Student',?)",
                            userId, r.name().trim(), r.username().trim(), r.password().trim(),
                            blank(r.phone()) ? null : r.phone().trim());

                    run(con, "INSERT INTO STUDENT (roll_no, department, branch, semester, user_id, cgpa) VALUES (?,?,?,?,?,?)",
                            r.rollNo(), r.department().trim(), r.branch().trim(), r.semester(),
                            userId, r.cgpa() == null ? 8.00 : r.cgpa());

                    run(con, "INSERT INTO ENROLLMENT (enrollment_id, roll_no, course_code) VALUES (?,?,?)",
                            nextId(con, "ENROLLMENT", "enrollment_id"), r.rollNo(), r.course());

                    con.commit();
                } catch (SQLException e) {
                    con.rollback();
                    throw e;
                }
            }
            return ResponseEntity.ok(Map.of("status", "saved", "username", r.username().trim(), "rollNo", r.rollNo()));

        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) return bad("Username or roll number already exists");
            return dbError(e);
        }
    }

    // ---------- enroll an EXISTING student in one of my courses ----------
    @PostMapping("/enroll")
    public ResponseEntity<?> enroll(@RequestBody EnrollReq r, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();
        if (r.rollNo() == null || blank(r.course())) return bad("Roll number and course are required");

        try {
            if (!teaches(user.getUserId(), r.course())) return bad("You do not teach " + r.course());
            if (Rows.query("SELECT 1 FROM STUDENT WHERE roll_no = ?", r.rollNo()).isEmpty())
                return bad("No student with roll number " + r.rollNo());
            if (enrolled(r.rollNo(), r.course()))
                return bad("Student is already enrolled in " + r.course());

            Rows.update("INSERT INTO ENROLLMENT (enrollment_id, roll_no, course_code) VALUES (?,?,?)",
                    nextId("ENROLLMENT", "enrollment_id"), r.rollNo(), r.course());
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- add an assessment to one of my courses ----------
    @PostMapping("/assessment")
    public ResponseEntity<?> addAssessment(@RequestBody AssessReq r, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        if (blank(r.course()) || blank(r.assessmentType())) return bad("Course and assessment type are required");
        if (r.totalMarks() == null || r.totalMarks() <= 0) return bad("Total marks must be greater than 0");
        int pass = r.passingMarks() == null ? (int) Math.ceil(r.totalMarks() * 0.4) : r.passingMarks();
        if (pass < 0 || pass > r.totalMarks()) return bad("Passing marks must be between 0 and total marks");

        try {
            if (!teaches(user.getUserId(), r.course())) return bad("You do not teach " + r.course());

            int assessId = nextId("ASSESSMENT", "assessment_id");
            Rows.update("INSERT INTO ASSESSMENT (assessment_id, course_code, assessment_type, total_marks, passing_marks) "
                      + "VALUES (?,?,?,?,?)",
                    assessId, r.course(), r.assessmentType().trim(), r.totalMarks(), pass);
            return ResponseEntity.ok(Map.of("status", "saved", "assessmentId", assessId));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- save one student's marks ----------
    @PostMapping("/marks")
    public ResponseEntity<?> saveMarks(@RequestBody MarkReq req, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            var asmt = Rows.query("SELECT course_code FROM ASSESSMENT WHERE assessment_id = ?", req.assessmentId());
            if (asmt.isEmpty()) return bad("Assessment not found");

            String course = (String) asmt.get(0).get("course_code");
            if (!teaches(user.getUserId(), course)) return bad("You do not teach " + course);
            if (!enrolled(req.rollNo(), course)) return bad("Roll " + req.rollNo() + " is not enrolled in " + course);

            var existing = Rows.query(
                "SELECT performance_id FROM STUDENT_PERFORMANCE WHERE roll_no = ? AND assessment_id = ?",
                req.rollNo(), req.assessmentId());

            if (existing.isEmpty()) {
                Rows.update("INSERT INTO STUDENT_PERFORMANCE (performance_id, roll_no, assessment_id, marks_obtained) "
                          + "VALUES (?, ?, ?, ?)",
                        nextId("STUDENT_PERFORMANCE", "performance_id"),
                        req.rollNo(), req.assessmentId(), req.marks());
            } else {
                Rows.update("UPDATE STUDENT_PERFORMANCE SET marks_obtained = ? WHERE performance_id = ?",
                        req.marks(), existing.get(0).get("performance_id"));
            }
            return ResponseEntity.ok(Map.of("status", "saved"));

        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- save attendance for a class on a date ----------
    @PostMapping("/attendance")
    public ResponseEntity<?> saveAttendance(@RequestBody AttReq req, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            if (req.course() == null || req.records() == null || req.records().isEmpty())
                return bad("Nothing to save");
            if (!teaches(user.getUserId(), req.course())) return bad("You do not teach " + req.course());

            java.sql.Date date;
            try {
                date = java.sql.Date.valueOf(LocalDate.parse(req.date()));
            } catch (Exception e) {
                return bad("Invalid date");
            }

            for (AttRow r : req.records()) {
                if (!"Present".equals(r.status()) && !"Absent".equals(r.status()))
                    return bad("Status must be Present or Absent");
                if (!enrolled(r.rollNo(), req.course()))
                    return bad("Roll " + r.rollNo() + " is not enrolled in " + req.course());
            }

            for (AttRow r : req.records()) {
                var existing = Rows.query(
                    "SELECT attendance_id FROM ATTENDANCE WHERE roll_no = ? AND course_code = ? AND attendance_date = ?",
                    r.rollNo(), req.course(), date);

                if (existing.isEmpty()) {
                    Rows.update("INSERT INTO ATTENDANCE (attendance_id, roll_no, course_code, attendance_date, status) "
                              + "VALUES (?, ?, ?, ?, ?)",
                            nextId("ATTENDANCE", "attendance_id"), r.rollNo(), req.course(), date, r.status());
                } else {
                    Rows.update("UPDATE ATTENDANCE SET status = ? WHERE attendance_id = ?",
                            r.status(), existing.get(0).get("attendance_id"));
                }
            }

            // Audit Trail on Attendance save/edit
            try {
                Rows.update("INSERT INTO audit_log (user_id, username, action, details) VALUES (?, ?, ?, ?)",
                    user.getUserId(), user.getUsername(), "MARK_ATTENDANCE",
                    "Saved attendance for " + req.course().trim().toUpperCase() + " on " + date + " (" + req.records().size() + " students)");
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of("status", "saved"));

        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ============================================================
    //   STUDY MATERIALS & STUDENT SUBMISSIONS (FACULTY VIEW)
    // ============================================================

    // ---------- campus announcements for faculty ----------
    @GetMapping("/announcements")
    public ResponseEntity<?> getAnnouncements(HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();
        try {
            var list = Rows.query("SELECT announcement_id, title, content, author, category, posted_at FROM announcements WHERE is_active = 1 ORDER BY announcement_id DESC LIMIT 20");
            return ResponseEntity.ok(list);
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- list all materials uploaded by this faculty for a course ----------
    @GetMapping("/materials")
    public ResponseEntity<?> listMaterials(@RequestParam(required = false) String course, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            var fac = Rows.query("SELECT faculty_id FROM FACULTY WHERE user_id = ?", user.getUserId());
            if (fac.isEmpty()) return bad("Faculty profile not found");
            int facultyId = ((Number) fac.get(0).get("faculty_id")).intValue();

            String sql = "SELECT sm.material_id, sm.course_code, sm.title, sm.material_type, sm.content, sm.upload_date, "
                       + "sm.file_name, sm.file_path, sm.file_size, sm.due_date, sm.max_marks, c.course_name, "
                       + "(SELECT COUNT(*) FROM student_submission ss WHERE ss.material_id = sm.material_id) AS submissions_count "
                       + "FROM study_material sm JOIN course c ON sm.course_code = c.course_code ";

            if (course != null && !course.isBlank()) {
                if (!teaches(user.getUserId(), course)) return bad("You do not teach " + course);
                sql += "WHERE sm.course_code = ? AND sm.faculty_id = ? ORDER BY sm.material_id DESC";
                return ResponseEntity.ok(Rows.query(sql, course, facultyId));
            } else {
                sql += "WHERE sm.faculty_id = ? ORDER BY sm.material_id DESC";
                return ResponseEntity.ok(Rows.query(sql, facultyId));
            }
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- upload study material (Notes / Slides / Tutorials / Reference with Laptop File) ----------
    @PostMapping(value = "/material-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMaterialWithFile(
            @RequestParam("course") String course,
            @RequestParam("title") String title,
            @RequestParam(value = "type", defaultValue = "Notes") String type,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "dueDate", required = false) String dueDate,
            @RequestParam(value = "maxMarks", required = false) Integer maxMarks,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        if (blank(course) || blank(title))
            return bad("Course and title are required");

        String safeType = blank(type) ? "Notes" : type.trim();
        if (!List.of("Notes", "Slides", "Tutorials", "Reference", "Assignment", "Quiz").contains(safeType)) {
            safeType = "Notes";
        }

        try {
            if (!teaches(user.getUserId(), course)) return bad("You do not teach " + course);

            var fac = Rows.query("SELECT faculty_id FROM FACULTY WHERE user_id = ?", user.getUserId());
            if (fac.isEmpty()) return bad("Faculty record not found");
            int facultyId = ((Number) fac.get(0).get("faculty_id")).intValue();

            String fileName = null;
            String filePath = null;
            String fileSize = null;

            if (file != null && !file.isEmpty()) {
                try {
                    var saved = storageService.saveMaterialFile(file);
                    fileName = saved.originalName();
                    filePath = saved.storagePath();
                    fileSize = saved.formattedSize();
                } catch (Exception e) {
                    e.printStackTrace();
                    return bad("Could not upload file: " + e.getMessage());
                }
            }

            java.sql.Date sqlDueDate = null;
            if (dueDate != null && !dueDate.isBlank()) {
                try {
                    sqlDueDate = java.sql.Date.valueOf(dueDate.trim());
                } catch (Exception ignored) {}
            }
            int safeMaxMarks = (maxMarks != null && maxMarks > 0) ? maxMarks : 100;

            int materialId = nextId("study_material", "material_id");
            Rows.update(
                "INSERT INTO study_material (material_id, course_code, faculty_id, title, material_type, content, upload_date, file_name, file_path, file_size, due_date, max_marks) "
              + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                materialId, course.trim().toUpperCase(), facultyId, title.trim(), safeType,
                blank(content) ? "" : content.trim(), java.sql.Date.valueOf(LocalDate.now()),
                fileName, filePath, fileSize, sqlDueDate, safeMaxMarks);

            // Audit Trail
            try {
                Rows.update("INSERT INTO audit_log (user_id, username, action, details) VALUES (?, ?, ?, ?)",
                    user.getUserId(), user.getUsername(), "UPLOAD_MATERIAL",
                    "Uploaded " + safeType + " '" + title.trim() + "' for course " + course.trim().toUpperCase());
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                "status", "saved",
                "materialId", materialId,
                "dueDate", sqlDueDate == null ? "" : sqlDueDate.toString(),
                "maxMarks", safeMaxMarks,
                "fileName", fileName == null ? "" : fileName,
                "fileSize", fileSize == null ? "" : fileSize
            ));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- upload study material (Legacy JSON fallback) ----------
    @PostMapping("/material")
    public ResponseEntity<?> addMaterial(@RequestBody MaterialReq r, HttpSession session) {
        return uploadMaterialWithFile(r.course(), r.title(), r.type(), r.content(), r.dueDate(), r.maxMarks(), null, session);
    }

    // ---------- delete a study material ----------
    @DeleteMapping("/material/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable int id, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            var fac = Rows.query("SELECT faculty_id FROM FACULTY WHERE user_id = ?", user.getUserId());
            if (fac.isEmpty()) return bad("Faculty record not found");
            int facultyId = ((Number) fac.get(0).get("faculty_id")).intValue();

            int n = Rows.update("DELETE FROM study_material WHERE material_id = ? AND faculty_id = ?", id, facultyId);
            return n == 0 ? bad("Material not found or not owned by you") : ResponseEntity.ok(Map.of("status", "deleted"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- view submissions submitted by enrolled students for teacher's courses ----------
    @GetMapping("/submissions")
    public ResponseEntity<?> getSubmissions(@RequestParam(required = false) String course, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            String sql = "SELECT ss.submission_id, ss.material_id, ss.course_code, ss.roll_no, u.name AS student_name, "
                       + "ss.title, ss.submission_text, ss.file_url, ss.file_name, ss.file_size, ss.submitted_at, ss.status, ss.feedback, "
                       + "ss.marks_awarded, sm.title AS material_title, sm.due_date, sm.max_marks "
                       + "FROM student_submission ss "
                       + "JOIN student s ON ss.roll_no = s.roll_no "
                       + "JOIN users u ON s.user_id = u.user_id "
                       + "LEFT JOIN study_material sm ON ss.material_id = sm.material_id ";

            if (course != null && !course.isBlank()) {
                if (!teaches(user.getUserId(), course)) return bad("You do not teach " + course);
                sql += "WHERE ss.course_code = ? ORDER BY ss.submission_id DESC";
                return ResponseEntity.ok(Rows.query(sql, course));
            } else {
                sql += "JOIN faculty_course fc ON ss.course_code = fc.course_code "
                    + "JOIN faculty f ON fc.faculty_id = f.faculty_id "
                    + "WHERE f.user_id = ? ORDER BY ss.submission_id DESC";
                return ResponseEntity.ok(Rows.query(sql, user.getUserId()));
            }
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- grade / give feedback on student submission ----------
    @PostMapping({"/submission/grade", "/submission-grade"})
    public ResponseEntity<?> gradeSubmission(@RequestBody GradeSubmissionReq r, HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            var sub = Rows.query("SELECT course_code, roll_no FROM student_submission WHERE submission_id = ?", r.submissionId());
            if (sub.isEmpty()) return bad("Submission not found");

            String course = (String) sub.get(0).get("course_code");
            if (!teaches(user.getUserId(), course)) return bad("You do not teach " + course);

            String status = blank(r.status()) ? "Reviewed" : r.status().trim();
            Double marks = r.marksAwarded();
            Rows.update(
                "UPDATE student_submission SET status = ?, feedback = ?, marks_awarded = ? WHERE submission_id = ?",
                status, blank(r.feedback()) ? null : r.feedback().trim(), marks, r.submissionId());

            // Audit Trail
            try {
                Rows.update("INSERT INTO audit_log (user_id, username, action, details) VALUES (?, ?, ?, ?)",
                    user.getUserId(), user.getUsername(), "GRADE_SUBMISSION",
                    "Graded submission #" + r.submissionId() + " (Marks: " + (marks != null ? marks : "N/A") + ", Status: " + status + ")");
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- class performance analytics for faculty courses ----------
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();
        try {
            var courses = Rows.query(
                "SELECT c.course_code, c.course_name, c.credits, c.semester, "
              + "COUNT(DISTINCT e.roll_no) AS enrolled_students, "
              + "COALESCE(ca.avg_marks, 0) AS avg_marks, "
              + "COALESCE(ca.highest_marks, 0) AS highest_marks, "
              + "COALESCE(ca.lowest_marks, 0) AS lowest_marks, "
              + "COALESCE(ca.fail_count, 0) AS fail_count, "
              + "(SELECT COUNT(*) FROM study_material sm WHERE sm.course_code = c.course_code) AS total_materials, "
              + "(SELECT COUNT(*) FROM student_submission ss WHERE ss.course_code = c.course_code) AS total_submissions "
              + "FROM FACULTY f JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
              + "JOIN COURSE c ON fc.course_code = c.course_code "
              + "LEFT JOIN course_analytics ca ON c.course_code = ca.course_code "
              + "LEFT JOIN ENROLLMENT e ON c.course_code = e.course_code "
              + "WHERE f.user_id = ? "
              + "GROUP BY c.course_code, c.course_name, c.credits, c.semester, ca.avg_marks, ca.highest_marks, ca.lowest_marks, ca.fail_count",
                user.getUserId());
            return ResponseEntity.ok(courses);
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- identify students at academic risk in faculty's courses ----------
    @GetMapping("/at-risk")
    public ResponseEntity<?> getAtRisk(HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();
        try {
            var atRisk = Rows.query(
                "SELECT ar.roll_no, ar.name, ar.course_code, ar.attendance_pct, ar.avg_marks, ar.risk_status "
              + "FROM at_risk_students ar "
              + "JOIN faculty_course fc ON ar.course_code = fc.course_code "
              + "JOIN faculty f ON fc.faculty_id = f.faculty_id "
              + "WHERE f.user_id = ? AND ar.risk_status = 'At Risk' "
              + "ORDER BY ar.attendance_pct ASC", user.getUserId());
            return ResponseEntity.ok(atRisk);
        } catch (SQLException e) {
            return dbError(e);
        }
    }
}
