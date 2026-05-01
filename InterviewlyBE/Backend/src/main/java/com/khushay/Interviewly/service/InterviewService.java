package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.Response;
import com.khushay.Interviewly.model.User;
import com.khushay.Interviewly.repository.InterviewRepository;
import com.khushay.Interviewly.repository.ResponseRepository;
import com.khushay.Interviewly.util.ResumeMultipartFileHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ResponseRepository responseRepository;
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
        interview.setCreatedAt(LocalDateTime.now());

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

        interview.setStatus("IN_PROGRESS");
        interview.setCurrentStage(stages.getFirst());
        interview.setQuestionIndex(1);

        interviewRepository.save(interview);
        return QuestionBank.getQuestion(
                interview.getCurrentStage(),
                interview.getQuestionIndex(),
                interview.getRole(),
                interview.getFocusAreas()
        );
    }

    @Transactional
    public AnswerResponse submitAnswer(UUID interviewId, String answer) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        List<InterviewStage> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> stagesForInterviewType(interview.getInterviewType())
        );

        InterviewStage currentStage = interview.getCurrentStage();
        if (currentStage == null) {
            currentStage = stages.getFirst();
            interview.setCurrentStage(currentStage);
        }

        int currentQuestionIndex = interview.getQuestionIndex() <= 0 ? 1 : interview.getQuestionIndex();
        String currentQuestion = QuestionBank.getQuestion(
                currentStage,
                currentQuestionIndex,
                interview.getRole(),
                interview.getFocusAreas()
        );

        Response response = new Response();
        response.setInterview(interview);
        response.setQuestion(currentQuestion);
        response.setAnswer(trimToNull(answer));
        responseRepository.save(response);

        ProgressStep progress = nextStep(
                currentStage,
                currentQuestionIndex,
                stages,
                interview.getRole(),
                interview.getFocusAreas()
        );
        interview.setCurrentStage(progress.stage());
        interview.setQuestionIndex(progress.questionIndex());

        if (InterviewStage.END.equals(progress.stage())) {
            interview.setStatus("COMPLETED");
            interviewStagesInMemory.remove(interviewId);
        }
        interviewRepository.save(interview);

        return new AnswerResponse(progress.question(), progress.stage());
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

    private static ProgressStep nextStep(
            InterviewStage currentStage,
            int currentQuestionIndex,
            List<InterviewStage> stages,
            String role,
            List<String> focusAreas
    ) {
        if (currentQuestionIndex < 2) {
            int nextQuestionIndex = currentQuestionIndex + 1;
            return new ProgressStep(
                    QuestionBank.getQuestion(currentStage, nextQuestionIndex, role, focusAreas),
                    currentStage,
                    nextQuestionIndex
            );
        }

        int stageIndex = stages.indexOf(currentStage);
        if (stageIndex >= 0 && stageIndex < stages.size() - 1) {
            InterviewStage nextStage = stages.get(stageIndex + 1);
            // Reset question index when moving to a new stage.
            return new ProgressStep(QuestionBank.getQuestion(nextStage, 1, role, focusAreas), nextStage, 1);
        }

        return new ProgressStep("END", InterviewStage.END, currentQuestionIndex + 1);
    }

    private record ProgressStep(String question, InterviewStage stage, int questionIndex) {}

    public record AnswerResponse(String question, InterviewStage stage) {}

}
