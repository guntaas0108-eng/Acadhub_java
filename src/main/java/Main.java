import dao.UserDAO;
import model.User;
import ui.AdminMenu;
import ui.FacultyMenu;
import ui.StudentMenu;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        UserDAO userDao = new UserDAO();

        while (true) {
            System.out.println("\n===== AcadHub Login =====");
            System.out.print("Username (or 'exit'): ");
            String username = sc.nextLine().trim();
            if (username.equalsIgnoreCase("exit")) break;

            System.out.print("Password: ");
            String password = sc.nextLine().trim();

            try {
                User user = userDao.login(username, password);

                if (user == null) {
                    System.out.println("Invalid username or password.");
                    continue;
                }

                System.out.println("\nLogin successful!");
                System.out.println("Welcome, " + user.getName());
                System.out.println("Role: " + user.getRole());

                String role = user.getRole() == null ? "" : user.getRole();
                switch (role) {
                    case "Admin"   -> new AdminMenu().show(user, sc);
                    case "Faculty" -> new FacultyMenu().show(user, sc);
                    case "Student" -> new StudentMenu().show(user, sc);
                    default        -> System.out.println("Unknown role.");
                }
            } catch (Exception e) {
                System.out.println("Error: " + e.getMessage());
            }
        }

        System.out.println("Goodbye!");
        sc.close();
    }
}