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
    <main
      className="relative min-h-screen overflow-y-auto overflow-x-hidden text-[#f4f7ff]"
      style={{ background: "radial-gradient(circle at 20% 10%, #0f245f 0%, #050918 45%, #03050f 100%)" }}
    >
      <div className="pointer-events-none absolute right-[6%] top-[5%] h-[280px] w-[280px] rounded-full opacity-90 blur-[1px]"
        style={{ background: "radial-gradient(circle at 35% 35%, #4db3ff 0%, #275cff 65%, transparent 100%)" }} />
      <div className="pointer-events-none absolute bottom-[8%] right-[3%] h-[220px] w-[220px] rounded-full opacity-80 blur-[2px]"
        style={{ background: "radial-gradient(circle at 35% 35%, #61c6ff 0%, #315dff 60%, transparent 100%)" }} />

      <div className="relative z-10 flex flex-col">
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

        <div className="mx-8 mb-8 rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-6 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#f4f7ff]">All Interviews</h1>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer rounded-lg border border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.45)] px-3 py-1.5 text-xs font-medium text-[#c8d8f8] transition hover:border-[rgba(145,172,255,0.45)]"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="grid gap-2">
            {interviews.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(getInterviewNavigationPath(item))}
                className="flex w-full items-center gap-3 rounded-xl border border-[rgba(145,172,255,0.1)] bg-[rgba(7,13,30,0.45)] px-4 py-3 text-left transition hover:border-[rgba(145,172,255,0.25)] hover:bg-[rgba(7,13,30,0.65)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(78,141,255,0.2)] text-sm font-bold text-[#9ec3ff]">
                  {String(item.role || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#f4f7ff]">{item.role}</p>
                  <p className="text-[11px] text-[#5a7299]">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#f4f7ff]">
                    {item.score === null || item.score === undefined ? "—" : Number(item.score).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-[#5a7299]">Score</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={item.status} />
                </div>
                <div className="shrink-0 text-[#3a4d6a]">
                  <ChevronRightIcon />
                </div>
              </button>
            ))}
            {interviews.length === 0 ? (
              <p className="rounded-xl border border-[rgba(145,172,255,0.12)] bg-[rgba(7,13,30,0.35)] px-4 py-8 text-center text-sm text-[#8fa3c8]">
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
