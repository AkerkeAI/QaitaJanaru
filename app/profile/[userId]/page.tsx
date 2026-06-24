"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface PublicProfile {
  id: number;
  full_name: string;
  city: string;
  eco_points: number;
  level: number;
  streak: number;
  total_scans: number;
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { messages } = useLanguage();
  const { colors } = useTheme();
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
    const loadProfile = async () => {
      if (!params.userId) return;
      
      try {
        const response = await fetch(`${API_URL}/profile/public/${params.userId}`);
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [params.userId]);

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6" style={{ borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent` }}></div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>{messages.profile.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">{messages.profile.error}</h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>{error || messages.profile.errorDescription}</p>
          <button
            onClick={() => router.push("/leaderboard")}
            className="px-8 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition"
            style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}
          >
            Back to Leaderboard
          </button>
        </div>
      </main>
    );
  }

  const currentLevel = profile.level;
  const levelProgress = (profile.eco_points % 100) / 100;
  const pointsToNextLevel = 100 - (profile.eco_points % 100);

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: colors.bg, color: colors.text }}>
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
        {/* Header with hamburger menu */}
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 group-hover:text-white transition-colors"
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

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">♻️</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{messages.common.appName}</h1>
          </div>

          <div className="w-12"></div>
        </header>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            
            {/* Hero Profile Card */}
            <div className="relative rounded-[32px] backdrop-blur-2xl border shadow-2xl overflow-hidden" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}></div>
              
              <div className="relative p-6 md:p-8 lg:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] shadow-2xl" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}>
                      <div className="w-full h-full rounded-full flex items-center justify-center text-5xl md:text-6xl backdrop-blur-sm" style={{ background: `linear-gradient(to bottom right, ${colors.primaryDark}, ${colors.primary})` }}>
                        🌱
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shadow-lg border-4" style={{ background: "linear-gradient(to bottom right, #fbbf24, #f97316)", borderColor: colors.primaryDark }}>
                      {currentLevel}
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">{profile.full_name}</h2>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4" style={{ color: colors.textSecondary }}>
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm" style={{ backgroundColor: `${colors.primary}10`, borderColor: colors.border }}>
                        📍 {profile.city}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-center md:text-right">
                    <div className="text-4xl md:text-5xl font-black" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {profile.eco_points}
                    </div>
                    <div className="text-sm md:text-base font-medium" style={{ color: colors.textSecondary }}>{messages.profile.ecoPoints}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="group relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}>
                      📸
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-1">{profile.total_scans}</div>
                  <div className="text-sm md:text-base font-medium" style={{ color: colors.textSecondary }}>{messages.profile.totalScans}</div>
                </div>
              </div>

              <div className="group relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(to bottom right, ${colors.warning}, ${colors.danger})` }}>
                      🔥
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-1">{profile.streak}</div>
                  <div className="text-sm md:text-base font-medium" style={{ color: colors.textSecondary }}>{messages.profile.streak}</div>
                </div>
              </div>
            </div>

            {/* XP Progress Section */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}>
                    📊
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{messages.profile.levelProgress}</h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Level {currentLevel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black">{profile.eco_points % 100} / 100</div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>{messages.profile.xp}</div>
                </div>
              </div>

              <div className="relative h-6 rounded-full overflow-hidden border backdrop-blur-sm" style={{ backgroundColor: `${colors.text}10`, borderColor: colors.border }}>
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{
                    width: `${levelProgress * 100}%`,
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>

              <div className="flex justify-between mt-3 text-sm" style={{ color: colors.textSecondary }}>
                <span className="font-medium">Level {currentLevel}</span>
                <span className="font-medium">Level {currentLevel + 1}</span>
              </div>

              <div className="mt-4 text-center">
                <p style={{ color: colors.textSecondary }}>
                  <span className="font-bold" style={{ color: colors.text }}>{pointsToNextLevel}</span> {messages.profile.morePointsToReachLevel} {currentLevel + 1}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
