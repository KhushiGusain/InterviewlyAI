package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewPlanItem;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.QuestionCategory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Builds an ordered interview plan used for question rotation before an interview starts.
 */
@Service
public class InterviewPlanService {

    public List<InterviewPlanItem> buildInterviewPlan(Interview interview) {
        List<InterviewPlanItem> plan = new ArrayList<>();
        Set<QuestionCategory> addedCategories = new LinkedHashSet<>();

        addIntroStage(plan, addedCategories, interview);
        addTechnicalStage(plan, addedCategories, interview);
        addBehavioralStage(plan, addedCategories);
        addPlanItem(plan, addedCategories, InterviewStage.END, QuestionCategory.END, "Interview wrap-up");

        return plan;
    }

    private void addIntroStage(List<InterviewPlanItem> plan, Set<QuestionCategory> addedCategories, Interview interview) {
        addPlanItem(
                plan,
                addedCategories,
                InterviewStage.INTRO,
                QuestionCategory.INTRODUCTION,
                "Warm-up and interview context setting"
        );

        QuestionCategory secondIntroCategory = hasResume(interview)
                ? QuestionCategory.RESUME_EXPERIENCE
                : QuestionCategory.ROLE_FUNDAMENTAL;

        String secondIntroFocus = hasResume(interview)
                ? "Resume-backed experience overview"
                : "Role basics and expectations";

        addPlanItem(plan, addedCategories, InterviewStage.INTRO, secondIntroCategory, secondIntroFocus);
    }

