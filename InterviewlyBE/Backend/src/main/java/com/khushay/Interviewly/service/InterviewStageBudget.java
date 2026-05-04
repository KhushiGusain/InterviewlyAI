package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.InterviewStage;
import java.util.Locale;
import org.springframework.util.StringUtils;

/**
 * Maximum number of questions per stage (not fixed counts; interview advances when the cap is reached).
 */
public final class InterviewStageBudget {

    private InterviewStageBudget() {}

    public static String normalizeInterviewType(String interviewType) {
        if (!StringUtils.hasText(interviewType)) {
            return "MIXED";
        }
        String u = interviewType.trim().toUpperCase(Locale.ROOT);
        if ("TECHNICAL".equals(u) || "BEHAVIORAL".equals(u) || "MIXED".equals(u)) {
            return u;
        }
        return "MIXED";
    }

    /** Max questions that may be asked in {@code stage} for the given interview type. */
    public static int maxQuestionsForStage(String interviewType, InterviewStage stage) {
        String t = normalizeInterviewType(interviewType);
        return switch (t) {
            case "TECHNICAL" -> switch (stage) {
                case INTRO -> 1;
                case TECHNICAL -> 5;
                default -> 0;
            };
            case "BEHAVIORAL" -> switch (stage) {
                case INTRO -> 1;
                case BEHAVIORAL -> 5;
                default -> 0;
            };
            default -> switch (stage) {
                case INTRO -> 2;
                case TECHNICAL -> 4;
                case BEHAVIORAL -> 3;
                default -> 0;
            };
        };
    }
}
