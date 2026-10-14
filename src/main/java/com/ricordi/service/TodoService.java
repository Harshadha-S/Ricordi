package com.ricordi.service;

import com.ricordi.model.TodoTask;
import com.ricordi.model.User;
import com.ricordi.repository.TodoTaskRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TodoService {

    private final TodoTaskRepository todoTaskRepository;

    public TodoService(TodoTaskRepository todoTaskRepository) {
        this.todoTaskRepository = todoTaskRepository;
    }

    @Transactional(readOnly = true)
    public List<TodoTask> getAllTasks(User user) {
        if (user != null && user.getId() != null) {
            return todoTaskRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        }
        return todoTaskRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<TodoTask> getTaskById(Long id) {
        if (id == null) return Optional.empty();
        return todoTaskRepository.findById(id);
    }

    @Transactional
    public TodoTask createTask(String title, LocalDate dueDate, User user) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title is required.");
        }
        String cleanTitle = title.trim();
        if (cleanTitle.length() > 200) {
            cleanTitle = cleanTitle.substring(0, 200);
        }

        TodoTask task = new TodoTask(user, cleanTitle, dueDate);
        return todoTaskRepository.save(task);
    }

    @Transactional
    public TodoTask toggleCompleted(Long id, User user) {
        if (id == null) {
            throw new IllegalArgumentException("Task ID is required.");
        }
        TodoTask task = todoTaskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id: " + id));

        // If user is specified and task has a user, check ownership
        if (user != null && user.getId() != null && task.getUser() != null &&
                !user.getId().equals(task.getUser().getId())) {
            throw new IllegalArgumentException("Access denied to task: " + id);
        }

        task.setCompleted(!task.isCompleted());
        return todoTaskRepository.save(task);
    }

    @Transactional
    public boolean deleteTask(Long id, User user) {
        if (id == null) return false;
        Optional<TodoTask> opt = todoTaskRepository.findById(id);
        if (opt.isEmpty()) {
            return false;
        }
        TodoTask task = opt.get();
        if (user != null && user.getId() != null && task.getUser() != null &&
                !user.getId().equals(task.getUser().getId())) {
            throw new IllegalArgumentException("Access denied to task: " + id);
        }

        todoTaskRepository.delete(task);
        return true;
    }
}
