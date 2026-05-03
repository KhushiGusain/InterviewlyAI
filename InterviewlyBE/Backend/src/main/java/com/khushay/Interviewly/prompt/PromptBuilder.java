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
     * Builds the question prompt using interview state, including {@link Interview#getResumeSummary()} when set
     * (populated when the interview starts).
     */
    public String buildQuestionPrompt(
            Interview interview,
            User candidate,
            InterviewStage stage,
            String previousQuestion,
            String previousAnswer) {
        List<String> areas = interview.getFocusAreas() != null ? interview.getFocusAreas() : List.of();
        String summary = interview.getResumeSummary() != null ? interview.getResumeSummary() : "";
        return buildQuestionPrompt(
                candidate.getName(),
                interview.getRole(),
                interview.getCompany(),
                interview.getJobDescription(),
                stage,
                areas,
                interview.getDifficulty(),
                summary,
                previousQuestion,
                previousAnswer);
    }

    /**
     * Builds the full instruction prompt for generating the next interview question.
     *
     * @param previousQuestion last question asked (optional); used to avoid repetition
     * @param previousAnswer candidate's last answer (optional); used for natural follow-ups
     */
    public String buildQuestionPrompt(
            String candidateName,
            String role,
            String company,
            String jobDescription,
            InterviewStage stage,
            List<String> focusAreas,
            String difficulty,
            String resumeSummary,
            String previousQuestion,
            String previousAnswer) {

        String name = blankToPlaceholder(candidateName, "the candidate");
        String roleLine = StringUtils.hasText(role) ? role.trim() : "(not specified)";
        String companyLine = StringUtils.hasText(company) ? company.trim() : null;
        String jdLine = StringUtils.hasText(jobDescription) ? jobDescription.trim() : null;
        String difficultyLine = StringUtils.hasText(difficulty) ? difficulty.trim() : "(not specified)";
        String resumeLine =
                StringUtils.hasText(resumeSummary) ? resumeSummary.trim() : "(not provided — avoid inventing projects)";
        List<String> areas = normalizeFocusAreas(focusAreas);

        StringBuilder sb = new StringBuilder(4096);

        sb.append("-------------------------------------\n");
        sb.append("CONTEXT (MUST INCLUDE)\n");
        sb.append("-------------------------------------\n\n");
        sb.append("- Candidate name: ").append(name).append('\n');
        sb.append("- Role: ").append(roleLine).append('\n');
        if (companyLine != null) {
            sb.append("- Company: ").append(companyLine).append('\n');
        } else {
            sb.append("- Company: (not provided)\n");
        }
        if (jdLine != null) {
            sb.append("- Job description:\n").append(jdLine).append('\n');
        } else {
            sb.append("- Job description: (not provided)\n");
        }
        sb.append("- Interview stage: ").append(stage.name()).append('\n');
        if (!areas.isEmpty()) {
            sb.append("- Focus areas (MUST be emphasized): ")
                    .append(String.join(", ", areas))
                    .append('\n');
        } else {
            sb.append("- Focus areas: (none — use role and resume)\n");
        }
        sb.append("- Difficulty: ").append(difficultyLine).append('\n');
        sb.append("- Resume summary (VERY IMPORTANT — base experience questions on this):\n")
                .append(resumeLine)
                .append("\n\n");
        if (StringUtils.hasText(previousAnswer)) {
            sb.append("- Previous answer from the candidate:\n")
                    .append(previousAnswer.trim())
                    .append("\n\n");
        } else {
            sb.append("- Previous answer: (none — this is the first question or no prior answer)\n\n");
        }

        sb.append("-------------------------------------\n");
        sb.append("PROMPT STRUCTURE\n");
        sb.append("-------------------------------------\n\n");

        sb.append("1. Define AI clearly:\n\n");
        sb.append("You are an experienced professional interviewer conducting a real interview.\n\n");

        sb.append("2. PERSONALIZATION\n\n");
        sb.append("- Use the candidate's name naturally in the question when it fits.\n");
        sb.append("- Use the role to guide the domain and depth of questions.\n");
        if (companyLine != null) {
            sb.append("- Company is known: slightly align tone or examples with that context (do not assume unverified facts).\n");
        }
        if (jdLine != null) {
            sb.append("- Job description is present: prioritize skills and responsibilities mentioned there.\n");
        }
        sb.append("- Resume summary is critical: ask project- and experience-based questions grounded in it.\n\n");

        sb.append("3. STRICT STAGE CONTROL\n\n");
        appendStageRules(sb, stage);

        sb.append("4. FOCUS AREA ENFORCEMENT (IMPORTANT)\n\n");
        if (!areas.isEmpty()) {
            sb.append("Focus areas are NOT empty. Questions MUST be based on these topics in the TECHNICAL stage.\n");
            sb.append("Prioritize them over generic questions. If there are multiple focus areas, rotate or pick one topic for this question (do not cram all into one question).\n");
            sb.append("Example: if focus areas are [DSA, OOP], ask ONLY DSA/OOP-aligned questions in TECHNICAL — do NOT introduce unrelated topics.\n\n");
        } else {
            sb.append("No focus areas listed: derive topics from role, job description (if any), and resume summary.\n\n");
        }

        sb.append("5. FOLLOW-UP LOGIC (ADVANCED)\n\n");
        if (StringUtils.hasText(previousAnswer)) {
            sb.append("A previous answer exists. Briefly infer technologies (e.g. MongoDB, React), concepts (e.g. optimization, hashing), ");
            sb.append("and decisions (\"I chose X because...\") from that answer, then ask ONE deeper or related follow-up that feels natural, not forced.\n");
            sb.append("Examples: MongoDB → indexing, consistency, or scaling; \"optimized\" → how and why; \"hash map\" → complexity or alternatives.\n\n");
        } else {
            sb.append("No previous answer: do not fabricate a follow-up to a missing answer; open with an appropriate stage-aligned question.\n\n");
        }

        sb.append("6. OUTPUT RULES\n\n");
        sb.append("- Ask ONLY ONE question.\n");
        sb.append("- Keep it concise (1–2 lines max).\n");
        sb.append("- Natural, human-like tone.\n");
        if (StringUtils.hasText(previousQuestion)) {
            sb.append("- Do NOT repeat or lightly rephrase this previous question:\n  \"")
                    .append(previousQuestion.trim().replace("\"", "\\\""))
                    .append("\"\n");
        } else {
            sb.append("- Do NOT repeat a prior question if you were given one in context.\n");
        }
        sb.append("- Do NOT include explanations, preamble, or labels — only the question.\n\n");

        sb.append("-------------------------------------\n");
        sb.append("FINAL INSTRUCTION\n");
        sb.append("-------------------------------------\n\n");
        sb.append("Return ONLY the question text.\n");

        return sb.toString();
    }

    private static void appendStageRules(StringBuilder sb, InterviewStage stage) {
        switch (stage) {
            case INTRO -> sb.append("""
                    - INTRO stage:
                      - Friendly tone.
                      - Greet using the candidate's name when natural.
                      - Ask one introduction or motivation question (keep it light and professional).

                    """);
            case TECHNICAL -> sb.append("""
                    - TECHNICAL stage:
                      - MUST focus on: the role; focus areas (VERY IMPORTANT when listed); concrete projects from the resume summary when available.
                      - Do NOT ask behavioral or soft-skill-only questions here — stay technical.

                    """);
            case BEHAVIORAL -> sb.append("""
                    - BEHAVIORAL stage:
                      - Experience-based questions: teamwork, challenges, conflict, decision-making, leadership, communication.
                      - You may reference resume experience when it strengthens the question.

                    """);
            case END -> sb.append("""
                    - Interview is at END stage:
                      - One very brief, polite closing question or thank-you prompt (single line), no new technical deep-dive.

                    """);
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
}
