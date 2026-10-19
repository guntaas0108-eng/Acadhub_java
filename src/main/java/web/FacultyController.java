package web;

import db.DBConnection;
import db.Rows;
import jakarta.servlet.http.HttpSession;
import model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    public record MarkReq(int rollNo, int assessmentId, int marks) {}
    public record AttRow(int rollNo, String status) {}
    public record AttReq(String course, String date, List<AttRow> records) {}

    public record StudentReq(String name, String username, String password, String phone,
                             Integer rollNo, String department, String branch,
                             Integer semester, Double cgpa, String course) {}
    public record EnrollReq(Integer rollNo, String course) {}
    public record AssessReq(String course, String assessmentType, Integer totalMarks, Integer passingMarks) {}

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
        // 45000 = validation message from our own triggers (safe to show)
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

    // same helpers, but on an open connection (used inside transactions)
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

    // ---------- dashboard (profile + courses) ----------
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {
        User user = getFaculty(session);
        if (user == null) return notLoggedIn();

        try {
            return ResponseEntity.ok(Map.of(
                "profile", Rows.query("SELECT faculty_id, designation, department FROM FACULTY WHERE user_id = ?",
                    user.getUserId()),
                "courses", Rows.query("SELECT c.course_code, c.course_name, ca.total_students, ca.avg_marks, "
                    + "ca.highest_marks, ca.lowest_marks, ca.fail_count "
                    + "FROM FACULTY f JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
                    + "JOIN COURSE c ON fc.course_code = c.course_code "
                    + "LEFT JOIN course_analytics ca ON c.course_code = ca.course_code "
                    + "WHERE f.user_id = ?", user.getUserId())
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
                    "SELECT s.roll_no, u.name FROM ENROLLMENT e "
                  + "JOIN STUDENT s ON e.roll_no = s.roll_no JOIN USERS u ON s.user_id = u.user_id "
                  + "WHERE e.course_code = ? ORDER BY s.roll_no", course),
                "assessments", Rows.query(
                    "SELECT assessment_id, assessment_type, total_marks FROM ASSESSMENT "
                  + "WHERE course_code = ? ORDER BY assessment_id", course),
                "marks", Rows.query(
                    "SELECT sp.roll_no, sp.assessment_id, sp.marks_obtained FROM STUDENT_PERFORMANCE sp "
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

            // one transaction: user + student + enrollment are saved together, or not at all
            try (Connection con = DBConnection.getConnection()) {
                con.setAutoCommit(false);
                try {
                    int userId = nextId(con, "USERS", "user_id");
                    run(con, "INSERT INTO USERS (user_id, name, username, password, role, phone) VALUES (?,?,?,?,'Student',?)",
                            userId, r.name().trim(), r.username().trim(), r.password().trim(),
                            blank(r.phone()) ? null : r.phone().trim());

                    run(con, "INSERT INTO STUDENT (roll_no, department, branch, semester, user_id, cgpa) VALUES (?,?,?,?,?,?)",
                            r.rollNo(), r.department().trim(), r.branch().trim(), r.semester(),
                            userId, r.cgpa() == null ? 5.00 : r.cgpa());

                    run(con, "INSERT INTO ENROLLMENT (enrollment_id, roll_no, course_code) VALUES (?,?,?)",
                            nextId(con, "ENROLLMENT", "enrollment_id"), r.rollNo(), r.course());

                    con.commit();
                } catch (SQLException e) {
                    con.rollback();
                    throw e;
                }
            }
            return ResponseEntity.ok(Map.of("status", "saved"));

        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) return bad("Username or roll number already exists");
            return dbError(e);
        }
    }

    // ---------- enroll an EXISTING student (by roll number) in one of my courses ----------
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

    // ---------- add an assessment (Mid Term, End Term, Quiz ...) to one of my courses ----------
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

            Rows.update("INSERT INTO ASSESSMENT (assessment_id, course_code, assessment_type, total_marks, passing_marks) "
                      + "VALUES (?,?,?,?,?)",
                    nextId("ASSESSMENT", "assessment_id"), r.course(), r.assessmentType().trim(), r.totalMarks(), pass);
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- save one student's marks (insert or update) ----------
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

            // The DB triggers check the range and set grade/result automatically
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

    // ---------- save attendance of a whole class for one date ----------
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

            // validate everything first, so we never save half of the class
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
            return ResponseEntity.ok(Map.of("status", "saved", "count", req.records().size()));

        } catch (SQLException e) {
            return dbError(e);
        }
    }
}