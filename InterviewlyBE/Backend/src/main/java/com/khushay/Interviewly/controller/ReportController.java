package com.khushay.Interviewly.controller;

import com.khushay.Interviewly.dto.ReportResponse;
import com.khushay.Interviewly.model.User;
import com.khushay.Interviewly.repository.UserRepository;
import com.khushay.Interviewly.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    @GetMapping("/interview/{id}/report")
    public ReportResponse getInterviewReport(@PathVariable("id") UUID id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return reportService.generateReport(id, user.getId());
    }
}
