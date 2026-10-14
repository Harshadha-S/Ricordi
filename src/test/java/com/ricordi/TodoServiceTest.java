package com.ricordi;

import com.ricordi.model.TodoTask;
import com.ricordi.service.TodoService;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class TodoServiceTest {

    @Autowired
    private TodoService todoService;

    @Test
    @DisplayName("Should create and retrieve a new task")
    void testCreateAndRetrieveTask() {
        LocalDate due = LocalDate.of(2027, 4, 15);
        TodoTask created = todoService.createTask("Buy pressed botanicals", due, null);

        assertNotNull(created.getId());
        assertEquals("Buy pressed botanicals", created.getTitle());
        assertEquals(due, created.getDueDate());
        assertFalse(created.isCompleted());

        Optional<TodoTask> fetched = todoService.getTaskById(created.getId());
        assertTrue(fetched.isPresent());
        assertEquals("Buy pressed botanicals", fetched.get().getTitle());
    }

    @Test
    @DisplayName("Should toggle task completion status")
    void testToggleTaskCompletion() {
        TodoTask created = todoService.createTask("Dry hydrangea flowers", null, null);
        assertFalse(created.isCompleted());

        TodoTask toggled = todoService.toggleCompleted(created.getId(), null);
        assertTrue(toggled.isCompleted());

        TodoTask toggledBack = todoService.toggleCompleted(created.getId(), null);
        assertFalse(toggledBack.isCompleted());
    }

    @Test
    @DisplayName("Should delete task successfully")
    void testDeleteTask() {
        TodoTask created = todoService.createTask("Temporary task to delete", null, null);
        Long id = created.getId();

        boolean deleted = todoService.deleteTask(id, null);
        assertTrue(deleted);

        Optional<TodoTask> fetched = todoService.getTaskById(id);
        assertTrue(fetched.isEmpty());

        boolean deleteAgain = todoService.deleteTask(id, null);
        assertFalse(deleteAgain);
    }

    @Test
    @DisplayName("Should reject blank or null task titles")
    void testRejectBlankTitle() {
        assertThrows(IllegalArgumentException.class, () -> todoService.createTask("", null, null));
        assertThrows(IllegalArgumentException.class, () -> todoService.createTask("   ", null, null));
        assertThrows(IllegalArgumentException.class, () -> todoService.createTask(null, null, null));
    }
}
