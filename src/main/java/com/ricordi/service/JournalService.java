package com.ricordi.service;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.JournalEntry;
import com.ricordi.model.User;
import com.ricordi.repository.JournalEntryRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final AlbumConfig albumConfig;

    public JournalService(JournalEntryRepository journalEntryRepository, AlbumConfig albumConfig) {
        this.journalEntryRepository = journalEntryRepository;
        this.albumConfig = albumConfig;
    }

    public List<JournalEntry> findForUser(Long userId) {
        return journalEntryRepository.findAllByUserIdOrderByMemoryDateDesc(userId);
    }

    public Optional<JournalEntry> findById(Long id) {
        return journalEntryRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<JournalEntry> findForDate(LocalDate memoryDate, User user) {
        albumConfig.isWithinAlbumYear(memoryDate);
        if (user != null && user.getId() != null) {
            Optional<JournalEntry> userEntry = journalEntryRepository.findByUserIdAndMemoryDate(user.getId(), memoryDate);
            if (userEntry.isPresent()) {
                return userEntry;
            }
        }
        return journalEntryRepository.findFirstByMemoryDateOrderByCreatedAtDesc(memoryDate);
    }

    @Transactional
    public JournalEntry saveOrUpdateEntry(LocalDate memoryDate, String content, User user) {
        if (!albumConfig.isWithinAlbumYear(memoryDate)) {
            throw new IllegalArgumentException(
                    "Date " + memoryDate + " is outside album year " + albumConfig.getAlbumYear()
            );
        }

        String sanitizedContent = (content != null) ? content : "";

        Optional<JournalEntry> existing = findForDate(memoryDate, user);
        JournalEntry entry;

        if (existing.isPresent()) {
            entry = existing.get();
            entry.setContent(sanitizedContent);
            if (user != null && entry.getUser() == null) {
                entry.setUser(user);
            }
        } else {
            String title = "Journal Response for " + memoryDate;
            entry = new JournalEntry(user, title, sanitizedContent, memoryDate);
        }

        return journalEntryRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<JournalEntry> getAllEntriesForAlbumYear() {
        return journalEntryRepository.findByMemoryDateBetweenOrderByMemoryDateAsc(
                albumConfig.getAlbumStartDate(),
                albumConfig.getAlbumEndDate()
        );
    }
}
