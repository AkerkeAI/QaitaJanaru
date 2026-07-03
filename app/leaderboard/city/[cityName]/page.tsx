"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { QrHeaderAction } from "../../../components/qr/QrHeaderAction";
import { UserStatusHeader } from "../../../components/UserStatusHeader";
import { getStatusHeaderValues } from "../../../lib/profileHelpers";
import { getProfile, ProfileResponse } from "../../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  full_name: string;
  city: string;
  eco_points: number;
  level: number;
  streak: number;
  total_scans: number;
}

export default function CityLeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
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
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (userId) {
      void getProfile(userId)
        .then(setProfile)
        .catch((err) => console.error("Failed to load profile header:", err));
    }

    const loadLeaderboard = async () => {
      if (!params.cityName) return;

      try {
        const response = await fetch(
          `${API_URL}/leaderboard/city/${params.cityName}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load leaderboard");
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard",
        );
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [params.cityName]);

  const getMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "";
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
        {/* Header with hamburger menu */}
        <header className="flex items-center justify-between gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
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

          <UserStatusHeader {...getStatusHeaderValues(profile)} />

          <QrHeaderAction />
        </header>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            {/* Page Title */}
            <div className="text-center">
              <button
                onClick={() => router.push("/leaderboard")}
                className="flex items-center gap-2 mb-2 mx-auto px-4 py-2 rounded-xl border backdrop-blur-sm hover:opacity-80 transition"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.textSecondary,
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                {messages.leaderboard.backToLeaderboard}
              </button>
              <div
                className="text-base md:text-lg font-semibold"
                style={{ color: colors.textSecondary }}
              >
                📍 {decodeURIComponent(params.cityName as string)}
              </div>
            </div>

            {/* Leaderboard Card */}
            <div
              className="relative rounded-[32px] backdrop-blur-2xl border shadow-2xl overflow-hidden"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                }}
              ></div>

              <div className="relative p-6 md:p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6"
                      style={{
                        borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent`,
                      }}
                    ></div>
                    <p
                      className="text-lg"
                      style={{ color: colors.textSecondary }}
                    >
                      {messages.leaderboard.loading}
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="w-20 h-20 mb-6 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${colors.danger}20` }}
                    >
                      ❌
                    </div>
                    <p
                      className="text-lg mb-4"
                      style={{ color: colors.danger }}
                    >
                      {error}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 rounded-xl font-bold hover:brightness-110 transition"
                      style={{
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                        color: colors.buttonText,
                      }}
                    >
                      {messages.leaderboard.retry}
                    </button>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="w-20 h-20 mb-6 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      🏆
                    </div>
                    <p
                      className="text-lg"
                      style={{ color: colors.textSecondary }}
                    >
                      {messages.leaderboard.noUsersFoundInCity}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div
                      className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold border-b"
                      style={{
                        borderColor: colors.border,
                        color: colors.textSecondary,
                      }}
                    >
                      <div className="col-span-2 md:col-span-1">
                        {messages.leaderboard.rank}
                      </div>
                      <div className="col-span-7 md:col-span-8">
                        {messages.leaderboard.name}
                      </div>
                      <div className="col-span-3 md:col-span-3 text-right">
                        Level
                      </div>
                    </div>

                    {/* Leaderboard Entries */}
                    {leaderboard.map((entry) => (
                      <button
                        key={entry.user_id}
                        onClick={() => router.push(`/profile/${entry.user_id}`)}
                        className="group w-full text-left grid grid-cols-12 gap-4 px-4 py-4 rounded-2xl transition-all duration-300 hover:opacity-90 hover:scale-[1.01]"
                        style={{
                          backgroundColor:
                            entry.rank <= 3
                              ? `${colors.primary}10`
                              : "transparent",
                          borderColor:
                            entry.rank <= 3
                              ? `${colors.primary}30`
                              : "transparent",
                          borderWidth: entry.rank <= 3 ? 1 : 0,
                        }}
                      >
                        {/* Rank */}
                        <div className="col-span-2 md:col-span-1 flex items-center">
                          <div
                            className={`text-2xl font-black ${getRankStyle(entry.rank)}`}
                            style={{
                              color:
                                entry.rank <= 3
                                  ? undefined
                                  : colors.textSecondary,
                            }}
                          >
                            {getMedal(entry.rank) || entry.rank}
                          </div>
                        </div>

                        {/* Name */}
                        <div className="col-span-7 md:col-span-8 flex items-center">
                          <div className="font-semibold text-lg truncate">
                            {entry.full_name}
                          </div>
                        </div>

                        {/* Level */}
                        <div className="col-span-3 md:col-span-3 flex items-center justify-end">
                          <div
                            className="text-xl font-black"
                            style={{
                              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {entry.level}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
