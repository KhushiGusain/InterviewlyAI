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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "interviews")
@Getter
@Setter
public class Interview {

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

    private String interviewType;

    private String difficulty;

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

    @Column(nullable = false)
    private int questionIndex;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
