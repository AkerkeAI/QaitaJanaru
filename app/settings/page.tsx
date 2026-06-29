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
            <div className="p-6 space-y-4">
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.register.fullName}
                </p>
                <p className="text-lg font-semibold">{profile.full_name}</p>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.login.email}
                </p>
                <p className="text-lg font-semibold">{profile.email}</p>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.register.city}
                </p>
                <p className="text-lg font-semibold">{profile.city}</p>
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
