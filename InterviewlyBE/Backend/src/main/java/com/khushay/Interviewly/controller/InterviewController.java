package com.khushay.Interviewly.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khushay.Interviewly.dto.InterviewAnswerRequest;
import com.khushay.Interviewly.dto.InterviewCreatedResponse;
import com.khushay.Interviewly.dto.InterviewSessionResponse;
import com.khushay.Interviewly.dto.InterviewStatusResponse;
import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.InterviewStage;
import com.khushay.Interviewly.model.User;
import com.khushay.Interviewly.repository.UserRepository;
import com.khushay.Interviewly.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class InterviewController {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final InterviewService interviewService;

    @PostMapping(value = "/interview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InterviewCreatedResponse> createInterview(
            @RequestParam("role") String role,
            @RequestParam(value = "company", required = false) String company,
            @RequestParam(value = "jobDescription", required = false) String jobDescription,
            @RequestParam(value = "focusAreas", required = false) String focusAreasJson,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) {
        List<String> focusAreas = parseFocusAreas(focusAreasJson);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        UUID interviewId = interviewService.createInterview(
                role,
                company,
                jobDescription,
                focusAreas,
                resume,
                user
        );

        return ResponseEntity.ok(new InterviewCreatedResponse(interviewId.toString()));
    }

    @GetMapping("/interview/{id}/session")
    public ResponseEntity<InterviewSessionResponse> getInterviewSession(@PathVariable("id") UUID interviewId) {
        User user = getAuthenticatedUser();
        InterviewService.StartInterviewResponse session = interviewService.getOrCreateInterviewSession(interviewId, user.getId());
        return ResponseEntity.ok(new InterviewSessionResponse(
                session.status(),
                session.question(),
                session.stage() != null ? session.stage().name() : null,
                false
        ));
    }

    @GetMapping("/interview/{id}/status")
    public ResponseEntity<InterviewStatusResponse> getInterviewStatus(@PathVariable("id") UUID interviewId) {
        User user = getAuthenticatedUser();
        InterviewStatusResponse status = interviewService.getInterviewStatus(interviewId, user.getId());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/interview/{id}/answer")
    public ResponseEntity<InterviewSessionResponse> answerInterview(
            @PathVariable("id") UUID interviewId,
            @RequestBody InterviewAnswerRequest request
    ) {
        User user = getAuthenticatedUser();
        InterviewService.AnswerResponse next = interviewService.submitAnswer(interviewId, user.getId(), request.getAnswer());
        if (InterviewStage.END.equals(next.stage())) {
            return ResponseEntity.ok(new InterviewSessionResponse(
                    Interview.STATUS_COMPLETED,
                    null,
                    InterviewStage.END.name(),
                    false
            ));
        }
        return ResponseEntity.ok(new InterviewSessionResponse(
                Interview.STATUS_IN_PROGRESS,
                next.question(),
                next.stage().name(),
                next.followUp()
        ));
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private List<String> parseFocusAreas(String focusAreasJson) {
        if (focusAreasJson == null || focusAreasJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(focusAreasJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid focusAreas JSON", e);
        }
    }
}
