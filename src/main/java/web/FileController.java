package web;

import db.Rows;
import jakarta.servlet.http.HttpSession;
import model.User;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService storageService;

    public FileController(FileStorageService storageService) {
        this.storageService = storageService;
    }

    private User getUser(HttpSession session) {
        Object o = session.getAttribute("user");
        return (o instanceof User u) ? u : null;
    }

    // ---------- Download / View Study Material File ----------
    @GetMapping("/material/{materialId}")
    public ResponseEntity<?> downloadMaterial(@PathVariable int materialId, HttpSession session) {
        User user = getUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Login required to access course files"));
        }

        try {
            var rows = Rows.query(
                "SELECT material_id, course_code, title, file_name, file_path "
              + "FROM study_material WHERE material_id = ?", materialId);
            if (rows.isEmpty()) return ResponseEntity.notFound().build();

            var mat = rows.get(0);
            String course = (String) mat.get("course_code");
            String storedPath = (String) mat.get("file_path");
            String originalName = (String) mat.get("file_name");

            if (storedPath == null || storedPath.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No physical file attached to this material"));
            }

            // Security: If student, verify enrollment in this course
            if ("Student".equals(user.getRole())) {
                var isEnrolled = Rows.query(
                    "SELECT 1 FROM ENROLLMENT e JOIN STUDENT s ON e.roll_no = s.roll_no "
                  + "WHERE s.user_id = ? AND e.course_code = ?", user.getUserId(), course);
                if (isEnrolled.isEmpty()) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied: You are not enrolled in " + course));
                }
            }

            return serveFile(storedPath, originalName);

        } catch (SQLException | MalformedURLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }

    // ---------- Download / View Student Submission File ----------
    @GetMapping("/submission/{submissionId}")
    public ResponseEntity<?> downloadSubmission(@PathVariable int submissionId, HttpSession session) {
        User user = getUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Login required"));
        }

        try {
            var rows = Rows.query(
                "SELECT ss.submission_id, ss.course_code, ss.roll_no, ss.file_name, ss.file_url, s.user_id "
              + "FROM student_submission ss "
              + "JOIN student s ON ss.roll_no = s.roll_no "
              + "WHERE ss.submission_id = ?", submissionId);
            if (rows.isEmpty()) return ResponseEntity.notFound().build();

            var sub = rows.get(0);
            String course = (String) sub.get("course_code");
            String fileUrl = (String) sub.get("file_url");
            String originalName = (String) sub.get("file_name");
            int studentUserId = ((Number) sub.get("user_id")).intValue();

            // Permissions:
            // 1. The student who uploaded it
            // 2. The faculty member teaching this course
            // 3. Admin
            boolean allowed = false;
            if ("Admin".equals(user.getRole())) {
                allowed = true;
            } else if ("Student".equals(user.getRole()) && user.getUserId() == studentUserId) {
                allowed = true;
            } else if ("Faculty".equals(user.getRole())) {
                var teaches = Rows.query(
                    "SELECT 1 FROM FACULTY f JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
                  + "WHERE f.user_id = ? AND fc.course_code = ?", user.getUserId(), course);
                allowed = !teaches.isEmpty();
            }

            if (!allowed) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied to this student submission"));
            }

            if (fileUrl == null || fileUrl.isBlank() || fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                // If it was an external link, redirect or return error
                return ResponseEntity.badRequest().body(Map.of("error", "This submission is hosted externally at: " + fileUrl));
            }

            return serveFile(fileUrl, originalName);

        } catch (SQLException | MalformedURLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }

    private ResponseEntity<Resource> serveFile(String relativePath, String originalName) throws MalformedURLException {
        Path filePath = storageService.loadFile(relativePath);
        if (filePath == null) return ResponseEntity.notFound().build();

        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = null;
        try {
            contentType = Files.probeContentType(filePath);
        } catch (Exception ignored) {}
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

        String safeFileName = (originalName != null && !originalName.isBlank())
                ? originalName : filePath.getFileName().toString();
        String encodedName = URLEncoder.encode(safeFileName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFileName + "\"; filename*=UTF-8''" + encodedName)
                .body(resource);
    }
}
