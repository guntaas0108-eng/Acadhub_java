package web;

import dao.ReportDAO;
import dao.StudentDAO;
import db.DBConnection;
import db.Rows;
import jakarta.servlet.http.HttpSession;
import model.Student;
import model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentDAO studentDao = new StudentDAO();
    private final ReportDAO reportDao = new ReportDAO();

    public record SubmissionReq(Integer materialId, String courseCode, String title, String submissionText, String fileUrl) {}

    private User getStudent(HttpSession session) {
        Object o = session.getAttribute("user");
        if (o instanceof User u && "Student".equals(u.getRole())) return u;
        return null;
    }

    private ResponseEntity<?> notLoggedIn() {
        return ResponseEntity.status(401).body(Map.of("error", "Not logged in as a student"));
    }

    private ResponseEntity<?> bad(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }

    private ResponseEntity<?> dbError(SQLException e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", "Server error"));
    }

    private int nextId(String table, String col) throws SQLException {
        Object n = Rows.query("SELECT COALESCE(MAX(" + col + "), 0) + 1 AS n FROM " + table).get(0).get("n");
        return ((Number) n).intValue();
    }

    // ---------- dashboard: student profile, marks, attendance, enrolled courses ----------
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {
        User user = getStudent(session);
        if (user == null) return notLoggedIn();

        try {
            Student student = studentDao.getStudentByUserId(user.getUserId());
            if (student == null) {
                return ResponseEntity.status(404).body(Map.of("error", "No student record found"));
            }

            int rollNo = student.getStudentId(); // studentId holds the roll number

            // Get list of courses enrolled by this student
            var enrolledCourses = Rows.query(
                "SELECT c.course_code, c.course_name, c.credits, c.semester, "
              + "COALESCE(u.name, 'Assigned Professor') AS faculty_name "
              + "FROM ENROLLMENT e "
              + "JOIN COURSE c ON e.course_code = c.course_code "
              + "LEFT JOIN FACULTY_COURSE fc ON c.course_code = fc.course_code "
              + "LEFT JOIN FACULTY f ON fc.faculty_id = f.faculty_id "
              + "LEFT JOIN USERS u ON f.user_id = u.user_id "
              + "WHERE e.roll_no = ? ORDER BY c.course_code", rollNo);

            return ResponseEntity.ok(Map.of(
                "details", Map.of(
                    "name", user.getName(),
                    "username", user.getUsername(),
                    "rollNo", student.getRollNo(),
                    "department", student.getDepartment(),
                    "semester", student.getSemester()
                ),
                "enrolledCourses", enrolledCourses,
                "marks", reportDao.getMarks(rollNo),
                "attendance", reportDao.getAttendance(rollNo)
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }

    // ---------- study materials: ONLY for courses this student is enrolled in ----------
    @GetMapping("/materials")
    public ResponseEntity<?> getMaterials(@RequestParam(required = false) String course, HttpSession session) {
        User user = getStudent(session);
        if (user == null) return notLoggedIn();

        try {
            Student student = studentDao.getStudentByUserId(user.getUserId());
            if (student == null) return bad("Student profile not found");
            int rollNo = Integer.parseInt(student.getRollNo());

            // Strict security: verify student is enrolled in requested course if provided
            if (course != null && !course.isBlank()) {
                var isEnrolled = Rows.query("SELECT 1 FROM ENROLLMENT WHERE roll_no = ? AND course_code = ?", rollNo, course);
                if (isEnrolled.isEmpty()) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied: You are not enrolled in " + course));
                }

                var materials = Rows.query(
                    "SELECT sm.material_id, sm.course_code, c.course_name, sm.title, sm.material_type, "
                  + "sm.content, sm.upload_date, u.name AS faculty_name "
                  + "FROM study_material sm "
                  + "JOIN course c ON sm.course_code = c.course_code "
                  + "JOIN faculty f ON sm.faculty_id = f.faculty_id "
                  + "JOIN users u ON f.user_id = u.user_id "
                  + "WHERE sm.course_code = ? "
                  + "ORDER BY sm.material_id DESC", course);
                return ResponseEntity.ok(materials);
            } else {
                // Fetch study materials strictly for all courses this student is enrolled in
                var materials = Rows.query(
                    "SELECT sm.material_id, sm.course_code, c.course_name, sm.title, sm.material_type, "
                  + "sm.content, sm.upload_date, u.name AS faculty_name "
                  + "FROM study_material sm "
                  + "JOIN course c ON sm.course_code = c.course_code "
                  + "JOIN faculty f ON sm.faculty_id = f.faculty_id "
                  + "JOIN users u ON f.user_id = u.user_id "
                  + "JOIN ENROLLMENT e ON sm.course_code = e.course_code "
                  + "WHERE e.roll_no = ? "
                  + "ORDER BY sm.material_id DESC", rollNo);
                return ResponseEntity.ok(materials);
            }
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- submit assignment / work to faculty for an enrolled course ----------
    @PostMapping("/submit")
    public ResponseEntity<?> submitWork(@RequestBody SubmissionReq r, HttpSession session) {
        User user = getStudent(session);
        if (user == null) return notLoggedIn();

        if (r.courseCode() == null || r.courseCode().isBlank() || r.title() == null || r.title().isBlank()) {
            return bad("Course and submission title are required");
        }
        if (r.submissionText() == null || r.submissionText().isBlank()) {
            return bad("Please include submission content, notes or answers");
        }

        try {
            Student student = studentDao.getStudentByUserId(user.getUserId());
            if (student == null) return bad("Student profile not found");
            int rollNo = Integer.parseInt(student.getRollNo());

            // Security check: Must be enrolled in this course
            var isEnrolled = Rows.query("SELECT 1 FROM ENROLLMENT WHERE roll_no = ? AND course_code = ?",
                    rollNo, r.courseCode().trim().toUpperCase());
            if (isEnrolled.isEmpty()) {
                return ResponseEntity.status(403).body(Map.of("error", "You can only submit work for courses you are enrolled in"));
            }

            int subId = nextId("student_submission", "submission_id");
            Rows.update(
                "INSERT INTO student_submission (submission_id, material_id, course_code, roll_no, title, submission_text, file_url, submitted_at, status) "
              + "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'Submitted')",
                subId, r.materialId(), r.courseCode().trim().toUpperCase(), rollNo, r.title().trim(),
                r.submissionText().trim(), r.fileUrl() == null ? null : r.fileUrl().trim());

            return ResponseEntity.ok(Map.of("status", "saved", "submissionId", subId));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- list my submissions + teacher reviews/feedback ----------
    @GetMapping("/submissions")
    public ResponseEntity<?> mySubmissions(HttpSession session) {
        User user = getStudent(session);
        if (user == null) return notLoggedIn();

        try {
            Student student = studentDao.getStudentByUserId(user.getUserId());
            if (student == null) return bad("Student profile not found");
            int rollNo = Integer.parseInt(student.getRollNo());

            var list = Rows.query(
                "SELECT ss.submission_id, ss.material_id, ss.course_code, c.course_name, ss.title, "
              + "ss.submission_text, ss.file_url, ss.submitted_at, ss.status, ss.feedback, sm.title AS material_title "
              + "FROM student_submission ss "
              + "JOIN course c ON ss.course_code = c.course_code "
              + "LEFT JOIN study_material sm ON ss.material_id = sm.material_id "
              + "WHERE ss.roll_no = ? ORDER BY ss.submission_id DESC", rollNo);

            return ResponseEntity.ok(list);
        } catch (SQLException e) {
            return dbError(e);
        }
    }
}
