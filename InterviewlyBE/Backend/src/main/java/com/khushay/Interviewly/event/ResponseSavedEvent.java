package com.khushay.Interviewly.event;

import com.khushay.Interviewly.model.Interview;
import com.khushay.Interviewly.model.Response;

public record ResponseSavedEvent(Response response, Interview interview) {}
