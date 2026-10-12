package com.ricordi.repository;

import com.ricordi.model.DailyPrompt;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyPromptRepository extends JpaRepository<DailyPrompt, Long> {

    Optional<DailyPrompt> findByPromptDate(LocalDate promptDate);

    List<DailyPrompt> findByPromptDateBetweenOrderByPromptDateAsc(LocalDate startDate, LocalDate endDate);

    boolean existsByPromptDate(LocalDate promptDate);

    long countByPromptDateBetween(LocalDate startDate, LocalDate endDate);
}
