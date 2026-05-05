import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const summary = location.state || {};
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      if (!id) return;
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest(`/interview/${id}/report`, {
          method: "GET",
        });
        if (isMounted) {
          setReport(response);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || "Failed to fetch report.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const reportData = report || summary;

  return (
    <main className="min-h-screen bg-[#030711] px-6 py-10 text-[#f4f7ff]">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Interview Summary</h1>
        <p className="mt-2 text-sm text-[#9fb1d3]">
          Interview ID: <span className="font-medium text-[#dce6ff]">{id}</span>
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[rgba(145,172,255,0.18)] bg-[rgba(7,13,30,0.55)] p-4">
            <p className="text-xs uppercase tracking-widest text-[#7b90b8]">Total Questions Answered</p>
            <p className="mt-1 text-xl font-semibold text-[#dce6ff]">
              {reportData.totalQuestionsAnswered ?? reportData.questionsAnswered ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(145,172,255,0.18)] bg-[rgba(7,13,30,0.55)] p-4">
            <p className="text-xs uppercase tracking-widest text-[#7b90b8]">Role</p>
            <p className="mt-1 text-xl font-semibold text-[#dce6ff]">{reportData.role || "Not available"}</p>
          </div>
          <div className="rounded-xl border border-[rgba(145,172,255,0.18)] bg-[rgba(7,13,30,0.55)] p-4">
            <p className="text-xs uppercase tracking-widest text-[#7b90b8]">Interview Type</p>
            <p className="mt-1 text-xl font-semibold text-[#dce6ff]">
              {reportData.interviewType || "Not available"}
            </p>
          </div>
        </div>
        {loading ? <p className="mt-3 text-sm text-[#9fb1d3]">Loading report...</p> : null}
        {error ? <p className="mt-3 text-sm text-[#ff9ca6]">{error}</p> : null}

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-6 h-11 cursor-pointer rounded-xl bg-linear-to-r from-[#2f80ff] to-[#5b33ff] px-5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}

export default ReportsPage;
