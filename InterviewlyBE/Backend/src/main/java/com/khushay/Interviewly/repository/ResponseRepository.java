package com.khushay.Interviewly.repository;

import com.khushay.Interviewly.model.Response;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ResponseRepository extends JpaRepository<Response, UUID> {

    /** Returns the {@code question} texts for the most recent N responses of an interview (newest first). */
    @Query("SELECT r.question FROM Response r WHERE r.interview.id = :interviewId ORDER BY r.createdAt DESC")
    List<String> findRecentQuestions(@Param("interviewId") UUID interviewId, Pageable pageable);

    List<Response> findByInterviewIdOrderByCreatedAtAsc(UUID interviewId);
}
