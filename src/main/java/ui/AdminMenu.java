package ui;

import dao.AdminDAO;
import model.User;
import java.util.Scanner;

public class AdminMenu {
    public void show(User user, Scanner sc) throws Exception {
        AdminDAO adminDao = new AdminDAO();
        while (true) {
            System.out.println("\n--- Admin Menu ---");
            System.out.println("1. Summary");
            System.out.println("2. All Users");
            System.out.println("3. At-Risk Students");
            System.out.println("0. Logout");
            System.out.print("Choice: ");

            switch (sc.nextLine().trim()) {
                case "1" -> adminDao.printSummary();
                case "2" -> adminDao.printAllUsers();
                case "3" -> adminDao.printAtRiskStudents();
                case "0" -> { return; }
                default -> System.out.println("Invalid choice.");
            }
        }
    }
}