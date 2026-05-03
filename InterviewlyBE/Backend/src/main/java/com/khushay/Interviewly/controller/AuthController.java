package com.khushay.Interviewly.controller;

import com.khushay.Interviewly.dto.AuthResponse;
import com.khushay.Interviewly.dto.LoginRequest;
import com.khushay.Interviewly.dto.MessageResponse;
import com.khushay.Interviewly.dto.SignupRequest;
import com.khushay.Interviewly.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<MessageResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthLoginResult loginResult = authService.login(request);
        return ResponseEntity.ok(new AuthResponse(loginResult.token(), loginResult.name()));
    }
}
