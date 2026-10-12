package com.ricordi.controller;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.JournalEntry;
import com.ricordi.service.JournalService;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/journal")
public class JournalApiController {

    private final JournalService journalService;
    private final AlbumConfig albumConfig;

    public JournalApiController(JournalService journalService, AlbumConfig albumConfig) {
        this.journalService = journalService;
        this.albumConfig = albumConfig;
    }

    @GetMapping
    public ResponseEntity<?> getJournalForDate(@RequestParam(name = "date", required = false) String dateStr) {
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

        String content = journalService.findForDate(date, null)
                .map(JournalEntry::getContent)
                .orElse("");

        Map<String, Object> response = new HashMap<>();
        response.put("date", date.toString());
        response.put("content", content);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> saveJournalForDate(@RequestBody Map<String, String> payload) {
        String dateStr = payload.get("date");
        String content = payload.get("content");

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

        JournalEntry saved = journalService.saveOrUpdateEntry(date, content, null);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("id", saved.getId());
        response.put("date", saved.getMemoryDate().toString());
        response.put("content", saved.getContent());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllJournalEntries() {
        List<JournalEntry> entries = journalService.getAllEntriesForAlbumYear();
        List<Map<String, Object>> result = new ArrayList<>();

        for (JournalEntry e : entries) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", e.getId());
            item.put("date", e.getMemoryDate().toString());
            item.put("content", e.getContent());
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> err = new HashMap<>();
        err.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }
}
