package com.ricordi;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.DailyPrompt;
import com.ricordi.service.PromptService;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class PromptServiceTest {

    @Autowired
    private PromptService promptService;

    @Autowired
    private AlbumConfig albumConfig;

    @Test
    @DisplayName("Should assign a daily question to every single date of the 2027 album (365 days)")
    void testAssignAllDatesIn2027() {
        promptService.initializeDailyPromptsForYear(2027);

        List<DailyPrompt> prompts = promptService.getAllPromptsForAlbumYear();
        assertEquals(365, prompts.size(), "2027 album must have exactly 365 assigned daily prompts");

        LocalDate expectedDate = albumConfig.getAlbumStartDate();
        for (DailyPrompt p : prompts) {
            assertEquals(expectedDate, p.getPromptDate(), "Prompts must be ordered sequentially from Jan 1 to Dec 31, 2027");
            assertNotNull(p.getPromptText(), "Prompt text must not be null");
            assertFalse(p.getPromptText().trim().isEmpty(), "Prompt text must not be empty");
            assertNotNull(p.getQuestionId(), "Question ID must not be null");
            expectedDate = expectedDate.plusDays(1);
        }
    }

    @Test
    @DisplayName("Should ensure each question is assigned only once within the 2027 edition (no duplicate question IDs)")
    void testNoDuplicateQuestionAssignmentsIn2027() {
        promptService.initializeDailyPromptsForYear(2027);
        List<DailyPrompt> prompts = promptService.getAllPromptsForAlbumYear();

        Set<Integer> assignedIds = new HashSet<>();
        for (DailyPrompt p : prompts) {
            assertTrue(assignedIds.add(p.getQuestionId()), "Question ID " + p.getQuestionId() + " assigned multiple times!");
        }
        assertEquals(365, assignedIds.size(), "Exactly 365 unique questions must be assigned");
        assertFalse(assignedIds.contains(366), "Question 366 must be reserved for leap years and NOT assigned in 2027");
    }

    @Test
    @DisplayName("Should keep date assignments stable after re-initialization (persistence check)")
    void testAssignmentStability() {
        promptService.initializeDailyPromptsForYear(2027);
        DailyPrompt jan1Original = promptService.getPromptForDate(LocalDate.of(2027, 1, 1));
        DailyPrompt dec31Original = promptService.getPromptForDate(LocalDate.of(2027, 12, 31));

        // Re-run initialization (simulating application restart)
        promptService.initializeDailyPromptsForYear(2027);

        DailyPrompt jan1After = promptService.getPromptForDate(LocalDate.of(2027, 1, 1));
        DailyPrompt dec31After = promptService.getPromptForDate(LocalDate.of(2027, 12, 31));

        assertEquals(jan1Original.getQuestionId(), jan1After.getQuestionId(), "Jan 1 question assignment must remain stable across restarts");
        assertEquals(jan1Original.getPromptText(), jan1After.getPromptText());
        assertEquals(dec31Original.getQuestionId(), dec31After.getQuestionId(), "Dec 31 question assignment must remain stable across restarts");
        assertEquals(dec31Original.getPromptText(), dec31After.getPromptText());
    }

    @Test
    @DisplayName("Should retrieve first day (Jan 1, 2027) and last day (Dec 31, 2027) correctly")
    void testFirstAndLastDayHandling() {
        promptService.initializeDailyPromptsForYear(2027);

        DailyPrompt firstDay = promptService.getPromptForDate(LocalDate.of(2027, 1, 1));
        assertNotNull(firstDay, "Jan 1, 2027 prompt must be present");
        assertEquals(LocalDate.of(2027, 1, 1), firstDay.getPromptDate());

        DailyPrompt lastDay = promptService.getPromptForDate(LocalDate.of(2027, 12, 31));
        assertNotNull(lastDay, "Dec 31, 2027 prompt must be present");
        assertEquals(LocalDate.of(2027, 12, 31), lastDay.getPromptDate());
    }

    @Test
    @DisplayName("Should reject dates outside 2027 album year")
    void testRejectDatesOutside2027() {
        promptService.initializeDailyPromptsForYear(2027);

        assertThrows(IllegalArgumentException.class, () -> promptService.getPromptForDate(LocalDate.of(2026, 12, 31)));
        assertThrows(IllegalArgumentException.class, () -> promptService.getPromptForDate(LocalDate.of(2028, 1, 1)));
    }
}
