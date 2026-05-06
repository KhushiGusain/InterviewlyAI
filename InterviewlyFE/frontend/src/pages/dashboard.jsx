import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

const FOCUS_AREAS = [
  "DSA",
  "System Design",
  "OOP",
  "DBMS",
  "Operating Systems",
  "Networks",
  "Frontend",
  "Backend",
  "Testing",
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
      <path d="M3 3v18h18" />
      <path d="m7 16 4-4 4 4 4-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="3" width="14" height="18" />
      <path d="M16 8h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4" />
      <path d="M6 8v.01M6 12v.01M6 16v.01M10 8v.01M10 12v.01M10 16v.01" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#a78bfa]">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toUpperCase();
  if (normalizedStatus === "COMPLETED") {
    return (
      <span className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-0.5 text-xs font-medium text-[#4ade80]">
        Completed
      </span>
    );
  }
  if (normalizedStatus === "IN_PROGRESS") {
    return (
      <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-0.5 text-xs font-medium text-[#fbbf24]">
        Continue Interview
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#60a5fa]/40 bg-[#60a5fa]/10 px-3 py-0.5 text-xs font-medium text-[#93c5fd]">
      Start
    </span>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [formData, setFormData] = useState({
    role: "",
    company: "",
    jobDescription: "",
    focusAreas: [],
  });
  const [customTopics, setCustomTopics] = useState([]);
  const [isCustomTopicModalOpen, setIsCustomTopicModalOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [customTopicError, setCustomTopicError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [dashboardData, setDashboardData] = useState(null);
  const recentInterviews = dashboardData?.recentInterviews || [];
  const incompleteCount = recentInterviews.filter(
    (item) => item.status === "IN_PROGRESS" || item.status === "NOT_STARTED"
  ).length;

  function getInterviewNavigationPath(item) {
    const status = String(item?.status || "").toUpperCase();
    if (status === "COMPLETED") return `/reports/${item.id}`;
    if (status === "IN_PROGRESS" || status === "NOT_STARTED" || status === "CREATED") {
      return `/interview/${item.id}`;
    }
    return `/interview/${item.id}`;
  }

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName?.trim()) {
      setDisplayName(storedName.trim());
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const response = await apiRequest("/dashboard", {
          method: "GET",
        });
        if (isMounted) {
          setDashboardData(response);
        }
      } catch {
        if (isMounted) {
          setDashboardData(null);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(eventOrName, value) {
    if (typeof eventOrName === "string") {
      setFormData((prev) => ({ ...prev, [eventOrName]: value }));
      return;
    }

    const { name, value: inputValue } = eventOrName.target;
    setFormData((prev) => ({ ...prev, [name]: inputValue }));
  }

  function toggleFocus(area) {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  }

  function openCustomTopicModal() {
    setCustomTopicInput("");
    setCustomTopicError("");
    setIsCustomTopicModalOpen(true);
  }

  function closeCustomTopicModal() {
    setIsCustomTopicModalOpen(false);
    setCustomTopicInput("");
    setCustomTopicError("");
  }

  function handleAddCustomTopic() {
    const topic = customTopicInput.trim();
    if (!topic) {
      setCustomTopicError("Topic name is required.");
      return;
    }

    const normalizedTopic = topic.toLowerCase();
    const alreadyExistsInDefault = FOCUS_AREAS.some((area) => area.toLowerCase() === normalizedTopic);
    const alreadyExistsInCustom = customTopics.some((area) => area.toLowerCase() === normalizedTopic);
    if (alreadyExistsInDefault || alreadyExistsInCustom) {
      setCustomTopicError("This topic already exists.");
      return;
    }

    setCustomTopics((prev) => [...prev, topic]);
    setFormData((prev) => ({ ...prev, focusAreas: [...prev.focusAreas, topic] }));
    closeCustomTopicModal();
  }

  function validateResumeFile(file) {
    if (!file) return false;

    const maxSizeInBytes = 5 * 1024 * 1024;
    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    if (!allowedExtensions.test(file.name)) {
      setResumeError("Only PDF, DOC, and DOCX files are allowed.");
      return false;
    }

    if (file.size > maxSizeInBytes) {
      setResumeError("File size must be 5MB or less.");
      return false;
    }

    setResumeError("");
    return true;
  }

  function handleResumeSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateResumeFile(file)) {
      event.target.value = "";
      setResumeFileName("");
      setResumeFile(null);
      return;
    }

    setResumeFileName(file.name);
    setResumeFile(file);
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login", { replace: true });
  }

  async function handleSubmit() {
    setSubmitError("");

    if (!formData.role.trim()) {
      setSubmitError("Role is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("role", formData.role);
      payload.append("company", formData.company);
      payload.append("jobDescription", formData.jobDescription);
      payload.append("focusAreas", JSON.stringify(formData.focusAreas));
      if (resumeFile) {
        payload.append("resume", resumeFile);
      }

      const response = await apiRequest("/interview", {
        method: "POST",
        body: payload,
      });

      const interviewId = response?.id ?? response?.interview?.id;
      if (!interviewId) {
        throw new Error("Interview created, but no interview id was returned.");
      }

      navigate(`/interview/${interviewId}`);
    } catch (error) {
      setSubmitError(error.message || "Failed to start interview.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-y-auto overflow-x-hidden text-[#f4f7ff]"
      data-dashboard-loaded={Boolean(dashboardData)}
      style={{ background: "radial-gradient(circle at 20% 10%, #0f245f 0%, #050918 45%, #03050f 100%)" }}
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute right-[6%] top-[5%] h-[280px] w-[280px] rounded-full opacity-90 blur-[1px]"
        style={{ background: "radial-gradient(circle at 35% 35%, #4db3ff 0%, #275cff 65%, transparent 100%)" }} />
      <div className="pointer-events-none absolute bottom-[8%] right-[3%] h-[220px] w-[220px] rounded-full opacity-80 blur-[2px]"
        style={{ background: "radial-gradient(circle at 35% 35%, #61c6ff 0%, #315dff 60%, transparent 100%)" }} />
      <div className="pointer-events-none absolute bottom-[22%] left-[46%] h-[180px] w-[180px] rounded-full opacity-70 blur-[2px]"
        style={{ background: "radial-gradient(circle at 35% 35%, #55a2ff 0%, #253fce 65%, transparent 100%)" }} />

      <div className="relative z-10 flex flex-col">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5">
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
        </nav>

        {/* Header Banner */}
        <div className="relative mx-8 mb-6 overflow-hidden rounded-2xl border border-[rgba(145,172,255,0.15)] bg-[rgba(10,18,45,0.6)] px-8 py-4 backdrop-blur-md">
          <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 h-[140px] w-[140px] rounded-full opacity-95"
            style={{ background: "radial-gradient(circle at 35% 35%, #4db3ff 0%, #275cff 65%, transparent 100%)" }} />
          <h1 className="mb-1 text-3xl font-bold text-[#f4f7ff]">Good to see you, {displayName}!</h1>
          <p className="text-sm text-[#8fa3c8]">Let&apos;s ace your next interview.</p>
        </div>

        {/* Main grid */}
        <div className="mx-8 mb-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left — Create New Interview */}
          <div className="rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
            <div className="mb-1 flex items-center">
              <h2 className="text-lg font-semibold text-[#f4f7ff]">Create New Interview</h2>
              ✨
            </div>
            <p className="mb-4 text-xs text-[#7b90b8]">Tailor your interview experience to your goals.</p>

            <div className="grid gap-3.5">
              {/* Row 1: Role + Company */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold text-[#d7e5ff]">
                  Role / Position *
                  <span className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a7299]">
                      <BriefcaseIcon />
                    </span>
                    <input
                      type="text"
                      name="role"
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-[rgba(145,172,255,0.2)] bg-[rgba(7,13,30,0.7)] pl-8.5 pr-3 text-sm text-[#f2f5ff] outline-none transition placeholder:text-[#6e7f9b] focus:border-[#4e8dff] focus:shadow-[0_0_0_2px_rgba(78,141,255,0.18)]"
                    />
                  </span>
                </label>

                <label className="grid gap-1 text-xs font-semibold text-[#d7e5ff]">
                  Company
                  <span className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a7299]">
                      <BuildingIcon />
                    </span>
                    <input
                      type="text"
                      name="company"
                      placeholder="e.g. Google, Microsoft (optional)"
                      value={formData.company}
                      onChange={handleChange}
                      className="h-10 w-full rounded-xl border border-[rgba(145,172,255,0.2)] bg-[rgba(7,13,30,0.7)] pl-8.5 pr-3 text-sm text-[#f2f5ff] outline-none transition placeholder:text-[#6e7f9b] focus:border-[#4e8dff] focus:shadow-[0_0_0_2px_rgba(78,141,255,0.18)]"
                    />
                  </span>
                </label>
              </div>

              {/* Job Description */}
              <label className="grid gap-1 text-xs font-semibold text-[#d7e5ff]">
                Job Description <span className="font-medium text-[#8197bb]">(Paste or type)</span>
                <textarea
                  name="jobDescription"
                  placeholder="Paste the job description here..."
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[rgba(145,172,255,0.2)] bg-[rgba(7,13,30,0.7)] p-3 text-sm text-[#f2f5ff] outline-none transition placeholder:text-[#6e7f9b] focus:border-[#4e8dff] focus:shadow-[0_0_0_2px_rgba(78,141,255,0.18)]"
                />
              </label>

              {/* Focus Areas */}
              <div>
                <p className="mb-2 text-xs font-medium text-[#a0b4d6]">
                  Focus Areas{" "}
                  <span className="font-normal text-[#8197bb]">(Select all that apply)</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {[...FOCUS_AREAS, ...customTopics].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocus(area)}
                      className={`flex min-w-[84px] cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        formData.focusAreas.includes(area)
                          ? "border-[#4e8dff] bg-[rgba(78,141,255,0.18)] text-[#7ab4ff]"
                          : "border-[rgba(145,172,255,0.18)] bg-[rgba(7,13,30,0.5)] text-[#7b90b8] hover:border-[rgba(145,172,255,0.35)]"
                      }`}
                    >
                      {formData.focusAreas.includes(area) && (
                        <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {area}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={openCustomTopicModal}
                    className="flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-[rgba(145,172,255,0.25)] px-3 py-1.5 text-xs text-[#5a7299] transition hover:border-[rgba(145,172,255,0.45)] hover:text-[#7b90b8]"
                  >
                    <PlusIcon /> Add Custom Topic
                  </button>
                </div>
              </div>

              {/* Upload Resume */}
              <div>
                <p className="mb-2 text-xs font-medium text-[#a0b4d6]">
                  Upload Resume <span className="font-normal text-[#8197bb]">(Optional, PDF/DOCX)</span>
                </p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => resumeInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      resumeInputRef.current?.click();
                    }
                  }}
                  className="flex h-[58px] cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.5)] px-4 transition hover:border-[rgba(145,172,255,0.4)]"
                >
                  <UploadIcon />
                  <div>
                    <p className="text-xs leading-tight text-[#9aaed0]">
                      {resumeFileName || "Click to upload or drag and drop"}
                    </p>
                    <p className="text-[11px] leading-tight text-[#7b90b8]">Max file size: 5MB</p>
                  </div>
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeSelect}
                  className="hidden"
                />
                {resumeError ? <p className="mt-2 text-xs text-[#ff9ca6]">{resumeError}</p> : null}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-linear-to-r from-[#2f80ff] to-[#5b33ff] text-sm font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(78,141,255,0.35)] transition hover:brightness-110 hover:shadow-[0_4px_28px_rgba(78,141,255,0.5)] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="9" className="opacity-30" />
                    <path d="M21 12a9 9 0 0 0-9-9" className="opacity-100" />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  Start Interview
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
            {submitError ? <p className="mt-2 text-xs text-[#ff9ca6]">{submitError}</p> : null}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Your Progress */}
            <div className="rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-6 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
              <h2 className="mb-4 text-base font-semibold text-[#f4f7ff]">Your Progress</h2>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { icon: <CalendarIcon />, value: String(dashboardData?.totalInterviews ?? 0), label: "Interviews", color: "text-[#4e8dff]", bg: "bg-[rgba(78,141,255,0.15)]" },
                  { icon: <CheckCircleIcon />, value: String(dashboardData?.completedInterviews ?? 0), label: "Completed", color: "text-[#a78bfa]", bg: "bg-[rgba(167,139,250,0.15)]" },
                  { icon: <ChartIcon />, value: `${Number(dashboardData?.avgScore ?? 0).toFixed(2)}`, label: "Avg. Score", color: "text-[#34d399]", bg: "bg-[rgba(52,211,153,0.15)]" },
                  { icon: <ClockIcon />, value: String(incompleteCount), label: "Incomplete", color: "text-[#fb923c]", bg: "bg-[rgba(251,146,60,0.15)]" },
                ].map(({ icon, value, label, color, bg }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
                      {icon}
                    </div>
                    <p className="text-xl font-bold text-[#f4f7ff]">{value}</p>
                    <p className="text-[11px] leading-tight text-[#6b7fa3]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Interviews */}
            <div className="rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-6 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#f4f7ff]">Recent Interviews</h2>
                <button
                  type="button"
                  onClick={() => navigate("/interviews")}
                  className="cursor-pointer text-xs font-medium text-[#4e8dff] transition hover:text-[#7ab4ff]"
                >
                  View All
                </button>
              </div>

              <div className="grid gap-2">
                {recentInterviews.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(getInterviewNavigationPath(item))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(145,172,255,0.1)] bg-[rgba(7,13,30,0.45)] px-4 py-3 transition hover:border-[rgba(145,172,255,0.25)] hover:bg-[rgba(7,13,30,0.65)]"
                  >
                    {/* Company logo */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(78,141,255,0.2)] text-sm font-bold text-[#9ec3ff]">
                      {String(item.role || "?").charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#f4f7ff]">{item.role}</p>
                      <p className="text-[11px] text-[#5a7299]">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[#f4f7ff]">
                        {item.score === null || item.score === undefined ? "—" : Number(item.score).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-[#5a7299]">Score</p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Arrow */}
                    <div className="shrink-0 text-[#3a4d6a]">
                      <ChevronRightIcon />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCustomTopicModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040b]/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(145,172,255,0.2)] bg-[rgba(10,17,35,0.98)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-semibold text-[#f4f7ff]">Add Custom Topic</h3>
            <p className="mt-1 text-xs text-[#8fa3c8]">Create a focus area and add it as a selectable chip.</p>

            <label className="mt-4 grid gap-1 text-xs font-semibold text-[#d7e5ff]">
              Topic Name
              <input
                type="text"
                value={customTopicInput}
                onChange={(event) => {
                  setCustomTopicInput(event.target.value);
                  if (customTopicError) setCustomTopicError("");
                }}
                placeholder="e.g. Distributed Systems"
                className="h-10 w-full rounded-xl border border-[rgba(145,172,255,0.2)] bg-[rgba(7,13,30,0.7)] px-3 text-sm text-[#f2f5ff] outline-none transition placeholder:text-[#6e7f9b] focus:border-[#4e8dff] focus:shadow-[0_0_0_2px_rgba(78,141,255,0.18)]"
              />
            </label>
            {customTopicError ? <p className="mt-2 text-xs text-[#ff9ca6]">{customTopicError}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCustomTopicModal}
                className="h-9 rounded-lg border border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.45)] px-3 text-xs font-medium text-[#c8d8f8] transition hover:border-[rgba(145,172,255,0.45)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomTopic}
                className="h-9 rounded-lg bg-linear-to-r from-[#2f80ff] to-[#5b33ff] px-3 text-xs font-semibold text-white transition hover:brightness-110"
              >
                Add Topic
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default DashboardPage;
