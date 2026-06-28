"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "../lib/api";
import { languageNames, Language } from "../lib/language";
import { useLanguage } from "../contexts/LanguageContext";

type Step = "request" | "verify" | "reset" | "success";

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder:text-emerald-300/50 outline-none transition-all focus:brightness-110 focus:ring-2 focus:ring-emerald-400/50 touch-manipulation";

const INPUT_STYLE: React.CSSProperties = {
  background: "#0d4a2f",
  borderColor: "#16a34a",
  color: "#ffffff",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language, messages, setLanguage } = useLanguage();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageMenu(false);
  };

  const validateEmail = () => {
    const normalized = email.trim();
    if (!normalized) {
      setError(`${messages.login.pleaseEnter} ${messages.login.email.toLowerCase()}`);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      setError(messages.login.validEmail);
      return false;
    }
    return true;
  };

  const handleRequestCode = async () => {
    setError("");
    setInfoMessage("");
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setInfoMessage(messages.login.resetGenericSuccess);
      setStep("verify");
    } catch {
      setInfoMessage(messages.login.resetGenericSuccess);
      setStep("verify");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    if (!code.trim()) {
      setError(`${messages.login.pleaseEnter} ${messages.forgotPassword.code.toLowerCase()}`);
      return;
    }

    setIsLoading(true);
    try {
      await verifyPasswordResetCode({ email: email.trim(), code: code.trim() });
      setStep("reset");
    } catch {
      setError(messages.forgotPassword.invalidCode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!newPassword.trim()) {
      setError(`${messages.login.pleaseEnter} ${messages.forgotPassword.newPassword.toLowerCase()}`);
      return;
    }
    if (newPassword.length < 8) {
      setError(messages.register.passwordMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(messages.forgotPassword.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      setStep("success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage === "PASSWORD_TOO_SHORT") {
        setError(messages.register.passwordMinLength);
      } else {
        setError(messages.forgotPassword.invalidCode);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative w-full min-h-screen overflow-x-hidden flex flex-col items-center justify-start"
      style={{
        background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="relative z-50 w-full max-w-lg px-4 pt-5 pb-0 flex items-center justify-between"
        style={{ alignSelf: "center" }}
      >
        <Link
          href="/login"
          prefetch={false}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all hover:brightness-110 active:scale-95 touch-manipulation"
          style={{
            background: "rgba(6, 78, 59, 0.70)",
            backdropFilter: "blur(14px)",
            borderColor: "rgba(52, 211, 153, 0.35)",
            color: "#a7f3d0",
          }}
        >
          {messages.common.back}
        </Link>

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
                    language === lang ? "bg-emerald-500/20" : "hover:bg-white/5"
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

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 mt-4 mb-8">
        <div
          className="relative w-full rounded-3xl border shadow-2xl overflow-visible"
          style={{
            background: "rgba(5, 46, 35, 0.58)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: "rgba(52, 211, 153, 0.22)",
          }}
        >
          <div className="px-6 sm:px-8 pt-8 pb-8 space-y-5">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
              >
                <span className="text-2xl">🔐</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white">
                {messages.forgotPassword.title}
              </h1>
              <p className="text-sm font-medium" style={{ color: "#6ee7b7" }}>
                {messages.forgotPassword.subtitle}
              </p>
            </div>

            {(error || infoMessage) && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: error
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(16, 185, 129, 0.15)",
                  border: error
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <p
                  className="text-xs font-medium"
                  style={{ color: error ? "#fca5a5" : "#a7f3d0" }}
                >
                  {error || infoMessage}
                </p>
              </div>
            )}

            {step === "request" && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.forgotPassword.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={messages.forgotPassword.emailPlaceholder}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                    color: "#ffffff",
                  }}
                >
                  {isLoading ? messages.forgotPassword.sendingCode : messages.forgotPassword.sendCode}
                </button>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-3.5">
                <div className="rounded-2xl border px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(52, 211, 153, 0.18)", color: "#d1fae5" }}>
                  <p className="text-sm font-semibold">{messages.forgotPassword.codeSentTitle}</p>
                  <p className="text-xs mt-1 opacity-90">{messages.forgotPassword.verifyInstructions}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.forgotPassword.code}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={messages.forgotPassword.codePlaceholder}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                      color: "#ffffff",
                    }}
                  >
                    {isLoading ? messages.forgotPassword.verifyingCode : messages.forgotPassword.verifyCode}
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    className="w-full py-3 rounded-xl font-semibold text-sm border"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(52, 211, 153, 0.22)",
                      color: "#d1fae5",
                    }}
                  >
                    {messages.forgotPassword.requestAnotherCode}
                  </button>
                </div>
              </div>
            )}

            {step === "reset" && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.forgotPassword.newPassword}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={messages.forgotPassword.newPasswordPlaceholder}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.forgotPassword.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={messages.forgotPassword.confirmPasswordPlaceholder}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                    color: "#ffffff",
                  }}
                >
                  {isLoading ? messages.forgotPassword.resettingPassword : messages.forgotPassword.resetPassword}
                </button>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="rounded-2xl border px-5 py-5" style={{ background: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.22)" }}>
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-base font-bold text-white">{messages.forgotPassword.resetSuccessTitle}</p>
                  <p className="text-sm mt-2" style={{ color: "#d1fae5" }}>
                    {messages.forgotPassword.resetSuccessDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                    color: "#ffffff",
                  }}
                >
                  {messages.forgotPassword.backToLogin}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
