package com.khushay.Interviewly.model;

/**
 * Follow-up strategy for the next interviewer turn.
 * <ul>
 *   <li>{@link #NONE}: move to the next topic.</li>
 *   <li>{@link #CLARIFICATION}: previous answer was vague or incomplete.</li>
 *   <li>{@link #DEEP_DIVE}: previous answer introduced an interesting concept worth exploring.</li>
 *   <li>{@link #CHALLENGE}: probe trade-offs, edge cases, or reasoning depth.</li>
 * </ul>
 */
public enum FollowUpType {
    NONE,
    CLARIFICATION,
    DEEP_DIVE,
    CHALLENGE
}
