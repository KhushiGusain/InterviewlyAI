package com.khushay.Interviewly.repository;

import com.khushay.Interviewly.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
}
