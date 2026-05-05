package com.khushay.Interviewly.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private int totalInterviews;
    private int completedInterviews;
    private double avgScore;
    private List<RecentInterviewDto> recentInterviews;
}
