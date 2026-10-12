package com.ricordi;

import com.ricordi.service.PhotoStorageService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class PhotoStorageServiceTest {

    @TempDir
    Path tempDir;

    private PhotoStorageService photoStorageService;

    @BeforeEach
    void setUp() {
        photoStorageService = new PhotoStorageService(tempDir.toString());
    }

    @Test
    @DisplayName("Should successfully store valid JPEG image")
    void testStoreValidJpegImage() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "vacation.jpg",
                "image/jpeg",
                "dummy image content".getBytes()
        );

        String filename = photoStorageService.store(file);
        assertNotNull(filename);
        assertTrue(filename.endsWith(".jpg"));

        File targetFile = tempDir.resolve(filename).toFile();
        assertTrue(targetFile.exists());
        assertTrue(targetFile.length() > 0);
    }

    @Test
    @DisplayName("Should successfully store valid PNG image")
    void testStoreValidPngImage() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sunset.png",
                "image/png",
                "png bytes content".getBytes()
        );

        String filename = photoStorageService.store(file);
        assertNotNull(filename);
        assertTrue(filename.endsWith(".png"));

        File targetFile = tempDir.resolve(filename).toFile();
        assertTrue(targetFile.exists());
    }

    @Test
    @DisplayName("Should reject empty image file")
    void testRejectEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> photoStorageService.store(emptyFile)
        );
        assertTrue(ex.getMessage().contains("must not be empty"));
    }

    @Test
    @DisplayName("Should reject unsupported file extensions like .txt or .pdf")
    void testRejectInvalidExtension() {
        MockMultipartFile txtFile = new MockMultipartFile(
                "file",
                "document.txt",
                "text/plain",
                "some text".getBytes()
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> photoStorageService.store(txtFile)
        );
        assertTrue(ex.getMessage().contains("Unsupported image format") || ex.getMessage().contains("Only JPEG, JPG, PNG, and WebP"));
    }

    @Test
    @DisplayName("Should reject files exceeding 10MB size limit")
    void testRejectLargeFile() {
        byte[] oversizedData = new byte[10 * 1024 * 1024 + 1]; // 10MB + 1 byte
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "huge.jpg",
                "image/jpeg",
                oversizedData
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> photoStorageService.store(largeFile)
        );
        assertTrue(ex.getMessage().contains("exceeds the maximum limit of 10MB"));
    }

    @Test
    @DisplayName("Should delete stored file successfully")
    void testDeleteFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "to_delete.webp",
                "image/webp",
                "temp data".getBytes()
        );

        String filename = photoStorageService.store(file);
        assertTrue(tempDir.resolve(filename).toFile().exists());

        boolean deleted = photoStorageService.delete("/uploads/" + filename);
        assertTrue(deleted);
        assertFalse(tempDir.resolve(filename).toFile().exists());
    }
}
