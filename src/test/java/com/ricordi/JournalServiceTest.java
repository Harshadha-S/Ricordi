package com.ricordi;

import com.ricordi.model.JournalEntry;
import com.ricordi.service.JournalService;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class JournalServiceTest {

    @Autowired
    private JournalService journalService;

    @Test
    @DisplayName("Should save and retrieve a new journal response for a valid 2027 date")
    void testSaveAndRetrieveJournalEntry() {
        LocalDate date = LocalDate.of(2027, 1, 15);
        String text = "Today was a quiet day filled with productive thoughts.";

        JournalEntry saved = journalService.saveOrUpdateEntry(date, text, null);
        assertNotNull(saved.getId(), "Saved entry ID must not be null");
        assertEquals(date, saved.getMemoryDate());
        assertEquals(text, saved.getContent());

        Optional<JournalEntry> fetched = journalService.findForDate(date, null);
        assertTrue(fetched.isPresent(), "Journal entry for date must be found");
        assertEquals(text, fetched.get().getContent());
    }

    @Test
    @DisplayName("Should update existing journal entry without creating duplicate records")
    void testUpdateExistingJournalEntryNoDuplicates() {
        LocalDate date = LocalDate.of(2027, 2, 1);
        journalService.saveOrUpdateEntry(date, "First draft", null);
        journalService.saveOrUpdateEntry(date, "Updated second draft", null);

        Optional<JournalEntry> fetched = journalService.findForDate(date, null);
        assertTrue(fetched.isPresent());
        assertEquals("Updated second draft", fetched.get().getContent());

        List<JournalEntry> allEntries = journalService.getAllEntriesForAlbumYear();
        long countForDate = allEntries.stream().filter(e -> e.getMemoryDate().equals(date)).count();
        assertEquals(1, countForDate, "There must be exactly one entry record for the date");
    }

    @Test
    @DisplayName("Should reject journal responses for dates outside 2027")
    void testRejectJournalEntryOutside2027() {
        LocalDate outsideDate = LocalDate.of(2026, 12, 31);
        assertThrows(IllegalArgumentException.class, () ->
            journalService.saveOrUpdateEntry(outsideDate, "Test content", null)
        );
    }
}
