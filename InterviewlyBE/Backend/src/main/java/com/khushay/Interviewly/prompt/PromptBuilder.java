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
        boolean isFirstIntroQuestion = currentCategory == QuestionCategory.INTRODUCTION
                && !isFollowUp
                && !StringUtils.hasText(previousQuestion)
                && (questionHistory == null || questionHistory.isEmpty());

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
        sb.append("- Generate exactly one question for this category.\n");
        sb.append("- ")
                .append(categoryInstruction(currentCategory, isFirstIntroQuestion))
                .append("\n\n");

        sb.append("=====================================\n");
        sb.append("REALISM\n");
        sb.append("=====================================\n\n");
        sb.append("- Questions should resemble actual interview questions asked in real companies.\n");
        sb.append("- Prefer practical and commonly tested concepts.\n");
        sb.append("- Avoid overly academic or artificial questions.\n");
        sb.append("- Keep questions concise and conversational.\n");
        sb.append("- Questions should feel interviewer-led, not AI-generated.\n");
        sb.append("- Avoid repetitive structures.\n");
        sb.append("- Avoid sounding like a questionnaire.\n\n");

        sb.append("=====================================\n");
        sb.append("CONVERSATIONAL VARIATION\n");
        sb.append("=====================================\n\n");
        sb.append("- Vary sentence openings naturally across questions.\n");
        sb.append("- Avoid repeating the same interviewer phrasing.\n");
        sb.append("- Occasionally use conversational transitions naturally.\n");
        sb.append("- Maintain a professional interviewer tone.\n");
        sb.append("- Keep wording concise and realistic.\n\n");

        sb.append("=====================================\n");
        sb.append("FOLLOW-UP LOGIC\n");
        sb.append("=====================================\n\n");
        sb.append("- Ask ONE focused question only.\n");
        if (isFollowUp && StringUtils.hasText(previousAnswer)) {
            FollowUpType currentFollowUpType = followUpType != null ? followUpType : FollowUpType.DEEP_DIVE;
            sb.append("- This turn is a follow-up.\n");
            sb.append("- Follow-up intent: ").append(currentFollowUpType.name()).append('\n');
            sb.append("- ").append(followUpIntentInstruction(currentFollowUpType)).append('\n');
            sb.append("- Make it a natural interviewer continuation of the candidate's answer.\n");
            sb.append("- Reference the candidate's specific claim/reasoning and probe deeper.\n");
            sb.append("- Clarify vague logic and challenge trade-offs when relevant.\n");
            sb.append("- Avoid generic probing, robotic wording, and repeated \"explain more\" phrasing.\n");
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
        sb.append("- Do NOT repeat topic, structure, intent, or wording from recent questions.\n");
        sb.append("- Prevent semantic repetition: avoid asking the same underlying question in rephrased form.\n");
        if (currentCategory == QuestionCategory.INTRODUCTION) {
            sb.append("- INTRODUCTION-specific prohibitions:\n");
            sb.append("  - Do NOT ask another self-introduction/background prompt after the first intro question.\n");
            sb.append("  - Do NOT ask software journey/motivation prompts more than once.\n");
            sb.append("  - Do NOT generate semantically equivalent intro prompts with different wording.\n");
        }
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

    private static String categoryInstruction(QuestionCategory category, boolean isFirstIntroQuestion) {
        return switch (category) {
            case INTRODUCTION -> isFirstIntroQuestion
                    ? "This is the FIRST intro question: greet the candidate naturally using their name and ask for a self-introduction/background in a warm professional tone; do not ask technical content."
                    : "This is a subsequent intro question: do NOT ask for self-introduction/background again, do NOT ask software journey/motivation again, and do NOT use semantically similar intro intent. Choose a distinct follow-up area only: internship/work experience, resume project discussion, favorite project, learning interests, career goals, or strengths/preferences. Keep it warm, concise, and non-technical.";
            case RESUME_EXPERIENCE -> "Ask about previous experience or a project from the resume.";
            case ROLE_FUNDAMENTAL -> "Ask one core fundamentals question relevant to the target role.";
            case ROLE_SCENARIO -> "Ask one practical role-based scenario and how they would handle it.";
            case DSA_CONCEPT -> "Ask a DSA concept question focused on reasoning and complexity awareness.";
            case DSA_PROBLEM -> "Ask a realistic DSA/coding problem that tests reasoning and complexity understanding.";
            case OOP_CONCEPT -> "Ask about one OOP principle and practical application.";
            case OOP_DESIGN -> "Ask a practical object-oriented design question.";
            case BACKEND_FUNDAMENTAL -> "Ask one backend fundamentals question (API, data flow, reliability, or security).";
            case BACKEND_SCENARIO -> "Ask a practical backend/API/system behavior scenario.";
            case FRONTEND_FUNDAMENTAL -> "Ask one frontend fundamentals question (state, rendering, performance, or UX).";
            case FRONTEND_SCENARIO -> "Ask a practical frontend product scenario with constraints.";
            case DATABASE_CONCEPT -> "Ask one database concept question (schema, indexing, transactions, or joins).";
            case DATABASE_SCENARIO -> "Ask a practical database/SQL scenario about debugging, scaling, or trade-offs.";
            case PROJECT_DEEP_DIVE -> "Ask a focused deep-dive on project decisions, implementation, or impact.";
            case TEAMWORK -> "Ask a collaboration/teamwork experience question.";
            case CONFLICT -> "Ask a behavioral conflict-resolution question.";
            case OWNERSHIP -> "Ask about accountability and ownership in a real situation.";
            case STRENGTH_WEAKNESS -> "Ask a candid strengths/weaknesses reflection question.";
            case FAILURE -> "Ask about a failure, mistake, or learning experience.";
            case LEADERSHIP -> "Ask a leadership/influence question with outcomes.";
            case END -> "Ask a brief and polite closing question/remark.";
        };
    }

    private static String followUpIntentInstruction(FollowUpType type) {
        return switch (type) {
            case CLARIFICATION -> "Style: ask a precise clarification for incomplete or vague reasoning.";
            case DEEP_DIVE -> "Style: probe deeper technical understanding and implementation details.";
            case CHALLENGE -> "Style: challenge claims via trade-offs, edge cases, constraints, or alternatives.";
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
