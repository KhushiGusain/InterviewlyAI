package com.khushay.Interviewly.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

public final class ResumeMultipartFileHelper {

    private static final Path RESUME_UPLOAD_DIR = Paths.get("uploads", "resumes");

    private ResumeMultipartFileHelper() {
    }

    /** Saves under {@code uploads/resumes/}; returns a forward-slash relative path for storage. */
    public static String save(MultipartFile file) throws IOException {
        Files.createDirectories(RESUME_UPLOAD_DIR);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "resume";
        }
        String safeName = Paths.get(originalFilename).getFileName().toString();
        if (safeName.isBlank()) {
            safeName = "resume";
        }

        String storedFilename = UUID.randomUUID().toString() + "_" + safeName;
        Path target = RESUME_UPLOAD_DIR.resolve(storedFilename);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return "uploads/resumes/" + storedFilename;
    }
}
