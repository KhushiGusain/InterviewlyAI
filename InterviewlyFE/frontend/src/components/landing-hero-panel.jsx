import chatIcon from "../assets/chat-icon.svg";
import graphIcon from "../assets/graph-icon.svg";
import micIcon from "../assets/mic-icon.svg";
import targetIcon from "../assets/target-icon.svg";

const FEATURES = [
  {
    icon: chatIcon,
    title: "AI-Powered Interviews",
    description: "Role-tailored, realistic questions",
  },
  {
    icon: graphIcon,
    title: "Smart Feedback",
    description: "Actionable insights after each answer",
  },
  {
    icon: micIcon,
    title: "Voice Interaction",
    description: "Speak naturally—we handle the rest",
  },
  {
    icon: targetIcon,
    title: "Progress Tracking",
    description: "Analytics that show how you improve",
  },
];

function LandingHeroPanel() {
  return (
    <aside className="flex min-h-0 max-w-[520px] flex-col pt-12 lg:max-w-[560px]">
      <p className="mb-5 inline-flex w-fit items-center rounded-full border border-[rgba(100,140,255,0.35)] bg-[rgba(12,22,48,0.55)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8eb4ff]">
        AI-Powered Interview Platform
      </p>

      <h1 className="text-[2.15rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem] lg:text-[2.75rem]">
        <span className="block text-[#e8eeff]">Your Personal</span>
        <span className="mt-1 block bg-linear-to-r from-[#60a5fa] via-[#818cf8] to-[#a78bfa] bg-clip-text text-transparent">
          AI Interviewer.
        </span>
        <span className="mt-1 block bg-linear-to-r from-[#38bdf8] to-[#c084fc] bg-clip-text text-transparent">
          Anywhere, Anytime.
        </span>
      </h1>

      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[#94a3c8] sm:text-base">
        Practice real interviews, get AI feedback, and build confidence to land
        your dream job—all in one focused workspace.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {FEATURES.map((item) => (
          <article
            key={item.title}
            className="group flex gap-3 rounded-xl border border-[rgba(148,163,255,0.12)] bg-[rgba(10,18,40,0.45)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[rgba(96,165,250,0.28)] hover:bg-[rgba(12,24,52,0.55)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(59,130,246,0.12)] ring-1 ring-[rgba(96,165,250,0.2)] transition group-hover:bg-[rgba(59,130,246,0.18)]">
              <img src={item.icon} alt="" className="h-[22px] w-[22px] opacity-95" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.8125rem] font-semibold leading-tight text-[#eef2ff]">
                {item.title}
              </h2>
              <p className="mt-1 text-[12px] leading-snug text-[#8b9cc4]">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

export default LandingHeroPanel;
