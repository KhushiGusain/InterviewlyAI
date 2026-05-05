import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function InterviewPage() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("INTRO");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [submitError, setSubmitError] = useState("");

  function getStageLabel(stageValue) {
    const normalized = String(stageValue || "").toUpperCase();
    if (normalized.includes("TECH")) return "Technical Round";
    if (normalized.includes("BEHAV")) return "Behavioral Round";
    return "Intro Round";
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchFirstQuestion() {
      setLoading(true);
      try {
        const response = await apiRequest(`/interview/${interviewId}/start`, {
          method: "POST",
        });
        if (isMounted) {
          if (response?.status === "COMPLETED") {
            navigate(`/reports/${interviewId}`, { replace: true });
            return;
          }

          if (response?.status === "IN_PROGRESS") {
            setQuestion(response?.lastQuestion || response?.question || "");
            setStage(response?.stage || response?.round || "INTRO");
            return;
          }

          setQuestion(response?.question || "");
          setStage(response?.stage || response?.round || "INTRO");
        }
      } catch {
        if (isMounted) {
          setQuestion("");
          setStage("INTRO");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (interviewId) {
      fetchFirstQuestion();
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
        navigate(`/reports/${interviewId}`, { replace: true });
        return;
      }

      setQuestion(response?.question || "");
      setStage(response?.stage || response?.round || stage);
      setAnswer("");
      const nextCount = answeredCount + 1;
      setAnsweredCount(nextCount);
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
          <p className="mb-2 text-xs uppercase tracking-widest text-[#7b90b8]">
            Current Question
          </p>
          <p className="text-base leading-relaxed text-[#dce6ff]">
            {loading ? "Loading question..." : question || "No question available."}
          </p>
        </section>

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
