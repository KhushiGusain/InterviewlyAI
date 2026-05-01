package com.khushay.Interviewly.repository;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findByUser(User user);
}
