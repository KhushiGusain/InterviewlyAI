package com.khushay.Interviewly.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents one planned question slot in the interview.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewPlanItem {
    private InterviewStage stage;
    private QuestionCategory category;
    private String focusArea;
}
