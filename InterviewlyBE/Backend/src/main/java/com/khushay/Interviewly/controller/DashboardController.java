package com.khushay.Interviewly.controller;

import com.khushay.Interviewly.dto.DashboardResponse;
import com.khushay.Interviewly.model.User;
import com.khushay.Interviewly.repository.UserRepository;
import com.khushay.Interviewly.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return dashboardService.getDashboardData(user.getId());
    }
}
