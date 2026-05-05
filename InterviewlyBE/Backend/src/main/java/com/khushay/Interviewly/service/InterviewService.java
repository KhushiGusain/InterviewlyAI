package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
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
    private final FallbackQuestionService fallbackQuestionService;
    private final Map<UUID, List<InterviewStage>> interviewStagesInMemory = new ConcurrentHashMap<>();

    @Transactional
    public UUID createInterview(
            String role,
            String company,
            String jobDescription,
            String interviewType,
            String difficulty,
            List<String> focusAreas,
            MultipartFile resume,
            User user
    ) {
        String normalizedRole = normalizeRequiredRole(role);

        String normalizedCompany = trimToNull(company);
        String normalizedJobDescription = trimToNull(jobDescription);
        String normalizedInterviewType = trimToNull(interviewType);
        String normalizedDifficulty = trimToNull(difficulty);
        List<String> normalizedFocusAreas = normalizeFocusAreas(focusAreas);

        if (resume == null || resume.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }

        String resumePath;
        try {
            resumePath = ResumeMultipartFileHelper.save(resume);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume", e);
        }

        Interview interview = new Interview();
        interview.setUser(user);
        interview.setRole(normalizedRole);
        interview.setCompany(normalizedCompany);
        interview.setJobDescription(normalizedJobDescription);
        interview.setInterviewType(normalizedInterviewType);
        interview.setDifficulty(normalizedDifficulty);
        interview.setFocusAreas(normalizedFocusAreas);
        interview.setResumePath(resumePath);
        interview.setStatus("CREATED");
        interview.setCurrentStage(InterviewStage.INTRO);
        interview.setQuestionIndex(0);
        interview.setLastQuestionText(null);
        interview.setFollowUpsUsedInStage(0);
        interview.setFollowUpsIssuedForCurrentBase(0);
        interview.setCreatedAt(LocalDateTime.now());

        ensureResumeSummaryGeneratedOnce(interview);

        interviewRepository.save(interview);
        interviewStagesInMemory.put(interview.getId(), stagesForInterviewType(normalizedInterviewType));

        return interview.getId();
    }

    @Transactional
    public String startInterview(UUID interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        List<InterviewStage> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> stagesForInterviewType(interview.getInterviewType())
        );

        ensureResumeSummaryGeneratedOnce(interview);

        interview.setStatus("IN_PROGRESS");
        interview.setCurrentStage(stages.getFirst());
        interview.setQuestionIndex(0);
        interview.setFollowUpsUsedInStage(0);
        interview.setFollowUpsIssuedForCurrentBase(0);

        String question = generateAiQuestion(interview, null, null, false);
        interview.setLastQuestionText(question);
        interview.setQuestionIndex(1);

        interviewRepository.save(interview);
        return question;
    }

    @Transactional
    public AnswerResponse submitAnswer(UUID interviewId, String answer) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        List<InterviewStage> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> stagesForInterviewType(interview.getInterviewType())
        );

        if (!"IN_PROGRESS".equals(interview.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview is not in progress");
        }

        String previousQuestion = interview.getLastQuestionText();
        if (!StringUtils.hasText(previousQuestion)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start the interview before submitting answers");
        }

        InterviewStage stageBeforeAnswer = interview.getCurrentStage();
        if (stageBeforeAnswer == null) {
            stageBeforeAnswer = stages.getFirst();
            interview.setCurrentStage(stageBeforeAnswer);
        }

        String trimmedAnswer = trimToNull(answer);

        Response response = new Response();
        response.setInterview(interview);
        response.setQuestion(previousQuestion);
        response.setAnswer(trimmedAnswer);
        responseRepository.save(response);

        int maxBasesInStage =
                InterviewStageBudget.maxQuestionsForStage(interview.getInterviewType(), stageBeforeAnswer);
        int baseQuestionsInStage = interview.getQuestionIndex();

        boolean allowFollowUp = StringUtils.hasText(trimmedAnswer)
                && shouldAskFollowUp(stageBeforeAnswer, trimmedAnswer)
                && interview.getFollowUpsIssuedForCurrentBase() < 1
                && interview.getFollowUpsUsedInStage() < 2;
        boolean nextIsFollowUp = allowFollowUp;

        if (!nextIsFollowUp && baseQuestionsInStage >= maxBasesInStage) {
            int stageIndex = stages.indexOf(stageBeforeAnswer);
            if (stageIndex >= 0 && stageIndex < stages.size() - 1) {
                InterviewStage nextStage = stages.get(stageIndex + 1);
                interview.setCurrentStage(nextStage);
                interview.setFollowUpsUsedInStage(0);
                interview.setFollowUpsIssuedForCurrentBase(0);

                String firstOfNextStage = generateAiQuestion(interview, previousQuestion, trimmedAnswer, false);
                interview.setLastQuestionText(firstOfNextStage);
                interview.setQuestionIndex(1);

                interviewRepository.save(interview);
                return new AnswerResponse(firstOfNextStage, nextStage);
            }
            interview.setCurrentStage(InterviewStage.END);
            interview.setStatus("COMPLETED");
            interview.setLastQuestionText(null);
            interview.setQuestionIndex(0);
            interview.setFollowUpsUsedInStage(0);
            interview.setFollowUpsIssuedForCurrentBase(0);
            interviewStagesInMemory.remove(interviewId);
            interviewRepository.save(interview);
            return new AnswerResponse("END", InterviewStage.END);
        }

        String nextQuestion = generateAiQuestion(interview, previousQuestion, trimmedAnswer, nextIsFollowUp);
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

    private String generateAiQuestion(
            Interview interview, String previousQuestion, String previousAnswer, boolean isFollowUp) {
        try {
            User candidate = interview.getUser();
            List<String> history = recentQuestionHistory(interview.getId());
            String questionTypeHint = resolveQuestionTypeHint(interview, isFollowUp);
            String prompt = promptBuilder.buildQuestionPrompt(
                    interview, candidate, interview.getCurrentStage(),
                    previousQuestion, previousAnswer, isFollowUp, history, questionTypeHint);
            return openAIService.generateQuestion(prompt);
        } catch (Exception ex) {
            log.warn("Question generation failed; using fallback. stage={}", interview.getCurrentStage(), ex);
            List<String> areas = interview.getFocusAreas() != null ? interview.getFocusAreas() : List.of();
            return fallbackQuestionService.getFallbackQuestion(
                    interview.getCurrentStage(),
                    interview.getRole(),
                    areas,
                    previousAnswer,
                    safeCandidateName(interview),
                    isFollowUp,
                    fallbackRotationKey(interview, isFollowUp));
        }
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

    private static String resolveQuestionTypeHint(Interview interview, boolean isFollowUp) {
        InterviewStage stage = interview.getCurrentStage();
        if (stage == null) {
            return "CONCEPT";
        }
        if (isFollowUp) {
            return "SCENARIO";
        }
        return switch (stage) {
            case INTRO -> "ROLE_BASED";
            case BEHAVIORAL, END -> "SCENARIO";
            case TECHNICAL -> {
                String[] order = {"CONCEPT", "PROBLEM_SOLVING", "ROLE_BASED", "SCENARIO", "RESUME"};
                int index = Math.max(0, interview.getQuestionIndex() - 1);
                yield order[index % order.length];
            }
        };
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
     * Follow-up is allowed only when the answer likely contains a deeper technical concept
     * or an explicit decision/trade-off signal.
     */
    private static boolean shouldAskFollowUp(InterviewStage stage, String answer) {
        if (!StringUtils.hasText(answer)) {
            return false;
        }
        String normalized = answer.toLowerCase(Locale.ROOT);

        boolean hasTradeoffSignal = containsAny(normalized,
                "trade-off", "tradeoff", "instead of", "rather than", "because", "pros and cons",
                "latency", "throughput", "scalability", "consistency", "availability");

        boolean hasTechnicalConcept = containsAny(normalized,
                "algorithm", "complexity", "big-o", "o(", "memory", "cpu", "cache", "index",
                "database", "query", "api", "microservice", "thread", "concurrency",
                "synchronization", "architecture", "design pattern", "encapsulation", "polymorphism",
                "inheritance", "abstraction", "solid", "edge case", "failure", "retry");

        // In non-technical stages, require a stronger decision/trade-off signal for follow-ups.
        if (!InterviewStage.TECHNICAL.equals(stage)) {
            return hasTradeoffSignal;
        }
        return hasTradeoffSignal || hasTechnicalConcept;
    }

    private static boolean containsAny(String text, String... markers) {
        for (String marker : markers) {
            if (text.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parses the stored PDF and calls OpenAI once to set {@link Interview#getResumeSummary()}. Skips if a value
     * was already persisted ({@code null} means never generated; empty string means generated but no usable text).
     */
    private void ensureResumeSummaryGeneratedOnce(Interview interview) {
        if (interview.getResumeSummary() != null) {
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

    private static List<InterviewStage> stagesForInterviewType(String interviewType) {
        String normalizedType = interviewType == null ? "" : interviewType.trim().toUpperCase(Locale.ROOT);
        if ("TECHNICAL".equals(normalizedType)) {
            return List.of(InterviewStage.INTRO, InterviewStage.TECHNICAL);
        }
        if ("BEHAVIORAL".equals(normalizedType)) {
            return List.of(InterviewStage.INTRO, InterviewStage.BEHAVIORAL);
        }
        return List.of(InterviewStage.INTRO, InterviewStage.TECHNICAL, InterviewStage.BEHAVIORAL);
    }

    public record AnswerResponse(String question, InterviewStage stage) {}

}
