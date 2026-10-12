package com.ricordi.model;

import java.util.List;

public class QuestionBankDto {

    private List<Question> questions;

    public QuestionBankDto() {
    }

    public QuestionBankDto(List<Question> questions) {
        this.questions = questions;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }
}
