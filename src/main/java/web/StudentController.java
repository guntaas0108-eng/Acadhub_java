package web;

import dao.ReportDAO;
import dao.StudentDAO;
import jakarta.servlet.http.HttpSession;
import model.Student;
import model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentDAO studentDao = new StudentDAO();
    private final ReportDAO reportDao = new ReportDAO();

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {

        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not logged in"));
        }
        if (!"Student".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Students only"));
        }

        try {
            Student student = studentDao.getStudentByUserId(user.getUserId());
            if (student == null) {
                return ResponseEntity.status(404).body(Map.of("error", "No student record found"));
            }

            int rollNo = student.getStudentId(); // this holds the roll number

            return ResponseEntity.ok(Map.of(
                "details", Map.of(
                    "name", user.getName(),
                    "rollNo", student.getRollNo(),
                    "department", student.getDepartment(),
                    "semester", student.getSemester()),
                "marks", reportDao.getMarks(rollNo),
                "attendance", reportDao.getAttendance(rollNo)
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }
}