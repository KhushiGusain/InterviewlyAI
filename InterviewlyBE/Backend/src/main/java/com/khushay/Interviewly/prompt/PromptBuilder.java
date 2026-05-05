package com.khushay.Interviewly.prompt;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
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
            String questionTypeHint) {
        List<String> areas = interview.getFocusAreas() != null ? interview.getFocusAreas() : List.of();
        String summary = interview.getResumeSummary() != null ? interview.getResumeSummary() : "";
        return buildQuestionPrompt(
                stage,
                interview.getRole(),
                interview.getCompany(),
                interview.getJobDescription(),
                areas,
                interview.getDifficulty(),
                summary,
                previousAnswer,
                candidate.getName(),
                previousQuestion,
                isFollowUp,
                questionHistory,
                questionTypeHint);
    }

    /**
     * Builds the full instruction prompt for OpenAI question generation.
     *
     * @param previousQuestion last question asked (optional); used to avoid repetition
     * @param isFollowUp       when {@code true} the model must emit a follow-up to {@code previousAnswer};
     *                         otherwise a new base question
     * @param questionHistory  last 2–3 questions already asked (newest first); may be null or empty
     * @param questionTypeHint target category for the current question. One of:
     *                         CONCEPT, PROBLEM_SOLVING, ROLE_BASED, SCENARIO, RESUME
     */
    public String buildQuestionPrompt(
            InterviewStage stage,
            String role,
            String company,
            String jobDescription,
            List<String> focusAreas,
            String difficulty,
            String resumeSummary,
            String previousAnswer,
            String userName,
            String previousQuestion,
            boolean isFollowUp,
            List<String> questionHistory,
            String questionTypeHint) {

        String name        = blankToPlaceholder(userName, "the candidate");
        String roleLine    = StringUtils.hasText(role)          ? role.trim()          : "(not specified)";
        String companyLine = StringUtils.hasText(company)       ? company.trim()       : null;
        String jdLine      = StringUtils.hasText(jobDescription) ? jobDescription.trim() : null;
        String diffLine    = StringUtils.hasText(difficulty)    ? difficulty.trim()    : "(not specified)";
        String resumeLine  = StringUtils.hasText(resumeSummary) ? resumeSummary.trim() : "(not provided)";
        List<String> areas = normalizeFocusAreas(focusAreas);

        StringBuilder sb = new StringBuilder(5120);

        // ── CONTEXT ──────────────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("INTERVIEW CONTEXT\n");
        sb.append("=====================================\n\n");
        sb.append("- Candidate name: ").append(name).append('\n');
        sb.append("- Role: ").append(roleLine).append('\n');
        if (companyLine != null) {
            sb.append("- Company: ").append(companyLine).append('\n');
        }
        if (jdLine != null) {
            sb.append("- Job description (prioritize these skills):\n  ").append(jdLine).append('\n');
        }
        sb.append("- Interview stage: ").append(stage.name()).append('\n');
        sb.append("- Difficulty: ").append(diffLine).append('\n');
        if (!areas.isEmpty()) {
            sb.append("- Focus areas: ").append(String.join(", ", areas)).append('\n');
        }
        sb.append('\n');

        // ── RESUME ───────────────────────────────────────────────────────────
        sb.append("RESUME SUMMARY\n");
        sb.append("-------------------------------------\n");
        sb.append(resumeLine).append('\n');
        sb.append('\n');
        sb.append("IMPORTANT — how to use the resume:\n");
        sb.append("- It is ONE source of context, not the only source.\n");
        sb.append("- Use it occasionally for project-based questions (max 1–2 per interview).\n");
        sb.append("- DO NOT base all questions on the resume.\n");
        sb.append("- Most questions should be conceptual, role-based, or scenario-based.\n\n");

        // ── PREVIOUS ANSWER ──────────────────────────────────────────────────
        if (StringUtils.hasText(previousAnswer)) {
            sb.append("CANDIDATE'S PREVIOUS ANSWER\n");
            sb.append("-------------------------------------\n");
            sb.append(previousAnswer.trim()).append('\n');
            sb.append('\n');
        }

        // ── AI ROLE ──────────────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("YOUR ROLE\n");
        sb.append("=====================================\n\n");
        sb.append("You are an experienced professional interviewer conducting a real, structured interview.\n");
        sb.append("- Be direct, professional, and concise.\n");
        sb.append("- Ask ONE question at a time.\n");
        sb.append("- Vary the type and depth of questions across the interview.\n\n");
        sb.append("- Questions should resemble real interview questions asked in actual companies.\n");
        sb.append("- Prefer practical, commonly asked questions over abstract or overly academic ones.\n\n");

        // ── INTERVIEW FLOW GUIDELINE ─────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("INTERVIEW FLOW GUIDELINE\n");
        sb.append("=====================================\n\n");
        sb.append("- Early questions should be easier and more introductory.\n");
        sb.append("- Gradually increase depth and difficulty as the interview progresses.\n");
        sb.append("- Move from general -> specific -> deep.\n");
        sb.append("- Do NOT start with very hard or niche questions.\n\n");

        // ── EVALUATION INTENT ────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("EVALUATION INTENT\n");
        sb.append("=====================================\n\n");
        sb.append("- Each question should clearly test a specific skill.\n");
        sb.append("- Possible skills to test:\n");
        sb.append("  - conceptual understanding\n");
        sb.append("  - problem-solving ability\n");
        sb.append("  - system thinking\n");
        sb.append("  - practical knowledge\n");
        sb.append("- Avoid vague or surface-level questions.\n\n");

        // ── COMPANY STYLE ALIGNMENT ──────────────────────────────────────────
        if (companyLine != null) {
            String companyLower = companyLine.toLowerCase();
            sb.append("=====================================\n");
            sb.append("COMPANY STYLE ALIGNMENT\n");
            sb.append("=====================================\n\n");
            sb.append("- Company context: ").append(companyLine).append('\n');
            sb.append("- Align question style with this company's interview expectations.\n");
            sb.append("- Example style references:\n");
            sb.append("  - Amazon -> practical, decision/trade-off driven questions.\n");
            sb.append("  - Google -> problem-solving and strong fundamentals.\n");
            sb.append("  - Startups -> system + implementation execution focus.\n");

            if (companyLower.contains("amazon")) {
                sb.append("- For this company, emphasize practical constraints and trade-off reasoning.\n");
            } else if (companyLower.contains("google")) {
                sb.append("- For this company, emphasize problem-solving depth and fundamentals.\n");
            } else if (companyLower.contains("startup")) {
                sb.append("- For this company, emphasize end-to-end system + implementation thinking.\n");
            } else {
                sb.append("- Adapt style to common patterns for this company while staying practical and role-relevant.\n");
            }
            sb.append('\n');
        }

        // ── STAGE RULES ───────────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("STAGE RULES\n");
        sb.append("=====================================\n\n");
        appendStageRules(sb, stage, areas, roleLine, jdLine);

        // ── QUESTION DIVERSITY ────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("QUESTION DISTRIBUTION RULES (IMPORTANT)\n");
        sb.append("=====================================\n\n");
        sb.append("Distribute questions across ALL of these categories — do NOT use only one:\n\n");
        sb.append("  1. Conceptual / theoretical  (OOP, DSA, design patterns, networking…)\n");
        sb.append("  2. Problem-solving / algorithmic  (time/space complexity, trade-offs…)\n");
        sb.append("  3. Role-based / JD-driven  (skills explicitly mentioned in the job description)\n");
        sb.append("  4. Scenario / system-design  (\"How would you design…\", \"What would you do if…\")\n");
        sb.append("  5. Resume / project-based  (max 1–2 questions across the ENTIRE interview)\n\n");
        sb.append("STRICT rules:\n");
        sb.append("- Do NOT ask multiple questions about the same project.\n");
        sb.append("- Do NOT repeat the same question structure (e.g. avoid repeating \"Explain how you used X in your project\").\n");
        sb.append("- If focus areas are provided, spread questions across their CONCEPTS, not just their project usage.\n\n");

        // ── CURRENT QUESTION TARGET ───────────────────────────────────────────
        String targetType = normalizeQuestionTypeHint(questionTypeHint);
        sb.append("=====================================\n");
        sb.append("CURRENT QUESTION TARGET\n");
        sb.append("=====================================\n\n");
        sb.append("- This question should be of type: ").append(targetType).append('\n');
        sb.append("- Follow this strictly.\n");
        sb.append("- Do NOT switch category.\n\n");

        // ── DIFFICULTY ENFORCEMENT ───────────────────────────────────────────
        String difficultyLevel = normalizeDifficultyHint(difficulty);
        sb.append("=====================================\n");
        sb.append("DIFFICULTY ENFORCEMENT\n");
        sb.append("=====================================\n\n");
        sb.append("- Current difficulty: ").append(difficultyLevel).append('\n');
        sb.append("- Apply these rules strictly:\n");
        switch (difficultyLevel) {
            case "EASY" -> {
                sb.append("  - Ask basic concepts and fundamentals.\n");
                sb.append("  - Keep scope simple; avoid deep multi-step complexity.\n");
            }
            case "MEDIUM" -> {
                sb.append("  - Mix concept understanding with practical application.\n");
                sb.append("  - Include moderate trade-offs or implementation reasoning.\n");
            }
            case "HARD" -> {
                sb.append("  - Ask for deeper reasoning and justification of choices.\n");
                sb.append("  - Include edge cases, constraints, and failure scenarios.\n");
                sb.append("  - Push toward system-level thinking and trade-offs.\n");
            }
        }
        sb.append('\n');

        // ── FOCUS AREA ENFORCEMENT ────────────────────────────────────────────
        if (!areas.isEmpty()) {
            sb.append("=====================================\n");
            sb.append("FOCUS AREA ENFORCEMENT\n");
            sb.append("=====================================\n\n");
            sb.append("Focus areas for THIS interview: ").append(String.join(", ", areas)).append('\n');
            sb.append('\n');
            sb.append("In the TECHNICAL stage, map each focus area to explicit question types.\n");
            sb.append("For each area, ask at least two different styles (not the same style repeatedly).\n\n");
            sb.append("Examples:\n");
            sb.append("- DSA:\n");
            sb.append("  - Ask about algorithms, complexity analysis, and edge cases.\n");
            sb.append("  - Ask problem-solving questions with constraints and trade-offs.\n");
            sb.append("- OOP:\n");
            sb.append("  - Ask about principles (encapsulation, abstraction, inheritance, polymorphism, SOLID).\n");
            sb.append("  - Ask design-based questions (modeling classes, choosing patterns, design trade-offs).\n");
            sb.append("- SYSTEM DESIGN / ARCHITECTURE:\n");
            sb.append("  - Ask about component design, scalability, reliability, and bottlenecks.\n");
            sb.append("  - Ask scenario-based design decisions and trade-offs.\n");
            sb.append("- DATABASE / SQL:\n");
            sb.append("  - Ask about schema design, indexing, query optimization, and transactions.\n");
            sb.append("  - Ask practical debugging/tuning scenarios.\n");
            sb.append("- API / BACKEND:\n");
            sb.append("  - Ask about REST conventions, validation, error handling, and security.\n");
            sb.append("  - Ask endpoint/system behavior under load and failure scenarios.\n");
            sb.append('\n');
            sb.append("DO NOT always relate focus areas to the candidate's past projects.\n");
            sb.append("Ensure variation within each focus area before moving on.\n");
            sb.append("Rotate across focus areas — do not hammer a single one repeatedly.\n\n");
        }

        // ── ROLE + JD ENFORCEMENT ─────────────────────────────────────────────
        if (InterviewStage.TECHNICAL.equals(stage)) {
            sb.append("=====================================\n");
            sb.append("ROLE + JD ENFORCEMENT (TECHNICAL STAGE)\n");
            sb.append("=====================================\n\n");
            sb.append("For the '").append(roleLine).append("' role, include questions covering:\n");
            if (jdLine != null) {
                sb.append("  - Skills and responsibilities from the job description (listed above).\n");
            }
            sb.append("  - Core expectations of this role (e.g. for Backend: APIs, databases, system design;\n");
            sb.append("    for Frontend: component architecture, performance, state management;\n");
            sb.append("    for Data: pipelines, SQL, ML concepts — adapt to the actual role).\n\n");
        }

        // ── FOLLOW-UP LOGIC ───────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("FOLLOW-UP LOGIC\n");
        sb.append("=====================================\n\n");
        sb.append("Follow-up should be asked ONLY if:\n");
        sb.append("- the answer introduces a strong technical concept worth deeper probing, OR\n");
        sb.append("- the answer mentions a clear decision, trade-off, or alternative comparison.\n");
        sb.append("- Otherwise, move to a new topic.\n");
        sb.append("- Avoid trivial follow-ups.\n\n");
        if (isFollowUp && StringUtils.hasText(previousAnswer)) {
            sb.append("This turn IS a follow-up.\n");
            sb.append("- The previous answer introduced a strong concept or trade-off worth exploring deeper.\n");
            sb.append("- Ask ONE focused follow-up anchored to what was just said.\n");
            sb.append("- The follow-up must test depth (reasoning, trade-off, edge case, or implementation detail).\n");
            sb.append("- After this follow-up, the interview will move to a NEW topic — so make this one count.\n");
            sb.append("- Do NOT ask generic prompts (e.g. \"can you explain more?\") unless tied to a specific claim.\n\n");
        } else {
            sb.append("This turn is a NEW BASE question.\n");
            sb.append("- Follow-ups should NOT happen for every answer.\n");
            sb.append("- Use a follow-up ONLY when the answer introduces a strong concept/trade-off worth probing.\n");
            sb.append("- After ONE follow-up per topic, always move to a new topic.\n");
            sb.append("- Open a fresh line of inquiry appropriate to the stage.\n");
            if (StringUtils.hasText(previousAnswer)) {
                sb.append("- If the previous answer is generic, shallow, or non-technical, do not probe it further.\n");
            }
            sb.append('\n');
        }

        // ── RECENT QUESTION HISTORY ───────────────────────────────────────────
        List<String> recentQuestions = (questionHistory != null && !questionHistory.isEmpty())
                ? questionHistory.stream()
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .limit(3)
                        .toList()
                : List.of();

        sb.append("=====================================\n");
        sb.append("RECENT QUESTIONS CONTEXT\n");
        sb.append("=====================================\n\n");
        if (recentQuestions.isEmpty()) {
            sb.append("Previously asked questions: (none yet — this is the start of the interview)\n\n");
        } else {
            sb.append("Previously asked questions (most recent first):\n");
            for (int i = 0; i < recentQuestions.size(); i++) {
                sb.append("  ").append(i + 1).append(". ").append(recentQuestions.get(i)).append('\n');
            }
            sb.append('\n');
        }
        sb.append("Instructions:\n");
        sb.append("- Analyze the topics and structure of the questions listed above.\n");
        sb.append("- The next question MUST explore a different dimension, concept, or topic.\n");
        sb.append("- Do NOT repeat a similar type of question (e.g. do not ask another project question\n");
        sb.append("  if the last one was project-based; do not ask another OOP question if one was just asked).\n");
        sb.append("- Ensure continuous variety and progression throughout the interview.\n\n");

        // ── ANTI-REPETITION ───────────────────────────────────────────────────
        sb.append("=====================================\n");
        sb.append("ANTI-REPETITION RULES\n");
        sb.append("=====================================\n\n");
        sb.append("- Do NOT ask multiple questions about the same project from the resume.\n");
        sb.append("- Do NOT repeat the same question structure or phrasing pattern.\n");
        sb.append("- Do NOT ask questions that are trivially similar to the previous question.\n");
        if (StringUtils.hasText(previousQuestion)) {
            sb.append("- The previous question was:\n  \"")
                    .append(previousQuestion.trim().replace("\"", "\\\""))
                    .append("\"\n");
            sb.append("  Do NOT repeat or lightly rephrase it.\n");
        }
        sb.append('\n');

        // ── OUTPUT RULES ──────────────────────────────────────────────────────
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

    private static void appendStageRules(StringBuilder sb, InterviewStage stage, List<String> areas,
            String role, String jdLine) {
        switch (stage) {
            case INTRO -> {
                sb.append("Stage: INTRO\n");
                sb.append("- Friendly, warm tone.\n");
                sb.append("- Greet the candidate by name.\n");
                sb.append("- Ask ONE light introduction or motivation question.\n");
                sb.append("  (e.g. \"Tell me about yourself\" or \"Why are you interested in this role?\")\n");
                sb.append("- Do NOT ask technical questions here.\n\n");
            }
            case TECHNICAL -> {
                sb.append("Stage: TECHNICAL\n");
                sb.append("- Ask technical questions only — no soft-skill or behavioral questions.\n");
                sb.append("- Spread questions across: concepts, problem-solving, role expectations");
                if (!areas.isEmpty()) {
                    sb.append(", and focus areas (").append(String.join(", ", areas)).append(")");
                }
                sb.append(".\n");
                sb.append("- At most 1 question may be project/resume-based.\n");
                sb.append("- Vary depth: start moderate, increase with each question.\n\n");
            }
            case BEHAVIORAL -> {
                sb.append("Stage: BEHAVIORAL\n");
                sb.append("- Experience-based questions: teamwork, conflict, decision-making, leadership, deadlines.\n");
                sb.append("- You may reference resume experience sparingly (max once).\n");
                sb.append("- Use STAR-style prompts where appropriate (Situation, Task, Action, Result).\n\n");
            }
            case END -> {
                sb.append("Stage: END\n");
                sb.append("- One brief, polite closing remark or question.\n");
                sb.append("- No new technical deep-dive.\n\n");
            }
        }
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

    private static String normalizeQuestionTypeHint(String value) {
        if (!StringUtils.hasText(value)) {
            return "CONCEPT";
        }
        return switch (value.trim().toUpperCase()) {
            case "CONCEPT", "PROBLEM_SOLVING", "ROLE_BASED", "SCENARIO", "RESUME" -> value.trim().toUpperCase();
            default -> "CONCEPT";
        };
    }

    private static String normalizeDifficultyHint(String value) {
        if (!StringUtils.hasText(value)) {
            return "MEDIUM";
        }
        return switch (value.trim().toUpperCase()) {
            case "EASY", "MEDIUM", "HARD" -> value.trim().toUpperCase();
            default -> "MEDIUM";
        };
    }
}
