import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { speakText, stopSpeaking } from "../utils/speech";

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

function InterviewPage() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(
    () => readPersistedSession(interviewId)?.question ?? ""
  );
  const [answer, setAnswer] = useState(
    () => readPersistedSession(interviewId)?.answer ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(
    () => readPersistedSession(interviewId)?.stage ?? null
  );
  const [submitError, setSubmitError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isBackendSynced, setIsBackendSynced] = useState(false);
  const prevInterviewIdRef = useRef(null);

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
  }, [interviewId]);

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
    let isMounted = true;

    async function syncSessionFromBackend() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await apiRequest(`/interview/${interviewId}/session`, {
          method: "GET",
        });
        if (!isMounted) return;

        const status = response?.status;

        if (status === "COMPLETED") {
          clearPersistedSession(interviewId);
          navigate(`/reports/${interviewId}`, { replace: true });
          return;
        }
        applySessionState(response, answer);
      } catch (err) {
        if (isMounted) {
          setLoadError(err?.message || "Could not load interview session.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
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

  async function handleSubmitAnswer() {
    if (!answer.trim() || !interviewId) {
      return;
    }

    setSubmitError("");
    setLoading(true);
    try {
      const response = await apiRequest(`/interview/${interviewId}/answer`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });

      if (response?.status === "COMPLETED") {
        clearPersistedSession(interviewId);
        navigate(`/reports/${interviewId}`, { replace: true });
        return;
      }

      applySessionState(response, "");
    } catch (error) {
      setSubmitError(error.message || "Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030711] px-6 py-10 text-[#f4f7ff]">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Interview Session</h1>
        <p className="mt-2 text-sm text-[#9fb1d3]">
          Interview ID: <span className="font-medium text-[#dce6ff]">{interviewId}</span>
        </p>
        <p className="mt-2 inline-flex rounded-full border border-[rgba(145,172,255,0.22)] bg-[rgba(7,13,30,0.55)] px-3 py-1 text-xs font-medium text-[#b8cdf2]">
          {getStageLabel(stage)}
        </p>

        <section className="mt-6 rounded-xl border border-[rgba(145,172,255,0.18)] bg-[rgba(7,13,30,0.55)] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-widest text-[#7b90b8]">Current Question</p>
            <button
              type="button"
              onClick={() => {
                if (window.speechSynthesis?.speaking) {
                  stopSpeaking();
                  return;
                }
                speakText(question);
              }}
              className="rounded-lg border border-[rgba(145,172,255,0.28)] bg-[rgba(14,21,46,0.6)] px-3 py-1 text-xs font-medium text-[#cfe0ff] transition hover:bg-[rgba(30,44,86,0.72)]"
            >
              Replay / Stop
            </button>
          </div>
          <p className="text-base leading-relaxed text-[#dce6ff]">
            {loading && !question
              ? "Loading question..."
              : question || (loadError ? "Could not sync with the server yet." : "No question available.")}
          </p>
        </section>
        {!isBackendSynced ? (
          <p className="mt-3 text-xs text-[#8fa3c8]">Syncing latest session from server...</p>
        ) : null}
        {loadError ? (
          <p className="mt-3 text-sm text-[#ff9ca6]">{loadError}</p>
        ) : null}

        <div className="mt-5">
          <label htmlFor="answer" className="mb-2 block text-sm font-medium text-[#c7d7f5]">
            Your Answer
          </label>
          <input
            id="answer"
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer here..."
            className="h-11 w-full rounded-xl border border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.6)] px-4 text-sm text-[#f2f5ff] outline-none transition placeholder:text-[#6e7f9b] focus:border-[#4e8dff] focus:shadow-[0_0_0_2px_rgba(78,141,255,0.2)]"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={loading || !answer.trim()}
          className="mt-4 h-11 rounded-xl bg-linear-to-r from-[#2f80ff] to-[#5b33ff] px-5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Submit
        </button>
        {submitError ? <p className="mt-3 text-sm text-[#ff9ca6]">{submitError}</p> : null}
      </div>
    </main>
  );
}

export default InterviewPage;
