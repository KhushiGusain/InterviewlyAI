package com.khushay.Interviewly.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ResumeSummarizer {

    private static final int MAX_RESUME_CHARS = 100_000;

    private static final String PROMPT_PREFIX =
            "You are an assistant that extracts key information from resumes.\n\n"
                    + "From the given resume text, return a concise summary including:\n"
                    + "- Projects worked on\n"
                    + "- Technologies used\n"
                    + "- Key experience\n\n"
                    + "Keep it short (4-6 lines max).\n"
                    + "Do not include unnecessary details.\n\n"
                    + "Resume text:\n"
                    + "---\n";

    private final OpenAIService openAIService;

    public String summarizeResume(String rawText) {
        if (!StringUtils.hasText(rawText)) {
            throw new IllegalArgumentException("Resume text is required");
        }
        String clipped = rawText.length() > MAX_RESUME_CHARS ? rawText.substring(0, MAX_RESUME_CHARS) : rawText;
        String userMessage = PROMPT_PREFIX + clipped;
        return openAIService.generateTextResponse(userMessage);
    }
}
