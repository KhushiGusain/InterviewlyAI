import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
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

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth={2.5}>
      <path d="m15 18-6-6 6-6" />
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

function InterviewsPage() {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName?.trim()) {
      setDisplayName(storedName.trim());
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchInterviews() {
      try {
        const response = await apiRequest("/dashboard", { method: "GET" });
        if (isMounted) {
          setInterviews(response?.recentInterviews || []);
        }
      } catch {
        if (isMounted) {
          setInterviews([]);
        }
      }
    }

    fetchInterviews();
    return () => {
      isMounted = false;
    };
  }, []);

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

  function getInterviewNavigationPath(item) {
    const status = String(item?.status || "").toUpperCase();
    if (status === "COMPLETED") return `/reports/${item.id}`;
    if (status === "IN_PROGRESS" || status === "NOT_STARTED" || status === "CREATED") {
      return `/interview/${item.id}`;
    }
    return `/interview/${item.id}`;
  }

  return (
    <main className="relative min-h-dvh overflow-y-auto overflow-x-hidden bg-white text-[#1e293b]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />

      <div className="relative z-10 flex flex-col">
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
        </nav>

        <div className="mx-auto mb-6 w-full max-w-[1280px] rounded-xl border border-[rgba(133,42,78,0.2)] bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:mb-8 sm:rounded-2xl sm:px-6 sm:py-6 md:px-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold text-[#0f172a] sm:text-2xl">All Interviews</h1>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(133,42,78,0.22)] bg-[rgba(133,42,78,0.09)] px-4 py-2.5 text-sm font-semibold text-[#852a4e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(133,42,78,0.1)] ring-1 ring-black/3 transition hover:border-[rgba(133,42,78,0.32)] hover:bg-[rgba(133,42,78,0.14)] hover:shadow-[0_2px_10px_rgba(133,42,78,0.14)] sm:w-auto sm:justify-start sm:py-2"
            >
              <ChevronLeftIcon />
              Back to Dashboard
            </button>
          </div>

          <div className="grid gap-2 sm:gap-2.5">
            {interviews.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(getInterviewNavigationPath(item))}
                className="flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-[#fafbff] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[rgba(133,42,78,0.22)] hover:bg-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:gap-3 sm:p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(133,42,78,0.12)] text-sm font-bold text-[#852a4e]">
                    {String(item.role || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{item.role}</p>
                    <p className="wrap-break-word text-[11px] leading-snug text-[#64748b]">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
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
              </button>
            ))}
            {interviews.length === 0 ? (
              <p className="rounded-xl border border-[#e2e8f0] bg-[#fafbff] px-4 py-8 text-center text-sm text-[#64748b]">
                No interviews found.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export default InterviewsPage;
