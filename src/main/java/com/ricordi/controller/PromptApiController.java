package com.ricordi.controller;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.DailyPrompt;
import com.ricordi.service.PromptService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prompts")
public class PromptApiController {

    private final PromptService promptService;
    private final AlbumConfig albumConfig;

    public PromptApiController(PromptService promptService, AlbumConfig albumConfig) {
        this.promptService = promptService;
        this.albumConfig = albumConfig;
    }

    @GetMapping
    public ResponseEntity<?> getPromptForDate(@RequestParam(name = "date", required = false) String dateStr) {
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

        DailyPrompt prompt = promptService.getPromptForDate(date);
        int dayOfYear = date.getDayOfYear();

        Map<String, Object> response = new HashMap<>();
        response.put("date", date.toString());
        response.put("dayOfYear", dayOfYear);
        response.put("totalDays", AlbumConfig.DAYS_IN_ALBUM_YEAR);
        response.put("questionId", prompt.getQuestionId());
        response.put("questionText", prompt.getPromptText());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllPromptsForYear() {
        List<DailyPrompt> prompts = promptService.getAllPromptsForAlbumYear();
        List<Map<String, Object>> result = new ArrayList<>();

        for (DailyPrompt p : prompts) {
            Map<String, Object> item = new HashMap<>();
            item.put("date", p.getPromptDate().toString());
            item.put("dayOfYear", p.getPromptDate().getDayOfYear());
            item.put("totalDays", AlbumConfig.DAYS_IN_ALBUM_YEAR);
            item.put("questionId", p.getQuestionId());
            item.put("questionText", p.getPromptText());
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
