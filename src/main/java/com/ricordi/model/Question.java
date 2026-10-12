package com.ricordi.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Question {

    private Integer id;

    @JsonProperty("question")
    private String questionText;

    public Question() {
    }

    public Question(Integer id, String questionText) {
        this.id = id;
        this.questionText = questionText;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }
}
