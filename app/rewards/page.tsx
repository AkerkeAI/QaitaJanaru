"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
import { QrHeaderAction } from "@/app/components/qr/QrHeaderAction";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { getProfile, ProfileResponse } from "@/app/lib/api";
import {
  Reward,
  Partner,
  PartnerLocation,
  RewardCategory,
} from "@/app/types/rewards";

// Sample data
const SAMPLE_CATEGORIES: RewardCategory[] = [
  { id: "drinks", icon: "☕", name: "Drinks" },
  { id: "desserts", icon: "🍦", name: "Desserts" },
];

const SAMPLE_PARTNERS: Partner[] = [
  {
    id: "partner-1",
    name: "Nagi Coffee Bar",
    logo: "☕",
    level: "Gold",
    locations: [
      {
        id: "loc-1",
        address: "33-181\nInside Dina Hypermarket",
        city: "Aktau",
      },
    ],
    instagram: "@nagicoffee",
  },
  {
    id: "partner-2",
    name: "Nagimoko Ice",
    logo: "🍦",
    level: "Silver",
    locations: [
      {
        id: "loc-2",
        address: "Shopping Center Astana\n14th Microdistrict\nKiosk",
        city: "Aktau",
      },
    ],
    instagram: "@nagimokoice",
  },
];

const SAMPLE_REWARDS: Reward[] = [
  {
    id: "reward-coffee",
    title: "10% off Coffee",
    description: "Get 10% off your coffee purchase",
    ecoPointsRequired: 300,
    image: "☕",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-lemonade",
    title: "10% off Lemonade",
    description: "Get 10% off your lemonade purchase",
    ecoPointsRequired: 300,
    image: "🍋",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-bubbletea",
    title: "10% off Bubble Tea",
    description: "Get 10% off your bubble tea purchase",
    ecoPointsRequired: 300,
    image: "🧋",
    categoryId: "drinks",
    partnerIds: ["partner-2"],
  },
  {
    id: "reward-cocktails",
    title: "10% off Cocktails",
    description: "Get 10% off your cocktail purchase",
    ecoPointsRequired: 300,
    image: "🍸",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-icecream",
    title: "10% off Ice Cream",
    description: "Get 10% off your ice cream purchase",
    ecoPointsRequired: 300,
    image: "🍦",
    categoryId: "desserts",
    partnerIds: ["partner-2"],
  },
];

export default function RewardsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("drinks");
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const loadData = useCallback(async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");

    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter rewards by selected category and available in user's city
  const filteredRewards = SAMPLE_REWARDS.filter((reward) => {
    if (reward.categoryId !== selectedCategoryId) return false;
    if (!profile?.city) return true;
    // Check if any partner of this reward has a location in user's city
    return reward.partnerIds.some((partnerId) => {
      const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
      return partner?.locations.some((loc) => loc.city === profile.city);
    });
  });

  if (loading) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6"
            style={{
              borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent`,
            }}
          ></div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>
            Loading...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ backgroundColor: `${colors.primary}20` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
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

          {profile && <UserStatusHeader {...{ ecoPoints: profile.eco_points, streak: profile.streak, level: profile.level }} />}

          <QrHeaderAction />
        </header>

        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <h1 className="text-3xl font-bold">{messages.rewards.title}</h1>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {SAMPLE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                    selectedCategoryId === category.id ? "shadow-lg" : ""
                  }`}
                  style={{
                    backgroundColor: selectedCategoryId === category.id
                      ? colors.cardBg
                      : "transparent",
                    color: selectedCategoryId === category.id
                      ? colors.primary
                      : colors.textSecondary,
                  }}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>

            {/* Rewards List */}
            {filteredRewards.length === 0 ? (
              <div
                className="col-span-full rounded-3xl p-8 text-center backdrop-blur-xl border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <div className="text-5xl mb-4">🎁</div>
                <p style={{ color: colors.textSecondary }}>{messages.rewards.noRewardsAvailable}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRewards.map((reward) => (
                  <div
                    key={reward.id}
                    onClick={() => router.push(`/rewards/${reward.id}`)}
                    className="group relative rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] backdrop-blur-xl border shadow-lg cursor-pointer"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="text-5xl mb-4">{reward.image}</div>
                    <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                    <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                      {reward.description}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: `${colors.primary}20`,
                          color: colors.primary,
                        }}
                      >
                        {reward.ecoPointsRequired} {messages.tasks.points}
                      </div>
                    </div>
                    <button
                      className="w-full py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                        color: colors.buttonText,
                      }}
                    >
                      {messages.rewards.viewReward}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
