package com.ricordi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ricordi.model.Question;
import com.ricordi.model.QuestionBankDto;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class QuestionBankService {

    public static final String QUESTION_BANK_CLASSPATH = "static/data/Question_prompt.json";
    public static final int MINIMUM_QUESTION_COUNT = 365;

    private final ObjectMapper objectMapper;
    private final List<Question> questions = new ArrayList<>();
    private final Map<Integer, Question> questionMap = new ConcurrentHashMap<>();

    public QuestionBankService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public synchronized void init() {
        if (!questions.isEmpty()) {
            return;
        }

        QuestionBankDto bankDto = loadQuestionBankDto();
        validateAndCache(bankDto);

        if (this.questions.size() < MINIMUM_QUESTION_COUNT) {
            throw new IllegalStateException(
                    "Authoritative question bank '" + QUESTION_BANK_CLASSPATH + "' must contain at least " +
                    MINIMUM_QUESTION_COUNT + " questions, but found: " + this.questions.size());
        }
    }

    private QuestionBankDto loadQuestionBankDto() {
        ClassPathResource resource = new ClassPathResource(QUESTION_BANK_CLASSPATH);
        if (!resource.exists()) {
            throw new IllegalStateException(
                    "Authoritative question bank file '" + QUESTION_BANK_CLASSPATH + "' was not found on the classpath.");
        }
        try (InputStream is = resource.getInputStream()) {
            QuestionBankDto bankDto = objectMapper.readValue(is, QuestionBankDto.class);
            if (bankDto == null) {
                throw new IllegalStateException(
                        "Authoritative question bank file '" + QUESTION_BANK_CLASSPATH + "' could not be parsed (evaluated to null).");
            }
            return bankDto;
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to load authoritative question bank from classpath '" + QUESTION_BANK_CLASSPATH + "': " + e.getMessage(), e);
        }
    }

    public void validateAndCache(QuestionBankDto dto) {
        if (dto == null || dto.getQuestions() == null || dto.getQuestions().isEmpty()) {
            throw new IllegalStateException("Question bank is empty or invalid.");
        }

        List<Question> rawQuestions = dto.getQuestions();
        Set<Integer> seenIds = new HashSet<>();
        List<Question> validatedList = new ArrayList<>();

        for (int i = 0; i < rawQuestions.size(); i++) {
            Question q = rawQuestions.get(i);
            if (q == null) {
                throw new IllegalStateException("Question bank contains a null question item at index " + i);
            }
            if (q.getId() == null) {
                throw new IllegalStateException("Question at index " + i + " is missing an ID.");
            }
            if (q.getId() <= 0) {
                throw new IllegalStateException("Question at index " + i + " has non-positive ID: " + q.getId());
            }
            if (q.getQuestionText() == null || q.getQuestionText().trim().isEmpty()) {
                throw new IllegalStateException("Question ID " + q.getId() + " has empty text.");
            }
            if (!seenIds.add(q.getId())) {
                throw new IllegalStateException("Duplicate question ID found in question bank: " + q.getId());
            }
            validatedList.add(q);
        }

        this.questions.clear();
        this.questionMap.clear();

        for (Question q : validatedList) {
            this.questions.add(q);
            this.questionMap.put(q.getId(), q);
        }
    }

    public List<Question> getAllQuestions() {
        return Collections.unmodifiableList(questions);
    }

    public Optional<Question> getQuestionById(Integer id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(questionMap.get(id));
    }

    public int getQuestionCount() {
        return questions.size();
    }

    public String getQuestionBankPath() {
        return QUESTION_BANK_CLASSPATH;
    }
}
