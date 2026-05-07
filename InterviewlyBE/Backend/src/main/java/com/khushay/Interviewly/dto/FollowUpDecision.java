package com.khushay.Interviewly.dto;

import com.khushay.Interviewly.model.FollowUpType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents AI decision for whether a follow-up should happen.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpDecision {
    private FollowUpType type;
    private String reason;
}
