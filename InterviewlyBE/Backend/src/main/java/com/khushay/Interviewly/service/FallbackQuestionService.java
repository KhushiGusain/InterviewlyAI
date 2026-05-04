package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.InterviewStage;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Static fallback questions when OpenAI (or prompt generation) is unavailable. {@link #getFallbackQuestion} uses
 * the same contextual inputs as the primary path (stage, role, focus areas, prior answer, name).
 */
@Service
public class FallbackQuestionService {

    private static final List<String> INTRO_TEMPLATES = List.of(
            "Hi %s, can you introduce yourself?",
            "Why are you interested in this role?");

    private static final List<String> TECHNICAL_TEMPLATES = List.of(
            "Explain a project where you used %s.",
            "What are key challenges in %s?",
            "How would you optimize a solution in %s?");

    private static final List<String> BEHAVIORAL_TEMPLATES = List.of(
            "Tell me about a challenge you faced",
            "Describe a time you worked in a team",
            "How do you handle deadlines?");

    private static final List<String> FOLLOW_UP_TEMPLATES = List.of(
            "Can you explain that in more detail?",
            "Why did you choose that approach?",
            "What challenges did you face?");

    /**
     * @param rotationKey varies by interview position so repeated fallbacks are not always identical
     */
    public String getFallbackQuestion(
            InterviewStage stage,
            String role,
            List<String> focusAreas,
            String previousAnswer,
            String candidateName,
            boolean isFollowUp,
            int rotationKey) {

        if (InterviewStage.END.equals(stage)) {
            return "Thank you for your time today.";
        }

        if (isFollowUp && StringUtils.hasText(previousAnswer)) {
            int i = Math.floorMod(rotationKey, FOLLOW_UP_TEMPLATES.size());
            return FOLLOW_UP_TEMPLATES.get(i);
        }

        return switch (stage) {
            case INTRO -> introQuestion(candidateName, rotationKey);
            case TECHNICAL -> technicalQuestion(role, focusAreas, rotationKey);
            case BEHAVIORAL -> behavioralQuestion(rotationKey);
            case END -> "Thank you for your time today.";
        };
    }

    private static String introQuestion(String candidateName, int rotationKey) {
        String name = StringUtils.hasText(candidateName) ? candidateName.trim() : "there";
        int i = Math.floorMod(rotationKey, INTRO_TEMPLATES.size());
        String template = INTRO_TEMPLATES.get(i);
        if (template.contains("%s")) {
            return String.format(template, name);
        }
        return template;
    }

    private static String technicalQuestion(String role, List<String> focusAreas, int rotationKey) {
        String focus = pickFocusArea(focusAreas, rotationKey);
        int templateIdx = Math.floorMod(rotationKey, TECHNICAL_TEMPLATES.size());
        String core = String.format(TECHNICAL_TEMPLATES.get(templateIdx), focus);
        if (StringUtils.hasText(role)) {
            return "For the " + role.trim() + " role: " + core;
        }
        return core;
    }

    private static String behavioralQuestion(int rotationKey) {
        int i = Math.floorMod(rotationKey, BEHAVIORAL_TEMPLATES.size());
        return BEHAVIORAL_TEMPLATES.get(i);
    }

    private static String pickFocusArea(List<String> focusAreas, int rotationKey) {
        if (focusAreas == null || focusAreas.isEmpty()) {
            return "your technical work";
        }
        int idx = Math.floorMod(rotationKey / TECHNICAL_TEMPLATES.size(), focusAreas.size());
        return focusAreas.get(idx).trim();
    }
}
