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
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // ---------- request bodies ----------
    public record UserReq(String name, String username, String password, String role, String phone,
                          Integer rollNo, String department, String branch, Integer semester, Double cgpa,
                          String designation, String courseCode) {}
    public record CourseReq(String courseCode, String courseName, Integer credits, Integer semester, String description) {}
    public record EnrollReq(Integer rollNo, String courseCode) {}
    public record AssignReq(Integer facultyId, String courseCode) {}
    public record AssessmentReq(String courseCode, String assessmentType, Integer totalMarks, Integer passingMarks) {}

    // ---------- helpers ----------
    private User getAdmin(HttpSession session) {
        Object o = session.getAttribute("user");
        if (o instanceof User u && "Admin".equals(u.getRole())) return u;
        return null;
    }

    private ResponseEntity<?> denied() {
        return ResponseEntity.status(401).body(Map.of("error", "Admin login required"));
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }

    private ResponseEntity<?> dbError(SQLException e) {
        e.printStackTrace();
        if ("45000".equals(e.getSQLState())) return bad(e.getMessage());
        if (e.getErrorCode() == 1062) return bad("That record already exists (duplicate username or roll number)");
        if (e.getErrorCode() == 1452) return bad("Related record not found (check course / student / faculty)");
        if (e.getErrorCode() == 3819) return bad("A value is outside its allowed range");
        return ResponseEntity.status(500).body(Map.of("error", "Server error"));
    }

    private static boolean blank(String s) { return s == null || s.trim().isEmpty(); }

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

    // ---------- dashboard & total accountability analytics ----------
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {
        if (getAdmin(session) == null) return denied();
        try {
            var sumRows = Rows.query(
                "SELECT (SELECT COUNT(*) FROM USERS) AS total_users, "
              + "(SELECT COUNT(*) FROM STUDENT) AS total_students, "
              + "(SELECT COUNT(*) FROM FACULTY) AS total_faculty, "
              + "(SELECT COUNT(*) FROM COURSE) AS total_courses, "
              + "(SELECT COUNT(*) FROM ENROLLMENT) AS total_enrollments");

            Map<String, Object> summary = sumRows.isEmpty() ? Map.of() : sumRows.get(0);

            // Enrollment Distribution Graph Data
            var enrollmentGraph = Rows.query(
                "SELECT c.course_code, c.course_name, c.credits, c.semester, "
              + "COUNT(DISTINCT e.roll_no) AS enrolled_students, "
              + "COALESCE(GROUP_CONCAT(DISTINCT u_fac.name ORDER BY u_fac.name SEPARATOR ', '), 'Unassigned') AS faculty_names "
              + "FROM course c "
              + "LEFT JOIN enrollment e ON c.course_code = e.course_code "
              + "LEFT JOIN faculty_course fc ON c.course_code = fc.course_code "
              + "LEFT JOIN faculty f ON fc.faculty_id = f.faculty_id "
              + "LEFT JOIN users u_fac ON f.user_id = u_fac.user_id "
              + "GROUP BY c.course_code, c.course_name, c.credits, c.semester "
              + "ORDER BY enrolled_students DESC, c.course_code");

            // Complete Accountability Connectivity Matrix (Course -> Faculty -> Enrolled Students)
            var accountabilityMatrix = Rows.query(
                "SELECT c.course_code, c.course_name, c.credits, c.semester, "
              + "COUNT(DISTINCT e.roll_no) AS enrolled_count, "
              + "COALESCE(GROUP_CONCAT(DISTINCT u_fac.name ORDER BY u_fac.name SEPARATOR ', '), 'Unassigned') AS faculty_names, "
              + "COALESCE(GROUP_CONCAT(DISTINCT CONCAT(u_stu.name, ' (Roll: ', s.roll_no, ')') ORDER BY u_stu.name SEPARATOR '; '), 'No students enrolled') AS enrolled_students_list "
              + "FROM course c "
              + "LEFT JOIN enrollment e ON c.course_code = e.course_code "
              + "LEFT JOIN student s ON e.roll_no = s.roll_no "
              + "LEFT JOIN users u_stu ON s.user_id = u_stu.user_id "
              + "LEFT JOIN faculty_course fc ON c.course_code = fc.course_code "
              + "LEFT JOIN faculty f ON fc.faculty_id = f.faculty_id "
              + "LEFT JOIN users u_fac ON f.user_id = u_fac.user_id "
              + "GROUP BY c.course_code, c.course_name, c.credits, c.semester "
              + "ORDER BY enrolled_count DESC, c.course_code");

            // Faculty Workload & Accountability
            var facultyAccountability = Rows.query(
                "SELECT f.faculty_id, u.name AS faculty_name, u.username, f.designation, f.department, "
              + "COUNT(DISTINCT fc.course_code) AS total_courses, "
              + "COALESCE(GROUP_CONCAT(DISTINCT fc.course_code ORDER BY fc.course_code SEPARATOR ', '), 'None') AS courses_taught, "
              + "COUNT(DISTINCT e.roll_no) AS total_students_mentored "
              + "FROM faculty f "
              + "JOIN users u ON f.user_id = u.user_id "
              + "LEFT JOIN faculty_course fc ON f.faculty_id = fc.faculty_id "
              + "LEFT JOIN enrollment e ON fc.course_code = e.course_code "
              + "GROUP BY f.faculty_id, u.name, u.username, f.designation, f.department "
              + "ORDER BY total_students_mentored DESC");

            var users = Rows.query("SELECT user_id, name, username, role, phone FROM USERS ORDER BY user_id");
            var atRisk = Rows.query(
                "SELECT roll_no, name, course_code, attendance_pct, avg_marks "
              + "FROM at_risk_students WHERE risk_status = 'At Risk' ORDER BY roll_no");

            return ResponseEntity.ok(Map.of(
                "summary", summary,
                "stats", summary,
                "enrollmentGraph", enrollmentGraph,
                "accountabilityMatrix", accountabilityMatrix,
                "facultyAccountability", facultyAccountability,
                "users", users,
                "atRisk", atRisk
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }

    // ---------- lists for the dropdowns in the forms ----------
    @GetMapping("/options")
    public ResponseEntity<?> options(HttpSession session) {
        if (getAdmin(session) == null) return denied();
        try {
            return ResponseEntity.ok(Map.of(
                "students", Rows.query("SELECT s.roll_no, u.name FROM STUDENT s JOIN USERS u ON s.user_id = u.user_id ORDER BY s.roll_no"),
                "faculty", Rows.query("SELECT f.faculty_id, u.name FROM FACULTY f JOIN USERS u ON f.user_id = u.user_id ORDER BY f.faculty_id"),
                "courses", Rows.query("SELECT course_code, course_name FROM COURSE ORDER BY course_code")
            ));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- add user (+ student / faculty / admin profile) ----------
    @PostMapping("/user")
    public ResponseEntity<?> addUser(@RequestBody UserReq r, HttpSession session) {
        if (getAdmin(session) == null) return denied();

        if (blank(r.name()) || blank(r.username()) || blank(r.password()))
            return bad("Name, username and password are required");

        String role = r.role();
        if (blank(role)) return bad("Role is required");
        if (role.equalsIgnoreCase("student")) role = "Student";
        else if (role.equalsIgnoreCase("faculty")) role = "Faculty";
        else if (role.equalsIgnoreCase("admin")) role = "Admin";
        else return bad("Role must be Student, Faculty or Admin");

        int rollNo = 0;
        if ("Student".equals(role)) {
            if (r.rollNo() != null && r.rollNo() > 0) {
                rollNo = r.rollNo();
            } else {
                try {
                    rollNo = nextId("STUDENT", "roll_no");
                    if (rollNo < 1024030100) rollNo = 1024030100;
                } catch (Exception ignored) {
                    rollNo = 1024030100;
                }
            }
        }

        String dept = blank(r.department()) ? "CSE" : r.department().trim();
        String branch = blank(r.branch()) ? "COE" : r.branch().trim();
        int sem = (r.semester() == null || r.semester() < 1 || r.semester() > 8) ? 1 : r.semester();
        double cgpa = (r.cgpa() == null || r.cgpa() < 0) ? 8.00 : r.cgpa();

        try (Connection con = DBConnection.getConnection()) {
            con.setAutoCommit(false);
            try {
                int userId = nextId(con, "USERS", "user_id");
                run(con, "INSERT INTO USERS (user_id, name, username, password, role, phone) VALUES (?,?,?,?,?,?)",
                        userId, r.name().trim(), r.username().trim(), r.password().trim(), role,
                        blank(r.phone()) ? null : r.phone().trim());

                switch (role) {
                    case "Student" -> {
                        run(con,
                            "INSERT INTO STUDENT (roll_no, department, branch, semester, user_id, cgpa) VALUES (?,?,?,?,?,?)",
                            rollNo, dept, branch, sem, userId, cgpa);

                        if (!blank(r.courseCode())) {
                            int enrId = nextId(con, "ENROLLMENT", "enrollment_id");
                            run(con, "INSERT INTO ENROLLMENT (enrollment_id, roll_no, course_code) VALUES (?,?,?)",
                                enrId, rollNo, r.courseCode().trim().toUpperCase());
                        }
                    }
                    case "Faculty" -> run(con,
                        "INSERT INTO FACULTY (faculty_id, designation, department, user_id) VALUES (?,?,?,?)",
                        nextId(con, "FACULTY", "faculty_id"),
                        blank(r.designation()) ? "Assistant Professor" : r.designation().trim(),
                        dept, userId);
                    default -> run(con, "INSERT INTO ADMIN (admin_id, user_id) VALUES (?,?)",
                        nextId(con, "ADMIN", "admin_id"), userId);
                }
                con.commit();
                return ResponseEntity.ok(Map.of(
                    "status", "saved",
                    "userId", userId,
                    "username", r.username().trim(),
                    "role", role,
                    "rollNo", rollNo
                ));
            } catch (SQLException e) {
                con.rollback();
                throw e;
            }
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) return bad("Username or roll number already exists");
            return dbError(e);
        }
    }

    // ---------- delete user (cascades to student/faculty/admin rows) ----------
    @DeleteMapping("/user/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable int id, HttpSession session) {
        User admin = getAdmin(session);
        if (admin == null) return denied();
        if (admin.getUserId() == id) return bad("You cannot delete your own account");
        try {
            int n = Rows.update("DELETE FROM USERS WHERE user_id = ?", id);
            return n == 0 ? bad("User not found") : ResponseEntity.ok(Map.of("status", "deleted"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- add course ----------
    @PostMapping("/course")
    public ResponseEntity<?> addCourse(@RequestBody CourseReq r, HttpSession session) {
        if (getAdmin(session) == null) return denied();
        if (blank(r.courseCode()) || blank(r.courseName())) return bad("Course code and name are required");
        if (r.courseCode().trim().length() > 10) return bad("Course code can be at most 10 characters");
        if (r.semester() == null || r.semester() < 1 || r.semester() > 8) return bad("Semester must be between 1 and 8");
        try {
            Rows.update("INSERT INTO COURSE (course_code, course_name, credits, semester, description) VALUES (?,?,?,?,?)",
                    r.courseCode().trim().toUpperCase(), r.courseName().trim(),
                    r.credits() == null ? 4 : r.credits(), r.semester(),
                    blank(r.description()) ? null : r.description().trim());
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- enroll a student in a course ----------
    @PostMapping("/enroll")
    public ResponseEntity<?> enroll(@RequestBody EnrollReq r, HttpSession session) {
        if (getAdmin(session) == null) return denied();
        if (r.rollNo() == null || blank(r.courseCode())) return bad("Choose a student and a course");
        try {
            Rows.update("INSERT INTO ENROLLMENT (enrollment_id, roll_no, course_code) VALUES (?,?,?)",
                    nextId("ENROLLMENT", "enrollment_id"), r.rollNo(), r.courseCode().trim().toUpperCase());
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) return bad("Student is already enrolled in this course");
            return dbError(e);
        }
    }

    // ---------- assign a faculty member to a course ----------
    @PostMapping("/assign")
    public ResponseEntity<?> assign(@RequestBody AssignReq r, HttpSession session) {
        if (getAdmin(session) == null) return denied();
        if (r.facultyId() == null || blank(r.courseCode())) return bad("Choose a faculty member and a course");
        try {
            if (!Rows.query("SELECT 1 FROM FACULTY_COURSE WHERE faculty_id = ? AND course_code = ?",
                    r.facultyId(), r.courseCode().trim().toUpperCase()).isEmpty())
                return bad("Faculty already teaches this course");
            Rows.update("INSERT INTO FACULTY_COURSE (id, faculty_id, course_code) VALUES (?,?,?)",
                    nextId("FACULTY_COURSE", "id"), r.facultyId(), r.courseCode().trim().toUpperCase());
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- add an assessment (Mid Term, End Term, ...) ----------
    @PostMapping("/assessment")
    public ResponseEntity<?> addAssessment(@RequestBody AssessmentReq r, HttpSession session) {
        if (getAdmin(session) == null) return denied();
        if (blank(r.courseCode()) || blank(r.assessmentType())) return bad("Course and assessment type are required");
        if (r.totalMarks() == null || r.totalMarks() <= 0) return bad("Total marks must be greater than 0");
        int pass = r.passingMarks() == null ? (int) Math.ceil(r.totalMarks() * 0.4) : r.passingMarks();
        if (pass < 0 || pass > r.totalMarks()) return bad("Passing marks must be between 0 and total marks");
        try {
            Rows.update("INSERT INTO ASSESSMENT (assessment_id, course_code, assessment_type, total_marks, passing_marks) VALUES (?,?,?,?,?)",
                    nextId("ASSESSMENT", "assessment_id"), r.courseCode().trim().toUpperCase(), r.assessmentType().trim(), r.totalMarks(), pass);
            return ResponseEntity.ok(Map.of("status", "saved"));
        } catch (SQLException e) {
            return dbError(e);
        }
    }
}
