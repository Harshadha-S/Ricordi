package com.ricordi.repository;

import com.ricordi.model.JournalEntry;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findAllByUserIdOrderByMemoryDateDesc(Long userId);

    Optional<JournalEntry> findFirstByMemoryDateOrderByCreatedAtDesc(LocalDate memoryDate);

    Optional<JournalEntry> findByUserIdAndMemoryDate(Long userId, LocalDate memoryDate);

    List<JournalEntry> findByMemoryDateBetweenOrderByMemoryDateAsc(LocalDate startDate, LocalDate endDate);
}
