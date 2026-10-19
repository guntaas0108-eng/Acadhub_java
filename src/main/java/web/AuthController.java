package web;

import dao.UserDAO;
import jakarta.servlet.http.HttpSession;
import model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserDAO userDao = new UserDAO();

    public record LoginRequest(String username, String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpSession session) {
        try {
            User user = userDao.login(req.username().trim(), req.password().trim());
            if (user == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Invalid username or password"));
            }
            session.setAttribute("user", user);
            return ResponseEntity.ok(Map.of("name", user.getName(), "role", user.getRole()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not logged in"));
        return ResponseEntity.ok(Map.of("name", user.getName(), "role", user.getRole()));
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        return Map.of("status", "logged out");
    }
}