package com.khushay.Interviewly.controller;

import com.khushay.Interviewly.dto.ReportResponse;
import com.khushay.Interviewly.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/interview/{id}/report")
    public ReportResponse getInterviewReport(@PathVariable("id") UUID id) {
        return reportService.generateReport(id);
    }
}
