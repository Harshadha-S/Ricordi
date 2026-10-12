package com.ricordi.controller;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.MemoryPhoto;
import com.ricordi.service.MemoryService;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/photos")
public class MemoryApiController {

    private final MemoryService memoryService;
    private final AlbumConfig albumConfig;

    public MemoryApiController(MemoryService memoryService, AlbumConfig albumConfig) {
        this.memoryService = memoryService;
        this.albumConfig = albumConfig;
    }

    @GetMapping
    public ResponseEntity<?> getPhotosForDate(@RequestParam(name = "date", required = false) String dateStr) {
        LocalDate date;
        if (dateStr == null || dateStr.trim().isEmpty()) {
            date = albumConfig.getAlbumStartDate();
        } else {
            try {
                date = LocalDate.parse(dateStr.trim());
            } catch (DateTimeParseException e) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Invalid date format. Expected yyyy-MM-dd.");
                return ResponseEntity.badRequest().body(err);
            }
        }

        if (!albumConfig.isWithinAlbumYear(date)) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Date " + date + " is outside album year " + albumConfig.getAlbumYear());
            return ResponseEntity.badRequest().body(err);
        }

        List<MemoryPhoto> photos = memoryService.getPhotosForDate(date);
        List<Map<String, Object>> result = new ArrayList<>();

        for (MemoryPhoto p : photos) {
            result.add(mapPhoto(p));
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("date") String dateStr,
            @RequestParam(name = "caption", required = false) String caption) {

        if (dateStr == null || dateStr.trim().isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Date field is required.");
            return ResponseEntity.badRequest().body(err);
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Invalid date format. Expected yyyy-MM-dd.");
            return ResponseEntity.badRequest().body(err);
        }

        if (!albumConfig.isWithinAlbumYear(date)) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Date " + date + " is outside album year " + albumConfig.getAlbumYear());
            return ResponseEntity.badRequest().body(err);
        }

        try {
            MemoryPhoto saved = memoryService.uploadPhotoForDate(date, file, caption, null);
            return ResponseEntity.ok(mapPhoto(saved));
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (IOException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to store image file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/{id}/caption")
    public ResponseEntity<?> updateCaption(
            @PathVariable("id") Long photoId,
            @RequestBody Map<String, String> payload) {

        String caption = payload.get("caption");
        try {
            MemoryPhoto updated = memoryService.updateCaption(photoId, caption);
            return ResponseEntity.ok(mapPhoto(updated));
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/reorder")
    public ResponseEntity<?> reorderPhotos(@RequestBody Map<String, Object> payload) {
        String dateStr = (String) payload.get("date");
        @SuppressWarnings("unchecked")
        List<Object> rawIds = (List<Object>) payload.get("photoIds");

        if (dateStr == null || rawIds == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Date and photoIds are required.");
            return ResponseEntity.badRequest().body(err);
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Invalid date format. Expected yyyy-MM-dd.");
            return ResponseEntity.badRequest().body(err);
        }

        List<Long> photoIds = new ArrayList<>();
        for (Object idObj : rawIds) {
            if (idObj instanceof Number) {
                photoIds.add(((Number) idObj).longValue());
            }
        }

        try {
            memoryService.reorderPhotos(date, photoIds);
            Map<String, Object> res = new HashMap<>();
            res.put("status", "success");
            res.put("date", dateStr);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePhoto(@PathVariable("id") Long photoId) {
        try {
            memoryService.deletePhoto(photoId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("id", photoId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to delete photo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllPhotos() {
        List<MemoryPhoto> photos = memoryService.getAllPhotosForAlbumYear();
        List<Map<String, Object>> result = new ArrayList<>();

        for (MemoryPhoto p : photos) {
            result.add(mapPhoto(p));
        }

        return ResponseEntity.ok(result);
    }

    private Map<String, Object> mapPhoto(MemoryPhoto p) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", p.getId());
        item.put("date", p.getMemoryDate().toString());
        item.put("url", p.getStoragePath());
        item.put("caption", p.getCaption() != null ? p.getCaption() : "");
        item.put("originalFileName", p.getOriginalFileName());
        item.put("displayOrder", p.getDisplayOrder());
        return item;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> err = new HashMap<>();
        err.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }
}
