import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function StageBar({ label, score, colorClass }) {
  const bounded = Math.max(0, Math.min(Number(score) || 0, 10));
  const width = `${(bounded / 10) * 100}%`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-[#cfe0ff]">{label}</span>
        <span className="font-semibold text-white">{bounded.toFixed(1)}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(147,173,233,0.2)]">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function RowChevronIcon({ expanded }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StageIcon({ type }) {
  if (type === "intro") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.5-3.7 3.8-5.5 7-5.5s5.5 1.8 7 5.5" />
      </svg>
    );
  }
  if (type === "technical") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
      <path d="M16 11c1.4 0 2.5-1.2 2.5-2.6S17.4 5.8 16 5.8s-2.5 1.2-2.5 2.6S14.6 11 16 11ZM8 11c1.4 0 2.5-1.2 2.5-2.6S9.4 5.8 8 5.8 5.5 7 5.5 8.4 6.6 11 8 11ZM8 13.5c-2.3 0-4.2 1.3-5 3.7m13-3.7c2.3 0 4.2 1.3 5 3.7m-10-.1c.5-1.8 2-2.8 3.8-2.8 1.8 0 3.3 1 3.8 2.8" />
    </svg>
  );
}

function OverallScoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19h16M7 16l3-3 2 2 5-5" />
    </svg>
  );
}

