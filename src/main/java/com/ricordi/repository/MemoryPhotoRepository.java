package com.ricordi.repository;

import com.ricordi.model.MemoryPhoto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemoryPhotoRepository extends JpaRepository<MemoryPhoto, Long> {

    List<MemoryPhoto> findAllByJournalEntryId(Long journalEntryId);

    List<MemoryPhoto> findByMemoryDateOrderByDisplayOrderAscCreatedAtAsc(LocalDate memoryDate);

    long countByMemoryDate(LocalDate memoryDate);

    List<MemoryPhoto> findByMemoryDateBetweenOrderByMemoryDateAscDisplayOrderAscCreatedAtAsc(LocalDate startDate, LocalDate endDate);
}
