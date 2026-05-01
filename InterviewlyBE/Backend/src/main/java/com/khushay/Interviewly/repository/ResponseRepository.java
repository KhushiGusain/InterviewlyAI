package com.khushay.Interviewly.repository;

import com.khushay.Interviewly.model.Response;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ResponseRepository extends JpaRepository<Response, UUID> {
}
