package com.khushay.Interviewly.repository;

import com.khushay.Interviewly.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    List<Evaluation> findByResponseIdIn(Collection<UUID> responseIds);
}
