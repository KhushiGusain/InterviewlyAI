package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.QuestionType;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class QuestionTypeStrategy {

    private static final List<QuestionType> TECHNICAL_SEQUENCE = List.of(
            QuestionType.CONCEPT,
            QuestionType.PROBLEM_SOLVING,
            QuestionType.ROLE_BASED,
            QuestionType.SCENARIO
    );

    private static final List<QuestionType> BEHAVIORAL_SEQUENCE = List.of(
            QuestionType.BEHAVIORAL,
            QuestionType.SITUATIONAL,
            QuestionType.EXPERIENCE
    );

    public String getNextQuestionType(Interview interview) {
        InterviewStage stage = interview.getCurrentStage();

        if (stage == InterviewStage.INTRO) {
            return "INTRO";
        }

        if (stage == InterviewStage.TECHNICAL) {
            return getNextFromSequence(interview.getLastQuestionType(), TECHNICAL_SEQUENCE);
        }

        if (stage == InterviewStage.BEHAVIORAL) {
            return getNextFromSequence(interview.getLastQuestionType(), BEHAVIORAL_SEQUENCE);
        }

        return "INTRO";
    }

    private String getNextFromSequence(String lastQuestionType, List<QuestionType> sequence) {
        if (!StringUtils.hasText(lastQuestionType)) {
            return sequence.getFirst().name();
        }

        for (int i = 0; i < sequence.size(); i++) {
            if (sequence.get(i).name().equalsIgnoreCase(lastQuestionType.trim())) {
                return sequence.get((i + 1) % sequence.size()).name();
            }
        }

        return sequence.getFirst().name();
    }
}
