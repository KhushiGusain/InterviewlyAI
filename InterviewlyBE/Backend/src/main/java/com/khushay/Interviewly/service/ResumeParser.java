package com.khushay.Interviewly.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.xml.sax.SAXException;

@Service
public class ResumeParser {

    private static final int TIKA_WRITE_LIMIT_CHARS = 200_000;

    /**
     * Extracts plain text from a PDF resume using Apache Tika. Does not summarize or interpret content.
     *
     * @return raw extracted text (may be blank for image-only PDFs)
     */
    public String extractTextFromPdf(MultipartFile pdf) {
        if (pdf == null || pdf.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }
        if (!isPdfMultipart(pdf)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF resumes are supported");
        }

        try (InputStream stream = pdf.getInputStream()) {
            return normalizeWhitespace(parseStream(stream, pdf.getOriginalFilename()));
        } catch (IOException | TikaException | SAXException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Could not read PDF resume", e);
        }
    }

    /**
     * Extracts plain text from a PDF stored on disk (path relative to the process working directory, e.g.
     * {@code uploads/resumes/...}).
     */
    public String extractTextFromStoredPdf(String resumeRelativePath) {
        if (!StringUtils.hasText(resumeRelativePath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume path is missing");
        }
        Path uploadsDir = Paths.get("uploads", "resumes").toAbsolutePath().normalize();
        Path candidate = Paths.get(resumeRelativePath.trim()).normalize();
        Path absolute = candidate.isAbsolute() ? candidate : Paths.get("").toAbsolutePath().resolve(candidate).normalize();
        if (!absolute.startsWith(uploadsDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resume path");
        }
        String fileName = absolute.getFileName().toString();
        if (!fileName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stored resume must be a PDF");
        }
        if (!Files.isRegularFile(absolute)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume file not found");
        }

        try (InputStream stream = Files.newInputStream(absolute)) {
            return normalizeWhitespace(parseStream(stream, fileName));
        } catch (IOException | TikaException | SAXException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Could not read PDF resume", e);
        }
    }

    private static boolean isPdfMultipart(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("pdf")) {
            return true;
        }
        String name = file.getOriginalFilename();
        return name != null && name.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }

    private static String parseStream(InputStream stream, String resourceNameHint)
            throws IOException, TikaException, SAXException {
        Metadata metadata = new Metadata();
        if (StringUtils.hasText(resourceNameHint)) {
            metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, resourceNameHint);
        }
        BodyContentHandler handler = new BodyContentHandler(TIKA_WRITE_LIMIT_CHARS);
        AutoDetectParser parser = new AutoDetectParser();
        ParseContext context = new ParseContext();
        parser.parse(stream, handler, metadata, context);
        return handler.toString();
    }

    private static String normalizeWhitespace(String raw) {
        return raw.replace("\r\n", "\n").replace('\r', '\n').trim();
    }
}
