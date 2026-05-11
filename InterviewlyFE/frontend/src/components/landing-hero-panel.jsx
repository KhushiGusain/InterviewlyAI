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
      <p className="mb-5 inline-flex w-fit items-center rounded-full border border-[rgba(133,42,78,0.22)] bg-[rgba(133,42,78,0.06)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#852a4e]">
        AI-Powered Interview Platform
      </p>

      <h1 className="text-[2.15rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0f172a] sm:text-[2.5rem] lg:text-[2.75rem]">
        <span className="block text-[#0f172a]">Your Personal</span>
        <span className="mt-1 block bg-linear-to-r from-[#852a4e] via-[#a83d62] to-[#c2547a] bg-clip-text text-transparent">
          AI Interviewer.
        </span>
        <span className="mt-1 block bg-linear-to-r from-[#6b2240] to-[#a83d62] bg-clip-text text-transparent">
          Anywhere, Anytime.
        </span>
      </h1>

      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[#475569] sm:text-base">
        Practice real interviews, get AI feedback, and build confidence to land
        your dream job—all in one focused workspace.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {FEATURES.map((item) => (
          <article
            key={item.title}
            className="group flex gap-3 rounded-xl border border-[rgba(133,42,78,0.16)] bg-white p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.05),0_6px_20px_rgba(0,0,0,0.07),0_16px_40px_rgba(0,0,0,0.05)] ring-1 ring-black/3 transition hover:border-[rgba(133,42,78,0.26)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_4px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.09),0_24px_48px_rgba(133,42,78,0.08)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(133,42,78,0.08)] ring-1 ring-[rgba(133,42,78,0.15)] transition group-hover:bg-[rgba(133,42,78,0.13)]">
              <img src={item.icon} alt="" className="h-[22px] w-[22px] brightness-0 opacity-50" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.8125rem] font-semibold leading-tight text-[#1e293b]">
                {item.title}
              </h2>
              <p className="mt-1 text-[12px] leading-snug text-[#64748b]">
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
