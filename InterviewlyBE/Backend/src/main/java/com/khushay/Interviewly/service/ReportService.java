package com.khushay.Interviewly.service;

import com.khushay.Interviewly.dto.QuestionFeedback;
import com.khushay.Interviewly.dto.ReportResponse;
import com.khushay.Interviewly.model.Evaluation;
import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.Response;
import com.khushay.Interviewly.repository.EvaluationRepository;
import com.khushay.Interviewly.repository.InterviewRepository;
import com.khushay.Interviewly.repository.ResponseRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final InterviewRepository interviewRepository;
    private final ResponseRepository responseRepository;
    private final EvaluationRepository evaluationRepository;

    @Transactional(readOnly = true)
    public ReportResponse generateReport(UUID interviewId, Long userId) {
        Interview interview = interviewRepository.findByIdAndUserId(interviewId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));

        List<Response> responses = responseRepository.findByInterviewIdOrderByCreatedAtAsc(interview.getId());
        List<UUID> responseIds = responses.stream().map(Response::getId).toList();
        List<Evaluation> evaluations = responseIds.isEmpty()
                ? List.of()
                : evaluationRepository.findByResponseIdIn(responseIds);
        if (evaluations.isEmpty()) {
            return defaultEmptyReport();
        }
        Map<UUID, Evaluation> evaluationByResponseId = toEvaluationMap(evaluations);

        double overallScore = evaluations.stream()
                .mapToInt(Evaluation::getScore)
                .average()
                .orElse(0.0);

        Map<String, Double> stageBreakdown = calculateStageBreakdown(responses, evaluationByResponseId);
        List<QuestionFeedback> questions = buildQuestionFeedback(responses, evaluationByResponseId);

        ReportResponse report = new ReportResponse();
        report.setOverallScore(overallScore);
        report.setPerformanceLabel(toPerformanceLabel(overallScore));
        report.setStageBreakdown(stageBreakdown);
        report.setQuestions(questions);
        return report;
    }

    private static Map<UUID, Evaluation> toEvaluationMap(List<Evaluation> evaluations) {
        Map<UUID, Evaluation> map = new LinkedHashMap<>();
        for (Evaluation evaluation : evaluations) {
            if (evaluation.getResponse() != null && evaluation.getResponse().getId() != null) {
                map.put(evaluation.getResponse().getId(), evaluation);
            }
        }
        return map;
    }

    private static Map<String, Double> calculateStageBreakdown(
            List<Response> responses, Map<UUID, Evaluation> evaluationByResponseId) {
        Map<InterviewStage, List<Integer>> scoresByStage = new LinkedHashMap<>();
        scoresByStage.put(InterviewStage.INTRO, new ArrayList<>());
        scoresByStage.put(InterviewStage.TECHNICAL, new ArrayList<>());
        scoresByStage.put(InterviewStage.BEHAVIORAL, new ArrayList<>());

        for (int i = 0; i < responses.size(); i++) {
            Response response = responses.get(i);
            Evaluation evaluation = evaluationByResponseId.get(response.getId());
            if (evaluation == null) {
                continue;
            }
            InterviewStage stage = stageForResponseIndex(i);
            scoresByStage.computeIfAbsent(stage, ignored -> new ArrayList<>()).add(evaluation.getScore());
        }

        Map<String, Double> breakdown = new LinkedHashMap<>();
        for (Map.Entry<InterviewStage, List<Integer>> entry : scoresByStage.entrySet()) {
            double avg = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0);
            breakdown.put(entry.getKey().name(), avg);
        }
        return breakdown;
    }

    private static InterviewStage stageForResponseIndex(int responseIndex) {
        int oneBased = responseIndex + 1;
        if (oneBased <= 2) {
            return InterviewStage.INTRO;
        }
        if (oneBased <= 7) {
            return InterviewStage.TECHNICAL;
        }
        return InterviewStage.BEHAVIORAL;
    }

    private static List<QuestionFeedback> buildQuestionFeedback(
            List<Response> responses, Map<UUID, Evaluation> evaluationByResponseId) {
        List<QuestionFeedback> feedbackList = new ArrayList<>();
        for (Response response : responses) {
            Evaluation evaluation = evaluationByResponseId.get(response.getId());
            QuestionFeedback feedback = new QuestionFeedback();
            feedback.setQuestion(nonNullText(response.getQuestion()));
            feedback.setAnswer(nonNullText(response.getAnswer()));
            feedback.setScore(evaluation != null ? evaluation.getScore() : 0);
            feedback.setStrengths(evaluation != null ? nonNullText(evaluation.getStrengths()) : "");
            feedback.setImprovements(evaluation != null ? nonNullText(evaluation.getImprovements()) : "");
            feedbackList.add(feedback);
        }
        return feedbackList;
    }

    private static ReportResponse defaultEmptyReport() {
        ReportResponse report = new ReportResponse();
        report.setOverallScore(0.0);
        report.setPerformanceLabel("Needs Improvement");
        Map<String, Double> stageBreakdown = new LinkedHashMap<>();
        stageBreakdown.put(InterviewStage.INTRO.name(), 0.0);
        stageBreakdown.put(InterviewStage.TECHNICAL.name(), 0.0);
        stageBreakdown.put(InterviewStage.BEHAVIORAL.name(), 0.0);
        report.setStageBreakdown(stageBreakdown);
        report.setQuestions(List.of());
        return report;
    }

    private static String nonNullText(String value) {
        return value == null ? "" : value;
    }

    private static String toPerformanceLabel(double score) {
        if (score >= 8.0) {
            return "Strong";
        }
        if (score >= 6.0) {
            return "Good";
        }
        if (score >= 4.0) {
            return "Average";
        }
        return "Needs Improvement";
    }
}
