package com.khushay.Interviewly.service;

import com.khushay.Interviewly.dto.EvaluationJob;
import com.khushay.Interviewly.util.RedisQueues;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EvaluationQueueProducer {

    private static final Logger log = LoggerFactory.getLogger(EvaluationQueueProducer.class);

    private final RedisTemplate<String, Object> redisTemplate;

    public void publishEvaluationJob(EvaluationJob job) {
        redisTemplate.opsForList().rightPush(
                RedisQueues.EVALUATION_QUEUE,
                job
        );
        System.out.println("Published evaluation job for responseId={}" + job.getResponseId());
        Long queueSize = redisTemplate.opsForList().size(RedisQueues.EVALUATION_QUEUE);
        System.out.println("Evaluation queue size={}" + queueSize);
    }
}
