package dao;

import db.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class FacultyDAO {

    // Prints faculty profile (designation + department)
    public void printProfile(int userId) throws SQLException {

        String sql = "SELECT faculty_id, designation, department "
                   + "FROM FACULTY WHERE user_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    System.out.println("Faculty ID: " + rs.getInt("faculty_id"));
                    System.out.println("Designation: " + rs.getString("designation"));
                    System.out.println("Department: " + rs.getString("department"));
                } else {
                    System.out.println("No faculty record found for this user.");
                }
            }
        }
    }

    // Prints the courses taught by this faculty with class statistics
    public void printCourses(int userId) throws SQLException {

        String sql = "SELECT c.course_code, c.course_name, "
                   + "       ca.total_students, ca.avg_marks, "
                   + "       ca.highest_marks, ca.lowest_marks, ca.fail_count "
                   + "FROM FACULTY f "
                   + "JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
                   + "JOIN COURSE c ON fc.course_code = c.course_code "
                   + "LEFT JOIN course_analytics ca ON c.course_code = ca.course_code "
                   + "WHERE f.user_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                boolean found = false;

                while (rs.next()) {
                    found = true;
                    System.out.println(
                        rs.getString("course_code") + " | "
                        + rs.getString("course_name"));
                    System.out.println(
                        "   Students: " + rs.getInt("total_students")
                        + " | Avg marks: " + rs.getDouble("avg_marks")
                        + " | Highest: " + rs.getInt("highest_marks")
                        + " | Lowest: " + rs.getInt("lowest_marks")
                        + " | Fails: " + rs.getInt("fail_count"));
                }

                if (!found) {
                    System.out.println("No courses assigned yet.");
                }
            }
        }
    }

    // Returns true if the logged-in faculty member teaches the given course
    private boolean teachesCourse(Connection con, int userId, String courseCode)
            throws SQLException {

        String sql = "SELECT 1 FROM FACULTY f "
                   + "JOIN FACULTY_COURSE fc ON f.faculty_id = fc.faculty_id "
                   + "WHERE f.user_id = ? AND fc.course_code = ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, courseCode);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    // Finds the internal student_id for a roll number, or -1 if not found
    // ASSUMES: STUDENT(student_id, roll_no)
    private int findStudentIdByRollNo(Connection con, String rollNo) throws SQLException {

        String sql = "SELECT student_id FROM STUDENT WHERE roll_no = ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, rollNo);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt("student_id") : -1;
            }
        }
    }

    // Saves or updates marks for a student in a course this faculty teaches
    // ASSUMES: MARKS(student_id, course_code, marks) with UNIQUE (student_id, course_code)
    public boolean saveMarks(int userId, String rollNo, String courseCode, double marks)
            throws SQLException {

        if (marks < 0 || marks > 100) {
            System.out.println("Marks must be between 0 and 100.");
            return false;
        }

        try (Connection con = DBConnection.getConnection()) {

            if (!teachesCourse(con, userId, courseCode)) {
                System.out.println("You are not assigned to course " + courseCode + ".");
                return false;
            }

            int studentId = findStudentIdByRollNo(con, rollNo);
            if (studentId == -1) {
                System.out.println("No student found with roll number " + rollNo + ".");
                return false;
            }

            String sql = "INSERT INTO MARKS (student_id, course_code, marks) VALUES (?, ?, ?) "
                       + "ON DUPLICATE KEY UPDATE marks = VALUES(marks)";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, studentId);
                ps.setString(2, courseCode);
                ps.setDouble(3, marks);
                return ps.executeUpdate() > 0;
            }
        }
    }
}