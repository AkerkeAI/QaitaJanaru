"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getProfile, ProfileResponse } from "../lib/api";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

export default function ProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakNotification, setStreakNotification] = useState<{ show: boolean; streak: number; message: string; fading: boolean }>({ show: false, streak: 0, message: "", fading: false });
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
      const userId = localStorage.getItem("qaitaJanaru_user_id");

      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        const data = await getProfile(userId);
        setProfile({
          ...data,
          achievements: data.achievements || [],
        });

        // Store full profile data in localStorage for Eco Assistant
        localStorage.setItem("qaitaJanaru_name", data.full_name || "Unknown");
        localStorage.setItem("qaitaJanaru_city", data.city || "Unknown");
        localStorage.setItem("qaitaJanaru_user_type", data.user_type || "Unknown");
        localStorage.setItem("qaitaJanaru_eco_points", (data.eco_points || 0).toString());
        localStorage.setItem("qaitaJanaru_streak", (data.streak || 0).toString());
        localStorage.setItem("qaitaJanaru_achievements_count", (data.achievements?.length || 0).toString());
        try {
          const computedLevel = Math.max(1, Math.floor((data.eco_points || 0) / 100) + 1);
          localStorage.setItem("qaitaJanaru_level", computedLevel.toString());
        } catch (e) {
          localStorage.setItem("qaitaJanaru_level", String(data.level || "Unknown"));
        }
        localStorage.setItem("qaitaJanaru_total_scans", (data.total_scans || 0).toString());
        localStorage.setItem("qaitaJanaru_institution", data.institution || "Unknown");

        // Check if this is a fresh login session and show streak notification
        const hasShownNotification = sessionStorage.getItem("streak_notification_shown");
        if (!hasShownNotification && data.streak && data.streak > 0) {
          sessionStorage.setItem("streak_notification_shown", "true");
          
          // Determine notification message based on streak
          let message = "";
          if (data.streak === 1) {
            message = "Streak Updated! You are on a 1-day streak.";
          } else {
            message = `Great Job! ${data.streak}-day streak maintained.`;
          }
          
          // Show notification after a short delay to ensure page is fully loaded
          setTimeout(() => {
            setStreakNotification({ show: true, streak: data.streak, message, fading: false });
            
            // Start fade-out after 5.5 seconds (6 seconds total - 0.5s fade-out)
            setTimeout(() => {
              setStreakNotification(prev => ({ ...prev, fading: true }));
              
              // Hide notification after fade-out completes
              setTimeout(() => {
                setStreakNotification({ show: false, streak: 0, message: "", fading: false });
              }, 500);
            }, 5500);
          }, 500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

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
            onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition"
            style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}
          >
            {messages.profile.loginAgain}
          </button>
        </div>
      </main>
    );
  }

  // Derive level and progress from eco_points authoritative source
  const currentLevel = Math.max(1, Math.floor(profile.eco_points / 100) + 1);
  const nextLevel = currentLevel + 1;
  const currentXP = profile.eco_points % 100;
  const nextLevelXP = 100;
  const levelProgress = currentXP / nextLevelXP;
  const pointsToNextLevel = nextLevelXP - currentXP;

  // Achievement definitions
  const achievements = [
    {
      id: "eco-beginner",
      icon: "🌱",
      title: messages.profile.achievementEcoBeginner,
      description: messages.profile.achievementEcoBeginnerDesc,
      unlocked: true,
    },
    {
      id: "first-scan",
      icon: "📸",
      title: messages.profile.achievementFirstScan,
      description: messages.profile.achievementFirstScanDesc,
      unlocked: profile.total_scans >= 1,
    },
    {
      id: "eco-enthusiast",
      icon: "🏆",
      title: messages.profile.achievementEcoEnthusiast,
      description: messages.profile.achievementEcoEnthusiastDesc,
      unlocked: profile.eco_points >= 100,
    },
    {
      id: "recycling-hero",
      icon: "♻️",
      title: messages.profile.achievementRecyclingHero,
      description: messages.profile.achievementRecyclingHeroDesc,
      unlocked: profile.eco_points >= 500,
    },
    {
      id: "consistent",
      icon: "🔥",
      title: messages.profile.achievementStreakChampion,
      description: messages.profile.achievementStreakChampionDesc,
      unlocked: profile.streak >= 7,
    },
    {
      id: "earth-guardian",
      icon: "🌍",
      title: messages.profile.achievementEarthGuardian,
      description: messages.profile.achievementEarthGuardianDesc,
      unlocked: profile.eco_points >= 1000,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

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
              {/* Card gradient overlay */}
              <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}></div>
              
              <div className="relative p-6 md:p-8 lg:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] shadow-2xl" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}>
                      <div className="w-full h-full rounded-full flex items-center justify-center text-5xl md:text-6xl backdrop-blur-sm" style={{ background: `linear-gradient(to bottom right, ${colors.primaryDark}, ${colors.primary})` }}>
                        🌱
                      </div>
                    </div>
                    {/* Level badge */}
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shadow-lg border-4" style={{ background: "linear-gradient(to bottom right, #fbbf24, #f97316)", borderColor: colors.primaryDark }}>
                      {currentLevel}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">{profile.full_name}</h2>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4" style={{ color: colors.textSecondary }}>
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm" style={{ backgroundColor: `${colors.primary}10`, borderColor: colors.border }}>
                        📍 {profile.city}
                      </span>
                      {profile.institution && (
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm" style={{ backgroundColor: `${colors.primary}10`, borderColor: colors.border }}>
                          🏫 {profile.institution}
                        </span>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm" style={{ background: `linear-gradient(to right, ${colors.primary}20, ${colors.accent}20)`, borderColor: `${colors.primary}40` }}>
                      <span className="text-lg">
                        {profile.user_type === "school" ? "🎒" : profile.user_type === "university" ? "🎓" : profile.user_type === "kindergarten" ? "🌸" : "💼"}
                      </span>
                      <span className="font-medium capitalize">{profile.user_type}</span>
                    </div>
                  </div>

                  {/* Eco Points Display */}
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
              {/* Eco Points */}
              <div className="group relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}>
                      🏆
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-1">{profile.eco_points}</div>
                  <div className="text-sm md:text-base font-medium" style={{ color: colors.textSecondary }}>{messages.profile.ecoPoints}</div>
                </div>
              </div>

              {/* Total Scans */}
              <div className="group relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(to bottom right, ${colors.accent}, #0284c7)` }}>
                      📸
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-1">{profile.total_scans}</div>
                  <div className="text-sm md:text-base font-medium" style={{ color: colors.textSecondary }}>{messages.profile.totalScans}</div>
                </div>
              </div>

              {/* Streak */}
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

              {/* Level */}
              <div className="group relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ background: "linear-gradient(to bottom right, #a855f7, #ec4899)" }}>
                      ⭐
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-1">{currentLevel}</div>
                  <div className="text-sm md:text-base font-medium" style={{ color: colors.textSecondary }}>{messages.profile.level}</div>
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
                  <div className="text-2xl font-black">{currentXP} / {nextLevelXP}</div>
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
                <span className="font-medium">Level {nextLevel}</span>
              </div>

              <div className="mt-4 text-center">
                <p style={{ color: colors.textSecondary }}>
                  <span className="font-bold" style={{ color: colors.text }}>{pointsToNextLevel}</span> {messages.profile.morePointsToReachLevel} {nextLevel}
                </p>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: "linear-gradient(to bottom right, #fbbf24, #f97316)" }}>
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{messages.profile.achievements}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{unlockedCount} / {achievements.length} {messages.profile.unlocked}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${
                      achievement.unlocked
                        ? ""
                        : "opacity-60 hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: achievement.unlocked ? `${colors.primary}15` : colors.cardBg,
                      borderColor: achievement.unlocked ? `${colors.primary}40` : colors.border,
                      borderWidth: 1
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}
                        style={{
                          background: achievement.unlocked ? "linear-gradient(to bottom right, #fbbf24, #f97316)" : "linear-gradient(to bottom right, #4b5563, #374151)"
                        }}
                      >
                        {achievement.unlocked ? achievement.icon : "🔒"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg mb-1 truncate">
                          {achievement.title}
                        </div>
                        <div
                          className={`text-sm`}
                          style={{
                            color: achievement.unlocked ? colors.textSecondary : "#9ca3af"
                          }}
                        >
                          {achievement.description}
                        </div>
                        {achievement.unlocked && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur-sm" style={{ backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}30`, color: colors.textSecondary }}>
                            <span className="text-xs">✓</span>
                            <span className="text-xs font-medium">{messages.profile.unlocked}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Impact Section */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})` }}>
                  🌍
                </div>
                <div>
                  <h3 className="text-xl font-bold">{messages.profile.yourImpact}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{messages.profile.makingADifference}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
                      <span className="text-lg">💨</span> {messages.profile.co2Saved}
                    </span>
                    <span className="font-bold text-lg">{(profile.total_scans * 0.5).toFixed(1)} kg</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden border backdrop-blur-sm" style={{ backgroundColor: `${colors.text}10`, borderColor: colors.border }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 shadow-lg"
                      style={{
                        width: `${Math.min(profile.total_scans * 2, 100)}%`,
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
                      <span className="text-lg">🌳</span> {messages.profile.treesSaved}
                    </span>
                    <span className="font-bold text-lg">{Math.floor(profile.total_scans / 10)}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden border backdrop-blur-sm" style={{ backgroundColor: `${colors.text}10`, borderColor: colors.border }}>
                    <div className="h-full rounded-full transition-all duration-1000 shadow-lg"
                      style={{
                        width: `${Math.min((profile.total_scans / 10) * 10, 100)}%`,
                        background: `linear-gradient(to right, ${colors.accent}, #0284c7)`
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
                      <span className="text-lg">💧</span> {messages.profile.waterSaved}
                    </span>
                    <span className="font-bold text-lg">{profile.total_scans * 2} L</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden border backdrop-blur-sm" style={{ backgroundColor: `${colors.text}10`, borderColor: colors.border }}>
                    <div className="h-full rounded-full transition-all duration-1000 shadow-lg"
                      style={{
                        width: `${Math.min(profile.total_scans, 100)}%`,
                        background: `linear-gradient(to right, ${colors.primaryLight}, ${colors.accent})`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Streak Notification */}
      {streakNotification.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500 ${streakNotification.fading ? 'animate-out fade-out slide-out-to-top-4 duration-500' : ''}`}>
          <div className="px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}>
            <span className="text-3xl">🔥</span>
            <div>
              <div className="font-bold text-base">{streakNotification.message}</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
