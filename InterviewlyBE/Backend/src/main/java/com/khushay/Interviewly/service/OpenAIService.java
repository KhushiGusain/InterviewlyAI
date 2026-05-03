package com.khushay.Interviewly.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
public class OpenAIService {

    private static final String MODEL = "gpt-4o-mini";
    private static final double DEFAULT_TEMPERATURE = 0.7;
    private static final int QUESTION_MAX_TOKENS = 80;
    private static final int TEXT_RESPONSE_MAX_TOKENS = 400;

    private final WebClient webClient;
    private final String apiKey;
    private final String apiUrl;

    public OpenAIService(
            WebClient.Builder webClientBuilder,
            @Value("${openai.api.key}") String apiKey,
            @Value("${openai.api.url}") String apiUrl) {
        this.webClient = webClientBuilder.build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }

    public String generateQuestion(String prompt) {
        return chatCompletion(prompt, QUESTION_MAX_TOKENS, DEFAULT_TEMPERATURE);
    }

    /**
     * Single user-message chat completion; suitable for summaries and other non-interview prompts.
     */
    public String generateTextResponse(String prompt) {
        return chatCompletion(prompt, TEXT_RESPONSE_MAX_TOKENS, DEFAULT_TEMPERATURE);
    }

    private String chatCompletion(String userMessage, int maxTokens, double temperature) {
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("openai.api.key is not configured");
        }
        if (!StringUtils.hasText(apiUrl)) {
            throw new IllegalStateException("openai.api.url is not configured");
        }

        Map<String, Object> body = Map.of(
                "model", MODEL,
                "messages", List.of(Map.of("role", "user", "content", userMessage)),
                "temperature", temperature,
                "max_tokens", maxTokens);

        JsonNode root;
        try {
            root = webClient
                    .post()
                    .uri(URI.create(apiUrl))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
        } catch (WebClientResponseException e) {
            throw new IllegalStateException(
                    "OpenAI request failed: " + e.getStatusCode() + " " + e.getResponseBodyAsString(), e);
        }

        if (root == null || !root.hasNonNull("choices") || root.path("choices").isEmpty()) {
            throw new IllegalStateException("OpenAI returned no choices");
        }

        String content = root.path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText("")
                .trim();

        if (!StringUtils.hasText(content)) {
            throw new IllegalStateException("OpenAI returned empty content");
        }

        return content;
    }
}
