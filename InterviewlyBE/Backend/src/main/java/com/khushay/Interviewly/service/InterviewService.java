package com.khushay.Interviewly.service;

import com.khushay.Interviewly.dto.EvaluationJob;
import com.khushay.Interviewly.dto.FollowUpDecision;
import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewPlanItem;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.FollowUpType;
import com.khushay.Interviewly.model.QuestionCategory;
import com.khushay.Interviewly.model.Response;
import com.khushay.Interviewly.model.User;
import com.khushay.Interviewly.prompt.PromptBuilder;
import com.khushay.Interviewly.repository.InterviewRepository;
import com.khushay.Interviewly.repository.ResponseRepository;
import com.khushay.Interviewly.util.ResumeMultipartFileHelper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewRepository interviewRepository;
    private final ResponseRepository responseRepository;
    private final ResumeParser resumeParser;
    private final ResumeSummarizer resumeSummarizer;
    private final OpenAIService openAIService;
    private final PromptBuilder promptBuilder;
    private final InterviewPlanService interviewPlanService;
    private final FollowUpClassifierService followUpClassifierService;
    private final FallbackQuestionService fallbackQuestionService;
    private final EvaluationQueueProducer evaluationQueueProducer;
    private final Map<UUID, List<InterviewStage>> interviewStagesInMemory = new ConcurrentHashMap<>();
    private final Map<UUID, List<InterviewPlanItem>> interviewPlansInMemory = new ConcurrentHashMap<>();
    private static final List<InterviewStage> STAGES = List.of(
            InterviewStage.INTRO,
            InterviewStage.TECHNICAL,
            InterviewStage.BEHAVIORAL,
            InterviewStage.END
    );

    @Transactional
    public UUID createInterview(
            String role,
            String company,
            String jobDescription,
            List<String> focusAreas,
            MultipartFile resume,
            User user
    ) {
        String normalizedRole = normalizeRequiredRole(role);

        String normalizedCompany = trimToNull(company);
        String normalizedJobDescription = trimToNull(jobDescription);
        List<String> normalizedFocusAreas = normalizeFocusAreas(focusAreas);

        String resumePath = null;
        if (resume != null && !resume.isEmpty()) {
            try {
                resumePath = ResumeMultipartFileHelper.save(resume);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume", e);
            }
        }

        Interview interview = new Interview();
        interview.setUser(user);
        interview.setRole(normalizedRole);
        interview.setCompany(normalizedCompany);
        interview.setJobDescription(normalizedJobDescription);
        interview.setFocusAreas(normalizedFocusAreas);
        interview.setResumePath(resumePath);
        interview.setStatus(Interview.STATUS_NOT_STARTED);
        interview.setCurrentStage(InterviewStage.INTRO);
        interview.setQuestionIndex(0);
        interview.setLastQuestionText(null);
        interview.setFollowUpsUsedInStage(0);
        interview.setFollowUpsIssuedForCurrentBase(0);
        interview.setCreatedAt(LocalDateTime.now());
        interview.setCompletedAt(null);

        ensureResumeSummaryGeneratedOnce(interview);

        interviewRepository.save(interview);
        interviewStagesInMemory.put(interview.getId(), STAGES);

        return interview.getId();
    }

    @Transactional
    public StartInterviewResponse getOrCreateInterviewSession(UUID interviewId, Long userId) {
        Interview interview = getOwnedInterviewOrThrow(interviewId, userId);

        if (Interview.STATUS_COMPLETED.equals(interview.getStatus())) {
            return new StartInterviewResponse(Interview.STATUS_COMPLETED, null, null);
        }

        if (Interview.STATUS_IN_PROGRESS.equals(interview.getStatus())) {
            return new StartInterviewResponse(
                    Interview.STATUS_IN_PROGRESS,
                    interview.getLastQuestionText(),
                    interview.getCurrentStage()
            );
        }

        if (!Interview.STATUS_NOT_STARTED.equals(interview.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Interview has invalid status for session retrieval");
        }

        List<InterviewStage> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> STAGES
        );

        ensureResumeSummaryGeneratedOnce(interview);

        interview.setStatus(Interview.STATUS_IN_PROGRESS);
        interview.setCurrentStage(stages.getFirst());
        interview.setQuestionIndex(0);
        interview.setFollowUpsUsedInStage(0);
        interview.setFollowUpsIssuedForCurrentBase(0);
        interview.setCompletedAt(null);
        interviewPlansInMemory.computeIfAbsent(interviewId, id -> interviewPlanService.buildInterviewPlan(interview));

        String firstQuestion = generateAiQuestion(interview, null, null, false, FollowUpType.NONE);
        interview.setLastQuestionText(firstQuestion);
        interview.setQuestionIndex(1);

        interviewRepository.save(interview);
        return new StartInterviewResponse(Interview.STATUS_IN_PROGRESS, firstQuestion, InterviewStage.INTRO);
    }

    @Transactional
    public AnswerResponse submitAnswer(UUID interviewId, Long userId, String answer) {
        Interview interview = getOwnedInterviewOrThrow(interviewId, userId);
        List<InterviewStage> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> STAGES
        );

        if (Interview.STATUS_COMPLETED.equals(interview.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview already completed");
        }

        if (!Interview.STATUS_IN_PROGRESS.equals(interview.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview is not in progress");
        }

        String previousQuestion = interview.getLastQuestionText();
        if (!StringUtils.hasText(previousQuestion)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start the interview before submitting answers");
        }

        InterviewStage currentStage = interview.getCurrentStage();
        if (currentStage == null) {
            currentStage = stages.getFirst();
            interview.setCurrentStage(currentStage);
        }

        String trimmedAnswer = trimToNull(answer);

        Response response = new Response();
        response.setInterview(interview);
        response.setQuestion(previousQuestion);
        response.setAnswer(trimmedAnswer);
        responseRepository.save(response);
        EvaluationJob evaluationJob = new EvaluationJob(response.getId(), interview.getId());
        publishEvaluationJobAfterCommit(evaluationJob);

        int maxBasesInStage = getMaxQuestionsForStage(currentStage);
        int baseQuestionsInStage = interview.getQuestionIndex();

        boolean followUpQuotaAvailable = interview.getFollowUpsIssuedForCurrentBase() < 1
                && interview.getFollowUpsUsedInStage() < 2;
        FollowUpDecision followUpDecision = (StringUtils.hasText(trimmedAnswer) && followUpQuotaAvailable)
                ? followUpClassifierService.classifyFollowUp(currentStage, previousQuestion, trimmedAnswer)
                : null;
        boolean nextIsFollowUp = followUpDecision != null
                && followUpDecision.getType() != null
                && !FollowUpType.NONE.equals(followUpDecision.getType());

        if (!nextIsFollowUp && baseQuestionsInStage >= maxBasesInStage) {
            int stageIndex = stages.indexOf(currentStage);
            if (stageIndex >= 0 && stageIndex < stages.size() - 1) {
                InterviewStage nextStage = stages.get(stageIndex + 1);
                if (InterviewStage.END.equals(nextStage)) {
                    interview.setCurrentStage(InterviewStage.END);
                    interview.setStatus(Interview.STATUS_COMPLETED);
                    interview.setCompletedAt(LocalDateTime.now());
                    interview.setLastQuestionText(null);
                    interview.setQuestionIndex(0);
                    interview.setFollowUpsUsedInStage(0);
                    interview.setFollowUpsIssuedForCurrentBase(0);
                    interviewStagesInMemory.remove(interviewId);
                    interviewPlansInMemory.remove(interviewId);
                    interviewRepository.save(interview);
                    return new AnswerResponse("END", InterviewStage.END);
                }
                interview.setCurrentStage(nextStage);
                interview.setFollowUpsUsedInStage(0);
                interview.setFollowUpsIssuedForCurrentBase(0);

                String firstOfNextStage = generateAiQuestion(interview, previousQuestion, trimmedAnswer, false, FollowUpType.NONE);
                interview.setLastQuestionText(firstOfNextStage);
                interview.setQuestionIndex(1);

                interviewRepository.save(interview);
                return new AnswerResponse(firstOfNextStage, nextStage);
            }
            interview.setCurrentStage(InterviewStage.END);
            interview.setStatus(Interview.STATUS_COMPLETED);
            interview.setCompletedAt(LocalDateTime.now());
            interview.setLastQuestionText(null);
            interview.setQuestionIndex(0);
            interview.setFollowUpsUsedInStage(0);
            interview.setFollowUpsIssuedForCurrentBase(0);
            interviewStagesInMemory.remove(interviewId);
            interviewPlansInMemory.remove(interviewId);
            interviewRepository.save(interview);
            return new AnswerResponse("END", InterviewStage.END);
        }

        FollowUpType followUpTypeForNextQuestion = nextIsFollowUp
                ? followUpDecision.getType()
                : FollowUpType.NONE;
        String nextQuestion = generateAiQuestion(
                interview,
                previousQuestion,
                trimmedAnswer,
                nextIsFollowUp,
                followUpTypeForNextQuestion
        );
        interview.setLastQuestionText(nextQuestion);
        if (!nextIsFollowUp) {
            interview.setQuestionIndex(baseQuestionsInStage + 1);
        }

        if (nextIsFollowUp) {
            interview.setFollowUpsIssuedForCurrentBase(1);
            interview.setFollowUpsUsedInStage(interview.getFollowUpsUsedInStage() + 1);
        } else {
            interview.setFollowUpsIssuedForCurrentBase(0);
        }

        interviewRepository.save(interview);
        return new AnswerResponse(nextQuestion, interview.getCurrentStage());
    }

    private Interview getOwnedInterviewOrThrow(UUID interviewId, Long userId) {
        return interviewRepository.findByIdAndUserId(interviewId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
    }

    private String generateAiQuestion(
            Interview interview,
            String previousQuestion,
            String previousAnswer,
            boolean isFollowUp,
            FollowUpType followUpType
    ) {
        QuestionCategory category = getCurrentPlanItem(interview)
                .map(InterviewPlanItem::getCategory)
                .orElseGet(() -> getFallbackCategoryForStage(interview));
        log.debug("Question category: {}", category);
        try {
            User candidate = interview.getUser();
            List<String> history = recentQuestionHistory(interview.getId());
            String prompt = promptBuilder.buildQuestionPrompt(
                    interview, candidate, interview.getCurrentStage(),
                    previousQuestion, previousAnswer, isFollowUp, history, category, followUpType);
            String question = openAIService.generateQuestion(prompt);
            interview.setLastQuestionType(category.name());
            return question;
        } catch (Exception ex) {
            log.warn("Question generation failed; using fallback. stage={}", interview.getCurrentStage(), ex);
            List<String> areas = interview.getFocusAreas() != null ? interview.getFocusAreas() : List.of();
            String fallbackQuestion = fallbackQuestionService.getFallbackQuestion(
                    interview.getCurrentStage(),
                    interview.getRole(),
                    areas,
                    previousAnswer,
                    safeCandidateName(interview),
                    isFollowUp,
                    fallbackRotationKey(interview, isFollowUp));
            interview.setLastQuestionType(category.name());
            return fallbackQuestion;
        }
    }

    /**
     * Resolves the current planned slot using the active stage and stage-local question index.
     * questionIndex tracks asked base questions in the stage, so the active item is index-1 (or 0 before first ask).
     */
    private Optional<InterviewPlanItem> getCurrentPlanItem(Interview interview) {
        if (interview == null || interview.getId() == null || interview.getCurrentStage() == null) {
            return Optional.empty();
        }
        List<InterviewPlanItem> plan = interviewPlansInMemory.computeIfAbsent(
                interview.getId(),
                id -> interviewPlanService.buildInterviewPlan(interview)
        );
        if (plan == null || plan.isEmpty()) {
            return Optional.empty();
        }

        List<InterviewPlanItem> stageItems = plan.stream()
                .filter(item -> interview.getCurrentStage().equals(item.getStage()))
                .collect(Collectors.toList());
        if (stageItems.isEmpty()) {
            return Optional.empty();
        }

        int stageQuestionIndex = interview.getQuestionIndex();
        int itemIndex = stageQuestionIndex <= 0 ? 0 : stageQuestionIndex - 1;
        if (itemIndex >= stageItems.size()) {
            itemIndex = stageItems.size() - 1;
        }
        return Optional.of(stageItems.get(itemIndex));
    }

    private QuestionCategory getFallbackCategoryForStage(Interview interview) {
        InterviewStage stage = interview.getCurrentStage();
        if (stage == null) {
            return QuestionCategory.INTRODUCTION;
        }
        return switch (stage) {
            case INTRO -> QuestionCategory.INTRODUCTION;
            case TECHNICAL -> QuestionCategory.ROLE_FUNDAMENTAL;
            case BEHAVIORAL -> QuestionCategory.TEAMWORK;
            case END -> QuestionCategory.END;
        };
    }

    /** Returns the last 3 question texts for the interview (newest first). */
    private List<String> recentQuestionHistory(UUID interviewId) {
        try {
            return responseRepository.findRecentQuestions(interviewId, PageRequest.of(0, 3));
        } catch (Exception ex) {
            log.warn("Could not load question history for interview {}: {}", interviewId, ex.getMessage());
            return List.of();
        }
    }

    private static String safeCandidateName(Interview interview) {
        try {
            User u = interview.getUser();
            return u != null && StringUtils.hasText(u.getName()) ? u.getName().trim() : "";
        } catch (Exception ignored) {
            return "";
        }
    }

    private static int fallbackRotationKey(Interview interview, boolean isFollowUp) {
        return interview.getQuestionIndex() * 11
                + interview.getFollowUpsUsedInStage() * 3
                + (isFollowUp ? 7 : 0)
                + interview.getCurrentStage().ordinal() * 5;
    }

    /**
     * Parses the stored PDF and calls OpenAI once to set {@link Interview#getResumeSummary()}. Skips if a value
     * was already persisted ({@code null} means never generated; empty string means generated but no usable text).
     */
    private void ensureResumeSummaryGeneratedOnce(Interview interview) {
        if (interview.getResumeSummary() != null) {
            return;
        }
        if (!StringUtils.hasText(interview.getResumePath())) {
            interview.setResumeSummary("");
            return;
        }
        String rawText = resumeParser.extractTextFromStoredPdf(interview.getResumePath());
        String summary = "";
        if (StringUtils.hasText(rawText)) {
            summary = resumeSummarizer.summarizeResume(rawText);
        }
        interview.setResumeSummary(summary);
    }

    private static String normalizeRequiredRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }
        return role.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static List<String> normalizeFocusAreas(List<String> focusAreas) {
        if (focusAreas == null || focusAreas.isEmpty()) {
            return new ArrayList<>();
        }
        return focusAreas.stream()
                .filter(s -> s != null)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static int getMaxQuestionsForStage(InterviewStage stage) {
        return switch (stage) {
            case INTRO -> 2;
            case TECHNICAL -> 5;
            case BEHAVIORAL -> 3;
            default -> 0;
        };
    }

    private void publishEvaluationJobAfterCommit(EvaluationJob job) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            evaluationQueueProducer.publishEvaluationJob(job);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                evaluationQueueProducer.publishEvaluationJob(job);
            }
        });
    }

    public record AnswerResponse(String question, InterviewStage stage) {}
    public record StartInterviewResponse(String status, String question, InterviewStage stage) {}

}
