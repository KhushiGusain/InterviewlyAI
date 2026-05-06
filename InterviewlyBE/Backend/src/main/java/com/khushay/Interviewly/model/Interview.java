package com.khushay.Interviewly.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "interviews")
@Getter
@Setter
public class Interview {
    public static final String STATUS_NOT_STARTED = "NOT_STARTED";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    private static final Set<String> ALLOWED_STATUSES = Set.of(
            STATUS_NOT_STARTED,
            STATUS_IN_PROGRESS,
            STATUS_COMPLETED
    );

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role;

    private String company;

    @Column(columnDefinition = "TEXT")
    private String jobDescription;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "interview_focus_areas", joinColumns = @JoinColumn(name = "interview_id"))
    @Column(name = "focus_area", nullable = false)
    private List<String> focusAreas = new ArrayList<>();

    private String resumePath;

    /** OpenAI-generated resume summary; populated once (at creation or first start) and reused for prompts. */
    @Column(columnDefinition = "TEXT")
    private String resumeSummary;

    private String status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStage currentStage;

    /**
     * Number of <strong>base</strong> questions issued in {@link #currentStage} only (follow-ups do not increment).
     * Stage advances when the next question would be a new base and this value is already at the stage max.
     */
    @Column(nullable = false)
    private int questionIndex;

    /** Last question text returned to the candidate (for the next answer pairing and prompt follow-up). */
    @Column(columnDefinition = "TEXT")
    private String lastQuestionText;

    /** Last question type returned to the candidate (for next-question selection context). */
    private String lastQuestionType;

    /**
     * Follow-up questions issued in the current stage (max 2 per stage). Reset with {@link #questionIndex} when the
     * stage changes.
     */
    @Column(nullable = false)
    @ColumnDefault("0")
    private int followUpsUsedInStage;

    /**
     * Follow-ups issued for the current base (0 or 1). Reset to 0 when a new base question is issued or when the
     * stage changes.
     */
    @Column(nullable = false)
    @ColumnDefault("0")
    private int followUpsIssuedForCurrentBase;

    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null || this.status.isBlank()) {
            this.status = STATUS_NOT_STARTED;
        }
        validateStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        validateStatus();
    }

    private void validateStatus() {
        if (this.status == null || !ALLOWED_STATUSES.contains(this.status)) {
            throw new IllegalStateException("Invalid interview status: " + this.status);
        }
    }
}