    private void addTechnicalStage(List<InterviewPlanItem> plan, Set<QuestionCategory> addedCategories, Interview interview) {
        String role = safeValue(interview.getRole());
        String company = safeValue(interview.getCompany());
        String jd = safeValue(interview.getJobDescription());
        String focusContext = buildFocusContext(interview.getFocusAreas());

        String roleFundamentalFocus = composeFocus("Role fundamentals", role, company, jd);
        String roleScenarioFocus = composeFocus("Role scenario and decisions", role, company, jd);
        addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.ROLE_FUNDAMENTAL, roleFundamentalFocus);
        addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.ROLE_SCENARIO, roleScenarioFocus);

        String topicCorpus = (role + " " + focusContext + " " + company + " " + jd).toLowerCase(Locale.ROOT);
        addFocusAreaDrivenCategories(plan, addedCategories, topicCorpus, focusContext, role, company, jd);

        if (shouldAddProjectDeepDive(interview, topicCorpus)) {
            addPlanItem(
                    plan,
                    addedCategories,
                    InterviewStage.TECHNICAL,
                    QuestionCategory.PROJECT_DEEP_DIVE,
                    composeFocus("Project architecture and trade-offs", role, company, jd)
            );
        }
    }

    private void addFocusAreaDrivenCategories(
            List<InterviewPlanItem> plan,
            Set<QuestionCategory> addedCategories,
            String topicCorpus,
            String focusContext,
            String role,
            String company,
            String jd
    ) {
        if (containsAny(topicCorpus, "dsa", "data structure", "algorithm", "problem solving", "competitive")) {
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.DSA_CONCEPT,
                    composeFocus("DSA concepts", role, company, jd, focusContext));
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.DSA_PROBLEM,
                    composeFocus("DSA live problem solving", role, company, jd, focusContext));
        }

        if (containsAny(topicCorpus, "oop", "object oriented", "solid", "design pattern", "class design")) {
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.OOP_CONCEPT,
                    composeFocus("OOP foundations", role, company, jd, focusContext));
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.OOP_DESIGN,
                    composeFocus("OOP design trade-offs", role, company, jd, focusContext));
        }

        if (containsAny(topicCorpus, "backend", "api", "microservice", "server", "spring", "distributed")) {
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.BACKEND_FUNDAMENTAL,
                    composeFocus("Backend fundamentals", role, company, jd, focusContext));
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.BACKEND_SCENARIO,
                    composeFocus("Backend scenario and scaling", role, company, jd, focusContext));
        }

        if (containsAny(topicCorpus, "frontend", "react", "angular", "vue", "ui", "ux", "javascript", "typescript")) {
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.FRONTEND_FUNDAMENTAL,
                    composeFocus("Frontend foundations", role, company, jd, focusContext));
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.FRONTEND_SCENARIO,
                    composeFocus("Frontend scenario and trade-offs", role, company, jd, focusContext));
        }

        if (containsAny(topicCorpus, "database", "sql", "postgres", "mysql", "query", "index", "nosql")) {
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.DATABASE_CONCEPT,
                    composeFocus("Database concepts", role, company, jd, focusContext));
            addPlanItem(plan, addedCategories, InterviewStage.TECHNICAL, QuestionCategory.DATABASE_SCENARIO,
                    composeFocus("Database scenarios and optimization", role, company, jd, focusContext));
        }
    }

    private void addBehavioralStage(List<InterviewPlanItem> plan, Set<QuestionCategory> addedCategories) {
        addPlanItem(plan, addedCategories, InterviewStage.BEHAVIORAL, QuestionCategory.TEAMWORK, "Collaboration and cross-team work");
        addPlanItem(plan, addedCategories, InterviewStage.BEHAVIORAL, QuestionCategory.CONFLICT, "Conflict resolution approach");
        addPlanItem(plan, addedCategories, InterviewStage.BEHAVIORAL, QuestionCategory.OWNERSHIP, "Ownership and accountability");
        addPlanItem(plan, addedCategories, InterviewStage.BEHAVIORAL, QuestionCategory.STRENGTH_WEAKNESS, "Self-awareness and growth mindset");
        addPlanItem(plan, addedCategories, InterviewStage.BEHAVIORAL, QuestionCategory.FAILURE, "Learning from setbacks");
        addPlanItem(plan, addedCategories, InterviewStage.BEHAVIORAL, QuestionCategory.LEADERSHIP, "Leadership and influence");
    }

    /**
     * Adds an item only if the category has not already been used in the plan.
     */
    private void addPlanItem(
            List<InterviewPlanItem> plan,
            Set<QuestionCategory> addedCategories,
            InterviewStage stage,
            QuestionCategory category,
            String focusArea
    ) {
        if (!addedCategories.add(category)) {
            return;
        }
        plan.add(new InterviewPlanItem(stage, category, focusArea));
    }

    private static boolean hasResume(Interview interview) {
        return StringUtils.hasText(interview.getResumePath()) || StringUtils.hasText(interview.getResumeSummary());
    }

    private static boolean shouldAddProjectDeepDive(Interview interview, String topicCorpus) {
        if (hasResume(interview)) {
            return true;
        }
        return containsAny(topicCorpus, "project", "architecture", "system design", "ownership", "impact");
    }

    private static String buildFocusContext(List<String> focusAreas) {
        if (focusAreas == null || focusAreas.isEmpty()) {
            return "";
        }
        return focusAreas.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private static String composeFocus(String base, String role, String company, String jd) {
        return composeFocus(base, role, company, jd, "");
    }

    private static String composeFocus(String base, String role, String company, String jd, String focusAreas) {
        List<String> parts = new ArrayList<>();
        parts.add(base);
        if (StringUtils.hasText(role)) {
            parts.add("Role: " + role);
        }
        if (StringUtils.hasText(focusAreas)) {
            parts.add("Focus: " + focusAreas);
        }
        if (StringUtils.hasText(company)) {
            parts.add("Company: " + company);
        }
        if (StringUtils.hasText(jd)) {
            parts.add("JD-informed");
        }
        return String.join(" | ", parts);
    }

    private static String safeValue(String value) {
        return value == null ? "" : value.trim();
    }

    private static boolean containsAny(String text, String... markers) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        for (String marker : markers) {
            if (text.contains(marker)) {
                return true;
            }
        }
        return false;
    }
}
