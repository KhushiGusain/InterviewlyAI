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
      <main className="min-h-screen bg-[#02050d] px-6 py-4 text-[#f4f7ff]">
        <div className="flex min-h-[80vh] items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.25)] border-t-[#7b5eff]" />
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
    <main className="min-h-screen bg-[#02050d] px-6 py-4 text-[#f4f7ff]">
      <div className="w-full rounded-2xl border border-[rgba(90,120,220,0.25)] bg-[radial-gradient(circle_at_top,rgba(31,83,255,0.24),rgba(5,10,28,0.94)_56%)] shadow-[0_0_80px_rgba(45,84,255,0.18)]">
        <div className="border-b border-[rgba(120,145,220,0.14)] px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[1.6rem] font-semibold tracking-tight text-[#f4f7ff]">
                Interviewly<span className="text-[#4e8dff]">AI</span>
              </h1>
            </div>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                stopListening();
                navigate("/interviews");
              }}
              className="rounded-lg border cursor-pointer border-[rgba(255,109,136,0.35)] bg-[rgba(83,30,47,0.45)] px-4 py-2 text-sm font-medium text-[#ffafbc] transition hover:bg-[rgba(121,42,67,0.5)]"
            >
              Leave Interview
            </button>
          </div>
        </div>

        <div className="px-7 pb-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-[rgba(110,72,210,0.34)] px-3 py-1 font-medium text-[#cab8ff]">
                {getStageLabel(stage)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#91a2c8]">
              <span>Interview ID: {interviewId}</span>
              <button
                type="button"
                onClick={handleCopyInterviewId}
                className="rounded p-1 text-[#a8bbe3] cursor-pointer transition hover:bg-[rgba(84,102,156,0.35)]"
                aria-label="Copy interview id"
              >
                ⧉
              </button>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs font-semibold tracking-[0.28em] text-[#8f70ff]">AI INTERVIEWER IS ASKING</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-xl leading-snug text-[#edf3ff]">
              {isSessionLoading && !question
                ? "Preparing your first interview question..."
                : question || (loadError ? "Could not sync with the server yet." : "Waiting for the interviewer to begin.")}
            </h2>
            <div className="mx-auto mt-6 flex w-full max-w-lg items-end justify-center gap-1 opacity-80">
              {Array.from({ length: 48 }).map((_, index) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="inline-block w-[2px] animate-pulse rounded-full bg-[rgba(134,95,255,0.7)]"
                  style={{ height: `${6 + ((index * 7) % 18)}px`, animationDelay: `${(index % 9) * 90}ms` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
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
              className={`flex h-18 w-18 cursor-pointer items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                micState === "listening"
                  ? "animate-pulse border-[rgba(123,94,255,0.92)] bg-[rgba(66,32,155,0.72)] text-white shadow-[0_0_0_8px_rgba(123,94,255,0.26)]"
                  : micState === "processing"
                    ? "border-[rgba(248,201,112,0.7)] bg-[rgba(92,69,24,0.68)] text-[#ffedc4]"
                    : "border-[rgba(123,94,255,0.85)] bg-[rgba(43,28,98,0.55)] text-white shadow-[0_0_0_6px_rgba(123,94,255,0.18)] hover:bg-[rgba(59,38,126,0.72)]"
              }`}
              aria-label={listening ? "Stop microphone" : "Start microphone"}
            >
              {micState === "processing" ? (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(255,237,196,0.35)] border-t-[#ffedc4]" />
              ) : (
                <MicIcon />
              )}
            </button>
            <p className="mt-4 text-lg font-medium text-[#e7edff]">
              {micState === "listening"
                ? "Listening..."
                : micState === "processing"
                  ? "Submitting response..."
                  : isSessionLoading && !question
                    ? "Getting things ready..."
                    : "Tap to start speaking"}
            </p>
            {unsupported ? <p className="mt-2 text-xs text-[#ff9ca6]">Voice input works best in Chrome</p> : null}
          </div>

          <div className="mx-auto mt-6 w-full max-w-4xl rounded-xl border border-[rgba(100,120,184,0.25)] bg-[rgba(10,20,44,0.62)] px-6 py-4">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-[#9b7dff]">LIVE TRANSCRIPT</p>
            <div ref={transcriptScrollRef} className="caption-panel h-24 overflow-y-auto pr-1 text-center">
              <p
                key={answer || "caption-placeholder"}
                className="caption-text text-base leading-relaxed text-[#dbe6ff]"
              >
                {answer || ""}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-4 flex w-full max-w-4xl items-center justify-between gap-4">
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
              className="rounded-xl cursor-pointer border border-[rgba(112,134,200,0.32)] bg-[rgba(20,31,64,0.62)] px-4 py-2 text-sm text-[#d2ddff] transition hover:bg-[rgba(33,49,94,0.72)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-[rgba(20,31,64,0.62)]"
            >
              🔊 Replay Question
            </button>
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answer.trim()}
              className="inline-flex min-w-44 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#5f32ff] to-[#7659ff] px-8 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
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
            <p className="mt-3 text-center text-xs text-[#8fa3c8]">Syncing latest session from server...</p>
          ) : null}
          {loadError ? <p className="mt-3 text-center text-sm text-[#ff9ca6]">{loadError}</p> : null}
          {submitError ? <p className="mt-3 text-center text-sm text-[#ff9ca6]">{submitError}</p> : null}
          <p className="mt-7 border-t border-[rgba(100,120,184,0.2)] py-4 text-center text-xs text-[#7f93bf]">
            Your answers are secure and will only be used for generating your interview report.
          </p>
        </div>
      </div>
    </main>
  );
}

export default InterviewPage;
