package com.khushay.Interviewly.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecentInterviewDto {
    private UUID id;
    private String role;
    private Double score; // nullable
    private String status; // COMPLETED / IN_PROGRESS
    private LocalDateTime createdAt;
}
