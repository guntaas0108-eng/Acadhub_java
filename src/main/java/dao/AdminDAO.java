package dao;

import db.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AdminDAO {

    // Prints total counts (users, students, faculty, courses)
    public void printSummary() throws SQLException {

        String sql = "SELECT "
                   + "(SELECT COUNT(*) FROM USERS)   AS total_users, "
                   + "(SELECT COUNT(*) FROM STUDENT) AS total_students, "
                   + "(SELECT COUNT(*) FROM FACULTY) AS total_faculty, "
                   + "(SELECT COUNT(*) FROM COURSE)  AS total_courses";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            if (rs.next()) {
                System.out.println("Total Users:    " + rs.getInt("total_users"));
                System.out.println("Total Students: " + rs.getInt("total_students"));
                System.out.println("Total Faculty:  " + rs.getInt("total_faculty"));
                System.out.println("Total Courses:  " + rs.getInt("total_courses"));
            }
        }
    }

    // Prints all users (password is NOT shown)
    public void printAllUsers() throws SQLException {

        String sql = "SELECT user_id, name, username, role, phone "
                   + "FROM USERS ORDER BY user_id";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            boolean found = false;

            while (rs.next()) {
                found = true;
                System.out.println(
                    rs.getInt("user_id") + " | "
                    + rs.getString("name") + " | "
                    + rs.getString("username") + " | "
                    + rs.getString("role") + " | "
                    + rs.getString("phone")
                );
            }

            if (!found) {
                System.out.println("No users found.");
            }
        }
    }

    // Prints students who are 'At Risk' (low marks or low attendance)
    public void printAtRiskStudents() throws SQLException {

        String sql = "SELECT roll_no, name, course_code, attendance_pct, avg_marks "
                   + "FROM at_risk_students WHERE risk_status = 'At Risk' "
                   + "ORDER BY roll_no";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            boolean found = false;

            while (rs.next()) {
                found = true;
                System.out.println(
                    rs.getInt("roll_no") + " | "
                    + rs.getString("name") + " | "
                    + rs.getString("course_code")
                    + " | Attendance: " + rs.getDouble("attendance_pct") + "%"
                    + " | Avg marks: " + rs.getDouble("avg_marks")
                );
            }

            if (!found) {
                System.out.println("No at-risk students.");
            }
        }
    }
}