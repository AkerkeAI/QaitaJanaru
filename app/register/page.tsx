"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerUser, googleAuth, getProfile } from "../lib/api";
import { languageNames, Language } from "../lib/language";
import { useLanguage } from "../contexts/LanguageContext";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DropdownOption {
  value: string;
  label: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────









// ─── Inline Dropdown Component ────────────────────────────────────────────────
// Absolute-positioned within its own wrapper for desktop, full-screen modal for mobile.

interface InlineDropdownProps {
  placeholder:  string;
  options:      DropdownOption[];
  selected:     string;
  onSelect:     (value: string) => void;
  isOpen:       boolean;
  onToggle:     () => void;
  onClose:      () => void;
  cancelText:   string;
}

function InlineDropdown({
  placeholder,
  options,
  selected,
  onSelect,
  isOpen,
  onToggle,
  onClose,
  cancelText,
}: InlineDropdownProps) {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? "";

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close when clicking outside (only for desktop)
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen, onClose, isMobile]);

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <>
      <div ref={wrapperRef} className="relative">
        {/* ── Trigger ── */}
        <button
          type="button"
          onClick={onToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="w-full px-3.5 py-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 touch-manipulation"
          style={{
            background:   "#0d4a2f",
            borderColor:  "#16a34a",
            minHeight:    "42px",
          }}
        >
          <span
            className="font-medium truncate leading-tight"
            style={{ color: selectedLabel ? "#ffffff" : "#6ee7b7" }}
          >
            {selectedLabel || placeholder}
          </span>
          <svg
            className={`w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            style={{ color: "#34d399" }}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* ── Desktop Option list ── */}
        {isOpen && !isMobile && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 mt-1 rounded-xl shadow-2xl border border-emerald-600/50 overflow-hidden"
            style={{
              background: "#0a3d24",
              zIndex:      200,
              maxHeight:   "220px",
              overflowY:   "auto",
            }}
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={selected === opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                className="px-3.5 py-2.5 text-xs cursor-pointer select-none transition-colors font-medium touch-manipulation"
                style={{
                  background: selected === opt.value ? "#166534" : undefined,
                  color:       "#ffffff",
                }}
                onMouseEnter={(e) => {
                  if (selected !== opt.value)
                    (e.currentTarget as HTMLLIElement).style.background = "#14532d";
                }}
                onMouseLeave={(e) => {
                  if (selected !== opt.value)
                    (e.currentTarget as HTMLLIElement).style.background = "";
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Mobile Full-Screen Modal ── */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-[1000] flex flex-col"
          style={{
            background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-4 border-b"
            style={{ borderColor: "rgba(52, 211, 153, 0.2)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:brightness-110 touch-manipulation"
              style={{
                background: "rgba(6, 78, 59, 0.70)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                color: "#a7f3d0",
              }}
            >
              {cancelText}
            </button>
            <h2 className="text-lg font-bold" style={{ color: "#ffffff" }}>
              {placeholder}
            </h2>
            <div className="w-20" />
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className="w-full px-6 py-4 text-left text-lg font-medium transition-all border-b touch-manipulation"
                style={{
                  background: selected === opt.value ? "rgba(52, 211, 153, 0.15)" : "transparent",
                  color: "#ffffff",
                  borderColor: "rgba(52, 211, 153, 0.1)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{opt.label}</span>
                  {selected === opt.value && (
                    <svg
                      className="w-6 h-6"
                      style={{ color: "#34d399" }}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder:text-emerald-300/50 outline-none transition-all focus:brightness-110 focus:ring-2 focus:ring-emerald-400/50 touch-manipulation";

const INPUT_STYLE: React.CSSProperties = {
  background:  "#0d4a2f",
  borderColor: "#16a34a",
  color:       "#ffffff",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next");

  // ── Form state ──
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [isLoading,    setIsLoading]    = useState(false);

  // ── Language state ──
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { language, messages, setLanguage } = useLanguage();

  const CITIES: DropdownOption[] = [
  { value: "astana", label: messages.cities.astana },
  { value: "almaty", label: messages.cities.almaty },
  { value: "shymkent", label: messages.cities.shymkent },
  { value: "aktobe", label: messages.cities.aktobe },
  { value: "atyrau", label: messages.cities.atyrau },
  { value: "aktau", label: messages.cities.aktau },
  { value: "karaganda", label: messages.cities.karaganda },
  { value: "kostanay", label: messages.cities.kostanay },
  { value: "kokshetau", label: messages.cities.kokshetau },
  { value: "kyzylorda", label: messages.cities.kyzylorda },
  { value: "pavlodar", label: messages.cities.pavlodar },
  { value: "petropavl", label: messages.cities.petropavl },
  { value: "semey", label: messages.cities.semey },
  { value: "taraz", label: messages.cities.taraz },
  { value: "taldykorgan", label: messages.cities.taldykorgan },
  { value: "turkistan", label: messages.cities.turkistan },
  { value: "uralsk", label: messages.cities.uralsk },
  { value: "ust-kamenogorsk", label: messages.cities["ust-kamenogorsk"] },
  { value: "zhezkazgan", label: messages.cities.zhezkazgan },
];

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageMenu(false);
  };

  // ── Dropdown values ──
  const [userType,    setUserType]    = useState<string>("");
  const [city,        setCity]        = useState("");

  // ── Single open-dropdown tracker — prevents two menus open simultaneously ──
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggle = (key: string) =>
    setOpenDropdown((prev: string | null) => (prev === key ? null : key));
  const closeAll = () => setOpenDropdown(null);



  // ── Validation ───────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError(`${messages.register.pleaseEnter} ${messages.register.fullName.toLowerCase()}`);
      return false;
    }
     
    if (!email.trim()) {
      setError(`${messages.register.pleaseEnter} ${messages.register.email.toLowerCase()}`);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(messages.register.validEmail);
      return false;
    }
    if (!password.trim()) {
      setError(`${messages.register.pleaseEnter} ${messages.register.password.toLowerCase()}`);
      return false;
    }
    if (password.length < 8) {
      setError(messages.register.passwordMinLength);
      return false;
    }

    if (!city) {
      setError(messages.register.selectCityRequired);
      return false;
    }
    return true;
  };

  // ── Submit Handler ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser({
      full_name: name.trim(),
       email: email.trim(),
      password: password,
      city: city,
    });

      // Save user data to localStorage
      localStorage.setItem("qaitaJanaru_user_id", response.user_id.toString());
      localStorage.setItem("qaitaJanaru_email", email.trim());

      // Store additional profile data for Eco Assistant
      localStorage.setItem("qaitaJanaru_name", name.trim() || "Unknown");
      localStorage.setItem("qaitaJanaru_city", city || "Unknown");
      localStorage.setItem("qaitaJanaru_eco_points", "0");
      localStorage.setItem("qaitaJanaru_streak", "0");
      localStorage.setItem("qaitaJanaru_achievements_count", "0");
      // compute initial level from eco points (keeps logic centralized on frontend)
      const initialLevel = Math.max(1, Math.floor(0 / 100) + 1);
      localStorage.setItem("qaitaJanaru_level", initialLevel.toString());
      localStorage.setItem("qaitaJanaru_total_scans", "0");

      console.log("=== REGISTRATION PAGE LOCALSTORAGE DEBUG ===");
      console.log("Stored profile data in localStorage after registration:");
      console.log("qaitaJanaru_name:", name.trim());
      console.log("qaitaJanaru_city:", city);
      console.log("=====================================");

      router.push(nextPath || "/profile");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : messages.register.registrationError;

      // Map error codes to translated messages
      let translatedError = errorMessage;
      if (errorMessage === "EMAIL_ALREADY_EXISTS") {
        translatedError = messages.register.emailAlreadyExists;
      } else if (errorMessage === "USER_NOT_FOUND") {
        translatedError = messages.login.userNotFound;
      } else if (errorMessage === "INCORRECT_PASSWORD") {
        translatedError = messages.login.incorrectPassword;
      } else {
        translatedError = messages.register.registrationError;
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
      if (!profile.city || profile.city === "unknown") {
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

  // ─────────────────────────────────────────────────────────────────────────────

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <>
      {/*
        ── Viewport meta is handled by Next.js layout, but we add a global style
           to prevent iOS auto-zoom on input focus (font-size ≥ 16px on inputs).
      */}
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

        /* Hide number spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.3; filter: invert(1); }
        input[type=number] { -moz-appearance: textfield; }

        /* Smooth scrolling inside dropdown lists */
        [role="listbox"] { scrollbar-width: thin; scrollbar-color: #16a34a transparent; }
        [role="listbox"]::-webkit-scrollbar { width: 4px; }
        [role="listbox"]::-webkit-scrollbar-thumb { background: #16a34a; border-radius: 2px; }
      `}</style>

      {/*
        ── PAGE WRAPPER
           - min-h-dvh uses the dynamic viewport height unit on mobile so the
             address bar doesn't clip content. Falls back to min-h-screen.
           - overflow-x: hidden prevents any accidental horizontal scroll.
           - py-safe-or-16 pads away from the iOS home indicator.
      */}
      <main
        className="relative w-full min-h-screen overflow-x-hidden flex flex-col items-center justify-start"
        style={{
          // ── EXACT homepage gradient per spec ──
          background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
          paddingTop:    "env(safe-area-inset-top,    0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* ── Ambient glow blobs (pointer-events: none, never block taps) ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ zIndex: 0 }}
        >
          {/* Top-left emerald bloom */}
          <div
            className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[130px]"
            style={{ background: "#10b981", opacity: 0.38, animation: "glowPulse 6s ease-in-out infinite" }}
          />
          {/* Bottom-right teal bloom */}
          <div
            className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full blur-[110px]"
            style={{ background: "#0d9488", opacity: 0.28, animation: "glowPulse 8s ease-in-out infinite 2s" }}
          />
          {/* Center soft wash */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px]"
            style={{ background: "#34d399", opacity: 0.10 }}
          />
        </div>

        {/* ── Leaf SVG texture ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C15 5 5 20 5 30 C5 45 20 55 30 55 C30 55 30 30 30 5Z' fill='%2322c55e'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
            zIndex: 0,
          }}
        />

        {/*
          ── BACK BUTTON and language selector
             Positioned absolute inside the main flex column so it never creates
             a fixed stacking context that could compete with dropdown z-indices.
             align-self: flex-start keeps it left-aligned within the centred column.
        */}
        <div
          className="relative z-50 w-full max-w-lg px-4 pt-5 pb-0 flex items-center justify-between"
          style={{ alignSelf: "center" }}
        >
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all hover:brightness-110 active:scale-95 touch-manipulation"
            style={{
              background:     "rgba(6, 78, 59, 0.70)",
              backdropFilter: "blur(14px)",
              borderColor:    "rgba(52, 211, 153, 0.35)",
              color:          "#a7f3d0",
            }}
          >
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/>
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
              <div className="absolute top-full right-0 mt-2 rounded-xl border overflow-hidden z-50 shadow-xl"
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

        {/*
          ── REGISTRATION CARD
             w-full + max-w-lg + px-4 ensures the card is always centered and
             never bleeds off-screen on any device width.
             mt-4 gives breathing room below the back button.
             mb-8 adds space at the bottom for iOS home indicator.
        */}
        <div
          className="relative z-10 w-full max-w-lg mx-auto px-4 mt-4 mb-8"
        >
          <div
            className="relative w-full rounded-3xl border shadow-2xl overflow-visible"
            style={{
              background:     "rgba(5, 46, 35, 0.58)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderColor:    "rgba(52, 211, 153, 0.22)",
              boxShadow:      "0 0 0 1px rgba(52,211,153,0.08), 0 24px 60px rgba(0,0,0,0.40), 0 0 60px rgba(16,185,129,0.07)",
            }}
          >
            {/* Top shimmer accent */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-8 right-8 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, #34d399 50%, transparent)" }}
            />

            <div className="px-6 sm:px-8 pt-8 pb-8">

              {/* ── Brand header ── */}
              <div className="text-center mb-7">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
                >
                  <span className="text-2xl" role="img" aria-label="seedling">🌱</span>
                </div>

                {/*
                  ── Brand title: unified color, slightly larger, responsive size.
                     text-4xl on mobile → text-5xl on sm+.
                     ALL letters same white color — no split coloring.
                */}
                <h1
                  className="text-4xl sm:text-5xl font-black tracking-tight mb-2 select-none"
                  style={{
                    color:       "#ffffff",
                    fontFamily:  "'Georgia', 'Times New Roman', serif",
                    letterSpacing: "-0.025em",
                    textShadow:  "0 2px 20px rgba(52,211,153,0.25)",
                  }}
                >
                  {messages.common.appName}
                </h1>

                <p className="text-sm font-medium" style={{ color: "#6ee7b7" }}>
                  🌍 {messages.register.tagline}
                </p>
              </div>

              {/* ── Section divider ── */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: "rgba(52,211,153,0.18)" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#34d399" }}>
                  {messages.register.createAccount}
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(52,211,153,0.18)" }} />
              </div>

              {/* ── Error display ── */}
              {error && (
                <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>
                    {error}
                  </p>
                </div>
              )}

              {/* ── Form fields ── */}
              <div className="space-y-3.5">

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.register.fullName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={messages.register.fullNamePlaceholder}
                    autoComplete="name"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>

                {/* Email —*/}
                <div>
                  
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                      {messages.register.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={messages.register.emailPlaceholder}
                      autoComplete="email"
                      inputMode="email"
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.register.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={messages.register.passwordPlaceholder}
                      autoComplete="new-password"
                      className={`${INPUT_CLASS} pr-24`}
                      style={INPUT_STYLE}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors whitespace-nowrap touch-manipulation"
                      style={{ color: "#34d399", background: "rgba(0,0,0,0.22)" }}
                    >
                      {showPassword ? messages.register.hidePassword : messages.register.showPassword}
                    </button>
                  </div>
                </div>

                {/* ── "Additional" divider ── */}
                <div className="pt-0.5 pb-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: "rgba(52,211,153,0.13)" }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#34d399" }}>{messages.register.additional}</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(52,211,153,0.13)" }} />
                  </div>
                </div>

                

                {/* ── City dropdown ── */}
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    {messages.register.city}
                  </label>
                  <InlineDropdown
                  placeholder={messages.register.selectCity}
                  options={CITIES}
                  selected={city}
                  onSelect={setCity}
                  isOpen={openDropdown === "city"}
                  onToggle={() => toggle("city")}
                  onClose={closeAll}
                  cancelText={messages.common.back}
                />
                </div>


                {/* ── Eco-points badge ── */}
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(52,211,153,0.07)",
                    border:     "1px solid rgba(52,211,153,0.18)",
                  }}
                >
                  <span className="text-xl shrink-0" role="img" aria-label="trophy">🏆</span>
                  <div>
                    <p className="text-xs font-bold leading-snug" style={{ color: "#34d399" }}>
                      {messages.register.ecoPointsBadge}
                    </p>
                    <p className="text-xs leading-snug mt-0.5" style={{ color: "#86efac" }}>
                      {messages.register.ecoPointsDescription}
                    </p>
                  </div>
                </div>

                {/*
                  ── CTA BUTTON
                     py-4 height, gradient, glow shadow, scale micro-interaction.
                     text-sm uppercase ensures readability; font-black for weight.
                     touch-manipulation disables 300 ms tap delay on mobile.
                */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] shadow-lg mt-1 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background:   "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                    color:        "#ffffff",
                    letterSpacing:"0.10em",
                    boxShadow:    "0 4px 28px rgba(16,185,129,0.45), 0 1px 0 rgba(255,255,255,0.10) inset",
                  }}
                >
                  {isLoading ? messages.register.registering : messages.register.signUpButton}
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
                      onError={() => setError(messages.register.registrationError)}
                      useOneTap
                      theme="filled_black"
                      text="signup_with"
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

                {/* ── Sign-in link ── */}
                <p className="text-center text-xs pt-1" style={{ color: "#6ee7b7" }}>
                  {messages.register.hasAccount}{" "}
                  <Link
                    href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
                    prefetch={false}
                    className="font-bold underline underline-offset-2 hover:text-white transition-colors touch-manipulation"
                    style={{ color: "#34d399" }}
                  >
                    {messages.register.signIn}
                  </Link>
                </p>

              </div>{/* /space-y-3.5 */}
            </div>{/* /px-6 */}

            {/* Bottom shimmer accent */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-8 right-8 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.25), transparent)" }}
            />
          </div>{/* /card */}
        </div>{/* /card wrapper */}
      </main>
      </>
    </GoogleOAuthProvider>
  );
}
