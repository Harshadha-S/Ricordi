package com.ricordi;

import com.ricordi.model.MemoryPhoto;
import com.ricordi.service.MemoryService;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class MemoryServiceTest {

    @Autowired
    private MemoryService memoryService;

    private MockMultipartFile createMockPhoto(String filename) {
        return new MockMultipartFile(
                "file",
                filename,
                "image/jpeg",
                ("dummy content for " + filename).getBytes()
        );
    }

    @Test
    @DisplayName("Should successfully upload photo for valid 2027 date")
    void testUploadPhotoForValidDate() throws IOException {
        LocalDate date = LocalDate.of(2027, 5, 15);
        MockMultipartFile file = createMockPhoto("spring_flower.jpg");

        MemoryPhoto saved = memoryService.uploadPhotoForDate(date, file, "Spring flowers blooming", null);

        assertNotNull(saved.getId());
        assertEquals(date, saved.getMemoryDate());
        assertEquals("Spring flowers blooming", saved.getCaption());
        assertEquals("spring_flower.jpg", saved.getOriginalFileName());
        assertTrue(saved.getStoragePath().startsWith("/uploads/"));
    }

    @Test
    @DisplayName("Should enforce 3 photos per date maximum limit")
    void testEnforceMaxThreePhotosPerDate() throws IOException {
        LocalDate date = LocalDate.of(2027, 6, 20);

        memoryService.uploadPhotoForDate(date, createMockPhoto("photo1.jpg"), "Photo 1", null);
        memoryService.uploadPhotoForDate(date, createMockPhoto("photo2.jpg"), "Photo 2", null);
        memoryService.uploadPhotoForDate(date, createMockPhoto("photo3.jpg"), "Photo 3", null);

        List<MemoryPhoto> photos = memoryService.getPhotosForDate(date);
        assertEquals(3, photos.size());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> memoryService.uploadPhotoForDate(date, createMockPhoto("photo4.jpg"), "Photo 4", null)
        );
        assertTrue(ex.getMessage().contains("Maximum 3 photos allowed per date"));
    }

    @Test
    @DisplayName("Should reject photo upload for date outside 2027 album year")
    void testRejectPhotoOutside2027() {
        LocalDate outsideDate = LocalDate.of(2026, 12, 31);
        MockMultipartFile file = createMockPhoto("old_photo.jpg");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> memoryService.uploadPhotoForDate(outsideDate, file, "Old photo", null)
        );
        assertTrue(ex.getMessage().contains("outside album year 2027"));
    }

    @Test
    @DisplayName("Should update photo caption successfully")
    void testUpdateCaption() throws IOException {
        LocalDate date = LocalDate.of(2027, 7, 4);
        MemoryPhoto photo = memoryService.uploadPhotoForDate(date, createMockPhoto("fireworks.png"), "Initial caption", null);

        MemoryPhoto updated = memoryService.updateCaption(photo.getId(), "Updated holiday caption");
        assertEquals("Updated holiday caption", updated.getCaption());
    }

    @Test
    @DisplayName("Should delete photo and remove metadata from repository")
    void testDeletePhoto() throws IOException {
        LocalDate date = LocalDate.of(2027, 8, 10);
        MemoryPhoto photo = memoryService.uploadPhotoForDate(date, createMockPhoto("beach.jpg"), "Beach day", null);

        Long id = photo.getId();
        memoryService.deletePhoto(id);

        List<MemoryPhoto> remaining = memoryService.getPhotosForDate(date);
        assertTrue(remaining.stream().noneMatch(p -> p.getId().equals(id)));
    }

    @Test
    @DisplayName("Should reorder photos and persist display order")
    void testReorderPhotos() throws IOException {
        LocalDate date = LocalDate.of(2027, 9, 15);
        MemoryPhoto p1 = memoryService.uploadPhotoForDate(date, createMockPhoto("p1.jpg"), "Cap 1", null);
        MemoryPhoto p2 = memoryService.uploadPhotoForDate(date, createMockPhoto("p2.jpg"), "Cap 2", null);

        memoryService.reorderPhotos(date, List.of(p2.getId(), p1.getId()));

        List<MemoryPhoto> reordered = memoryService.getPhotosForDate(date);
        assertEquals(2, reordered.size());
        assertEquals(p2.getId(), reordered.get(0).getId());
        assertEquals(p1.getId(), reordered.get(1).getId());
    }
}
