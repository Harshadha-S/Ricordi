package com.ricordi.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PhotoStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final Path uploadDirectory;

    public PhotoStorageService(@Value("${ricordi.upload-dir:uploads}") String uploadDirectory) {
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Photo file must not be empty.");
        }

        if (photo.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Photo size exceeds the maximum limit of 10MB.");
        }

        String contentType = photo.getContentType();
        if (contentType != null && !contentType.isEmpty()) {
            String cleanType = contentType.toLowerCase().trim();
            if (!ALLOWED_CONTENT_TYPES.contains(cleanType) && !cleanType.startsWith("image/")) {
                throw new IllegalArgumentException("Unsupported image format: " + contentType);
            }
        }

        String originalFilename = StringUtils.cleanPath(
                photo.getOriginalFilename() == null ? "" : photo.getOriginalFilename());
        String extension = StringUtils.getFilenameExtension(originalFilename);
        
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Only JPEG, JPG, PNG, and WebP image files are allowed.");
        }

        String storedFilename = UUID.randomUUID().toString() + "." + extension.toLowerCase();

        Files.createDirectories(uploadDirectory);
        Path destination = uploadDirectory.resolve(storedFilename).normalize();
        if (!destination.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Invalid photo path.");
        }

        Files.copy(photo.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        return storedFilename;
    }

    public boolean delete(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return false;
        }
        try {
            String cleanName = StringUtils.cleanPath(filename.trim());
            // If filename starts with "/uploads/", strip prefix
            if (cleanName.startsWith("/uploads/")) {
                cleanName = cleanName.substring("/uploads/".length());
            } else if (cleanName.startsWith("uploads/")) {
                cleanName = cleanName.substring("uploads/".length());
            }

            Path path = uploadDirectory.resolve(cleanName).normalize();
            if (path.startsWith(uploadDirectory)) {
                return Files.deleteIfExists(path);
            }
        } catch (IOException e) {
            System.err.println("Could not delete file: " + filename + " - " + e.getMessage());
        }
        return false;
    }
}
