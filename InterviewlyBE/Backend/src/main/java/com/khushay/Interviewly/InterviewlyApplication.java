package com.khushay.Interviewly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InterviewlyApplication {

	public static void main(String[] args) {
		SpringApplication.run(InterviewlyApplication.class, args);
	}

}
