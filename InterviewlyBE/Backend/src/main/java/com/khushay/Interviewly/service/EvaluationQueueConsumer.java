package com.khushay.Interviewly.service;

import com.khushay.Interviewly.dto.EvaluationJob;
import com.khushay.Interviewly.util.RedisQueues;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EvaluationQueueConsumer {

    private static final Logger log = LoggerFactory.getLogger(EvaluationQueueConsumer.class);
    private static final long EMPTY_QUEUE_SLEEP_MS = 500;

    private final RedisTemplate<String, Object> redisTemplate;
    private final EvaluationService evaluationService;

    private volatile boolean running = true;
    private Thread workerThread;

    @PostConstruct
    public void startWorker() {
        running = true;
        workerThread = new Thread(this::consumeLoop, "evaluation-queue-consumer");
        workerThread.setDaemon(true);
        workerThread.start();
    }

    @PreDestroy
    public void stopWorker() {
        running = false;
        if (workerThread != null) {
            workerThread.interrupt();
        }
    }

    private void consumeLoop() {
        while (running && !Thread.currentThread().isInterrupted()) {
            try {
                Object payload = redisTemplate.opsForList().leftPop(RedisQueues.EVALUATION_QUEUE);
                if (!(payload instanceof EvaluationJob job)) {
                    Thread.sleep(EMPTY_QUEUE_SLEEP_MS);
                    continue;
                }

                log.info("Evaluation job consumed: responseId={} interviewId={}",
                        job.getResponseId(),
                        job.getInterviewId());
                log.info("Evaluation started: responseId={}", job.getResponseId());
                try {
                    boolean evaluated = evaluationService.processEvaluation(job);
                    if (evaluated) {
                        log.info("Evaluation completed: responseId={}", job.getResponseId());
                    } else {
                        log.warn("Evaluation skipped: responseId={}", job.getResponseId());
                    }
                } catch (Exception ex) {
                    log.error("Evaluation failed for responseId={} interviewId={}",
                            job.getResponseId(),
                            job.getInterviewId(),
                            ex);
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception ex) {
                if (isExpectedShutdownException(ex)) {
                    log.debug("Evaluation queue consumer stopping during shutdown: {}", ex.getMessage());
                    break;
                }
                log.error("Evaluation queue consumer error", ex);
            }
        }
    }

    private boolean isExpectedShutdownException(Exception ex) {
        if (!running) {
            return true;
        }
        if (ex instanceof RedisConnectionFailureException) {
            return true;
        }
        String message = ex.getMessage();
        return message != null && message.contains("LettuceConnectionFactory has been STOPPED");
    }
}
