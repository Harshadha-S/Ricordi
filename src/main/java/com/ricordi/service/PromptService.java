package com.ricordi.service;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.DailyPrompt;
import com.ricordi.model.Question;
import com.ricordi.repository.DailyPromptRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PromptService {

    private final DailyPromptRepository dailyPromptRepository;
    private final QuestionBankService questionBankService;
    private final AlbumConfig albumConfig;

    public PromptService(
            DailyPromptRepository dailyPromptRepository,
            QuestionBankService questionBankService,
            AlbumConfig albumConfig) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.questionBankService = questionBankService;
        this.albumConfig = albumConfig;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        initializeDailyPromptsForYear(albumConfig.getAlbumYear());
    }

    @Transactional
    public synchronized void initializeDailyPromptsForYear(int year) {
        if (year != AlbumConfig.ALBUM_YEAR) {
            return;
        }

        LocalDate start = albumConfig.getAlbumStartDate();
        LocalDate end = albumConfig.getAlbumEndDate();

        long existingCount = dailyPromptRepository.countByPromptDateBetween(start, end);
        if (existingCount == AlbumConfig.DAYS_IN_ALBUM_YEAR) {
            // Already fully assigned
            return;
        }

        List<DailyPrompt> existingPrompts = dailyPromptRepository.findByPromptDateBetweenOrderByPromptDateAsc(start, end);
        Set<LocalDate> assignedDates = existingPrompts.stream()
                .map(DailyPrompt::getPromptDate)
                .collect(Collectors.toSet());

        Set<Integer> assignedQuestionIds = existingPrompts.stream()
                .filter(p -> p.getQuestionId() != null)
                .map(DailyPrompt::getQuestionId)
                .collect(Collectors.toSet());

        int daysInYear = start.lengthOfYear();
        // Eligible questions for album year: standard 365 days (reserving #366 for leap years) or 366 days in leap years
        List<Question> eligibleQuestions = questionBankService.getAllQuestions().stream()
                .filter(q -> q.getId() != null && q.getId() <= daysInYear)
                .filter(q -> !assignedQuestionIds.contains(q.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        // Shuffle available unassigned questions deterministically by year without replacement
        Collections.shuffle(eligibleQuestions, new Random(year));

        List<DailyPrompt> toSave = new ArrayList<>();
        int questionIndex = 0;

        for (int i = 0; i < AlbumConfig.DAYS_IN_ALBUM_YEAR; i++) {
            LocalDate date = start.plusDays(i);
            if (!assignedDates.contains(date)) {
                if (questionIndex >= eligibleQuestions.size()) {
                    throw new IllegalStateException("Not enough unassigned questions available for date: " + date);
                }
                Question q = eligibleQuestions.get(questionIndex++);
                DailyPrompt prompt = new DailyPrompt(date, q.getQuestionText(), q.getId());
                toSave.add(prompt);
            }
        }

        if (!toSave.isEmpty()) {
            dailyPromptRepository.saveAll(toSave);
        }
    }

    @Transactional(readOnly = true)
    public Optional<DailyPrompt> findForDate(LocalDate date) {
        validateDateInAlbumYear(date);
        return dailyPromptRepository.findByPromptDate(date);
    }

    @Transactional(readOnly = true)
    public DailyPrompt getPromptForDate(LocalDate date) {
        validateDateInAlbumYear(date);
        return dailyPromptRepository.findByPromptDate(date)
                .orElseThrow(() -> new IllegalStateException("No assigned question found for date: " + date));
    }

    @Transactional(readOnly = true)
    public List<DailyPrompt> getAllPromptsForAlbumYear() {
        return dailyPromptRepository.findByPromptDateBetweenOrderByPromptDateAsc(
                albumConfig.getAlbumStartDate(),
                albumConfig.getAlbumEndDate()
        );
    }

    public void validateDateInAlbumYear(LocalDate date) {
        if (!albumConfig.isWithinAlbumYear(date)) {
            throw new IllegalArgumentException(
                    "Date " + date + " is outside the album year " + albumConfig.getAlbumYear() +
                    " (" + albumConfig.getAlbumStartDate() + " to " + albumConfig.getAlbumEndDate() + ")"
            );
        }
    }
}
