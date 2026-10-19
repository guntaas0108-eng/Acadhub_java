package ui;

import dao.ReportDAO;
import dao.StudentDAO;
import model.Student;
import model.User;

import java.util.Scanner;

public class StudentMenu {
    public void show(User user, Scanner sc) throws Exception {
        Student student = new StudentDAO().getStudentByUserId(user.getUserId());
        if (student == null) {
            System.out.println("No student record found for this user.");
            return;
        }

        ReportDAO reportDao = new ReportDAO();
        int studentId = student.getStudentId();

        while (true) {
            System.out.println("\n--- Student Menu ---");
            System.out.println("1. My Details");
            System.out.println("2. My Marks");
            System.out.println("3. My Attendance");
            System.out.println("0. Logout");
            System.out.print("Choice: ");
            String choice = sc.nextLine().trim();

            switch (choice) {
                case "1" -> {
                    System.out.println("Roll No: " + student.getRollNo());
                    System.out.println("Department: " + student.getDepartment());
                    System.out.println("Semester: " + student.getSemester());
                }
                case "2" -> reportDao.printMarks(studentId);
                case "3" -> reportDao.printAttendance(studentId);
                case "0" -> { return; }
                default -> System.out.println("Invalid choice.");
            }
        }
    }
}