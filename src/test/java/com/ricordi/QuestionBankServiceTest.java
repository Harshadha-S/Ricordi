package com.ricordi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ricordi.model.Question;
import com.ricordi.model.QuestionBankDto;
import com.ricordi.service.QuestionBankService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class QuestionBankServiceTest {

    private QuestionBankService questionBankService;

    @BeforeEach
    void setUp() {
        questionBankService = new QuestionBankService(new ObjectMapper());
        questionBankService.init();
    }

    @Test
    @DisplayName("Should load questions bank containing at least 365 questions")
    void testLoadAllQuestions() {
        List<Question> questions = questionBankService.getAllQuestions();
        assertNotNull(questions, "Question bank list should not be null");
        assertTrue(questions.size() >= 365, "Question bank should contain at least 365 questions");
    }

    @Test
    @DisplayName("Should preserve question 366 in question bank for leap-year use")
    void testPreserveQuestion366() {
        Optional<Question> q366 = questionBankService.getQuestionById(366);
        assertTrue(q366.isPresent(), "Question 366 should exist in source question bank");
        assertNotNull(q366.get().getQuestionText(), "Question 366 text should not be null");
        assertFalse(q366.get().getQuestionText().trim().isEmpty(), "Question 366 text should not be empty");
    }

    @Test
    @DisplayName("Should reject invalid question bank with duplicate IDs")
    void testRejectDuplicateIds() {
        QuestionBankDto invalidDto = new QuestionBankDto(List.of(
                new Question(1, "Question One"),
                new Question(1, "Duplicate Question One")
        ));
        QuestionBankService service = new QuestionBankService(new ObjectMapper());
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.validateAndCache(invalidDto));
        assertTrue(ex.getMessage().contains("Duplicate question ID"), "Exception should mention duplicate question ID");
    }

    @Test
    @DisplayName("Should reject question bank with empty question text")
    void testRejectEmptyQuestionText() {
        QuestionBankDto invalidDto = new QuestionBankDto(List.of(
                new Question(1, "   ")
        ));
        QuestionBankService service = new QuestionBankService(new ObjectMapper());
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.validateAndCache(invalidDto));
        assertTrue(ex.getMessage().contains("empty text"), "Exception should mention empty text");
    }

    @Test
    @DisplayName("Should verify authoritative question bank classpath path is static/data/Question_prompt.json")
    void testAuthoritativeQuestionBankPath() {
        assertEquals("static/data/Question_prompt.json", questionBankService.getQuestionBankPath());
    }

    @Test
    @DisplayName("Should preserve exact ordering and IDs from 1 to 366")
    void testPreserveExactOrdering() {
        List<Question> questions = questionBankService.getAllQuestions();
        assertEquals(366, questions.size(), "Question bank should contain exactly 366 questions");
        for (int i = 0; i < 366; i++) {
            assertEquals(i + 1, questions.get(i).getId(), "Questions should be ordered sequentially by ID");
        }
    }

    @Test
    @DisplayName("Should reject question bank with invalid non-positive ID")
    void testRejectNonPositiveId() {
        QuestionBankDto invalidDto = new QuestionBankDto(List.of(
                new Question(0, "Invalid ID zero")
        ));
        QuestionBankService service = new QuestionBankService(new ObjectMapper());
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.validateAndCache(invalidDto));
        assertTrue(ex.getMessage().contains("non-positive ID"), "Exception should mention non-positive ID");
    }
}
