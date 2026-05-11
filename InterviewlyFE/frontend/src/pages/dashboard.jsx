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
const DASHBOARD_FORM_STORAGE_KEY = "interviewly_dashboard_form";
const initialFormState = {
  role: "",
  company: "",
  jobDescription: "",
  focusAreas: [],
};

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
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#852a4e]">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toUpperCase();
  if (normalizedStatus === "COMPLETED") {
    return (
      <span className="rounded-full border border-[#22c55e]/35 bg-[#dcfce7] px-3 py-0.5 text-xs font-medium text-[#15803d]">
        Completed
      </span>
    );
  }
  if (normalizedStatus === "IN_PROGRESS") {
    return (
      <span className="max-w-44 rounded-full border border-[#f59e0b]/35 bg-[#fef3c7] px-2 py-1 text-center text-[10px] font-medium leading-tight text-[#b45309] sm:max-w-none sm:px-3 sm:py-0.5 sm:text-xs">
        Continue Interview
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[rgba(133,42,78,0.25)] bg-[rgba(133,42,78,0.08)] px-3 py-0.5 text-xs font-medium text-[#852a4e]">
      Start
    </span>
  );
}

function readDraftFromStorage() {
  try {
    const raw = localStorage.getItem(DASHBOARD_FORM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function DashboardPage() {
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [formData, setFormData] = useState(() => {
    const draft = readDraftFromStorage();
    const saved = draft?.formData;
    if (!saved || typeof saved !== "object") return initialFormState;
    return {
      role: typeof saved.role === "string" ? saved.role : "",
      company: typeof saved.company === "string" ? saved.company : "",
      jobDescription: typeof saved.jobDescription === "string" ? saved.jobDescription : "",
      focusAreas: Array.isArray(saved.focusAreas)
        ? saved.focusAreas.filter((a) => typeof a === "string")
        : [],
    };
  });
  const [customTopics, setCustomTopics] = useState(() => {
    const draft = readDraftFromStorage();
    return Array.isArray(draft?.customTopics)
      ? draft.customTopics.filter((t) => typeof t === "string")
      : [];
  });
  const [isCustomTopicModalOpen, setIsCustomTopicModalOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [customTopicError, setCustomTopicError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [roleError, setRoleError] = useState("");
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
    try {
      localStorage.setItem(
        DASHBOARD_FORM_STORAGE_KEY,
        JSON.stringify({ formData, customTopics })
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [formData, customTopics]);

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
      if (eventOrName === "role") setRoleError("");
      setFormData((prev) => ({ ...prev, [eventOrName]: value }));
      return;
    }

    const { name, value: inputValue } = eventOrName.target;
    if (name === "role") setRoleError("");
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
    setRoleError("");

    if (!formData.role.trim()) {
      setRoleError("Role is required.");
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

      setFormData(initialFormState);
      setCustomTopics([]);
      setResumeFileName("");
      setResumeFile(null);
      setResumeError("");
      localStorage.removeItem(DASHBOARD_FORM_STORAGE_KEY);
      navigate(`/interview/${interviewId}`);
    } catch (error) {
      setSubmitError(error.message || "Failed to start interview.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="relative min-h-dvh overflow-y-auto overflow-x-hidden bg-white text-[#1e293b]"
      data-dashboard-loaded={Boolean(dashboardData)}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />

      <div className="relative z-10 flex flex-col">
        {/* Navbar */}
        <nav className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
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
              <span className="shrink-0 text-[#64748b] sm:ml-0">
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
        </nav>

        {/* Header Banner */}
        <div className="relative mx-auto mb-4 w-full max-w-[1280px] overflow-hidden rounded-xl border border-[rgba(133,42,78,0.15)] bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05),0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/4 sm:mb-5 sm:rounded-2xl sm:px-6 sm:py-4 md:mb-6 md:px-8">
          <h1 className="mb-1 wrap-break-word text-2xl font-bold text-[#0f172a] sm:text-3xl">
            Good to see you, {displayName}!
          </h1>
          <p className="text-sm text-[#64748b]">Let&apos;s ace your next interview.</p>
        </div>

        {/* Main grid */}
        <div className="mx-auto mb-6 grid w-full max-w-[1280px] gap-4 px-4 sm:mb-8 sm:gap-5 sm:px-6 md:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left — Create New Interview */}
          <div className="rounded-xl border border-[rgba(133,42,78,0.2)] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:rounded-2xl sm:p-5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#0f172a] sm:text-lg">Create New Interview</h2>
              <SparkleIcon />
            </div>
            <p className="mb-4 text-xs text-[#64748b]">Tailor your interview experience to your goals.</p>

            <div className="grid gap-3.5">
              {/* Row 1: Role + Company */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold text-[#374151]">
                  Role / Position *
                  <span className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                      <BriefcaseIcon />
                    </span>
                    <input
                      type="text"
                      name="role"
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={handleChange}
                      className={`h-10 min-h-10 w-full rounded-xl bg-[#fafbff] pl-[34px] pr-3 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] ${
                        roleError
                          ? "border border-[#f87171] focus:border-[#dc2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]"
                          : "border border-[#e2e8f0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
                      }`}
                    />
                  </span>
                  {roleError ? <p className="text-[11px] font-medium text-[#dc2626]">{roleError}</p> : null}
                </label>

                <label className="grid gap-1 text-xs font-semibold text-[#374151]">
                  Company
                  <span className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                      <BuildingIcon />
                    </span>
                    <input
                      type="text"
                      name="company"
                      placeholder="e.g. Google, Microsoft (optional)"
                      value={formData.company}
                      onChange={handleChange}
                      className="h-10 min-h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#fafbff] pl-[34px] pr-3 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
                    />
                  </span>
                </label>
              </div>

              {/* Job Description */}
              <label className="grid gap-1 text-xs font-semibold text-[#374151]">
                Job Description <span className="font-medium text-[#94a3b8]">(Paste or type)</span>
                <textarea
                  name="jobDescription"
                  placeholder="Paste the job description here..."
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#fafbff] p-3 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
                />
              </label>

              {/* Focus Areas */}
              <div>
                <p className="mb-2 text-xs font-medium text-[#475569]">
                  Focus Areas{" "}
                  <span className="font-normal text-[#94a3b8]">(Select all that apply)</span>
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {[...FOCUS_AREAS, ...customTopics].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocus(area)}
                      className={`flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition sm:min-w-[80px] sm:px-3 ${
                        formData.focusAreas.includes(area)
                          ? "border-[#852a4e] bg-[rgba(133,42,78,0.1)] text-[#852a4e]"
                          : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[rgba(133,42,78,0.25)]"
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
                    className="flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#cbd5e1] px-3 py-1.5 text-xs text-[#64748b] transition hover:border-[rgba(133,42,78,0.35)] hover:text-[#852a4e]"
                  >
                    <PlusIcon /> Add Custom Topic
                  </button>
                </div>
              </div>

              {/* Upload Resume */}
              <div>
                <p className="mb-2 text-xs font-medium text-[#475569]">
                  Upload Resume <span className="font-normal text-[#94a3b8]">(Optional, PDF/DOCX)</span>
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
                  className="flex min-h-[58px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd5e1] bg-[#fafbff] px-3 py-3 text-center text-[#64748b] transition hover:border-[rgba(133,42,78,0.3)] hover:bg-[rgba(133,42,78,0.03)] sm:flex-row sm:gap-3 sm:px-4 sm:text-left"
                >
                  <UploadIcon />
                  <div className="min-w-0">
                    <p className="text-xs leading-tight text-[#475569]">
                      {resumeFileName || "Click to upload or drag and drop"}
                    </p>
                    <p className="text-[11px] leading-tight text-[#94a3b8]">Max file size: 5MB</p>
                  </div>
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeSelect}
                  className="hidden"
                />
                {resumeError ? <p className="mt-2 text-xs text-[#dc2626]">{resumeError}</p> : null}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-4 flex h-11 min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-linear-to-r from-[#852a4e] to-[#a83d62] text-sm font-semibold tracking-wide text-white shadow-[0_4px_16px_rgba(133,42,78,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
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
            {submitError ? <p className="mt-2 text-xs text-[#dc2626]">{submitError}</p> : null}
          </div>

          {/* Right column */}
          <div className="flex min-h-0 flex-col gap-4 sm:gap-5">
            {/* Your Progress */}
            <div className="rounded-xl border border-[rgba(133,42,78,0.2)] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:rounded-2xl sm:p-6">
              <h2 className="mb-3 text-base font-semibold text-[#0f172a] sm:mb-4">Your Progress</h2>
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 sm:gap-3">
                {[
                  { icon: <CalendarIcon />, value: String(dashboardData?.totalInterviews ?? 0), label: "Interviews", color: "text-[#852a4e]", bg: "bg-[rgba(133,42,78,0.12)]" },
                  { icon: <CheckCircleIcon />, value: String(dashboardData?.completedInterviews ?? 0), label: "Completed", color: "text-[#15803d]", bg: "bg-[rgba(22,163,74,0.12)]" },
                  { icon: <ChartIcon />, value: `${Number(dashboardData?.avgScore ?? 0).toFixed(2)}`, label: "Avg. Score", color: "text-[#0f766e]", bg: "bg-[rgba(20,184,166,0.14)]" },
                  { icon: <ClockIcon />, value: String(incompleteCount), label: "Incomplete", color: "text-[#c2410c]", bg: "bg-[rgba(251,146,60,0.15)]" },
                ].map(({ icon, value, label, color, bg }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
                      {icon}
                    </div>
                    <p className="text-lg font-bold text-[#0f172a] sm:text-xl">{value}</p>
                    <p className="text-[10px] leading-tight text-[#64748b] sm:text-[11px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Interviews */}
            <div className="rounded-xl border border-[rgba(133,42,78,0.2)] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:rounded-2xl sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                <h2 className="text-base font-semibold text-[#0f172a]">Recent Interviews</h2>
                <button
                  type="button"
                  onClick={() => navigate("/interviews")}
                  className="cursor-pointer text-xs font-semibold text-[#852a4e] transition hover:text-[#6b2240]"
                >
                  View All
                </button>
              </div>

              <div className="grid gap-2">
                {recentInterviews.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(getInterviewNavigationPath(item))}
                    className="flex cursor-pointer flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-[#fafbff] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[rgba(133,42,78,0.22)] hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:gap-3 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(133,42,78,0.12)] text-sm font-bold text-[#852a4e]">
                        {String(item.role || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#0f172a]">{item.role}</p>
                        <p className="text-[11px] text-[#64748b]">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#e2e8f0] pt-3 sm:ml-auto sm:border-t-0 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-[#0f172a]">
                          {item.score === null || item.score === undefined ? "—" : Number(item.score).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-[#64748b]">Score</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={item.status} />
                        <div className="text-[#94a3b8] sm:pl-1">
                          <ChevronRightIcon />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCustomTopicModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#0f172a]/40 px-4 py-6 backdrop-blur-[2px] sm:items-center sm:py-8">
          <div className="max-h-[min(90dvh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-[rgba(133,42,78,0.18)] bg-white p-4 shadow-[0_24px_64px_rgba(0,0,0,0.15)] ring-1 ring-black/4 sm:p-5">
            <h3 className="text-lg font-semibold text-[#0f172a]">Add Custom Topic</h3>
            <p className="mt-1 text-xs text-[#64748b]">Create a focus area and add it as a selectable chip.</p>

            <label className="mt-4 grid gap-1 text-xs font-semibold text-[#374151]">
              Topic Name
              <input
                type="text"
                value={customTopicInput}
                onChange={(event) => {
                  setCustomTopicInput(event.target.value);
                  if (customTopicError) setCustomTopicError("");
                }}
                placeholder="e.g. Distributed Systems"
                className="h-10 min-h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#fafbff] px-3 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
              />
            </label>
            {customTopicError ? <p className="mt-2 text-xs text-[#dc2626]">{customTopicError}</p> : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCustomTopicModal}
                className="h-10 w-full cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm font-medium text-[#374151] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc] sm:h-9 sm:w-auto sm:text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomTopic}
                className="h-10 w-full cursor-pointer rounded-lg bg-linear-to-r from-[#852a4e] to-[#a83d62] px-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(133,42,78,0.25)] transition hover:brightness-105 sm:h-9 sm:w-auto sm:text-xs"
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
