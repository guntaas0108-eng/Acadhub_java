package db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    // Optional environment variable overrides for custom setups
    private static final String ENV_URL = System.getenv("DB_URL");
    private static final String ENV_USER = System.getenv("DB_USER");
    private static final String ENV_PASS = System.getenv("DB_PASSWORD");

    // Cached successful connection parameters for zero-overhead subsequent queries
    private static volatile String activeUrl = null;
    private static volatile String activeUser = null;
    private static volatile String activePass = null;

    public static Connection getConnection() throws SQLException {
        // 1. Direct environment variable override if provided
        if (ENV_URL != null && !ENV_URL.isBlank()) {
            return DriverManager.getConnection(
                ENV_URL,
                ENV_USER != null ? ENV_USER : "root",
                ENV_PASS != null ? ENV_PASS : ""
            );
        }

        // 2. Use cached working configuration if already established
        if (activeUrl != null) {
            try {
                return DriverManager.getConnection(activeUrl, activeUser, activePass);
            } catch (SQLException e) {
                // If the cached configuration stopped working, reset and re-detect
                activeUrl = null;
            }
        }

        // 3. Multi-Port & Multi-Password Auto-Detection Strategy
        // Supports port 3307 (custom setup) and standard port 3306 (default MySQL installation)
        String[] candidateUrls = {
            "jdbc:mysql://localhost:3307/acadhub_java?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
            "jdbc:mysql://localhost:3306/acadhub_java?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
            "jdbc:mysql://127.0.0.1:3307/acadhub_java?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
            "jdbc:mysql://127.0.0.1:3306/acadhub_java?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC"
        };

        String[] candidatePasswords = {
            ENV_PASS != null ? ENV_PASS : "padlopadlo",
            "padlopadlo",
            "root",
            "admin",
            ""
        };

        SQLException lastException = null;

        for (String url : candidateUrls) {
            for (String pass : candidatePasswords) {
                try {
                    Connection conn = DriverManager.getConnection(url, "root", pass);
                    // Cache the successful parameters
                    activeUrl = url;
                    activeUser = "root";
                    activePass = pass;
                    return conn;
                } catch (SQLException ex) {
                    lastException = ex;
                }
            }
        }

        throw new SQLException("Could not connect to MySQL database 'acadhub_java'. "
                + "Please ensure MySQL is running (on port 3306 or 3307) and the database 'acadhub_java' is imported.", lastException);
    }
}
