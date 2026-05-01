package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.InterviewStage;

import java.util.List;
import java.util.Map;

public final class QuestionBank {

    private static final Map<InterviewStage, List<String>> QUESTIONS_BY_STAGE = Map.of(
            InterviewStage.INTRO,
            List.of(
                    "Tell me about yourself",
                    "Why are you interested in this role?"
            ),
            InterviewStage.TECHNICAL,
            List.of(
                    "What technical approach would you take in this role?",
                    "Pick one of your focus areas and explain core concepts."
            ),
            InterviewStage.BEHAVIORAL,
            List.of(
                    "Tell me about a challenge you faced",
                    "Describe a time you worked in a team"
            )
    );

    private QuestionBank() {
    }

    public static String getQuestion(InterviewStage stage, int questionIndex, String role, List<String> focusAreas) {
        if (InterviewStage.TECHNICAL.equals(stage)) {
            return technicalQuestion(questionIndex, role, focusAreas);
        }
        List<String> questions = QUESTIONS_BY_STAGE.getOrDefault(stage, List.of());
        if (questions.isEmpty()) {
            return "Tell me about yourself";
        }
        int idx = Math.max(0, Math.min(questionIndex - 1, questions.size() - 1));
        return questions.get(idx);
    }

    private static String technicalQuestion(int questionIndex, String role, List<String> focusAreas) {
        String safeRole = role == null || role.isBlank() ? "this role" : role;
        String primaryFocus = (focusAreas == null || focusAreas.isEmpty()) ? "your strongest technical area" : focusAreas.getFirst();

        if (questionIndex <= 1) {
            return "For the " + safeRole + " role, explain a project where you applied " + primaryFocus + ".";
        }
        return "What are the key trade-offs and complexity considerations in " + primaryFocus + "?";
    }
}
