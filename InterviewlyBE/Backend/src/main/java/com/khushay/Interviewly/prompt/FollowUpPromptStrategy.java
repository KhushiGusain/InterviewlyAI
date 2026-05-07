package com.khushay.Interviewly.prompt;

import com.khushay.Interviewly.model.FollowUpType;
import org.springframework.stereotype.Component;

/**
 * Provides concise interviewer guidance for follow-up question style.
 */
@Component
public class FollowUpPromptStrategy {

    public String buildFollowUpGuidance(FollowUpType type) {
        if (type == null) {
            return "Move to a new topic with a concise, natural next question.";
        }

        return switch (type) {
            case CLARIFICATION ->
                    "Ask the candidate to clarify the vague or incomplete part with a specific follow-up.";
            case DEEP_DIVE ->
                    "Explore implementation detail, reasoning, or deeper understanding behind the candidate's answer.";
            case CHALLENGE ->
                    "Probe trade-offs, edge cases, scalability, alternatives, or constraints in the candidate's approach.";
            case NONE ->
                    "Do not follow up on this answer; move to the next topic naturally.";
        };
    }
}
