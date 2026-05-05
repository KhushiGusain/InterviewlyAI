package com.khushay.Interviewly.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionFeedback {
    private String question;
    private String answer;
    private int score;
    private String strengths;
    private String improvements;
}
