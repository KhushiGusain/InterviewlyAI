import { useParams } from "react-router-dom";

function InterviewPage() {
  const { id } = useParams();

  return (
    <main className="min-h-screen bg-[#030711] px-6 py-10 text-[#f4f7ff]">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-[rgba(145,172,255,0.18)] bg-[rgba(14,21,46,0.65)] p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Interview Session</h1>
        <p className="mt-2 text-sm text-[#9fb1d3]">
          Interview ID: <span className="font-medium text-[#dce6ff]">{id}</span>
        </p>
      </div>
    </main>
  );
}

export default InterviewPage;
