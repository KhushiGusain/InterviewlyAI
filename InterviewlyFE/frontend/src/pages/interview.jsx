import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { speakText, stopSpeaking } from "../utils/speech";
import useSpeechRecognition from "../hooks/useSpeechRecognition";


function sessionKey(interviewId) {
  return `interviewly_interview_session:${interviewId}`;
}

function readPersistedSession(interviewId) {
  if (!interviewId) return null;
  try {
    const raw = sessionStorage.getItem(sessionKey(interviewId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return {
      question: typeof data.question === "string" ? data.question : "",
      stage: typeof data.stage === "string" ? data.stage : null,
      answer: typeof data.answer === "string" ? data.answer : "",
    };
  } catch {
    return null;
  }
}

function writePersistedSession(interviewId, partial) {
  if (!interviewId) return;
  try {
    const prev = readPersistedSession(interviewId) || {
      question: "",
      stage: null,
      answer: "",
    };
    const next = { ...prev, ...partial };
    sessionStorage.setItem(sessionKey(interviewId), JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearPersistedSession(interviewId) {
  if (!interviewId) return;
  try {
    sessionStorage.removeItem(sessionKey(interviewId));
  } catch {
    /* ignore */
  }
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </svg>
  );
}

function InterviewPage() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(
    () => readPersistedSession(interviewId)?.question ?? ""
  );
  const [answer, setAnswer] = useState(
    () => readPersistedSession(interviewId)?.answer ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [stage, setStage] = useState(
    () => readPersistedSession(interviewId)?.stage ?? null
  );
  const [submitError, setSubmitError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isBackendSynced, setIsBackendSynced] = useState(false);
  const [isInterviewValidated, setIsInterviewValidated] = useState(false);
  const prevInterviewIdRef = useRef(null);
  const latestAnswerRef = useRef("");
  const transcriptScrollRef = useRef(null);
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    unsupported,
  } = useSpeechRecognition();
  const micState = isSubmitting ? "processing" : listening ? "listening" : "idle";

  useEffect(() => {
    if (!interviewId) return;
    // Cache is only for instant paint while server state loads.
    const next = readPersistedSession(interviewId);
    setQuestion(next?.question ?? "");
    setStage(next?.stage ?? null);
    setAnswer(next?.answer ?? "");
    setSubmitError("");
    setLoadError("");
    setIsBackendSynced(false);
    setIsInterviewValidated(false);
  }, [interviewId]);

  useEffect(() => {
    latestAnswerRef.current = answer;
  }, [answer]);

  function getStageLabel(stageValue) {
    if (stageValue == null || stageValue === "") {
      return "Session";
    }
    const normalized = String(stageValue).toUpperCase();
    if (normalized.includes("TECH")) return "Technical Round";
    if (normalized.includes("BEHAV")) return "Behavioral Round";
    if (normalized.includes("INTRO")) return "Intro Round";
    return normalized.replaceAll("_", " ");
  }

  function applySessionState(response, nextAnswer) {
    const backendQuestion = response?.question ?? "";
    const backendStage = response?.stage ?? null;
    setQuestion(backendQuestion);
    setStage(backendStage);
    setAnswer(nextAnswer);
    writePersistedSession(interviewId, {
      question: backendQuestion,
      stage: backendStage,
      answer: nextAnswer,
    });
  }

  useEffect(() => {
    if (!interviewId) return;
    const idChanged = prevInterviewIdRef.current !== interviewId;
    prevInterviewIdRef.current = interviewId;
    if (idChanged) return;
    writePersistedSession(interviewId, { answer });
  }, [interviewId, answer]);

  useEffect(() => {
    speakText(question);
  }, [question]);

  useEffect(() => {
    return () => {
      // Ensure TTS does not continue after leaving interview route.
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (transcript?.trim()) {
      setAnswer(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (!transcriptScrollRef.current) return;
    transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
  }, [answer]);

  useEffect(() => {
    let isMounted = true;

    async function syncSessionFromBackend() {
      setIsSessionLoading(true);
      setLoadError("");
      try {
        await apiRequest(`/interview/${interviewId}/status`, {
          method: "GET",
        });
        if (!isMounted) return;
        setIsInterviewValidated(true);

        const response = await apiRequest(`/interview/${interviewId}/session`, {
          method: "GET",
        });
        if (!isMounted) return;

        const status = response?.status;

        if (status === "COMPLETED") {
          stopSpeaking();
          clearPersistedSession(interviewId);
          navigate(`/reports/${interviewId}`, { replace: true });
          return;
        }
        applySessionState(response, latestAnswerRef.current);
      } catch (err) {
        if (isMounted) {
          if ([400, 401, 403, 404].includes(err?.status)) {
            clearPersistedSession(interviewId);
            navigate("/dashboard", { replace: true });
            return;
          }
          setLoadError(err?.message || "Could not load interview session.");
        }
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
          setIsBackendSynced(true);
        }
      }
    }

    if (interviewId) {
      syncSessionFromBackend();
    }

    return () => {
      isMounted = false;
    };
  }, [interviewId, navigate]);

  if (!isInterviewValidated && isSessionLoading) {
    return (
      <main className="relative min-h-dvh overflow-x-hidden bg-white px-4 py-4 text-[#1e293b] sm:px-6 md:px-8">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />
        <div className="relative z-10 flex min-h-[80dvh] items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#852a4e]" />
        </div>
      </main>
    );
  }

  async function handleSubmitAnswer() {
    if (!answer.trim() || !interviewId) {
      setSubmitError("Please record your response first.");
      return;
    }

    stopListening();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const response = await apiRequest(`/interview/${interviewId}/answer`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });

      if (response?.status === "COMPLETED") {
        stopListening();
        stopSpeaking();
        setAnswer("");
        resetTranscript();
        clearPersistedSession(interviewId);
        navigate(`/reports/${interviewId}`, { replace: true });
        return;
      }

      stopListening();
      applySessionState(response, "");
      resetTranscript();
    } catch (error) {
      setSubmitError(error.message || "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyInterviewId() {
    if (!interviewId || !navigator?.clipboard) return;
    navigator.clipboard.writeText(interviewId).catch(() => {});
  }

  return (
    <main className="relative min-h-dvh overflow-y-auto overflow-x-hidden bg-white py-4 text-[#1e293b]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8">
        <div className="rounded-xl border border-[rgba(133,42,78,0.2)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:rounded-2xl">
          <div className="border-b border-[#e2e8f0] px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-[1.35rem] font-semibold tracking-tight text-[#0f172a] sm:text-[1.5rem] md:text-[1.6rem]">
                  Interviewly<span className="text-[#852a4e]">AI</span>
                </h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  navigate("/interviews");
                }}
                className="w-full shrink-0 cursor-pointer rounded-xl border border-[#fecaca] bg-white px-4 py-2.5 text-sm font-semibold text-[#b91c1c] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[#f87171] hover:bg-[#fef2f2] sm:w-auto sm:py-2"
              >
                Leave Interview
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-3 sm:pt-4 md:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3 text-xs">
                <span className="max-w-full truncate rounded-full bg-[rgba(133,42,78,0.1)] px-3 py-1 font-semibold text-[#852a4e] ring-1 ring-[rgba(133,42,78,0.15)]">
                  {getStageLabel(stage)}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2 text-xs text-[#373a3f]">
                <span className="min-w-0 truncate">
                  Interview ID: <span className="font-mono text-[11px] text-[#64748b] sm:text-xs">{interviewId}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyInterviewId}
                  className="shrink-0 cursor-pointer rounded-md p-1 text-[#64748b] transition hover:bg-[rgba(133,42,78,0.08)] hover:text-[#852a4e]"
                  aria-label="Copy interview id"
                >
                  ⧉
                </button>
              </div>
            </div>

            <div className="mt-8 text-center sm:mt-10">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#852a4e] sm:text-xs sm:tracking-[0.28em]">
                AI INTERVIEWER IS ASKING
              </p>
              <h2 className="mx-auto mt-3 max-w-3xl px-1 text-lg leading-snug text-[#0f172a] sm:mt-4 sm:px-0 sm:text-xl">
                {isSessionLoading && !question
                  ? "Preparing your first interview question..."
                  : question || (loadError ? "Could not sync with the server yet." : "Waiting for the interviewer to begin.")}
              </h2>
              <div className="mx-auto mt-5 flex w-full max-w-full items-end justify-center gap-0.5 overflow-x-hidden px-1 opacity-90 sm:mt-6 sm:max-w-lg sm:gap-1">
                {Array.from({ length: 48 }).map((_, index) => (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="inline-block w-[2px] shrink-0 animate-pulse rounded-full bg-[rgba(133,42,78,0.45)]"
                    style={{ height: `${6 + ((index * 7) % 18)}px`, animationDelay: `${(index % 9) * 90}ms` }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center sm:mt-8">
              <button
                type="button"
                onClick={() => {
                  if (listening) {
                    stopListening();
                    return;
                  }
                  stopSpeaking();
                  resetTranscript();
                  startListening();
                }}
                disabled={unsupported || micState === "processing"}
                className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-18 sm:w-18 ${
                  micState === "listening"
                    ? "animate-pulse border-[#852a4e] bg-[rgba(133,42,78,0.12)] text-[#852a4e] shadow-[0_0_0_6px_rgba(133,42,78,0.14)] sm:shadow-[0_0_0_8px_rgba(133,42,78,0.14)]"
                    : micState === "processing"
                      ? "border-[#f59e0b] bg-[#fef3c7] text-[#b45309] shadow-[0_0_0_6px_rgba(245,158,11,0.15)]"
                      : "border-[rgba(133,42,78,0.45)] bg-white text-[#852a4e] shadow-[0_0_0_6px_rgba(133,42,78,0.08)] hover:bg-[rgba(133,42,78,0.06)]"
                }`}
                aria-label={listening ? "Stop microphone" : "Start microphone"}
              >
                {micState === "processing" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#fcd34d] border-t-[#b45309] sm:h-6 sm:w-6" />
                ) : (
                  <span className="scale-90 sm:scale-100">
                    <MicIcon />
                  </span>
                )}
              </button>
              <p className="mt-3 px-2 text-center text-base font-medium text-[#475569] sm:mt-4 sm:text-lg">
                {micState === "listening"
                  ? "Listening..."
                  : micState === "processing"
                    ? "Submitting response..."
                    : isSessionLoading && !question
                      ? "Getting things ready..."
                      : "Tap to start speaking"}
              </p>
              {unsupported ? <p className="mt-2 text-xs text-[#dc2626]">Voice input works best in Chrome</p> : null}
            </div>

            <div className="mx-auto mt-5 w-full max-w-4xl rounded-xl border border-[#e2e8f0] bg-[#fafbff] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/3 sm:mt-6 sm:px-6 sm:py-4">
              <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-[#852a4e] sm:text-[11px] sm:tracking-[0.22em]">
                LIVE TRANSCRIPT
              </p>
              <div
                ref={transcriptScrollRef}
                className="caption-panel max-h-40 min-h-22 overflow-y-auto pr-1 text-left sm:h-24 sm:max-h-none sm:text-center"
              >
                <p
                  key={answer || "caption-placeholder"}
                  className="caption-text text-base leading-relaxed text-[#334155]"
                >
                  {answer || ""}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  if (window.speechSynthesis?.speaking) {
                    stopSpeaking();
                    return;
                  }
                  speakText(question);
                }}
                disabled={listening}
                className="w-full cursor-pointer rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-base font-medium text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[rgba(133,42,78,0.2)] hover:bg-[rgba(133,42,78,0.04)] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:text-sm"
              >
                🔊 Replay Question
              </button>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answer.trim()}
                className="inline-flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-linear-to-r from-[#852a4e] to-[#a83d62] px-6 py-2.5 text-base font-semibold text-white shadow-[0_4px_16px_rgba(133,42,78,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 sm:w-auto sm:min-w-44 sm:px-8 sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Processing...
                  </>
                ) : (
                  "Submit Answer →"
                )}
              </button>
            </div>

            {!isBackendSynced ? (
              <p className="mt-3 text-center text-xs text-[#64748b]">Syncing latest session from server...</p>
            ) : null}
            {loadError ? <p className="mt-3 text-center text-sm font-medium text-[#dc2626]">{loadError}</p> : null}
            {submitError ? <p className="mt-3 text-center text-sm font-medium text-[#dc2626]">{submitError}</p> : null}
            <p className="mt-7 border-t border-[#e2e8f0] py-4 text-center text-xs text-[#64748b]">
              Your answers are secure and will only be used for generating your interview report.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default InterviewPage;
