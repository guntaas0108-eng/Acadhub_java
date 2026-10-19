package dao;

import db.DBConnection;
import model.Student;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class StudentDAO {

    // Find student by ROLL NUMBER
    public Student getStudentById(int rollNo) throws SQLException {

        String sql = "SELECT * FROM STUDENT WHERE roll_no = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, rollNo);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Student(
                        rs.getInt("roll_no"),
                        rs.getString("roll_no"),
                        rs.getString("department"),
                        rs.getInt("semester"),
                        rs.getInt("user_id")
                    );
                }
            }
        }

        return null;
    }

    // Find student by USER ID (used after login)
    public Student getStudentByUserId(int userId) throws SQLException {

        String sql = "SELECT * FROM STUDENT WHERE user_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Student(
                        rs.getInt("roll_no"),
                        rs.getString("roll_no"),
                        rs.getString("department"),
                        rs.getInt("semester"),
                        rs.getInt("user_id")
                    );
                }
            }
        }

        return null;
    }
}