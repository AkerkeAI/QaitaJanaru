"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, getProfile, googleAuth } from "../lib/api";
import { languageNames, Language } from "../lib/language";
import { useLanguage } from "../contexts/LanguageContext";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { language, messages, setLanguage } = useLanguage();

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageMenu(false);
  };

  const INPUT_CLASS =
    "w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder:text-emerald-300/50 outline-none transition-all focus:brightness-110 focus:ring-2 focus:ring-emerald-400/50 touch-manipulation";

  const INPUT_STYLE: React.CSSProperties = {
    background: "#0d4a2f",
    borderColor: "#16a34a",
    color: "#ffffff",
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError(
        `${messages.login.pleaseEnter} ${messages.login.email.toLowerCase()}`,
      );
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(messages.login.validEmail);
      return false;
    }
    if (!password.trim()) {
      setError(
        `${messages.login.pleaseEnter} ${messages.login.password.toLowerCase()}`,
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser({
        email: email.trim(),
        password: password,
      });
      const profile = await getProfile(response.user_id.toString());

      // Save user data to localStorage
      localStorage.setItem("qaitaJanaru_user_id", response.user_id.toString());
      localStorage.setItem("qaitaJanaru_email", email.trim());
      localStorage.setItem(
        "qaitaJanaru_eco_points",
        response.eco_points.toString(),
      );
      localStorage.setItem(
        "qaitaJanaru_streak",
        response.streak?.toString() || "0",
      );

      // Store additional profile data for Eco Assistant
      localStorage.setItem("qaitaJanaru_name", profile.full_name || "Unknown");
      localStorage.setItem("qaitaJanaru_city", profile.city || "Unknown");
      localStorage.setItem(
        "qaitaJanaru_achievements_count",
        (profile.achievements?.length || 0).toString(),
      );
      // store computed level from profile.eco_points if available
      try {
        const computedLevel = Math.max(
          1,
          Math.floor((profile.eco_points || 0) / 100) + 1,
        );
        localStorage.setItem("qaitaJanaru_level", computedLevel.toString());
      } catch (e) {
        localStorage.setItem("qaitaJanaru_level", profile.level.toString());
      }
      localStorage.setItem(
        "qaitaJanaru_total_scans",
        profile.total_scans.toString(),
      );
      localStorage.setItem("qaitaJanaru_name", profile.full_name || "Unknown");
      localStorage.setItem("qaitaJanaru_city", profile.city || "Unknown");
      localStorage.setItem(
        "qaitaJanaru_achievements_count",
        (profile.achievements?.length || 0).toString(),
      );
      try {
        const computedLevel = Math.max(
          1,
          Math.floor((profile.eco_points || 0) / 100) + 1,
        );
        localStorage.setItem("qaitaJanaru_level", computedLevel.toString());
      } catch (e) {
        localStorage.setItem("qaitaJanaru_level", profile.level.toString());
      }
      localStorage.setItem(
        "qaitaJanaru_total_scans",
        profile.total_scans.toString(),
      );

      console.log("=== LOGIN PAGE LOCALSTORAGE DEBUG ===");
      console.log("Stored profile data in localStorage after login:");
      console.log("qaitaJanaru_name:", profile.full_name);
      console.log("qaitaJanaru_city:", profile.city);
      console.log("qaitaJanaru_level:", profile.level);
      console.log("=====================================");

      router.push(nextPath || "/profile");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : messages.login.invalidCredentials;

      // Map error codes to translated messages
      let translatedError = errorMessage;
      if (errorMessage === "USER_NOT_FOUND") {
        translatedError = messages.login.userNotFound;
      } else if (errorMessage === "INCORRECT_PASSWORD") {
        translatedError = messages.login.incorrectPassword;
      } else if (errorMessage === "EMAIL_ALREADY_EXISTS") {
        translatedError = messages.register.emailAlreadyExists;
      } else {
        translatedError = messages.login.invalidCredentials;
      }

      setError(translatedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await googleAuth({
        id_token: credentialResponse.credential,
      });
      const profile = await getProfile(response.user_id.toString());

      // Save user data to localStorage
      localStorage.setItem("qaitaJanaru_user_id", response.user_id.toString());
      localStorage.setItem("qaitaJanaru_email", profile.email);
      localStorage.setItem(
        "qaitaJanaru_eco_points",
        response.eco_points.toString(),
      );
      localStorage.setItem(
        "qaitaJanaru_streak",
        response.streak?.toString() || "0",
      );

      // Store additional profile data for Eco Assistant
      localStorage.setItem("qaitaJanaru_name", profile.full_name || "Unknown");
      localStorage.setItem("qaitaJanaru_city", profile.city || "Unknown");
      localStorage.setItem(
        "qaitaJanaru_achievements_count",
        (profile.achievements?.length || 0).toString(),
      );
      const computedLevel = Math.max(
        1,
        Math.floor((profile.eco_points || 0) / 100) + 1,
      );
      localStorage.setItem("qaitaJanaru_level", computedLevel.toString());
      localStorage.setItem(
        "qaitaJanaru_total_scans",
        profile.total_scans.toString(),
      );

      // Check if city is missing or "unknown"
      if (!profile.city || profile.city.toLowerCase() === "unknown") {
        router.push(`/select-city?next=${encodeURIComponent(nextPath || "/profile")}`);
      } else {
        router.push(nextPath || "/profile");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google authentication failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <style>{`
        /* Prevent iOS Safari zoom on input focus */
        input, select, textarea, button { font-size: 16px; }
        @media (min-width: 640px) {
          input, select, textarea, button { font-size: inherit; }
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.55; }
        }
      `}</style>

      <main
        className="relative w-full min-h-screen overflow-x-hidden flex flex-col items-center justify-start"
        style={{
          background:
            "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Ambient glow blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <div
            className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[130px]"
            style={{
              background: "#10b981",
              opacity: 0.38,
              animation: "glowPulse 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full blur-[110px]"
            style={{
              background: "#0d9488",
              opacity: 0.28,
              animation: "glowPulse 8s ease-in-out infinite 2s",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px]"
            style={{ background: "#34d399", opacity: 0.1 }}
          />
        </div>

        {/* Leaf SVG texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C15 5 5 20 5 30 C5 45 20 55 30 55 C30 55 30 30 30 5Z' fill='%2322c55e'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
            zIndex: 0,
          }}
        />

        {/* Back button and language selector */}
        <div
          className="relative z-50 w-full max-w-lg px-4 pt-5 pb-0 flex items-center justify-between"
          style={{ alignSelf: "center" }}
        >
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all hover:brightness-110 active:scale-95 touch-manipulation"
            style={{
              background: "rgba(6, 78, 59, 0.70)",
              backdropFilter: "blur(14px)",
              borderColor: "rgba(52, 211, 153, 0.35)",
              color: "#a7f3d0",
            }}
          >
            <svg
              className="w-3 h-3 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            {messages.common.back}
          </Link>

          {/* Compact language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:brightness-110"
              style={{
                background: "rgba(6, 78, 59, 0.70)",
                backdropFilter: "blur(14px)",
                borderColor: "rgba(52, 211, 153, 0.35)",
                color: "#a7f3d0",
              }}
            >
              🌍 {languageNames[language]}
            </button>

            {showLanguageMenu && (
              <div
                className="absolute top-full right-0 mt-2 rounded-xl border overflow-hidden z-50 shadow-xl"
                style={{
                  background: "rgba(5, 46, 35, 0.95)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(52, 211, 153, 0.3)",
                }}
              >
                {(["en", "ru", "kz"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`block px-4 py-2 text-left text-xs transition-colors ${
                      language === lang
                        ? "bg-emerald-500/20"
                        : "hover:bg-white/5"
                    }`}
                    style={{ color: "#ffffff" }}
                  >
                    {languageNames[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Login card */}
        <div className="relative z-10 w-full max-w-lg mx-auto px-4 mt-4 mb-8">
          <div
            className="relative w-full rounded-3xl border shadow-2xl overflow-visible"
            style={{
              background: "rgba(5, 46, 35, 0.58)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderColor: "rgba(52, 211, 153, 0.22)",
              boxShadow:
                "0 0 0 1px rgba(52,211,153,0.08), 0 24px 60px rgba(0,0,0,0.40), 0 0 60px rgba(16,185,129,0.07)",
            }}
          >
            {/* Top shimmer accent */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-8 right-8 h-px rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #34d399 50%, transparent)",
              }}
            />

            <div className="px-6 sm:px-8 pt-8 pb-8">
              {/* Brand header */}
              <div className="text-center mb-7">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #0d9488)",
                  }}
                >
                  <span className="text-2xl" role="img" aria-label="seedling">
                    🌱
                  </span>
                </div>

                <h1
                  className="text-4xl sm:text-5xl font-black tracking-tight mb-2 select-none"
                  style={{
                    color: "#ffffff",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    letterSpacing: "-0.025em",
                    textShadow: "0 2px 20px rgba(52,211,153,0.25)",
                  }}
                >
                  {messages.common.appName}
                </h1>

                <p className="text-sm font-medium" style={{ color: "#6ee7b7" }}>
                  🌍 {messages.login.tagline}
                </p>
              </div>

              {/* Section divider */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(52,211,153,0.18)" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "#34d399" }}
                >
                  {messages.login.signInToAccount}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(52,211,153,0.18)" }}
                />
              </div>

              {/* Error display */}
              {error && (
                <div
                  className="rounded-xl px-4 py-3 mb-4"
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#fca5a5" }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-3.5">
                {/* Email */}
                <div>
                  <label
                    className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest"
                    style={{ color: "#6ee7b7" }}
                  >
                    {messages.login.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={messages.login.emailPlaceholder}
                    autoComplete="email"
                    inputMode="email"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest"
                    style={{ color: "#6ee7b7" }}
                  >
                    {messages.login.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={messages.login.passwordPlaceholder}
                      autoComplete="current-password"
                      className={`${INPUT_CLASS} pr-24`}
                      style={INPUT_STYLE}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors whitespace-nowrap touch-manipulation"
                      style={{
                        color: "#34d399",
                        background: "rgba(0,0,0,0.22)",
                      }}
                    >
                      {showPassword
                        ? messages.login.hidePassword
                        : messages.login.showPassword}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    prefetch={false}
                    className="text-xs font-semibold underline underline-offset-2 hover:text-white transition-colors touch-manipulation"
                    style={{ color: "#6ee7b7" }}
                  >
                    {messages.login.forgotPassword}
                  </Link>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] shadow-lg mt-1 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                    color: "#ffffff",
                    letterSpacing: "0.10em",
                    boxShadow:
                      "0 4px 28px rgba(16,185,129,0.45), 0 1px 0 rgba(255,255,255,0.10) inset",
                  }}
                >
                  {isLoading
                    ? messages.login.signingIn
                    : messages.login.signInButton}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div
                    className="flex-1 h-px"
                    style={{ background: "rgba(52,211,153,0.18)" }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "#34d399" }}
                  >
                    {messages.login.or}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "rgba(52,211,153,0.18)" }}
                  />
                </div>

                {/* Google Sign-In Button */}
                {googleClientId && (
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError(messages.login.invalidCredentials)}
                      useOneTap
                      theme="filled_black"
                      text="signin_with"
                      shape="pill"
                    />
                  </div>
                )}

                {/* Phone Sign-In Button (Coming Soon) */}
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all opacity-50 cursor-not-allowed"
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    color: "#6ee7b7",
                  }}
                >
                  📱 {messages.login.phoneSignIn} (Coming Soon)
                </button>

                {/* Register link */}
                <p
                  className="text-center text-xs pt-1"
                  style={{ color: "#6ee7b7" }}
                >
                  {messages.login.noAccount}{" "}
                  <Link
                    href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
                    prefetch={false}
                    className="font-bold underline underline-offset-2 hover:text-white transition-colors touch-manipulation"
                    style={{ color: "#34d399" }}
                  >
                    {messages.login.signUp}
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom shimmer accent */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-8 right-8 h-px rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(52,211,153,0.25), transparent)",
              }}
            />
          </div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
