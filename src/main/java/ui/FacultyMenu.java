package ui;

import dao.FacultyDAO;
import model.User;

import java.util.Scanner;

public class FacultyMenu {

    public void show(User user, Scanner sc) {
        FacultyDAO facultyDao = new FacultyDAO();

        while (true) {
            System.out.println("\n--- Faculty Menu ---");
            System.out.println("1. My Profile");
            System.out.println("2. My Courses");
            System.out.println("3. Enter / Update Marks");
            System.out.println("0. Logout");
            System.out.print("Choice: ");

            String choice = sc.nextLine().trim();

            try {
                switch (choice) {
                    case "1" -> facultyDao.printProfile(user.getUserId());
                    case "2" -> facultyDao.printCourses(user.getUserId());
                    case "3" -> {
                        System.out.print("Student roll no: ");
                        String rollNo = sc.nextLine().trim();

                        System.out.print("Course code (e.g. UCS310): ");
                        String courseCode = sc.nextLine().trim().toUpperCase();

                        System.out.print("Marks (0-100): ");
                        double marks = Double.parseDouble(sc.nextLine().trim());

                        if (facultyDao.saveMarks(user.getUserId(), rollNo, courseCode, marks)) {
                            System.out.println("Marks saved.");
                        }
                    }
                    case "0" -> { return; }
                    default -> System.out.println("Invalid choice.");
                }
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid number for marks.");
            } catch (Exception e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
    }
}