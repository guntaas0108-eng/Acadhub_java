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
        initDirectories();
    }

    private synchronized void initDirectories() {
        try {
            Files.createDirectories(rootLocation);
            Files.createDirectories(materialsLocation);
            Files.createDirectories(submissionsLocation);
        } catch (IOException e) {
            System.err.println("Warning: Could not initialize upload directories: " + e.getMessage());
        }
    }

    public SavedFile saveMaterialFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        initDirectories();
        return store(file, materialsLocation, "mat_");
    }

    public SavedFile saveSubmissionFile(int rollNo, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        initDirectories();
        return store(file, submissionsLocation, "sub_" + rollNo + "_");
    }

    private SavedFile store(MultipartFile file, Path targetDir, String prefix) throws IOException {
        Files.createDirectories(targetDir);

        String rawOriginalName = file.getOriginalFilename();
        String originalFilename = (rawOriginalName != null && !rawOriginalName.isBlank())
                ? Paths.get(rawOriginalName).getFileName().toString()
                : "document_" + System.currentTimeMillis();

        // Sanitize filename to avoid filesystem bugs or encoding conflicts
        String cleanName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (cleanName.isBlank() || cleanName.equals(".")) {
            cleanName = "uploaded_file.bin";
        }

        String uniqueName = prefix + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + cleanName;
        Path destinationFile = targetDir.resolve(uniqueName).normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(targetDir.toAbsolutePath())) {
            throw new SecurityException("Cannot store file outside target directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }

        // Relative path normalized with forward slashes for cross-platform DB compatibility
        String relativePath = rootLocation.relativize(destinationFile).toString().replace('\\', '/');
        String formattedSize = formatSize(file.getSize());

        return new SavedFile(originalFilename, relativePath, formattedSize);
    }

    public Path loadFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return null;

        // 1. Direct path check from root uploads folder
        Path resolved = rootLocation.resolve(relativePath).normalize().toAbsolutePath();
        if (resolved.startsWith(rootLocation) && Files.exists(resolved) && Files.isRegularFile(resolved)) {
            return resolved;
        }

        // 2. Check inside materials folder if path was stored without 'materials/' prefix
        Path inMat = materialsLocation.resolve(relativePath).normalize().toAbsolutePath();
        if (inMat.startsWith(materialsLocation) && Files.exists(inMat) && Files.isRegularFile(inMat)) {
            return inMat;
        }

        // 3. Check inside submissions folder if path was stored without 'submissions/' prefix
        Path inSub = submissionsLocation.resolve(relativePath).normalize().toAbsolutePath();
        if (inSub.startsWith(submissionsLocation) && Files.exists(inSub) && Files.isRegularFile(inSub)) {
            return inSub;
        }

        return null;
    }

    public static String formatSize(long size) {
        if (size <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB" };
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        if (digitGroups >= units.length) digitGroups = units.length - 1;
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }
}
