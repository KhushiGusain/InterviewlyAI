package com.khushay.Interviewly.service;

import com.khushay.Interviewly.dto.DashboardResponse;
import com.khushay.Interviewly.dto.RecentInterviewDto;
import com.khushay.Interviewly.model.Evaluation;
import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.Response;
import com.khushay.Interviewly.repository.EvaluationRepository;
import com.khushay.Interviewly.repository.InterviewRepository;
import com.khushay.Interviewly.repository.ResponseRepository;

import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final InterviewRepository interviewRepository;
    private final ResponseRepository responseRepository;
    private final EvaluationRepository evaluationRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(Long userId) {
        List<Interview> allForUser = interviewRepository.findByUserId(userId);

        int totalInterviews = allForUser.size();
        List<Interview> completed = allForUser.stream()
                .filter(interview -> "COMPLETED".equalsIgnoreCase(interview.getStatus()))
                .toList();
        int completedInterviews = completed.size();

        Map<UUID, Double> scoreByInterviewId = buildInterviewScoreMap(allForUser);
        double avgScore = completed.stream()
                .map(interview -> scoreByInterviewId.getOrDefault(interview.getId(), 0.0))
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        List<RecentInterviewDto> recentInterviews = allForUser.stream()
                .sorted(Comparator.comparing(Interview::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .limit(5)
                .map(interview -> {
                    RecentInterviewDto dto = new RecentInterviewDto();
                    dto.setId(interview.getId());
                    dto.setRole(interview.getRole());
                    dto.setStatus(interview.getStatus());
                    dto.setCreatedAt(interview.getCreatedAt());
                    if ("COMPLETED".equalsIgnoreCase(interview.getStatus())) {
                        dto.setScore(scoreByInterviewId.getOrDefault(interview.getId(), 0.0));
                    } else {
                        dto.setScore(null);
                    }
                    return dto;
                })
                .toList();

        DashboardResponse response = new DashboardResponse();
        response.setTotalInterviews(totalInterviews);
        response.setCompletedInterviews(completedInterviews);
        response.setAvgScore(avgScore);
        response.setRecentInterviews(recentInterviews);
        return response;
    }

    private Map<UUID, Double> buildInterviewScoreMap(List<Interview> interviews) {
        if (interviews.isEmpty()) {
            return Map.of();
        }

        List<UUID> interviewIds = interviews.stream().map(Interview::getId).toList();
        List<Response> responses = responseRepository.findByInterviewIdIn(interviewIds);
        if (responses.isEmpty()) {
            return Map.of();
        }

        Map<UUID, UUID> interviewIdByResponseId = new LinkedHashMap<>();
        for (Response response : responses) {
            if (response.getId() != null && response.getInterview() != null && response.getInterview().getId() != null) {
                interviewIdByResponseId.put(response.getId(), response.getInterview().getId());
            }
        }

        List<Evaluation> evaluations = evaluationRepository.findByResponseIdIn(interviewIdByResponseId.keySet());
        Map<UUID, List<Integer>> scoresByInterview = new LinkedHashMap<>();
        for (Evaluation evaluation : evaluations) {
            if (evaluation.getResponse() == null || evaluation.getResponse().getId() == null) {
                continue;
            }
            UUID interviewId = interviewIdByResponseId.get(evaluation.getResponse().getId());
            if (interviewId == null) {
                continue;
            }
            scoresByInterview.computeIfAbsent(interviewId, ignored -> new ArrayList<>()).add(evaluation.getScore());
        }

        Map<UUID, Double> avgByInterview = new LinkedHashMap<>();
        for (Interview interview : interviews) {
            List<Integer> scores = scoresByInterview.getOrDefault(interview.getId(), List.of());
            double avg = scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            avgByInterview.put(interview.getId(), avg);
        }
        return avgByInterview;
    }
}
