package dao;

import db.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ReportDAO {

    // ---------- Data holders (used by the website) ----------
    public record MarkRow(String courseName, String assessmentType,
                          int marksObtained, int totalMarks, double percentage) {}

    public record AttendanceRow(String courseCode, int totalClasses,
                                int presentCount, double attendancePct) {}

    // ---------- Website methods: return data ----------
    public List<MarkRow> getMarks(int rollNo) throws SQLException {

        String sql = "SELECT course_name, assessment_type, marks_obtained, total_marks, percentage "
                   + "FROM student_performance_report WHERE roll_no = ?";

        List<MarkRow> list = new ArrayList<>();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, rollNo);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new MarkRow(
                        rs.getString("course_name"),
                        rs.getString("assessment_type"),
                        rs.getInt("marks_obtained"),
                        rs.getInt("total_marks"),
                        rs.getDouble("percentage")));
                }
            }
        }
        return list;
    }

    public List<AttendanceRow> getAttendance(int rollNo) throws SQLException {

        String sql = "SELECT course_code, total_classes, present_count, attendance_pct "
                   + "FROM attendance_summary WHERE roll_no = ?";

        List<AttendanceRow> list = new ArrayList<>();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, rollNo);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new AttendanceRow(
                        rs.getString("course_code"),
                        rs.getInt("total_classes"),
                        rs.getInt("present_count"),
                        rs.getDouble("attendance_pct")));
                }
            }
        }
        return list;
    }

    // ---------- Console methods (old menus still use these) ----------
    public void printMarks(int rollNo) throws SQLException {
        List<MarkRow> rows = getMarks(rollNo);
        if (rows.isEmpty()) {
            System.out.println("No marks available yet.");
            return;
        }
        for (MarkRow r : rows) {
            System.out.println(r.courseName() + " | " + r.assessmentType() + " | "
                + r.marksObtained() + "/" + r.totalMarks() + " (" + r.percentage() + "%)");
        }
    }

    public void printAttendance(int rollNo) throws SQLException {
        List<AttendanceRow> rows = getAttendance(rollNo);
        if (rows.isEmpty()) {
            System.out.println("No attendance records yet.");
            return;
        }
        for (AttendanceRow r : rows) {
            System.out.println(r.courseCode() + " | Present " + r.presentCount() + "/"
                + r.totalClasses() + " (" + r.attendancePct() + "%)");
        }
    }
}