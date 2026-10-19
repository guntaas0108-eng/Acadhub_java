package model;

public class User {

    private int userId;
    private String name;
    private String username;
    private String role;

    public User(int userId, String name, String username, String role) {
        this.userId = userId;
        this.name = name;
        this.username = username;
        this.role = role;
    }

    public int getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }
}