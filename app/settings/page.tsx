"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { languageNames, Language } from "../lib/language";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { themeNames, Theme } from "../lib/theme";
import { QrHeaderAction } from "../components/qr/QrHeaderAction";
import { UserStatusHeader } from "../components/UserStatusHeader";
import { getStatusHeaderValues } from "../lib/profileHelpers";
import { updateProfile } from "../lib/api";
import { getCityLabel, getCityOptions } from "../lib/cityOptions";

interface Profile {
  id: number;
  full_name: string;
  email: string;
  city: string;
  eco_points: number;
  level: number;
  streak: number;
  total_scans: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [citySaveMessage, setCitySaveMessage] = useState("");
  const [citySaveError, setCitySaveError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const { language, messages, setLanguage } = useLanguage();
  const { theme, colors, setTheme } = useTheme();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Handle swipe to open sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (sidebarOpen) return;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (sidebarOpen) return;
      touchEndX.current = e.changedTouches[0].clientX;
      if (
        touchStartX.current < 30 &&
        touchEndX.current - touchStartX.current > 50
      ) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    // Load profile immediately on mount to ensure header shows correct values
    fetchProfile();
  }, [router]);

  useEffect(() => {
    if (showAccountModal && profile?.city) {
      setSelectedCity(profile.city.trim().toLowerCase());
      setCitySaveMessage("");
      setCitySaveError("");
    }
  }, [showAccountModal, profile?.city]);

  const cityOptions = getCityOptions(messages);

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageModal(false);
  };

  const fetchProfile = async (showModal = false) => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        if (showModal) {
          setShowAccountModal(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("qaitaJanaru_user_id");
    localStorage.removeItem("qaitaJanaru_email");
    localStorage.removeItem("qaitaJanaru_eco_points");
    localStorage.removeItem("qaitaJanaru_achievements_count");
    localStorage.removeItem("qaitaJanaru_level");
    localStorage.removeItem("qaitaJanaru_total_scans");
    localStorage.removeItem("qaitaJanaru_name");
    localStorage.removeItem("qaitaJanaru_city");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/${userId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        localStorage.clear();
        alert(messages.settings.deleteAccountSuccess);
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleSaveName = async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId || !tempName.trim()) {
      return;
    }

    setSavingName(true);
    try {
      const updatedProfile = await updateProfile(userId, { full_name: tempName.trim() });
      setProfile(updatedProfile);
      localStorage.setItem("qaitaJanaru_name", updatedProfile.full_name);
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveCity = async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId || !selectedCity) {
      return;
    }

    setSavingCity(true);
    setCitySaveMessage("");
    setCitySaveError("");

    try {
      const updatedProfile = await updateProfile(userId, { city: selectedCity });
      setProfile(updatedProfile);
      localStorage.setItem("qaitaJanaru_city", updatedProfile.city);
      setCitySaveMessage(messages.settings.cityUpdated);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : messages.selectCity.saveError;

      if (errorMessage === "CITY_REQUIRED") {
        setCitySaveError(messages.register.selectCityRequired);
      } else {
        setCitySaveError(messages.selectCity.saveError);
      }
    } finally {
      setSavingCity(false);
    }
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      {/* Animated background orbs */}
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ backgroundColor: `${colors.primary}20` }}
      ></div>
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse delay-1000"
        style={{ backgroundColor: `${colors.accent}20` }}
      ></div>
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-500"
        style={{ backgroundColor: `${colors.primary}10` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 transition-colors group-hover:text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke={colors.textSecondary}
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <UserStatusHeader {...getStatusHeaderValues(profile)} />

          <QrHeaderAction />
        </header>

        {/* Content Area */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-2xl mx-auto">
            {/* Settings List */}
            <div className="space-y-3">
              {/* Theme Row */}
              <div
                className="rounded-xl backdrop-blur-xl border overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:opacity-80 transition-colors h-16"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-lg flex-shrink-0"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                      }}
                    >
                      🎨
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {messages.settings.theme}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: colors.textSecondary }}
                      >
                        {themeNames[theme]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 pl-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke={colors.textSecondary}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Language Row */}
              <div
                className="rounded-xl backdrop-blur-xl border overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <button
                  onClick={() => setShowLanguageModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:opacity-80 transition-colors h-16"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-lg flex-shrink-0"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                      }}
                    >
                      🌍
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {messages.settings.language}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: colors.textSecondary }}
                      >
                        {languageNames[language]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 pl-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke={colors.textSecondary}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Account Information Row */}
              <div
                className="rounded-xl backdrop-blur-xl border overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <button
                  onClick={() => fetchProfile(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:opacity-80 transition-colors h-16"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-lg flex-shrink-0"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.accent}, ${colors.primary})`,
                      }}
                    >
                      👤
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {messages.settings.accountInformation}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.settings.accountInformationDescription}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 pl-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke={colors.textSecondary}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Logout Row */}
              <div
                className="rounded-xl backdrop-blur-xl border overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:opacity-80 transition-colors h-16"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-lg flex-shrink-0"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.warning}, ${colors.danger})`,
                      }}
                    >
                      🚪
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {messages.settings.logout}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Delete Account Row */}
              <div
                className="rounded-xl backdrop-blur-xl border overflow-hidden"
                style={{
                  backgroundColor: colors.dangerLight,
                  borderColor: `${colors.danger}50`,
                }}
              >
                <button
                  onClick={() => setShowDeleteConfirmModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:opacity-80 transition-colors h-16"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-lg flex-shrink-0"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.danger}, #7f1d1d)`,
                      }}
                    >
                      🗑️
                    </div>
                    <div className="text-left min-w-0">
                      <div
                        className="font-semibold text-sm truncate"
                        style={{ color: `${colors.danger}cc` }}
                      >
                        {messages.settings.deleteAccount}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: `${colors.danger}aa` }}
                      >
                        {messages.settings.deleteAccountDescription}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 pl-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke={`${colors.danger}cc`}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div
              className="mt-8 rounded-xl backdrop-blur-xl border p-5 sm:p-6 min-w-0"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <h2 className="text-base font-bold mb-2 break-words">
                {messages.settings.feedbackTitle}
              </h2>
              <p
                className="text-sm mb-3 break-words"
                style={{ color: colors.textSecondary }}
              >
                {messages.settings.feedbackPrompt}
              </p>
              <a
                href={`mailto:${messages.settings.feedbackEmail}`}
                className="inline-flex items-center gap-2 text-sm font-semibold break-all"
                style={{ color: colors.primary }}
              >
                <span aria-hidden="true">📧</span>
                <span>{messages.settings.feedbackEmail}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowThemeModal(false)}
          ></div>
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden z-10"
            style={{
              background: colors.bg,
              borderColor: colors.border,
            }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: colors.border }}
            >
              <h3 className="text-xl font-bold tracking-tight">
                🎨 {messages.settings.chooseTheme}
              </h3>
              <button
                onClick={() => setShowThemeModal(false)}
                style={{ color: colors.textSecondary }}
                className="hover:opacity-80"
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {(Object.keys(themeNames) as Theme[]).map((t) => {
                const tc = require("../lib/theme").themeColors[t];
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                    }}
                    className="p-4 rounded-xl transition-all duration-200"
                    style={{
                      background: tc.bg,
                      border: `2px solid ${theme === t ? tc.primary : tc.border}`,
                      boxShadow:
                        theme === t ? `0 0 0 2px ${tc.primary}40` : "none",
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full shadow-md"
                        style={{
                          background: `linear-gradient(to bottom right, ${tc.primary}, ${tc.accent})`,
                        }}
                      ></div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: tc.text }}
                      >
                        {themeNames[t]}
                      </span>
                      {theme === t && (
                        <span className="text-xs" style={{ color: tc.primary }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowLanguageModal(false)}
          ></div>
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden z-10"
            style={{
              background: colors.bg,
              borderColor: colors.border,
            }}
          >
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <h3 className="text-xl font-bold tracking-tight">
                ⚙️ {messages.settings.language}
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {Object.keys(languageNames).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang as Language)}
                  className="w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors text-sm font-medium"
                  style={{
                    backgroundColor:
                      language === lang ? `${colors.primary}30` : "transparent",
                    border:
                      language === lang
                        ? `1px solid ${colors.primary}60`
                        : "none",
                  }}
                >
                  <span>{languageNames[lang as Language]}</span>
                  {language === lang && (
                    <span style={{ color: colors.primary }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Information Modal */}
      {showAccountModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowAccountModal(false)}
          ></div>
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden z-10"
            style={{
              background: colors.bg,
              borderColor: colors.border,
            }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: colors.border }}
            >
              <h3 className="text-xl font-bold tracking-tight">
                👤 {messages.settings.accountInformation}
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                style={{ color: colors.textSecondary }}
                className="hover:opacity-80"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.register.fullName}
                </p>
                {isEditingName ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveName();
                        } else if (e.key === "Escape") {
                          setIsEditingName(false);
                          setTempName(profile.full_name);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none"
                      style={{
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveName}
                        disabled={!tempName.trim() || savingName}
                        className="flex-1 py-2 rounded-xl font-semibold disabled:opacity-50"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                          color: colors.buttonText,
                        }}
                      >
                        {savingName ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setTempName(profile.full_name);
                        }}
                        disabled={savingName}
                        className="flex-1 py-2 rounded-xl font-semibold border"
                        style={{
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-semibold break-words flex-1">
                      {profile.full_name}
                    </p>
                    <button
                      onClick={() => {
                        setTempName(profile.full_name);
                        setIsEditingName(true);
                      }}
                      className="p-2 rounded-xl hover:bg-white/10 transition"
                      style={{ color: colors.textSecondary }}
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.login.email}
                </p>
                <p className="text-lg font-semibold break-all">{profile.email}</p>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.register.city}
                </p>
                <p
                  className="text-sm mb-3 break-words"
                  style={{ color: colors.textSecondary }}
                >
                  {getCityLabel(profile.city, messages)}
                </p>
                <div
                  className="max-h-48 overflow-y-auto rounded-xl border [scrollbar-width:none] [-webkit-overflow-scrolling:touch]"
                  style={{ borderColor: colors.border }}
                >
                  {cityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedCity(option.value)}
                      className="w-full px-4 py-3 text-left text-sm font-medium transition-all hover:opacity-90"
                      style={{
                        background:
                          selectedCity === option.value
                            ? `${colors.primary}20`
                            : "transparent",
                        color: colors.text,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {citySaveError ? (
                  <p className="text-sm mt-2" style={{ color: colors.danger }}>
                    {citySaveError}
                  </p>
                ) : null}
                {citySaveMessage ? (
                  <p className="text-sm mt-2" style={{ color: colors.primary }}>
                    {citySaveMessage}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSaveCity()}
                  disabled={!selectedCity || savingCity}
                  className="mt-3 w-full py-3 rounded-xl font-semibold disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                    color: colors.buttonText,
                  }}
                >
                  {savingCity
                    ? messages.selectCity.saving
                    : messages.selectCity.save}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {messages.profile.ecoPoints}
                  </p>
                  <p className="text-lg font-semibold">{profile.eco_points}</p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {messages.profile.level}
                  </p>
                  <p className="text-lg font-semibold">{profile.level}</p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {messages.profile.streak}
                  </p>
                  <p className="text-lg font-semibold">{profile.streak}</p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {messages.profile.totalScans}
                  </p>
                  <p className="text-lg font-semibold">{profile.total_scans}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowDeleteConfirmModal(false)}
          ></div>
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden z-10"
            style={{
              background: colors.bg,
              borderColor: colors.border,
            }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: colors.border }}
            >
              <h3 className="text-xl font-bold tracking-tight">
                🗑️ {messages.settings.deleteAccount}
              </h3>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                style={{ color: colors.textSecondary }}
                className="hover:opacity-80"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-lg">
                {messages.settings.deleteAccountConfirm}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border hover:opacity-80 text-sm font-semibold"
                  style={{ borderColor: colors.border }}
                >
                  {messages.settings.cancel}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold hover:brightness-110 transition"
                  style={{
                    background: `linear-gradient(to right, ${colors.danger}, #7f1d1d)`,
                    color: "#fff",
                  }}
                >
                  {messages.settings.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
