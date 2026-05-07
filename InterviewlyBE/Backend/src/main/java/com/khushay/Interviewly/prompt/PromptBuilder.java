package com.khushay.Interviewly.prompt;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.FollowUpType;
import com.khushay.Interviewly.model.QuestionCategory;
import com.khushay.Interviewly.model.User;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class PromptBuilder {

    /**
     * Convenience overload: pulls all fields from {@code interview} and {@code candidate}.
     *
     * @param previousQuestion last question shown (anti-repeat); may be null on first question
     * @param questionHistory  last 2–3 questions already asked (newest first); may be empty
     */
    public String buildQuestionPrompt(
            Interview interview,
            User candidate,
            InterviewStage stage,
            String previousQuestion,
            String previousAnswer,
            boolean isFollowUp,
            List<String> questionHistory,
            QuestionCategory category,
            FollowUpType followUpType) {
        List<String> areas = interview.getFocusAreas() != null ? interview.getFocusAreas() : List.of();
        String summary = interview.getResumeSummary() != null ? interview.getResumeSummary() : "";
        return buildQuestionPrompt(
                stage,
                interview.getRole(),
                interview.getCompany(),
                interview.getJobDescription(),
                areas,
                summary,
                previousAnswer,
                candidate.getName(),
                previousQuestion,
                isFollowUp,
                questionHistory,
                category,
                followUpType);
    }

    /**
     * Builds the full instruction prompt for OpenAI question generation.
     *
     * @param previousQuestion last question asked (optional); used to avoid repetition
     * @param isFollowUp       when {@code true} the model must emit a follow-up to {@code previousAnswer};
     *                         otherwise a new base question
     * @param questionHistory  last 2–3 questions already asked (newest first); may be null or empty
     * @param category target question category from the interview plan.
     */
    public String buildQuestionPrompt(
            InterviewStage stage,
            String role,
            String company,
            String jobDescription,
            List<String> focusAreas,
            String resumeSummary,
            String previousAnswer,
            String userName,
            String previousQuestion,
            boolean isFollowUp,
            List<String> questionHistory,
            QuestionCategory category,
            FollowUpType followUpType) {

        String name = blankToPlaceholder(userName, "the candidate");
        String roleLine = StringUtils.hasText(role) ? role.trim() : "(not specified)";
        String companyLine = StringUtils.hasText(company) ? company.trim() : null;
        String jdLine = StringUtils.hasText(jobDescription) ? jobDescription.trim() : null;
        String resumeLine = StringUtils.hasText(resumeSummary) ? resumeSummary.trim() : "(not provided)";
        List<String> areas = normalizeFocusAreas(focusAreas);
        QuestionCategory currentCategory = category != null ? category : QuestionCategory.ROLE_FUNDAMENTAL;

        StringBuilder sb = new StringBuilder(2600);

        sb.append("=====================================\n");
        sb.append("INTERVIEW CONTEXT\n");
        sb.append("=====================================\n\n");
        sb.append("- Candidate name: ").append(name).append('\n');
        sb.append("- Role: ").append(roleLine).append('\n');
        sb.append("- Interview stage: ").append(stage.name()).append('\n');
        if (companyLine != null) {
            sb.append("- Company: ").append(companyLine).append('\n');
        }
        if (jdLine != null) {
            sb.append("- Job description summary:\n  ").append(jdLine).append('\n');
        }
        if (!areas.isEmpty()) {
            sb.append("- Focus areas: ").append(String.join(", ", areas)).append('\n');
        }
        sb.append("- Resume summary: ").append(resumeLine).append("\n\n");

        sb.append("=====================================\n");
        sb.append("STAGE RULES\n");
        sb.append("=====================================\n\n");
        sb.append("- You MUST strictly follow the current stage.\n");
        sb.append("- INTRO: only introduction-style questions.\n");
        sb.append("- TECHNICAL: only technical/role/problem questions.\n");
        sb.append("- BEHAVIORAL: only behavior/situational questions.\n");
        sb.append("- END: only a short closing question/remark.\n\n");

        sb.append("=====================================\n");
        sb.append("CURRENT QUESTION CATEGORY\n");
        sb.append("=====================================\n\n");
        sb.append("- Category: ").append(currentCategory.name()).append('\n');
        sb.append("- Do NOT change category.\n");
        sb.append("- ").append(categoryInstruction(currentCategory)).append("\n\n");

        sb.append("=====================================\n");
        sb.append("FOLLOW-UP LOGIC\n");
        sb.append("=====================================\n\n");
        sb.append("- Ask ONE focused question only.\n");
        if (isFollowUp && StringUtils.hasText(previousAnswer)) {
            FollowUpType currentFollowUpType = followUpType != null ? followUpType : FollowUpType.DEEP_DIVE;
            sb.append("- This turn is a follow-up.\n");
            sb.append("- Follow-up intent: ").append(currentFollowUpType.name()).append('\n');
            sb.append("- ").append(followUpIntentInstruction(currentFollowUpType)).append('\n');
            sb.append("- Sound conversational and interviewer-like, not robotic.\n");
            sb.append("- Do NOT use generic probes like \"Can you explain more?\".\n");
            sb.append("- Reference specific claims, reasoning, implementation choices, or trade-offs from the answer.\n");
            sb.append("- Keep the follow-up concise and natural.\n");
            sb.append("- This is the only follow-up for this topic; after this, move to the next planned topic.\n");
            sb.append("- Previous answer:\n  ").append(previousAnswer.trim()).append("\n\n");
        } else {
            sb.append("- This turn is a new base question.\n");
            sb.append("- Keep it realistic, role-relevant, and naturally worded.\n\n");
        }

        List<String> recentQuestions = (questionHistory != null && !questionHistory.isEmpty())
                ? questionHistory.stream()
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .limit(3)
                        .toList()
                : List.of();

        sb.append("=====================================\n");
        sb.append("ANTI-REPETITION\n");
        sb.append("=====================================\n\n");
        sb.append("- Do NOT repeat topic, structure, or wording from recent questions.\n");
        if (!recentQuestions.isEmpty()) {
            sb.append("- Recent questions (most recent first):\n");
            for (int i = 0; i < recentQuestions.size(); i++) {
                sb.append("  ").append(i + 1).append(". ").append(recentQuestions.get(i)).append('\n');
            }
        }
        if (StringUtils.hasText(previousQuestion)) {
            sb.append("- Previous question:\n  \"")
                    .append(previousQuestion.trim().replace("\"", "\\\""))
                    .append("\"\n");
        }
        sb.append('\n');

        sb.append("=====================================\n");
        sb.append("OUTPUT RULES (STRICT)\n");
        sb.append("=====================================\n\n");
        sb.append("- Return ONLY the question text — nothing else.\n");
        sb.append("- ONE question only.\n");
        sb.append("- 1–2 lines maximum.\n");
        sb.append("- Natural, human-like, professional tone.\n");
        sb.append("- No preamble, no labels, no explanations.\n\n");

        sb.append("Return ONLY the question text.\n");

        return sb.toString();
    }

    private static String categoryInstruction(QuestionCategory category) {
        return switch (category) {
            case INTRODUCTION -> "Ask a warm, brief introduction question.";
            case RESUME_EXPERIENCE -> "Ask about past experience from resume in a concrete way.";
            case ROLE_FUNDAMENTAL -> "Ask a core fundamentals question for the target role.";
            case ROLE_SCENARIO -> "Ask a practical role-based scenario question.";
            case DSA_CONCEPT -> "Ask a DSA concept question (complexity, data structures, trade-offs).";
            case DSA_PROBLEM -> "Ask a realistic coding/problem-solving interview question.";
            case OOP_CONCEPT -> "Ask an OOP principle question (encapsulation, abstraction, SOLID, etc.).";
            case OOP_DESIGN -> "Ask an object-oriented design question with trade-offs.";
            case BACKEND_FUNDAMENTAL -> "Ask backend fundamentals (APIs, architecture, reliability, security).";
            case BACKEND_SCENARIO -> "Ask a backend production scenario with constraints.";
            case FRONTEND_FUNDAMENTAL -> "Ask frontend fundamentals (state, rendering, performance, UX basics).";
            case FRONTEND_SCENARIO -> "Ask a frontend scenario question with real product constraints.";
            case DATABASE_CONCEPT -> "Ask a database concept question (indexing, transactions, schema, joins).";
            case DATABASE_SCENARIO -> "Ask a practical SQL/database troubleshooting or design scenario.";
            case PROJECT_DEEP_DIVE -> "Ask one focused deep-dive question on architecture/decisions/impact.";
            case TEAMWORK -> "Ask a behavioral teamwork question with a real example.";
            case CONFLICT -> "Ask a behavioral conflict-resolution question.";
            case OWNERSHIP -> "Ask about accountability and ownership in a real situation.";
            case STRENGTH_WEAKNESS -> "Ask a candid strengths/weaknesses reflection question.";
            case FAILURE -> "Ask about a failure, learning, and corrective actions.";
            case LEADERSHIP -> "Ask a leadership/influence question with outcomes.";
            case END -> "Ask a brief and polite closing question/remark.";
        };
    }

    private static String followUpIntentInstruction(FollowUpType type) {
        return switch (type) {
            case CLARIFICATION -> "Ask a precise clarification about the incomplete or vague part of the answer.";
            case DEEP_DIVE -> "Probe deeper technical understanding through concrete implementation or reasoning details.";
            case CHALLENGE -> "Challenge the claim using trade-offs, edge cases, alternatives, or constraints.";
            case NONE -> "No follow-up intent; move to the next topic.";
        };
    }

    private static String blankToPlaceholder(String value, String placeholder) {
        return StringUtils.hasText(value) ? value.trim() : placeholder;
    }

    private static List<String> normalizeFocusAreas(List<String> focusAreas) {
        if (focusAreas == null || focusAreas.isEmpty()) {
            return List.of();
        }
        return focusAreas.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }

}
