import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function StageBar({ label, score, colorClass }) {
  const bounded = Math.max(0, Math.min(Number(score) || 0, 10));
  const width = `${(bounded / 10) * 100}%`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs sm:text-sm">
        <span className="min-w-0 shrink text-[#64748b]">{label}</span>
        <span className="shrink-0 font-semibold text-[#0f172a]">{bounded.toFixed(1)}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#e2e8f0]">
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

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth={2.5}>
      <path d="m15 18-6-6 6-6" />
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
      try {
        const response = await apiRequest(`/interview/${id}/report`, { method: "GET" });
        if (isMounted) setReport(response);
      } catch (fetchError) {
        if (!isMounted) return;
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

  if (loading) {
    return (
      <main className="relative min-h-dvh bg-white px-4 py-4 text-[#1e293b] sm:px-6">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />
        <div className="relative z-10 flex min-h-[75dvh] items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#852a4e]" />
        </div>
      </main>
    );
  }

  const reportData = report || summary;
  const overallScore = Number(reportData.overallScore ?? reportData.score ?? 0);
  const completedAt = reportData.completedAt || reportData.createdAt;

  const stageSource = reportData.stageBreakdown || reportData.stageScores || reportData.performanceByStage || {};
  const stageScores = {
    intro: Number(stageSource.intro ?? stageSource.INTRO ?? 7.5),
    technical: Number(stageSource.technical ?? stageSource.TECHNICAL ?? 6.0),
    behavioral: Number(stageSource.behavioral ?? stageSource.BEHAVIORAL ?? 8.0),
  };

  const detailedFeedback = reportData.questions || reportData.detailedFeedback || reportData.feedback || [];

  const scorePercent = Math.max(0, Math.min((overallScore / 10) * 100, 100));
  const performanceLabel =
    reportData.performanceLabel ||
    (overallScore >= 8 ? "Strong Performance" : overallScore >= 6.5 ? "Good Performance" : "Needs Improvement");

  function getScoreTone(score) {
    if (score >= 7) {
      return {
        text: "text-[#15803d]",
        bar: "from-[#34d399] to-[#059669]",
        ring: "#059669",
      };
    }
    if (score >= 4) {
      return {
        text: "text-[#b45309]",
        bar: "from-[#fbbf24] to-[#d97706]",
        ring: "#d97706",
      };
    }
    return {
      text: "text-[#dc2626]",
      bar: "from-[#fb7185] to-[#dc2626]",
      ring: "#dc2626",
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
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-white text-[#1e293b]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />

      <div className="relative z-10 flex flex-col">
        <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
          <span className="min-w-0 shrink truncate text-[1.35rem] font-semibold tracking-tight text-[#0f172a] sm:text-[1.5rem] md:text-[1.6rem]">
            Interviewly<span className="text-[#852a4e]">AI</span>
          </span>
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex max-w-full cursor-pointer items-center gap-1.5 rounded-2xl border border-[rgba(133,42,78,0.16)] bg-white px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08),0_20px_48px_rgba(0,0,0,0.06)] ring-1 ring-black/4 transition hover:border-[rgba(133,42,78,0.26)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.1),0_28px_56px_rgba(133,42,78,0.07)] sm:gap-2 sm:px-3 sm:py-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#852a4e] to-[#a83d62] text-sm font-bold text-white shadow-[0_2px_8px_rgba(133,42,78,0.35)] ring-2 ring-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden min-w-0 text-left leading-tight sm:block">
                <p className="max-w-[140px] truncate text-sm font-medium text-[#0f172a] md:max-w-[220px]">
                  {displayName}
                </p>
                <p className="text-[11px] text-[#64748b]">Free Plan</p>
              </div>
              <span className="shrink-0 text-[#64748b]">
                <ChevronDownIcon />
              </span>
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-[#374151] transition hover:bg-[rgba(133,42,78,0.06)]"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="mx-4 mb-6 w-full max-w-[1280px] rounded-xl border border-[rgba(133,42,78,0.2)] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:mx-auto sm:mb-8 sm:rounded-2xl sm:p-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(133,42,78,0.22)] bg-[rgba(133,42,78,0.09)] px-4 py-2.5 text-sm font-semibold text-[#852a4e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(133,42,78,0.1)] ring-1 ring-black/3 transition hover:border-[rgba(133,42,78,0.32)] hover:bg-[rgba(133,42,78,0.14)] hover:shadow-[0_2px_10px_rgba(133,42,78,0.14)] sm:w-auto sm:justify-start sm:py-2"
          >
            <ChevronLeftIcon />
            Back to Dashboard
          </button>

          <section className="mb-3 rounded-xl border border-[#e2e8f0] bg-[#fafbff] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <h1 className="wrap-break-word text-2xl font-semibold text-[#0f172a] sm:text-3xl">Interview Report</h1>
                {completedAt ? (
                  <p className="mt-1 wrap-break-word text-xs text-[#64748b]">
                    Completed on {new Date(completedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <p className="wrap-break-word text-xs text-[#94a3b8] sm:max-w-48 sm:shrink-0 sm:text-right md:max-w-none">
                Interview ID: {id}
              </p>
            </div>
          </section>

          <section className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/4 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#475569]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(133,42,78,0.1)] text-[#852a4e]">
                  <OverallScoreIcon />
                </span>
                Overall Score
              </div>
              <div className="flex flex-col items-center justify-center gap-3 py-2">
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-full p-[3px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] sm:h-28 sm:w-28"
                  style={{
                    background: `conic-gradient(${overallTone.ring} ${scorePercent}%, #e2e8f0 ${scorePercent}% 100%)`,
                  }}
                >
                  <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] sm:h-[102px] sm:w-[102px]">
                    <p className="text-4xl font-bold leading-none text-[#0f172a] sm:text-5xl">{overallScore.toFixed(1)}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#64748b] sm:text-base">/10</p>
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-[#64748b]">
                  Performance: <span className={`font-semibold ${overallTone.text}`}>{performanceLabel}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/4 sm:p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">Performance by Stage</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbff] p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[#852a4e]">
                    <StageIcon type="intro" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[#374151]">Intro</span>
                  </div>
                  <StageBar label="Score" score={stageScores.intro} colorClass={`bg-linear-to-r ${introTone.bar}`} />
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbff] p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[#475569]">
                    <StageIcon type="technical" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[#374151]">Technical</span>
                  </div>
                  <StageBar label="Score" score={stageScores.technical} colorClass={`bg-linear-to-r ${technicalTone.bar}`} />
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbff] p-2.5">
                  <div className="mb-2 flex items-center gap-2 text-[#059669]">
                    <StageIcon type="behavioral" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[#374151]">Behavioral</span>
                  </div>
                  <StageBar label="Score" score={stageScores.behavioral} colorClass={`bg-linear-to-r ${behavioralTone.bar}`} />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-3 rounded-xl border border-[#e2e8f0] bg-white px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/4 sm:px-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-[#0f172a]">Detailed Feedback</h3>
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
                className="w-fit cursor-pointer text-left text-xs font-semibold text-[#852a4e] transition hover:text-[#6b2240] sm:text-right"
              >
                Expand All
              </button>
            </div>

            <div className="divide-y divide-[#e2e8f0]">
              {detailedFeedback.length > 0 ? (
                detailedFeedback.map((item, index) => (
                  <div key={`${item.question || "question"}-${index}`} className="py-2">
                    <button
                      type="button"
                      onClick={() => toggleRow(index)}
                      className="flex w-full flex-col gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-[rgba(133,42,78,0.05)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
                    >
                      <p className="min-w-0 flex-1 wrap-break-word text-sm text-[#334155]">
                        {item.question || `Question ${index + 1}`}
                      </p>
                      <div className="flex shrink-0 items-center justify-between gap-2 text-[#64748b] sm:justify-end">
                        <span className={`text-sm font-semibold ${getScoreTone(Number(item.score ?? 0)).text}`}>
                          {Number(item.score ?? 0).toFixed(0)}/10
                        </span>
                        <RowChevronIcon expanded={Boolean(expandedRows[index])} />
                      </div>
                    </button>
                    {expandedRows[index] ? (
                      <div className="mx-0 mt-1 space-y-1 rounded-lg border border-[#e2e8f0] bg-[#fafbff] p-2.5 text-xs text-[#475569] sm:mx-2">
                        {item.answer ? (
                          <p>
                            <span className="font-semibold text-[#0f172a]">Answer:</span> {item.answer}
                          </p>
                        ) : null}
                        {item.strengths ? (
                          <p>
                            <span className="font-semibold text-[#15803d]">Strength:</span> {item.strengths}
                          </p>
                        ) : null}
                        {item.improvements ? (
                          <p>
                            <span className="font-semibold text-[#b45309]">Improvement:</span> {item.improvements}
                          </p>
                        ) : null}
                        {!item.answer && !item.strengths && !item.improvements ? (
                          <p>{item.feedback || item.comment || "No additional feedback."}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="py-3 text-sm text-[#64748b]">No detailed feedback available.</p>
              )}
            </div>
          </section>

          {error ? <p className="mt-2 text-center text-xs font-medium text-[#dc2626]">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}

export default ReportsPage;
