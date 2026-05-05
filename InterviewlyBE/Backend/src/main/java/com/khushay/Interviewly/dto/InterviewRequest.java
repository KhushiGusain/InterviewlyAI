package com.khushay.Interviewly.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class InterviewRequest {

    private String role;
    private String company;
    private String jobDescription;
    private List<String> focusAreas;
}
