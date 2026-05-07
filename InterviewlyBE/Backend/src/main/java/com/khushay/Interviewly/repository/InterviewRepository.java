package com.khushay.Interviewly.repository;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findByUser(User user);

    List<Interview> findByUserId(Long userId);

    Optional<Interview> findByIdAndUserId(UUID interviewId, Long userId);

    boolean existsByIdAndUserId(UUID interviewId, Long userId);
}