function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const summary = location.state || {};
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReportValidated, setIsReportValidated] = useState(false);
  const [shouldRedirectToDashboard, setShouldRedirectToDashboard] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const displayName = localStorage.getItem("userName") || "User";
  const profileMenuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      if (!id) return;
      setLoading(true);
      setError("");
      setShouldRedirectToDashboard(false);
      try {
        await apiRequest(`/interview/${id}/status`, { method: "GET" });
        if (!isMounted) return;
        setIsReportValidated(true);

        const response = await apiRequest(`/interview/${id}/report`, { method: "GET" });
        if (isMounted) setReport(response);
      } catch (fetchError) {
        if (!isMounted) return;
        if ([400, 401, 403, 404].includes(fetchError?.status)) {
          setShouldRedirectToDashboard(true);
          return;
        }
        setError(fetchError.message || "Failed to fetch report.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (shouldRedirectToDashboard) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  if (!isReportValidated && loading) {
    return (
      <main className="min-h-screen bg-[#02050d] px-6 py-4 text-[#f4f7ff]">
        <div className="flex min-h-[80vh] items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.25)] border-t-[#7b5eff]" />
        </div>
      </main>
    );
  }

  const reportData = report || summary;
  const overallScore = Number(reportData.overallScore ?? reportData.score ?? 0);
  const completedAt = reportData.completedAt || reportData.createdAt;

  const stageScores = useMemo(() => {
    const source = reportData.stageBreakdown || reportData.stageScores || reportData.performanceByStage || {};
    return {
      intro: Number(source.intro ?? source.INTRO ?? 7.5),
      technical: Number(source.technical ?? source.TECHNICAL ?? 6.0),
      behavioral: Number(source.behavioral ?? source.BEHAVIORAL ?? 8.0),
    };
  }, [reportData]);

  const detailedFeedback = reportData.questions || reportData.detailedFeedback || reportData.feedback || [];

  const scorePercent = Math.max(0, Math.min((overallScore / 10) * 100, 100));
  const performanceLabel =
    reportData.performanceLabel ||
    (overallScore >= 8 ? "Strong Performance" : overallScore >= 6.5 ? "Good Performance" : "Needs Improvement");

  function getScoreTone(score) {
    if (score >= 7) {
      return {
        text: "text-[#3ddc97]",
        bar: "from-[#20dca3] to-[#15b27a]",
        ring: "#20dca3",
      };
    }
    if (score >= 4) {
      return {
        text: "text-[#fbbf24]",
        bar: "from-[#fbbf24] to-[#f59e0b]",
        ring: "#f59e0b",
      };
    }
    return {
      text: "text-[#fb7185]",
      bar: "from-[#fb7185] to-[#ef4444]",
      ring: "#ef4444",
    };
  }

  const overallTone = getScoreTone(overallScore);
  const introTone = getScoreTone(stageScores.intro);
  const technicalTone = getScoreTone(stageScores.technical);
  const behavioralTone = getScoreTone(stageScores.behavioral);

  function toggleRow(index) {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login", { replace: true });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_20%_10%,#0f245f_0%,#050918_45%,#03050f_100%)] text-[#f4f7ff]">
      <div className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,#4f46e5_0%,transparent_70%)] opacity-45 blur-md" />
      <div className="pointer-events-none absolute -right-10 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,#2563eb_0%,transparent_70%)] opacity-40 blur-md" />

      <div className="relative z-10 flex flex-col">
        <header className="flex items-center justify-between px-8 py-5">
          <span className="text-[1.6rem] font-semibold tracking-tight text-[#f4f7ff]">
            Interviewly<span className="text-[#4e8dff]">AI</span>
          </span>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[rgba(145,172,255,0.2)] bg-[rgba(16,24,46,0.55)] px-3 py-2 backdrop-blur-md transition hover:border-[rgba(145,172,255,0.35)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#4e8dff] to-[#7c3aed] text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-medium text-[#f4f7ff]">{displayName}</p>
                <p className="text-[11px] text-[#8fa3c8]">Free Plan</p>
              </div>
              <ChevronDownIcon />
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-[rgba(145,172,255,0.22)] bg-[rgba(10,17,35,0.96)] p-1.5 shadow-[0_14px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-[#f4f7ff] transition hover:bg-[rgba(145,172,255,0.12)]"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="mx-8 mb-8 rounded-2xl border border-[rgba(145,172,255,0.16)] bg-[rgba(8,16,36,0.58)] p-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(145,172,255,0.24)] bg-[rgba(14,24,52,0.56)] px-3 py-2 text-sm font-medium text-[#cfe0ff] transition hover:border-[rgba(145,172,255,0.4)] hover:bg-[rgba(145,172,255,0.12)]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[rgba(90,129,255,0.2)] text-[#78a5ff]">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={2.5}>
                <path d="M15 18 9 12l6-6" />
              </svg>
            </span>
            Back to Dashboard
          </button>

          <section className="mb-3 rounded-xl border border-[rgba(145,172,255,0.14)] bg-[rgba(16,28,58,0.45)] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">Interview Report</h1>
                {completedAt ? (
                  <p className="mt-1 text-xs text-[#8ea5d1]">
                    Completed on {new Date(completedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-[#9db1d6]">Interview ID: {id}</p>
            </div>
          </section>

          <section className="mb-3 grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-xl border border-[rgba(145,172,255,0.18)] bg-[linear-gradient(140deg,rgba(20,33,71,0.62),rgba(12,21,44,0.55))] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.24)]">
              <div className="mb-2 flex items-center gap-2 text-sm text-[#9cb2dc]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(90,129,255,0.2)] text-[#78a5ff]">
                  <OverallScoreIcon />
                </span>
                Overall Score
              </div>
              <div className="flex flex-col items-center justify-center gap-3 py-2">
                <div
                  className="relative flex h-28 w-28 items-center justify-center rounded-full shadow-[inset_0_0_24px_rgba(79,125,255,0.25)]"
                  style={{
                    background: `conic-gradient(${overallTone.ring} ${scorePercent}%, rgba(147,173,233,0.17) ${scorePercent}% 100%)`,
                  }}
                >
                  <div className="flex h-[102px] w-[102px] flex-col items-center justify-center rounded-full bg-[#0a1431]">
                    <p className="text-5xl font-bold leading-none">{overallScore.toFixed(1)}</p>
                    <p className="mt-0.5 text-base font-medium text-[#8ea5d1]">/10</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#9cb2dc]">
                  Performance: <span className={`font-semibold ${overallTone.text}`}>{performanceLabel}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(145,172,255,0.18)] bg-[linear-gradient(140deg,rgba(20,33,71,0.62),rgba(12,21,44,0.55))] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.24)]">
              <h2 className="mb-3 text-sm font-semibold text-[#d8e4ff]">Performance by Stage</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[rgba(145,172,255,0.16)] bg-[rgba(8,15,34,0.35)] p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[#76b0ff]">
                    <StageIcon type="intro" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[#cde0ff]">Intro</span>
                  </div>
                  <StageBar label="Score" score={stageScores.intro} colorClass={`bg-linear-to-r ${introTone.bar}`} />
                </div>
                <div className="rounded-lg border border-[rgba(145,172,255,0.16)] bg-[rgba(8,15,34,0.35)] p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[#a18bff]">
                    <StageIcon type="technical" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[#cde0ff]">Technical</span>
                  </div>
                  <StageBar label="Score" score={stageScores.technical} colorClass={`bg-linear-to-r ${technicalTone.bar}`} />
                </div>
                <div className="rounded-lg border border-[rgba(145,172,255,0.16)] bg-[rgba(8,15,34,0.35)] p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[#4ce2ae]">
                    <StageIcon type="behavioral" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[#cde0ff]">Behavioral</span>
                  </div>
                  <StageBar label="Score" score={stageScores.behavioral} colorClass={`bg-linear-to-r ${behavioralTone.bar}`} />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-3 rounded-xl border border-[rgba(145,172,255,0.14)] bg-[rgba(16,28,58,0.45)] px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#edf3ff]">Detailed Feedback</h3>
              <button
                type="button"
                onClick={() => {
                  const allExpanded = detailedFeedback.every((_, idx) => expandedRows[idx]);
                  const nextState = {};
                  detailedFeedback.forEach((_, idx) => {
                    nextState[idx] = !allExpanded;
                  });
                  setExpandedRows(nextState);
                }}
                className="text-xs text-[#86a7e3] hover:text-white"
              >
                Expand All
              </button>
            </div>

            <div className="divide-y divide-[rgba(145,172,255,0.14)]">
              {detailedFeedback.length > 0 ? (
                detailedFeedback.map((item, index) => (
                  <div key={`${item.question || "question"}-${index}`} className="py-2">
                    <button
                      type="button"
                      onClick={() => toggleRow(index)}
                      className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left transition hover:bg-[rgba(145,172,255,0.08)]"
                    >
                      <p className="text-sm text-[#dce8ff]">{item.question || `Question ${index + 1}`}</p>
                      <div className="flex shrink-0 items-center gap-2 text-[#9eb7e2]">
                        <span className={`text-sm font-semibold ${getScoreTone(Number(item.score ?? 0)).text}`}>
                          {Number(item.score ?? 0).toFixed(0)}/10
                        </span>
                        <RowChevronIcon expanded={Boolean(expandedRows[index])} />
                      </div>
                    </button>
                    {expandedRows[index] ? (
                      <div className="mx-2 mt-1 rounded-lg border border-[rgba(145,172,255,0.14)] bg-[rgba(7,13,30,0.45)] p-2.5 space-y-1 text-xs text-[#8ea6d1]">
                        {item.answer ? <p><span className="text-[#b7c9ea]">Answer:</span> {item.answer}</p> : null}
                        {item.strengths ? <p><span className="text-[#76e6bc]">Strength:</span> {item.strengths}</p> : null}
                        {item.improvements ? <p><span className="text-[#f9c46f]">Improvement:</span> {item.improvements}</p> : null}
                        {!item.answer && !item.strengths && !item.improvements ? (
                          <p>{item.feedback || item.comment || "No additional feedback."}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="py-3 text-sm text-[#8ea6d1]">No detailed feedback available.</p>
              )}
            </div>
          </section>

          {loading ? <p className="mt-2 text-center text-xs text-[#9bb0d8]">Loading report...</p> : null}
          {error ? <p className="mt-2 text-center text-xs text-[#ff9ca6]">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}

export default ReportsPage;
