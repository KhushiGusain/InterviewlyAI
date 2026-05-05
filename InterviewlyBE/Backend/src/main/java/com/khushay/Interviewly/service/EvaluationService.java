package com.khushay.Interviewly.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khushay.Interviewly.dto.EvaluationResult;
import com.khushay.Interviewly.model.Evaluation;
import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.Response;
import com.khushay.Interviewly.repository.EvaluationRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    public static final EvaluationResult FALLBACK_RESULT =
            new EvaluationResult(5, "Could not evaluate", "Try to be clearer");
    private static final Logger log = LoggerFactory.getLogger(EvaluationService.class);

    private final OpenAIService openAIService;
    private final ObjectMapper objectMapper;
    private final EvaluationRepository evaluationRepository;

    public EvaluationResult evaluateAnswer(
            String question,
            String answer,
            String role,
            List<String> focusAreas
    ) {
        if (!StringUtils.hasText(question)) {
            throw new IllegalArgumentException("question is required");
        }
        if (!StringUtils.hasText(answer)) {
            throw new IllegalArgumentException("answer is required");
        }

        String prompt = buildPrompt(question, answer, role, focusAreas);
        String rawResponse = openAIService.generateTextResponse(prompt);
        return parseEvaluationResult(rawResponse);
    }

    @Async
    public void evaluateAndSave(Response response, Interview interview) {
        if (response == null) {
            throw new IllegalArgumentException("response is required");
        }
        if (interview == null) {
            throw new IllegalArgumentException("interview is required");
        }
        log.info("Starting evaluation for responseId: {}", response.getId());

        EvaluationResult result = evaluateAnswer(
                response.getQuestion(),
                response.getAnswer(),
                interview.getRole(),
                interview.getFocusAreas());

        Evaluation evaluation = new Evaluation();
        evaluation.setResponse(response);
        evaluation.setScore(result.getScore());
        evaluation.setStrengths(result.getStrengths());
        evaluation.setImprovements(result.getImprovements());
        evaluationRepository.save(evaluation);
        log.info("Evaluation completed for responseId: {}", response.getId());
    }

    private String buildPrompt(String question, String answer, String role, List<String> focusAreas) {
        String roleLine = StringUtils.hasText(role) ? role.trim() : "(not specified)";
        String focusLine = (focusAreas == null || focusAreas.isEmpty())
                ? "(not specified)"
                : focusAreas.stream()
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .toList()
                        .toString();

        return "You are a technical interviewer evaluating a candidate's answer.\n\n"
                + "Role:\n"
                + roleLine + "\n\n"
                + "Focus Areas:\n"
                + focusLine + "\n\n"
                + "Question:\n"
                + question.trim() + "\n\n"
                + "Answer:\n"
                + answer.trim() + "\n\n"
                + "Evaluate based on:\n"
                + "- correctness\n"
                + "- clarity\n"
                + "- depth\n"
                + "- relevance\n\n"
                + "Strict scoring rubric (0-10):\n"
                + "- 0-2: non-answer, irrelevant, or just repeats/paraphrases the question.\n"
                + "- 3-4: very shallow answer with minimal technical substance.\n"
                + "- 5-6: partially correct but limited depth or clarity.\n"
                + "- 7-8: solid and mostly correct with good technical detail.\n"
                + "- 9-10: highly accurate, deep, and well-structured with strong reasoning/trade-offs.\n\n"
                + "Critical evaluation rules:\n"
                + "- Base your judgment ONLY on the provided answer text.\n"
                + "- Do NOT assume unstated details.\n"
                + "- If the candidate echoes the question, rephrases it, or gives generic filler,\n"
                + "  treat it as a weak/non-answer and assign a low score (typically 0-3).\n"
                + "- strengths/improvements must reflect what is actually present/missing in this answer.\n\n"
                + "Return STRICT JSON:\n"
                + "{\n"
                + "  \"score\": number (0-10),\n"
                + "  \"strengths\": \"short text\",\n"
                + "  \"improvements\": \"short text\"\n"
                + "}\n"

                + "Do not include markdown or explanation outside JSON.";
    }

    private EvaluationResult parseEvaluationResult(String rawResponse) {
        if (!StringUtils.hasText(rawResponse)) {
            return FALLBACK_RESULT;
        }

        try {
            String jsonPayload = extractJsonObject(rawResponse);
            JsonNode root = objectMapper.readTree(jsonPayload);
            int score = root.path("score").asInt(-1);
            if (score < 0 || score > 10) {
                return FALLBACK_RESULT;
            }

            String strengths = root.path("strengths").asText("").trim();
            String improvements = root.path("improvements").asText("").trim();

            if (!StringUtils.hasText(strengths) || !StringUtils.hasText(improvements)) {
                return FALLBACK_RESULT;
            }

            return new EvaluationResult(score, strengths, improvements);
        } catch (Exception ignored) {
            return FALLBACK_RESULT;
        }
    }

    private static String extractJsonObject(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new IllegalStateException("No JSON object found in evaluation response");
        }
        return cleaned.substring(start, end + 1);
    }
}
