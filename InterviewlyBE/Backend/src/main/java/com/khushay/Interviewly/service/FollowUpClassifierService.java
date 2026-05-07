package com.khushay.Interviewly.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khushay.Interviewly.dto.FollowUpDecision;
import com.khushay.Interviewly.model.FollowUpType;
import com.khushay.Interviewly.model.InterviewStage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class FollowUpClassifierService {

    private static final Logger log = LoggerFactory.getLogger(FollowUpClassifierService.class);
    private static final FollowUpDecision FALLBACK_NONE = new FollowUpDecision(
            FollowUpType.NONE,
            "Classifier fallback: unable to determine a reliable follow-up."
    );

    private final OpenAIService openAIService;
    private final ObjectMapper objectMapper;

    public FollowUpDecision classifyFollowUp(
            InterviewStage stage,
            String previousQuestion,
            String candidateAnswer
    ) {
        if (!StringUtils.hasText(candidateAnswer)) {
            FollowUpDecision decision = new FollowUpDecision(FollowUpType.NONE, "Candidate answer is empty.");
            logDecision(stage, decision);
            return decision;
        }

        try {
            String prompt = buildClassifierPrompt(stage, previousQuestion, candidateAnswer);
            String raw = openAIService.generateTextResponse(prompt);
            FollowUpDecision decision = parseDecision(raw);
            logDecision(stage, decision);
            return decision;
        } catch (Exception ex) {
            log.warn("Follow-up classifier failed; defaulting to NONE. stage={}", stage, ex);
            logDecision(stage, FALLBACK_NONE);
            return FALLBACK_NONE;
        }
    }

    private String buildClassifierPrompt(InterviewStage stage, String previousQuestion, String candidateAnswer) {
        String stageLine = stage != null ? stage.name() : "UNKNOWN";
        String questionLine = StringUtils.hasText(previousQuestion) ? previousQuestion.trim() : "(not provided)";

        return "You are an expert interviewer deciding whether a follow-up question is valuable.\n"
                + "Think like a real interviewer.\n"
                + "Do NOT ask follow-ups for every answer.\n"
                + "A follow-up is valuable only if the answer shows one of these:\n"
                + "- interesting technical reasoning\n"
                + "- a strong claim worth probing\n"
                + "- a trade-off decision\n"
                + "- implementation detail worth exploring\n"
                + "- vague/incomplete explanation worth clarifying\n\n"
                + "Interview stage: " + stageLine + "\n"
                + "Previous question:\n" + questionLine + "\n\n"
                + "Candidate answer:\n" + candidateAnswer.trim() + "\n\n"
                + "Choose EXACTLY one type from:\n"
                + "- NONE\n"
                + "- CLARIFICATION\n"
                + "- DEEP_DIVE\n"
                + "- CHALLENGE\n\n"
                + "Type meaning:\n"
                + "- NONE: move to next topic.\n"
                + "- CLARIFICATION: answer is vague or incomplete.\n"
                + "- DEEP_DIVE: answer contains an interesting concept to explore.\n"
                + "- CHALLENGE: probe trade-offs, edge cases, or reasoning depth.\n\n"
                + "Return STRICT JSON only:\n"
                + "{\n"
                + "  \"type\": \"NONE|CLARIFICATION|DEEP_DIVE|CHALLENGE\",\n"
                + "  \"reason\": \"short reason\"\n"
                + "}\n"
                + "No markdown. No extra text.";
    }

    private FollowUpDecision parseDecision(String rawResponse) {
        if (!StringUtils.hasText(rawResponse)) {
            return FALLBACK_NONE;
        }

        try {
            String json = extractJsonObject(rawResponse);
            JsonNode root = objectMapper.readTree(json);
            FollowUpType type = parseType(root.path("type").asText(null));
            String reason = normalizeReason(root.path("reason").asText(""));
            return new FollowUpDecision(type, reason);
        } catch (Exception ignored) {
            // Secondary parse: handle non-JSON responses robustly.
            FollowUpType type = parseType(rawResponse);
            return new FollowUpDecision(type, "Parsed from non-JSON classifier response.");
        }
    }

    private static FollowUpType parseType(String value) {
        if (!StringUtils.hasText(value)) {
            return FollowUpType.NONE;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (normalized.contains("CLARIFICATION")) {
            return FollowUpType.CLARIFICATION;
        }
        if (normalized.contains("DEEP_DIVE") || normalized.contains("DEEP DIVE")) {
            return FollowUpType.DEEP_DIVE;
        }
        if (normalized.contains("CHALLENGE")) {
            return FollowUpType.CHALLENGE;
        }
        if (normalized.contains("NONE")) {
            return FollowUpType.NONE;
        }
        return FollowUpType.NONE;
    }

    private static String normalizeReason(String reason) {
        if (StringUtils.hasText(reason)) {
            return reason.trim();
        }
        return "No reason provided by classifier.";
    }

    private static String extractJsonObject(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new IllegalStateException("No JSON object found in classifier response");
        }
        return cleaned.substring(start, end + 1);
    }

    private void logDecision(InterviewStage stage, FollowUpDecision decision) {
        String stageLine = stage != null ? stage.name() : "UNKNOWN";
        log.info("Follow-up classifier decision: stage={}, type={}", stageLine, decision.getType());
        log.info("Follow-up classifier reason: stage={}, reason={}", stageLine, decision.getReason());
    }
}
