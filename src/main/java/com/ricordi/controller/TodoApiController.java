package com.ricordi.controller;

import com.ricordi.model.TodoTask;
import com.ricordi.service.TodoService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
public class TodoApiController {

    private final TodoService todoService;

    public TodoApiController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTasks() {
        List<TodoTask> tasks = todoService.getAllTasks(null);
        List<Map<String, Object>> response = new ArrayList<>();

        for (TodoTask t : tasks) {
            response.add(taskToMap(t));
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        if (title == null || title.trim().isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Task title is required.");
            return ResponseEntity.badRequest().body(err);
        }

        String dueDateStr = payload.get("dueDate");
        LocalDate dueDate = null;
        if (dueDateStr != null && !dueDateStr.trim().isEmpty()) {
            try {
                dueDate = LocalDate.parse(dueDateStr.trim());
            } catch (DateTimeParseException e) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Invalid dueDate format. Expected yyyy-MM-dd.");
                return ResponseEntity.badRequest().body(err);
            }
        }

        TodoTask created = todoService.createTask(title, dueDate, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(taskToMap(created));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleTask(@PathVariable("id") Long id) {
        try {
            TodoTask updated = todoService.toggleCompleted(id, null);
            return ResponseEntity.ok(taskToMap(updated));
        } catch (IllegalArgumentException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable("id") Long id) {
        boolean deleted = todoService.deleteTask(id, null);
        if (!deleted) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Task not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Task deleted successfully.");
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> taskToMap(TodoTask t) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("dueDate", t.getDueDate() != null ? t.getDueDate().toString() : null);
        map.put("completed", t.isCompleted());
        map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        return map;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> err = new HashMap<>();
        err.put("error", ex.getMessage());
        return ResponseEntity.badRequest().body(err);
    }
}
