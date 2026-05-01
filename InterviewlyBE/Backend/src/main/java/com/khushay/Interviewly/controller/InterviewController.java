package com.khushay.Interviewly.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khushay.Interviewly.dto.InterviewAnswerRequest;
import com.khushay.Interviewly.dto.InterviewCreatedResponse;
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
import java.util.Map;
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
            @RequestParam(value = "interviewType", required = false) String interviewType,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam(value = "focusAreas", required = false) String focusAreasJson,
            @RequestPart("resume") MultipartFile resume
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
                interviewType,
                difficulty,
                focusAreas,
                resume,
                user
        );

        return ResponseEntity.ok(new InterviewCreatedResponse(interviewId.toString()));
    }

    @GetMapping("/interview/{id}/start")
    public ResponseEntity<Map<String, String>> startInterview(@PathVariable("id") UUID interviewId) {
        String question = interviewService.startInterview(interviewId);
        return ResponseEntity.ok(Map.of("question", question));
    }

    @PostMapping("/interview/{id}/answer")
    public ResponseEntity<Map<String, String>> answerInterview(
            @PathVariable("id") UUID interviewId,
            @RequestBody InterviewAnswerRequest request
    ) {
        InterviewService.AnswerResponse next = interviewService.submitAnswer(interviewId, request.getAnswer());
        if (InterviewStage.END.equals(next.stage())) {
            return ResponseEntity.ok(Map.of("status", "COMPLETED"));
        }
        return ResponseEntity.ok(Map.of("question", next.question(), "stage", next.stage().name()));
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
