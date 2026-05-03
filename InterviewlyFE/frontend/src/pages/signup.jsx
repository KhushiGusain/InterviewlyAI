import { useState } from "react";
import userIcon from "../assets/user-icon.svg";
import emailIcon from "../assets/email-icon.svg";
import lockIcon from "../assets/lock-icon.svg";
import openEyeIcon from "../assets/open-eye-icon.svg";
import closeEyeIcon from "../assets/close-eye-icon.svg";
import { Link, useNavigate } from "react-router-dom";
import LandingHeroPanel from "../components/landing-hero-panel";
import NavbarBrand from "../components/navbar-brand";
import { apiRequest } from "../services/api";

function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignupSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const signupResponse = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (signupResponse?.token) {
        localStorage.setItem("token", signupResponse.token);
        if (signupResponse?.name) {
          localStorage.setItem("userName", signupResponse.name);
        }
        navigate("/dashboard", { replace: true });
        return;
      }

      const loginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("token", loginResponse.token);
      if (loginResponse?.name) {
        localStorage.setItem("userName", loginResponse.name);
      }
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#0f245f_0%,#050918_45%,#03050f_100%)] py-4 text-[#f4f7ff] sm:py-5">
      <div className="absolute right-[8%] top-[9%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#4db3ff_0%,#275cff_65%,transparent_100%)] opacity-95 blur-[2px]" />
      <div className="absolute bottom-[10%] right-[4%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#61c6ff_0%,#315dff_60%,transparent_100%)] opacity-95 blur-[2px]" />
      <div className="absolute bottom-[24%] left-[48%] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#55a2ff_0%,#253fce_65%,transparent_100%)] opacity-95 blur-[2px]" />

      <div className="relative z-10 flex h-full w-full flex-col">
        <NavbarBrand />

        <section className="mx-auto grid min-h-0 w-full max-w-[1180px] flex-1 items-start gap-5 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <LandingHeroPanel />

        <section
          className="w-full max-w-[470px] justify-self-end self-start rounded-3xl border border-[rgba(145,172,255,0.24)] bg-[rgba(16,24,46,0.62)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          aria-label="Create account form"
        >
          <h2 className="mb-5 text-center text-[2rem] font-medium tracking-[0.08em]">
            SIGN UP
          </h2>
          <form className="grid gap-3.5" onSubmit={handleSignupSubmit}>
            <label className="grid gap-1.5 text-sm text-[#dce6ff]">
              Full Name
              <span className="relative">
                <img
                  src={userIcon}
                  alt=""
                  className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.7)] pl-[42px] pr-4 text-[#f2f5ff] outline-none transition placeholder:text-[#8f9bbf] focus:border-[#568cff] focus:shadow-[0_0_0_3px_rgba(86,140,255,0.2)]"
                />
              </span>
            </label>

            <label className="grid gap-1.5 text-sm text-[#dce6ff]">
              Email Address
              <span className="relative">
                <img
                  src={emailIcon}
                  alt=""
                  className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2"
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.7)] pl-[42px] pr-4 text-[#f2f5ff] outline-none transition placeholder:text-[#8f9bbf] focus:border-[#568cff] focus:shadow-[0_0_0_3px_rgba(86,140,255,0.2)]"
                />
              </span>
            </label>

            <label className="grid gap-1.5 text-sm text-[#dce6ff]">
              Password
              <span className="relative">
                <img
                  src={lockIcon}
                  alt=""
                  className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-[rgba(145,172,255,0.25)] bg-[rgba(7,13,30,0.7)] pl-[42px] pr-10 text-[#f2f5ff] outline-none transition placeholder:text-[#8f9bbf] focus:border-[#568cff] focus:shadow-[0_0_0_3px_rgba(86,140,255,0.2)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <img
                    src={showPassword ? openEyeIcon : closeEyeIcon}
                    alt={showPassword ? "Hide password" : "Show password"}
                    className="h-5 w-5"
                  />
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-[46px] w-full items-center justify-center rounded-xl border-0 bg-linear-to-r from-[#2f80ff] to-[#5b33ff] font-bold tracking-[0.02em] text-[#f5f7ff] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="9" className="opacity-30" />
                  <path d="M21 12a9 9 0 0 0-9-9" className="opacity-100" />
                </svg>
              ) : (
                "CREATE ACCOUNT"
              )}
            </button>
          </form>

          {error ? (
            <p className="mt-3 text-sm text-[#ff9ca6]">{error}</p>
          ) : null}
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[rgba(154,170,214,0.25)]" />
            <span className="text-xs text-[#9ea8c7]">OR</span>
            <span className="h-px flex-1 bg-[rgba(154,170,214,0.25)]" />
          </div>

          <p className="text-center text-[#b4bddb]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#6da6ff] no-underline">
              Login
            </Link>
          </p>
        </section>
      </section>
      </div>
    </main>
  );
}

export default SignupPage;
