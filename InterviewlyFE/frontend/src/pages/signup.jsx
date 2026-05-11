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
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-white py-3 text-[#1e293b] sm:py-4 md:py-5">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />

      <div className="relative z-10 flex min-h-min w-full flex-col">
        <NavbarBrand />

        <section className="mx-auto grid w-full max-w-[1180px] auto-rows-min grid-cols-1 content-start gap-6 px-4 pb-10 pt-1 sm:gap-7 sm:px-6 sm:pb-12 sm:pt-2 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-5 lg:pb-16">
          <div className="order-2 min-h-0 w-full lg:order-1">
            <LandingHeroPanel />
          </div>

          <section
            className="order-1 w-full max-w-full justify-self-stretch rounded-2xl border border-[rgba(133,42,78,0.2)] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_100px_rgba(0,0,0,0.08)] ring-1 ring-black/4 sm:rounded-3xl sm:p-6 lg:order-2 lg:max-w-[470px] lg:justify-self-end lg:self-start lg:p-7"
            aria-label="Create account form"
          >
            <h2 className="mb-4 text-center text-2xl font-medium tracking-[0.08em] text-[#0f172a] sm:mb-5 sm:text-[1.85rem] lg:text-[2rem]">
              SIGN UP
            </h2>
            <form className="grid gap-3.5" onSubmit={handleSignupSubmit}>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Full Name
                <span className="relative">
                  <img
                    src={userIcon}
                    alt=""
                    className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 brightness-0 opacity-35"
                  />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="h-11 w-full min-h-11 rounded-xl border border-[#e2e8f0] bg-[#fafbff] pl-[42px] pr-4 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
                  />
                </span>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Email Address
                <span className="relative">
                  <img
                    src={emailIcon}
                    alt=""
                    className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 brightness-0 opacity-35"
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11 w-full min-h-11 rounded-xl border border-[#e2e8f0] bg-[#fafbff] pl-[42px] pr-4 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
                  />
                </span>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Password
                <span className="relative">
                  <img
                    src={lockIcon}
                    alt=""
                    className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 brightness-0 opacity-35"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-11 w-full min-h-11 rounded-xl border border-[#e2e8f0] bg-[#fafbff] pl-[42px] pr-10 text-base text-[#0f172a] outline-none transition placeholder:text-[#a0aec0] focus:border-[#852a4e] focus:shadow-[0_0_0_3px_rgba(133,42,78,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-50 transition hover:opacity-80"
                  >
                    <img
                      src={showPassword ? openEyeIcon : closeEyeIcon}
                      alt={showPassword ? "Hide password" : "Show password"}
                      className="h-5 w-5 brightness-0"
                    />
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-[46px] w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-linear-to-r from-[#852a4e] to-[#a83d62] font-bold tracking-[0.02em] text-white shadow-[0_4px_16px_rgba(133,42,78,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
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

            {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#e2e8f0]" />
              <span className="text-xs text-[#94a3b8]">OR</span>
              <span className="h-px flex-1 bg-[#e2e8f0]" />
            </div>

            <p className="text-center text-[#64748b]">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#852a4e] no-underline transition hover:text-[#6b2240]">
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
