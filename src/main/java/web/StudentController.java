package web;

import dao.ReportDAO;
import dao.StudentDAO;
import db.Rows;
import jakarta.servlet.http.HttpSession;
import model.Student;
import model.User;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.sql.SQLException;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentDAO studentDao = new StudentDAO();
    private final ReportDAO reportDao = new ReportDAO();
    private final FileStorageService storageService;

    public StudentController(FileStorageService storageService) {
        this.storageService = storageService;
    }

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

    private static boolean blank(String s) { return s == null || s.trim().isEmpty(); }

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

            var enrolledCourses = Rows.query(
                "SELECT c.course_code, c.course_name, c.credits, c.semester, "
              + "COALESCE(u.name, 'Assigned Professor') AS faculty_name "
              + "FROM ENROLLMENT e "
              + "JOIN COURSE c ON e.course_code = c.course_code "
              + "LEFT JOIN FACULTY_COURSE fc ON c.course_code = fc.course_code "
              + "LEFT JOIN FACULTY f ON fc.faculty_id = f.faculty_id "
              + "LEFT JOIN USERS u ON f.user_id = u.user_id "
              + "WHERE e.roll_no = ? ORDER BY c.course_code", rollNo);

            var attList = reportDao.getAttendance(rollNo);
            int sumAttended = 0;
            int sumTotal = 0;
            for (var a : attList) {
                sumAttended += a.presentCount();
                sumTotal += a.totalClasses();
            }
            double overallPct = sumTotal > 0 ? Math.round(((double) sumAttended / sumTotal) * 1000.0) / 10.0 : 0.0;

            var announcements = Rows.query(
                "SELECT announcement_id, title, content, author, category, posted_at FROM announcements WHERE is_active = 1 ORDER BY announcement_id DESC LIMIT 6");

            var timetables = Rows.query(
                "SELECT t.timetable_id, t.course_code, t.course_name, t.day_of_week, t.start_time, t.end_time, t.room, t.faculty_name "
              + "FROM timetables t JOIN enrollment e ON t.course_code = e.course_code "
              + "WHERE e.roll_no = ? ORDER BY t.day_of_week, t.start_time", rollNo);

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
                "attendance", attList,
                "overallAttendance", Map.of(
                    "attended", sumAttended,
                    "total", sumTotal,
                    "percentage", overallPct
                ),
                "announcements", announcements,
                "timetables", timetables
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

            String sql = "SELECT sm.material_id, sm.course_code, c.course_name, sm.title, sm.material_type, "
                       + "sm.content, sm.upload_date, sm.file_name, sm.file_path, sm.file_size, sm.due_date, sm.max_marks, u.name AS faculty_name "
                       + "FROM study_material sm "
                       + "JOIN course c ON sm.course_code = c.course_code "
                       + "JOIN faculty f ON sm.faculty_id = f.faculty_id "
                       + "JOIN users u ON f.user_id = u.user_id ";

            if (course != null && !course.isBlank()) {
                var isEnrolled = Rows.query("SELECT 1 FROM ENROLLMENT WHERE roll_no = ? AND course_code = ?", rollNo, course);
                if (isEnrolled.isEmpty()) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied: You are not enrolled in " + course));
                }

                sql += "WHERE sm.course_code = ? ORDER BY sm.material_id DESC";
                return ResponseEntity.ok(Rows.query(sql, course));
            } else {
                sql += "JOIN ENROLLMENT e ON sm.course_code = e.course_code WHERE e.roll_no = ? ORDER BY sm.material_id DESC";
                return ResponseEntity.ok(Rows.query(sql, rollNo));
            }
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- submit assignment / work with file from Laptop / PC ----------
    @PostMapping(value = "/submit-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitWorkWithFile(
            @RequestParam("courseCode") String courseCode,
            @RequestParam("title") String title,
            @RequestParam(value = "submissionText", required = false) String submissionText,
            @RequestParam(value = "materialId", required = false) Integer materialId,
            @RequestParam(value = "fileUrl", required = false) String fileUrl,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpSession session) {
        User user = getStudent(session);
        if (user == null) return notLoggedIn();

        if (blank(courseCode) || blank(title)) {
            return bad("Course and submission title are required");
        }

        try {
            Student student = studentDao.getStudentByUserId(user.getUserId());
            if (student == null) return bad("Student profile not found");
            int rollNo = Integer.parseInt(student.getRollNo());

            // Security check: Must be enrolled in this course
            var isEnrolled = Rows.query("SELECT 1 FROM ENROLLMENT WHERE roll_no = ? AND course_code = ?",
                    rollNo, courseCode.trim().toUpperCase());
            if (isEnrolled.isEmpty()) {
                return ResponseEntity.status(403).body(Map.of("error", "You can only submit work for courses you are enrolled in"));
            }

            String fileName = null;
            String storedPath = blank(fileUrl) ? null : fileUrl.trim();
            String fileSize = null;

            if (file != null && !file.isEmpty()) {
                try {
                    var saved = storageService.saveSubmissionFile(rollNo, file);
                    fileName = saved.originalName();
                    storedPath = saved.storagePath();
                    fileSize = saved.formattedSize();
                } catch (Exception e) {
                    e.printStackTrace();
                    return bad("Failed to save uploaded file: " + e.getMessage());
                }
            }

            Integer safeMaterialId = (materialId != null && materialId > 0) ? materialId : null;
            int subId = nextId("student_submission", "submission_id");
            Rows.update(
                "INSERT INTO student_submission (submission_id, material_id, course_code, roll_no, title, submission_text, file_url, file_name, file_size, submitted_at, status) "
              + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Submitted')",
                subId, safeMaterialId, courseCode.trim().toUpperCase(), rollNo, title.trim(),
                blank(submissionText) ? (fileName != null ? "File attached: " + fileName : "Assignment submission") : submissionText.trim(),
                storedPath, fileName, fileSize);

            // Audit Trail
            try {
                Rows.update("INSERT INTO audit_log (user_id, username, action, details) VALUES (?, ?, ?, ?)",
                    user.getUserId(), user.getUsername(), "SUBMIT_ASSIGNMENT",
                    "Student " + rollNo + " submitted assignment '" + title.trim() + "' for course " + courseCode.trim().toUpperCase());
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                "status", "saved",
                "submissionId", subId,
                "fileName", fileName == null ? "" : fileName,
                "fileSize", fileSize == null ? "" : fileSize
            ));
        } catch (SQLException e) {
            return dbError(e);
        }
    }

    // ---------- submit assignment / work (Legacy JSON fallback) ----------
    @PostMapping("/submit")
    public ResponseEntity<?> submitWork(@RequestBody SubmissionReq r, HttpSession session) {
        return submitWorkWithFile(r.courseCode(), r.title(), r.submissionText(), r.materialId(), r.fileUrl(), null, session);
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
              + "ss.submission_text, ss.file_url, ss.file_name, ss.file_size, ss.submitted_at, ss.status, ss.feedback, "
              + "ss.marks_awarded, sm.title AS material_title, sm.due_date, sm.max_marks "
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
