package com.ricordi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "daily_prompts")
public class DailyPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate promptDate;

    @Column(nullable = false, length = 500)
    private String promptText;

    @Column(name = "question_id")
    private Integer questionId;

    protected DailyPrompt() {
    }

    public DailyPrompt(LocalDate promptDate, String promptText) {
        this.promptDate = promptDate;
        this.promptText = promptText;
    }

    public DailyPrompt(LocalDate promptDate, String promptText, Integer questionId) {
        this.promptDate = promptDate;
        this.promptText = promptText;
        this.questionId = questionId;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getPromptDate() {
        return promptDate;
    }

    public String getPromptText() {
        return promptText;
    }

    public Integer getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Integer questionId) {
        this.questionId = questionId;
    }
}
