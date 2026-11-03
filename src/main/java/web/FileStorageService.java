package web;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.text.DecimalFormat;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootLocation = Paths.get("uploads").toAbsolutePath().normalize();
    private final Path materialsLocation = rootLocation.resolve("materials");
    private final Path submissionsLocation = rootLocation.resolve("submissions");

    public record SavedFile(String originalName, String storagePath, String formattedSize) {}

    public FileStorageService() {
        try {
            Files.createDirectories(materialsLocation);
            Files.createDirectories(submissionsLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    public SavedFile saveMaterialFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        return store(file, materialsLocation, "mat_");
    }

    public SavedFile saveSubmissionFile(int rollNo, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        return store(file, submissionsLocation, "sub_" + rollNo + "_");
    }

    private SavedFile store(MultipartFile file, Path targetDir, String prefix) throws IOException {
        String originalFilename = Paths.get(file.getOriginalFilename()).getFileName().toString();
        // sanitize
        String cleanName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String uniqueName = prefix + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + cleanName;

        Path destinationFile = targetDir.resolve(uniqueName).normalize().toAbsolutePath();
        if (!destinationFile.getParent().equals(targetDir.toAbsolutePath())) {
            throw new SecurityException("Cannot store file outside target directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }

        // Relative path from uploads root
        String relativePath = rootLocation.relativize(destinationFile).toString().replace('\\', '/');
        String formattedSize = formatSize(file.getSize());

        return new SavedFile(originalFilename, relativePath, formattedSize);
    }

    public Path loadFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return null;
        Path resolved = rootLocation.resolve(relativePath).normalize().toAbsolutePath();
        if (!resolved.startsWith(rootLocation)) {
            throw new SecurityException("Access denied: invalid file path");
        }
        return Files.exists(resolved) ? resolved : null;
    }

    public static String formatSize(long size) {
        if (size <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB" };
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }
}
