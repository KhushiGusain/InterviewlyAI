package com.khushay.Interviewly.service;

import com.khushay.Interviewly.model.Interview;
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
    private final Map<UUID, List<String>> interviewStagesInMemory = new ConcurrentHashMap<>();

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
        interview.setCurrentStage("INTRO");
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
        List<String> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> stagesForInterviewType(interview.getInterviewType())
        );

        interview.setStatus("IN_PROGRESS");
        interview.setCurrentStage(stages.getFirst());
        interview.setQuestionIndex(1);

        interviewRepository.save(interview);
        return "Tell me about yourself";
    }

    @Transactional
    public String submitAnswer(UUID interviewId, String answer) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
        List<String> stages = interviewStagesInMemory.computeIfAbsent(
                interviewId,
                id -> stagesForInterviewType(interview.getInterviewType())
        );

        String currentQuestion = currentQuestionByIndex(interview.getQuestionIndex());

        Response response = new Response();
        response.setInterview(interview);
        response.setQuestion(currentQuestion);
        response.setAnswer(trimToNull(answer));
        responseRepository.save(response);

        String nextQuestion = nextQuestionByIndex(interview.getQuestionIndex());
        interview.setQuestionIndex(interview.getQuestionIndex() + 1);
        interview.setCurrentStage(stageForQuestionIndex(interview.getQuestionIndex(), stages));
        if ("END".equals(nextQuestion)) {
            interview.setStatus("COMPLETED");
            interviewStagesInMemory.remove(interviewId);
        }
        interviewRepository.save(interview);

        return nextQuestion;
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

    private static String currentQuestionByIndex(int questionIndex) {
        if (questionIndex == 1) {
            return "Tell me about yourself";
        }
        if (questionIndex == 2) {
            return "Explain a project you worked on";
        }
        return "What is OOP?";
    }

    private static String nextQuestionByIndex(int questionIndex) {
        if (questionIndex == 1) {
            return "Explain a project you worked on";
        }
        if (questionIndex == 2) {
            return "What is OOP?";
        }
        return "END";
    }

    private static List<String> stagesForInterviewType(String interviewType) {
        String normalizedType = interviewType == null ? "" : interviewType.trim().toUpperCase(Locale.ROOT);
        if ("TECHNICAL".equals(normalizedType)) {
            return List.of("INTRO", "TECHNICAL");
        }
        if ("BEHAVIORAL".equals(normalizedType)) {
            return List.of("INTRO", "BEHAVIORAL");
        }
        return List.of("INTRO", "TECHNICAL", "BEHAVIORAL");
    }

    private static String stageForQuestionIndex(int questionIndex, List<String> stages) {
        if (questionIndex <= 1) {
            return stages.getFirst();
        }
        int stageIdx = Math.min(questionIndex - 1, stages.size() - 1);
        return stages.get(stageIdx);
    }

}
